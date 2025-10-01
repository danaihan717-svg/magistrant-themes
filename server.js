const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const fs = require("fs");

const students = require("./students"); // [{ fio, iin, isAdmin }]
const centers = require("./centers");   // Ваш centers.js с 30 темами в каждом центре

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, "public")));

// API для скачивания отчета
app.get("/downloadReport", (req, res) => {
  let csv = "Центр,Тема (Каз),Тема (Рус),ФИО,Время выбора\n";
  centers.forEach(center => {
    center.topics.forEach(t => {
      csv += `"${center.name}","${t.title_kk}","${t.title_ru}","${t.student || ""}","${t.time || ""}"\n`;
    });
  });
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=report.csv");
  res.send(csv);
});

// Socket.IO
io.on("connection", socket => {

  socket.on("registerStudent", ({ fio, iin }) => {
    const student = students.find(s => s.fio === fio && s.iin === iin);
    if (!student) {
      socket.emit("authError", "ФИО немесе ИИН қате / ФИО или ИИН неверны");
      return;
    }
    socket.emit("topicsList", centers, student.isAdmin);
  });

  socket.on("chooseTopic", ({ fio, centerName, topicId }) => {
    const center = centers.find(c => c.name === centerName);
    if (!center) return;

    const topic = center.topics.find(t => t.id === topicId);
    if (!topic) return;

    // Проверка, выбрал ли студент уже тему
    const alreadyChosen = centers.some(c => c.topics.some(t => t.student === fio));
    if (alreadyChosen && topic.student !== fio) {
      socket.emit("authError", "Сіз бұрын тақырып таңдағансыз / Вы уже выбрали тему");
      return;
    }

    // Если тема свободна или уже выбрана этим студентом
    if (!topic.student || topic.student === fio) {
      topic.student = fio;
      topic.time = new Date().toLocaleString();
    }

    // Отправляем обновленный список всем клиентам
    io.emit("topicsList", centers);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

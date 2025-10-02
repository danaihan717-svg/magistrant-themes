const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const students = require("./students");
const centers = require("./centers");

app.use(express.static("public"));

// Кто какой центр выбрал (ИИН → центр)
let studentCenter = {};

io.on("connection", (socket) => {
  console.log("🔗 Жаңа қосылым");

  // Авторизация по ИИН
  socket.on("registerStudent", ({ iin }) => {
    const student = students.find((s) => s.iin === iin);
    if (!student) {
      socket.emit("authError", "❌ ИИН қате!");
      return;
    }

    socket.fio = student.fio;
    socket.isAdmin = student.isAdmin || false;

    console.log(`✅ Тіркелді: ${socket.fio} ${socket.isAdmin ? "(ADMIN)" : ""}`);

    // отправляем список центров и ФИО
    socket.emit("authSuccess", {
      fio: socket.fio,
      centers,
      isAdmin: socket.isAdmin,
    });
  });

  // Выбор темы студентом
  socket.on("chooseTopic", ({ fio, centerName, topicId }) => {
    const center = centers.find((c) => c.name === centerName);
    if (!center) return;

    if (studentCenter[fio] && studentCenter[fio] !== centerName) {
      socket.emit("topicError", "⚠️ Сіз басқа орталықтан тақырып таңдадыңыз!");
      return;
    }

    let topic = center.topics.find((t) => t.id === topicId);
    if (!topic) return;

    if (topic.student) {
      socket.emit("topicError", "❌ Бұл тақырып толы!");
      return;
    }

    // Проверка — уже выбрал ли студент тему в этом центре
    let already = center.topics.find((t) => t.student === fio);
    if (already) {
      socket.emit("topicError", "⚠️ Сіз бұл орталықтан тақырып таңдадыңыз!");
      return;
    }

    // Фиксируем выбор
    topic.student = fio;
    topic.time = new Date().toLocaleString("kk-KZ", {
      timeZone: "Asia/Almaty",
    });
    studentCenter[fio] = centerName;

    console.log(`🎓 ${fio} таңдады: ${topic.title.kk} / ${topic.title.ru}`);

    // Отправляем обновлённые темы всем
    io.emit("updateTopics", centers);
  });

  // Очистка (только админ)
  socket.on("clearAll", () => {
    if (!socket.isAdmin) return;
    centers.forEach((center) => {
      center.topics.forEach((topic) => {
        topic.student = null;
        topic.time = null;
      });
    });
    studentCenter = {};
    console.log("🧹 Админ очистил все выборы");
    io.emit("updateTopics", centers);
  });

  socket.on("disconnect", () => {
    if (socket.fio) console.log(`❎ Шығып кетті: ${socket.fio}`);
  });
});

// CSV отчёт
app.get("/downloadReport", (req, res) => {
  let csv = "Толық аты-жөні,Центр,Тақырып,Таңдау уақыты\n";
  centers.forEach((center) => {
    center.topics.forEach((t) => {
      if (t.student)
        csv += `${t.student},${center.name.kk},${t.title.kk},${t.time}\n`;
    });
  });
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=report.csv");
  res.send(csv);
});

// запуск сервера
http.listen(3000, "0.0.0.0", () => {
  console.log("🚀 Сервер іске қосылды: http://0.0.0.0:3000");
});

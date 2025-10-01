// server.js
const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

// Загружаем студентов
const students = require("./students.js");

// Загружаем центры с темами
const centers = require("./centers.js");

// В памяти хранение выбранных тем
// Формат: { "topicId": { fio: "ФИО", time: "время выбора" } }
let selectedTopics = {};

// Маршрут для фронтенда
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Проверка логина студента
app.post("/login", (req, res) => {
  const { fio, iin } = req.body;
  const student = students.find(s => s.fio === fio && s.iin === iin);
  if (student) {
    res.json({ success: true, student });
  } else {
    res.json({ success: false, message: "Студент не найден" });
  }
});

// Получить все центры и темы (с пометкой, занята или нет)
app.get("/centers", (req, res) => {
  const response = centers.map(center => ({
    ...center,
    topics: center.topics.map(t => ({
      ...t,
      selected: selectedTopics[t.id] ? true : false,
      student: selectedTopics[t.id] ? selectedTopics[t.id].fio : null,
      time: selectedTopics[t.id] ? selectedTopics[t.id].time : null
    }))
  }));
  res.json(response);
});

// Выбор темы
app.post("/select-topic", (req, res) => {
  const { topicId, fio } = req.body;

  // Проверка, что тема еще свободна
  if (selectedTopics[topicId]) {
    return res.json({ success: false, message: "Тема уже выбрана" });
  }

  // Сохраняем выбор
  const now = new Date().toLocaleString();
  selectedTopics[topicId] = { fio, time: now };
  res.json({ success: true, topicId, fio, time: now });
});

// Сброс темы (если нужно для админа)
app.post("/unselect-topic", (req, res) => {
  const { topicId } = req.body;
  if (selectedTopics[topicId]) {
    delete selectedTopics[topicId];
    return res.json({ success: true });
  }
  res.json({ success: false, message: "Тема не была выбрана" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

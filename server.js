const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const students = require('./students');
const centers = require('./centers');

app.use(express.static('public'));

let studentCenter = {};

io.on('connection', (socket) => {
  console.log("🔗 Новый студент подключился");

  socket.on('registerStudent', ({ fio, iin }) => {
    const student = students.find(s => s.fio === fio && s.iin === iin);
    if (!student) return socket.emit('authError', "❌ Неверное ФИО или ИИН");

    socket.fio = fio;
    socket.isAdmin = student.isAdmin || false;
    socket.emit('topicsList', centers, socket.isAdmin);
  });

  socket.on('chooseTopic', ({ fio, centerName, topicId }) => {
    const center = centers.find(c => c.name.kz === centerName || c.name.ru === centerName);
    if (!center) return;

    if (studentCenter[fio] && studentCenter[fio] !== center.name.kz) {
      return socket.emit('topicError', "⚠️ Уже выбрана тема в другом центре");
    }

    let topic = center.topics.find(t => t.id === topicId);
    if (!topic || topic.student) return socket.emit('topicError', "❌ Тема занята");

    topic.student = fio;
    topic.time = new Date().toLocaleString("kk-KZ", { timeZone: "Asia/Almaty" });
    studentCenter[fio] = center.name.kz;

    io.emit('topicsList', centers, socket.isAdmin);
  });

  socket.on('clearAll', () => {
    if (!socket.isAdmin) return;
    centers.forEach(c => c.topics.forEach(t => { t.student = null; t.time = null; }));
    studentCenter = {};
    io.emit('topicsList', centers, true);
  });

  socket.on('disconnect', () => {
    if (socket.fio) console.log(`❎ Вышел: ${socket.fio}`);
  });
});

app.get('/downloadReport', (req, res) => {
  let csv = "ФИО,Центр,Тема,Время\n";
  centers.forEach(c => c.topics.forEach(t => {
    if (t.student) csv += `${t.student},${c.name.ru},${t.title.ru},${t.time}\n`;
  }));
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
  res.send(csv);
});

http.listen(3000, () => console.log("🚀 Сервер запущен на http://localhost:3000"));

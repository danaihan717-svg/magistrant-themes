const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Загружаем списки студентов и центров
const students = require('./students');
const centers = require('./centers');

app.use(express.static('public'));

// Кто какой центр выбрал (ФИО → центр)
let studentCenter = {};

io.on('connection', (socket) => {
  console.log("🔗 Жаңа магистрант қосылды");

  // Авторизация
  socket.on('registerStudent', ({ fio, iin }) => {
    const student = students.find(s => s.fio === fio && s.iin === iin);
    if (!student) {
      socket.emit('authError', "❌ ФИО немесе ИИН қате!");
      return;
    }

    socket.fio = fio;
    socket.isAdmin = student.isAdmin || false;

    console.log(`✅ Тіркелді: ${fio} ${socket.isAdmin ? "(ADMIN)" : ""}`);

    // отправляем список центров + права админа
    socket.emit('topicsList', centers, socket.isAdmin);
  });

  // Выбор темы студентом
  socket.on('chooseTopic', ({ fio, centerName, topicId }) => {
    const center = centers.find(c => c.name.kk === centerName || c.name.ru === centerName);
    if (!center) return;

    // Проверка: если студент уже выбрал другой центр
    if (studentCenter[fio] && studentCenter[fio] !== center.name.kk) {
      socket.emit('topicError', "⚠️ Сіз басқа орталықтан тақырып таңдадыңыз!");
      return;
    }

    let topic = center.topics.find(t => t.id === topicId);
    if (!topic) return;

    if (topic.student) {
      socket.emit('topicError', "❌ Бұл тақырып толы!");
      return;
    }

    // Проверка: студент уже выбрал тему в этом центре
    let already = center.topics.find(t => t.student === fio);
    if (already) {
      socket.emit('topicError', "⚠️ Сіз бұл орталықтан тақырып таңдадыңыз!");
      return;
    }

    // Фиксация выбора
    topic.student = fio;
    topic.time = new Date().toLocaleString("kk-KZ", { timeZone: "Asia/Almaty" });
    studentCenter[fio] = center.name.kk;

    console.log(`🎓 ${fio} таңдады: ${topic.title.kk}`);

    // Обновляем у всех
    io.emit('topicsList', centers, socket.isAdmin);
  });

  // Очистка всех выборов (только админ)
  socket.on("clearAll", () => {
    if (!socket.isAdmin) return;
    centers.forEach(center => {
      center.topics.forEach(topic => {
        topic.student = null;
        topic.time = null;
      });
    });
    studentCenter = {};
    console.log("🧹 Админ очистил все выборы");
    io.emit("topicsList", centers, true);
  });

  // Выход
  socket.on('disconnect', () => {
    if (socket.fio) console.log(`❎ Шығып кетті: ${socket.fio}`);
  });
});

// CSV отчет
app.get('/downloadReport', (req, res) => {
  let csv = "Толық аты-жөні,Центр,Тақырып,Таңдау уақыты\n";
  centers.forEach(center => {
    center.topics.forEach(t => {
      if (t.student) csv += `${t.student},${center.name.kk},${t.title.kk},${t.time}\n`;
    });
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
  res.send(csv);
});

// запуск сервера
http.listen(3000, "0.0.0.0", () => {
  console.log("🚀 Сервер іске қосылды: http://0.0.0.0:3000");
});

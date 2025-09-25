const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

// Центры учебных программ
let centers = [
  {
    name: "Мемлекеттік-құқықтық пәндердің ғылыми-білім беру орталығы",
    maxStudents: 31,
    topics: []
  },
  {
    name: "Азаматтық-құқықтық пәндердің ғылыми-білім беру орталығы",
    maxStudents: 31,
    topics: []
  },
  {
    name: "Қылмыстық-құқықтық пәндердің ғылыми-білім беру орталығы",
    maxStudents: 31,
    topics: []
  }
];

// Генерация 33 тем для каждого центра
centers.forEach(center => {
  for (let i = 1; i <= 33; i++) {
    center.topics.push({
      id: i,
      title: `Тақырып ${i} (${center.name})`,
      student: null,
      time: null
    });
  }
});

// Socket.IO
io.on('connection', (socket) => {
  console.log("🔗 Жаңа магистрант қосылды");

  socket.on('registerStudent', (fio) => {
    socket.fio = fio;
    console.log(`✅ Тіркелді: ${fio}`);
    socket.emit('topicsList', centers);
  });

  socket.on('chooseTopic', ({ fio, centerName, topicId }) => {
    const center = centers.find(c => c.name === centerName);
    if (!center) return;

    let selectedCount = center.topics.filter(t => t.student).length;
    if (selectedCount >= center.maxStudents) {
      socket.emit('topicError', `❌ Бұл орталықта таңдауға рұқсат жоқ (толық)!`);
      return;
    }

    let topic = center.topics.find(t => t.id === topicId);
    if (!topic) return;

    if (topic.student) {
      socket.emit('topicError', "❌ Бұл тақырып толы!");
      return;
    }

    // Студент уже выбрал тему в этом центре
    let already = center.topics.find(t => t.student === fio);
    if (already) {
      socket.emit('topicError', "⚠️ Сіз бұл орталықтан тақырып таңдадыңыз!");
      return;
    }

    topic.student = fio;
    topic.time = new Date().toLocaleString("kk-KZ", { timeZone: "Asia/Almaty" });

    console.log(`🎓 ${fio} таңдады: ${topic.title}`);
    io.emit('topicsList', centers);
  });

  socket.on('disconnect', () => {
    if (socket.fio) console.log(`❎ Шығып кетті: ${socket.fio}`);
  });
});

// CSV отчёт
app.get('/downloadReport', (req, res) => {
  let csv = "Толық аты-жөні,Центр,Тақырып,Таңдау уақыты\n";
  centers.forEach(center => {
    center.topics.forEach(t => {
      if (t.student) csv += `${t.student},${center.name},${t.title},${t.time}\n`;
    });
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
  res.send(csv);
});

http.listen(3000, () => {
  console.log("🚀 Сервер іске қосылды: http://localhost:3000");
});

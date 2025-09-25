const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');

app.use(express.static('public'));

// Тақырыптар тізімі (өз 100 тақырыбыңызбен ауыстыруға болады)
let topics = [
  { id: 1, title: "Node.js-та веб-қосымшаларды әзірлеу", student: null, time: null },
  { id: 2, title: "Жасанды интеллект және машиналық оқыту", student: null, time: null },
  { id: 3, title: "Корпоративтік желілердің киберқауіпсіздігі", student: null, time: null },
  { id: 4, title: "Android үшін мобильді қосымшаларды әзірлеу", student: null, time: null },
  { id: 5, title: "Деректерді талдау және Data Science", student: null, time: null },
  { id: 6, title: "Бұлтты есептеу және DevOps", student: null, time: null },
  { id: 7, title: "Виртуалды және кеңейтілген шындық", student: null, time: null },
  { id: 8, title: "Өнеркәсіпте заттар интернеті (IoT)", student: null, time: null },
  { id: 9, title: "Блокчейн және криптовалюталар", student: null, time: null },
  { id: 10, title: "Дерекқорларды жобалау", student: null, time: null },
  { id: 11, title: "Академия қалай көркейту қажет", student: null, time: null },
  { id: 12, title: "Пик-никке қашан барамыз? Фантастика", student: null, time: null },
  { id: 13, title: "Не десем екен, не десем?", student: null, time: null },
  { id: 14, title: "Бұл жерде Сіздің тақырыбыңыз болуы мүмкін еді", student: null, time: null },
  { id: 12, title: "Осы платформаға премия береді ме екен?", student: null, time: null }
  // …қалғандарын 100-ге дейін қосыңыз
];

// Socket.IO
io.on('connection', (socket) => {
  console.log("🔗 Жаңа магистрант қосылды");

  // студентті тіркеу
  socket.on('registerStudent', (fio) => {
    socket.fio = fio;
    console.log(`✅ Тіркелді: ${fio}`);
    socket.emit('topicsList', topics);
  });

  // тақырыпты таңдау
  socket.on('chooseTopic', ({ fio, topicId }) => {
    let topic = topics.find(t => t.id === topicId);
    if (!topic) return;

    if (topic.student) {
      socket.emit('topicError', "❌ Бұл тақырып толы!");
      return;
    }

    // студент бұрын таңдаған ба?
    let already = topics.find(t => t.student === fio);
    if (already) {
      socket.emit('topicError', "⚠️ Сіз бұрын тақырып таңдадыңыз!");
      return;
    }

    // тақырыпты бекіту және уақытты жазу (Asia/Almaty)
    topic.student = fio;
    topic.time = new Date().toLocaleString("ru-RU", { timeZone: "Asia/Almaty" });

    console.log(`🎓 ${fio} тақырып таңдады: ${topic.title} (${topic.time})`);
    io.emit('topicsList', topics);
  });

  socket.on('disconnect', () => {
    if (socket.fio) {
      console.log(`❎ Шығып кетті: ${socket.fio}`);
    }
  });
});

// CSV есепті жүктеу маршруты
app.get('/downloadReport', (req, res) => {
  let csv = "Толық аты-жөні,Тақырып,Таңдау уақыты\n";
  topics.forEach(t => {
    if (t.student) {
      csv += `${t.student},${t.title},${t.time}\n`;
    }
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
  res.send(csv);
});

http.listen(3000, () => {
  console.log("🚀 Сервер іске қосылды: http://localhost:3000");
});

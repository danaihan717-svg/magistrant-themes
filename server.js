const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const students = require('./students');
const centers = require('./centers');

app.use(express.static('public'));

let studentCenter = {};

io.on('connection', socket => {
  console.log("🔗 Жаңа магистрант қосылды");

  socket.on('registerStudent', ({ iin }) => {
    const student = students.find(s => s.iin === iin);
    if (!student) {
      socket.emit('authError', "❌ ИИН қате!");
      return;
    }

    socket.fio = student.fio;
    socket.isAdmin = student.isAdmin || false;

    console.log(`✅ Тіркелді: ${student.fio} ${socket.isAdmin?"(ADMIN)":""}`);
    socket.emit('topicsList', centers, socket.isAdmin, student.fio);
  });

  socket.on('chooseTopic', ({ fio, centerName, topicId }) => {
    const center = centers.find(c => c.name.kk === centerName || c.name.ru === centerName);
    if (!center) return;

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

    let already = center.topics.find(t => t.student === fio);
    if (already) {
      socket.emit('topicError', "⚠️ Сіз бұл орталықтан тақырып таңдадыңыз!");
      return;
    }

    topic.student = fio;
    topic.time = new Date().toLocaleString("kk-KZ", { timeZone: "Asia/Almaty" });
    studentCenter[fio] = center.name.kk;

    console.log(`🎓 ${fio} таңдады: ${topic.title.kk}`);
    io.emit('topicsList', centers, socket.isAdmin, fio);
  });

  socket.on('clearAll', () => {
    if (!socket.isAdmin) return;
    centers.forEach(center => center.topics.forEach(t => { t.student=null; t.time=null; }));
    studentCenter = {};
    console.log("🧹 Админ очистил все выборы");
    io.emit("topicsList", centers, true, "Админ");
  });

  socket.on('disconnect', () => {
    if(socket.fio) console.log(`❎ Шығып кетті: ${socket.fio}`);
  });
});

app.get('/downloadReport', (req,res)=>{
  let csv = "ФИО,Центр,Тема,Время\n";
  centers.forEach(center=>{
    center.topics.forEach(t=>{
      if(t.student) csv += `${t.student},${center.name.kk},${t.title.kk},${t.time}\n`;
    });
  });
  res.setHeader('Content-Type','text/csv');
  res.setHeader('Content-Disposition','attachment; filename=report.csv');
  res.send(csv);
});

http.listen(3000,"0.0.0.0",()=>console.log("🚀 Сервер запущен на http://0.0.0.0:3000"));

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const students = require('./students');
const centers = require('./centers');

app.use(express.static('public'));

let studentCenter = {};

io.on('connection', socket => {
  console.log("🔗 Новый магистрант подключился");

  socket.on('registerStudent', ({ iin }) => {
    const student = students.find(s => s.iin === iin);
    if (!student) return socket.emit('authError', "❌ ИИН қате!");
    socket.fio = student.fio;
    socket.isAdmin = student.isAdmin || false;
    socket.emit('topicsList', centers, socket.isAdmin, student.fio);
  });

  socket.on('chooseTopic', ({ fio, centerName, topicId }) => {
    const center = centers.find(c => c.name.kk === centerName.kk);
    if (!center) return;

    if (studentCenter[fio] && studentCenter[fio] !== centerName.kk) {
      return socket.emit('topicError', "⚠️ Сіз басқа орталықтан тақырып таңдадыңыз!");
    }

    const topic = center.topics.find(t => t.id === topicId);
    if (!topic || topic.student) return socket.emit('topicError', "❌ Бұл тақырып толы!");

    if (center.topics.find(t => t.student===fio)) return socket.emit('topicError', "⚠️ Сіз бұл орталықтан тақырып таңдадыңыз!");

    topic.student = fio;
    topic.time = new Date().toLocaleString("kk-KZ", { timeZone: "Asia/Almaty" });
    studentCenter[fio] = centerName.kk;
    io.emit('topicsList', centers, socket.isAdmin, fio);
  });

  socket.on('clearAll', () => {
    if (!socket.isAdmin) return;
    centers.forEach(c => c.topics.forEach(t => { t.student=null; t.time=null; }));
    studentCenter = {};
    io.emit('topicsList', centers, true, socket.fio);
  });

  socket.on('disconnect', () => { if(socket.fio) console.log(`❎ Отключился: ${socket.fio}`); });
});

app.get('/downloadReport', (req,res)=>{
  let csv = "ФИО,Центр,Тема,Время выбора\n";
  centers.forEach(c=>c.topics.forEach(t=>{ if(t.student) csv+=`${t.student},${c.name.kk},${t.title.kk},${t.time}\n`; }));
  res.setHeader('Content-Type','text/csv');
  res.setHeader('Content-Disposition','attachment; filename=report.csv');
  res.send(csv);
});

http.listen(3000,"0.0.0.0",()=>console.log("🚀 Сервер запущен на http://0.0.0.0:3000"));

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

// создаём список из 100 тем
let topics = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  title: `Тема ${i + 1}`,
  student: null
}));

io.on('connection', (socket) => {
  console.log("🔗 Новый магистрант подключился");

  // регистрация студента
  socket.on('registerStudent', (fio) => {
    socket.fio = fio;
    console.log(`✅ Зарегистрировался: ${fio}`);
    socket.emit('topicsList', topics); // отправляем список тем
  });

  // выбор темы
  socket.on('chooseTopic', ({ fio, topicId }) => {
    let topic = topics.find(t => t.id === topicId);

    if (!topic) return;

    if (topic.student) {
      socket.emit('topicError', "❌ Эта тема уже занята!");
      return;
    }

    // проверяем — студент уже выбрал?
    let already = topics.find(t => t.student === fio);
    if (already) {
      socket.emit('topicError', "⚠️ Вы уже выбрали тему!");
      return;
    }

    // закрепляем тему
    topic.student = fio;
    console.log(`🎓 ${fio} выбрал тему: ${topic.title}`);
    io.emit('topicsList', topics); // обновляем у всех
  });

  socket.on('disconnect', () => {
    if (socket.fio) {
      console.log(`❎ Отключился: ${socket.fio}`);
    }
  });
});

http.listen(3000, () => {
  console.log("🚀 Сервер запущен: http://localhost:3000");
});

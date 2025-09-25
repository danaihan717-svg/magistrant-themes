const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

// Список тем (можно заменить на реальные 100)
let topics = [
  { id: 1, title: "Разработка веб-приложений на Node.js", student: null, time: null },
  { id: 2, title: "Искусственный интеллект и машинное обучение", student: null, time: null },
  { id: 3, title: "Кибербезопасность корпоративных сетей", student: null, time: null },
  { id: 4, title: "Разработка мобильных приложений для Android", student: null, time: null },
  { id: 5, title: "Анализ данных и Data Science", student: null, time: null },
  { id: 6, title: "Облачные вычисления и DevOps", student: null, time: null },
  { id: 7, title: "Виртуальная и дополненная реальность", student: null, time: null },
  { id: 8, title: "Интернет вещей (IoT) в промышленности", student: null, time: null },
  { id: 9, title: "Блокчейн и криптовалюты", student: null, time: null },
  { id: 10, title: "Проектирование баз данных", student: null, time: null }
  // …добавьте оставшиеся до 100 тем
];

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

    // закрепляем тему и время выбора
    topic.student = fio;
    topic.time = new Date().toLocaleString();

    console.log(`🎓 ${fio} выбрал тему: ${topic.title} (${topic.time})`);
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

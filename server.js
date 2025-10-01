const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const students = require('./students');
const centers = require('./centers');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let selectedTopics = {}; // { "центрID-темаID": studentIIN }

app.get('/api/students', (req, res) => {
  res.json(students);
});

app.get('/api/centers', (req, res) => {
  res.json(centers);
});

app.post('/api/select-topic', (req, res) => {
  const { studentIIN, centerId, topicId } = req.body;
  const key = `${centerId}-${topicId}`;
  if (selectedTopics[key]) {
    return res.status(400).json({ message: 'Тема уже выбрана' });
  }
  // Проверяем, не выбрал ли студент другую тему
  const alreadySelected = Object.entries(selectedTopics).find(
    ([k, v]) => v === studentIIN
  );
  if (alreadySelected) {
    return res.status(400).json({ message: 'Вы уже выбрали тему' });
  }
  selectedTopics[key] = studentIIN;
  io.emit('topic-selected', { key, studentIIN, time: new Date() });
  res.json({ message: 'Тема успешно выбрана', key });
});

app.post('/api/logout', (req, res) => {
  // Для простоты просто отвечаем
  res.json({ message: 'Выход выполнен' });
});

io.on('connection', (socket) => {
  console.log('Пользователь подключен');
  // Можно отправить текущие выбранные темы
  socket.emit('init-selected', selectedTopics);
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

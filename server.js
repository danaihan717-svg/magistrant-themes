const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const students = require('./students');
const centers = require('./centers');

app.use(express.static('public'));

// сопоставление: студент -> центр (по ФИО)
let studentCenter = {};

// Когда клиент авторизовался, мы отправляем ему authSuccess (фио, права) и текущие центры.
// Когда кто-то выбирает тему — сервер фиксирует и всем рассылает обновление (topicsUpdate).
io.on('connection', socket => {
  console.log('🔗 Подключение');

  socket.on('registerStudent', ({ iin, lang }) => {
    const student = students.find(s => s.iin === iin);
    if (!student) {
      socket.emit('authError', '❌ ИИН неверный!');
      return;
    }
    socket.fio = student.fio;
    socket.isAdmin = !!student.isAdmin;
    socket.lang = lang || 'kk';
    console.log(`✅ Авторизация: ${socket.fio} ${socket.isAdmin ? '(ADMIN)' : ''}`);

    // Отправляем только этому сокету — чтобы он установил своё currentFio
    socket.emit('authSuccess', {
      fio: socket.fio,
      isAdmin: socket.isAdmin,
      centers, // текущий список (состояние)
      lang: socket.lang
    });
  });

  socket.on('chooseTopic', ({ fio, centerName, topicId }) => {
    // Ищем центр по kk или ru
    const center = centers.find(c => c.name.kk === centerName || c.name.ru === centerName);
    if (!center) {
      socket.emit('topicError', '❌ Центр не найден!');
      return;
    }

    // Если студент уже выбрал тему в другом центре — запрет
    if (studentCenter[fio] && studentCenter[fio] !== center.name.kk && studentCenter[fio] !== center.name.ru) {
      socket.emit('topicError', '⚠️ Вы уже выбрали тему в другом центре!');
      return;
    }

    const topic = center.topics.find(t => t.id === topicId);
    if (!topic) {
      socket.emit('topicError', '❌ Тема не найдена!');
      return;
    }
    if (topic.student) {
      socket.emit('topicError', '❌ Тема уже занята!');
      return;
    }

    // Проверяем, не выбрал ли студент уже тему в этом же центре
    const already = center.topics.find(t => t.student === fio);
    if (already) {
      socket.emit('topicError', '⚠️ Вы уже выбрали тему в этом центре!');
      return;
    }

    // Фиксация
    topic.student = fio;
    topic.time = new Date().toLocaleString('kk-KZ', { timeZone: 'Asia/Almaty' });
    studentCenter[fio] = center.name.kk;

    console.log(`🎓 ${fio} выбрал тему ${topic.id} в центре "${center.name.kk}"`);

    // Всем даём обновлённый список (без подмены currentFio у клиентов)
    io.emit('topicsUpdate', centers);
  });

  socket.on('clearAll', () => {
    if (!socket.isAdmin) return;
    centers.forEach(c => c.topics.forEach(t => { t.student = null; t.time = null; }));
    studentCenter = {};
    console.log('🧹 Очистка всеми админом');
    io.emit('topicsUpdate', centers);
  });

  socket.on('disconnect', () => {
    if (socket.fio) console.log(`❎ Отключился: ${socket.fio}`);
  });
});

// CSV с support языка через query param ?lang=kk|ru
app.get('/downloadReport', (req, res) => {
  const lang = (req.query.lang === 'ru') ? 'ru' : 'kk';
  let csv = `ФИО,Центр,Тақырып,Таңдау уақыты\n`;
  centers.forEach(center => {
    center.topics.forEach(t => {
      if (t.student) csv += `${t.student},${center.name[lang]},${t.title[lang]},${t.time}\n`;
    });
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
  res.send(csv);
});

http.listen(3000, '0.0.0.0', () => console.log('🚀 Сервер запущен на http://0.0.0.0:3000'));

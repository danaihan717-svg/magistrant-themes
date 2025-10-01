let currentStudent = null;
let currentLang = 'kz';
let centers = [];
let selectedTopics = {};

document.addEventListener('DOMContentLoaded', async () => {
  const studentsRes = await fetch('/api/students');
  const studentsList = await studentsRes.json();

  const centersRes = await fetch('/api/centers');
  centers = await centersRes.json();

  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const iin = document.getElementById('iin').value.trim();
    const student = studentsList.find(s => s.IIN === iin);
    if (!student) return alert('Студент не найден');
    currentStudent = student;
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-section').style.display = 'block';
    document.getElementById('student-name').textContent = student.name;
    renderCenters();
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    location.reload();
  });

  document.getElementById('lang-kz').addEventListener('click', () => {
    currentLang = 'kz';
    renderCenters();
  });

  document.getElementById('lang-ru').addEventListener('click', () => {
    currentLang = 'ru';
    renderCenters();
  });

  const socket = io();
  socket.on('topic-selected', ({ key, studentIIN, time }) => {
    selectedTopics[key] = { studentIIN, time };
    renderCenters();
  });

  socket.on('init-selected', (data) => {
    selectedTopics = data;
    renderCenters();
  });
});

function renderCenters() {
  const container = document.getElementById('centers-container');
  container.innerHTML = '';
  centers.forEach((center, ci) => {
    const centerDiv = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = currentLang === 'kz' ? center.name_kz : center.name_ru;
    title.style.cursor = 'pointer';
    centerDiv.appendChild(title);

    const topicsDiv = document.createElement('div');
    topicsDiv.style.display = 'none';
    center.topics.forEach((topic, ti) => {
      const key = `${ci}-${ti}`;
      const isSelected = selectedTopics[key];
      const btn = document.createElement('button');
      btn.textContent = currentLang === 'kz' ? topic.kz : topic.ru;
      btn.disabled = isSelected && isSelected.studentIIN !== currentStudent.IIN;
      if (isSelected) {
        btn.textContent += ` (Выбран: ${studentsNameByIIN(isSelected.studentIIN)}, ${new Date(isSelected.time).toLocaleTimeString()})`;
      }
      btn.addEventListener('click', async () => {
        try {
          const res = await fetch('/api/select-topic', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentIIN: currentStudent.IIN, centerId: ci, topicId: ti })
          });
          const data = await res.json();
          if (res.ok) {
            selectedTopics[key] = { studentIIN: currentStudent.IIN, time: new Date() };
            renderCenters();
          } else {
            alert(data.message);
          }
        } catch (err) {
          console.error(err);
        }
      });
      topicsDiv.appendChild(btn);
      topicsDiv.appendChild(document.createElement('br'));
    });

    title.addEventListener('click', () => {
      topicsDiv.style.display = topicsDiv.style.display === 'none' ? 'block' : 'none';
    });

    centerDiv.appendChild(topicsDiv);
    container.appendChild(centerDiv);
  });
}

function studentsNameByIIN(iin) {
  const student = currentStudent && currentStudent.IIN === iin ? currentStudent : null;
  if (!student) {
    return iin;
  }
  return student.name;
}

const socket = io();
let students = [];
let centers = [];
let selectedThemes = {};
let currentStudent = null;
let lang = "kz";

const loginDiv = document.getElementById("login");
const mainDiv = document.getElementById("main");
const studentNameSpan = document.getElementById("studentName");
const centersContainer = document.getElementById("centersContainer");

document.getElementById("loginBtn").onclick = async () => {
  const name = document.getElementById("name").value.trim();
  const iin = document.getElementById("iin").value.trim();
  if (!name || !iin) return alert("Введите ФИО и ИИН");

  const res = await fetch("/students");
  students = await res.json();
  currentStudent = students.find(s => s.name === name && s.iin === iin);
  if (!currentStudent) return alert("Студент не найден");

  loginDiv.classList.add("hidden");
  mainDiv.classList.remove("hidden");
  studentNameSpan.textContent = currentStudent.name;

  loadCenters();
};

document.getElementById("logoutBtn").onclick = () => location.reload();
document.getElementById("langSelect").onchange = (e) => { lang = e.target.value; loadCenters(); };

async function loadCenters() {
  const res = await fetch("/centers");
  centers = await res.json();

  const selRes = await fetch("/selected");
  selectedThemes = await selRes.json();

  centersContainer.innerHTML = "";
  centers.forEach(center => {
    const div = document.createElement("div");
    div.className = "center";
    div.innerHTML = `<b>${center.name[lang]}</b>`;
    center.themes.forEach((theme, index) => {
      const themeDiv = document.createElement("div");
      themeDiv.className = "theme";
      themeDiv.textContent = theme[lang];

      const selStudent = selectedThemes[center.id]?.[index];
      if (selStudent) themeDiv.textContent += ` (Занято / Толық)`;
      themeDiv.onclick = () => {
        if (selStudent) return alert("Тема уже занята");
        socket.emit("selectTheme", { centerId: center.id, themeIndex: index, studentIIN: currentStudent.iin });
      };

      div.appendChild(themeDiv);
    });
    centersContainer.appendChild(div);
  });
}

socket.on("updateSelected", ({ centerId, themeIndex, studentIIN, time }) => {
  if (!selectedThemes[centerId]) selectedThemes[centerId] = {};
  selectedThemes[centerId][themeIndex] = studentIIN;
  loadCenters();
});

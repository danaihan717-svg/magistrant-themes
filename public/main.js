const socket = io();

let currentFio = null;
let isAdmin = false;
let currentLang = "kk";

const loginDiv = document.getElementById("login");
const appDiv = document.getElementById("app");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const fioInput = document.getElementById("fio");
const iinInput = document.getElementById("iin");
const loginError = document.getElementById("loginError");
const userNameSpan = document.getElementById("userName");
const centersDiv = document.getElementById("centers");
const langSelect = document.getElementById("lang");
const downloadBtn = document.getElementById("downloadReport");

loginBtn.onclick = () => {
  const fio = fioInput.value.trim();
  const iin = iinInput.value.trim();
  socket.emit("registerStudent", { fio, iin });
};

logoutBtn.onclick = () => {
  location.reload();
};

langSelect.onchange = () => {
  currentLang = langSelect.value;
  renderCenters(window.centersData || []);
};

downloadBtn.onclick = () => {
  window.open("/downloadReport", "_blank");
};

socket.on("authError", msg => {
  loginError.textContent = msg;
});

socket.on("topicsList", (centers, admin) => {
  currentFio = fioInput.value.trim();
  isAdmin = admin;
  window.centersData = centers;
  loginDiv.style.display = "none";
  appDiv.style.display = "block";
  userNameSpan.textContent = currentFio;
  renderCenters(centers);
});

function renderCenters(centers) {
  centersDiv.innerHTML = "";
  centers.forEach(center => {
    const cDiv = document.createElement("div");
    cDiv.className = "center";

    const name = currentLang === "kk" ? center.name : center.name_ru;
    const header = document.createElement("h3");
    header.textContent = name;
    cDiv.appendChild(header);

    center.topics.forEach(t => {
      const tDiv = document.createElement("div");
      tDiv.className = "topic";
      tDiv.textContent = currentLang === "kk" ? t.title_kk : t.title_ru;
      if (t.student) tDiv.classList.add("taken");

      const chooseBtn = document.createElement("button");
      chooseBtn.textContent = "Таңдау / Выбрать";
      chooseBtn.disabled = t.student && t.student !== currentFio;

      chooseBtn.onclick = () => {
        socket.emit("chooseTopic", { fio: currentFio, centerName: center.name, topicId: t.id });
      };

      tDiv.appendChild(chooseBtn);

      if (t.student === currentFio) {
        const timeSpan = document.createElement("span");
        timeSpan.textContent = ` ✅ (${t.time})`;
        tDiv.appendChild(timeSpan);
      }

      cDiv.appendChild(tDiv);
    });

    centersDiv.appendChild(cDiv);
  });
}

const loginDiv = document.getElementById("login");
const appDiv = document.getElementById("app");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const fullNameInput = document.getElementById("fullName");
const iinInput = document.getElementById("iin");
const loginError = document.getElementById("loginError");
const currentUserSpan = document.getElementById("currentUser");
const centersContainer = document.getElementById("centersContainer");
const languageSelect = document.getElementById("language");

loginBtn.addEventListener("click", () => {
  const fullName = fullNameInput.value.trim();
  const iin = iinInput.value.trim();
  const student = students.find(s => s.fullName === fullName && s.iin === iin);
  if (!student) {
    loginError.textContent = "Студент табылмады / Студент не найден";
    return;
  }
  loggedStudent = student;
  loginDiv.style.display = "none";
  appDiv.style.display = "block";
  currentUserSpan.textContent = `${student.fullName}`;
  renderCenters();
});

logoutBtn.addEventListener("click", () => {
  loggedStudent = null;
  loginDiv.style.display = "block";
  appDiv.style.display = "none";
  fullNameInput.value = "";
  iinInput.value = "";
  loginError.textContent = "";
});

languageSelect.addEventListener("change", renderCenters);

function renderCenters() {
  const lang = languageSelect.value;
  centersContainer.innerHTML = "";
  centers.forEach(center => {
    const div = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = center.name[lang];
    div.appendChild(title);

    const ul = document.createElement("ul");
    center.topics.forEach(topic => {
      const li = document.createElement("li");
      const isLocked = lockedTopics[topic.id] && lockedTopics[topic.id] !== loggedStudent.iin;
      li.textContent = topic[lang] + (isLocked ? " (занято)" : "");
      li.style.cursor = isLocked ? "not-allowed" : "pointer";
      li.addEventListener("click", () => {
        if (isLocked || lockedTopics[topic.id] === loggedStudent.iin) return;
        // Снимаем предыдущую тему студента
        Object.keys(lockedTopics).forEach(k => {
          if (lockedTopics[k] === loggedStudent.iin) delete lockedTopics[k];
        });
        lockedTopics[topic.id] = loggedStudent.iin;
        renderCenters();
      });
      ul.appendChild(li);
    });
    div.appendChild(ul);
    centersContainer.appendChild(div);
  });
}

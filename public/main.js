// main.js

let currentStudent = null; // текущий магистрант
let currentLanguage = "kk"; // язык по умолчанию
let centers = []; // сюда загружается centers.js
let students = []; // сюда загружается students.js
let selectedTopics = {}; // { topicId: studentIIN }

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    loginForm.addEventListener("submit", handleLogin);

    // кнопки языка
    document.getElementById("lang-kk").addEventListener("click", () => switchLanguage("kk"));
    document.getElementById("lang-ru").addEventListener("click", () => switchLanguage("ru"));
});

function handleLogin(event) {
    event.preventDefault();
    const fioInput = document.getElementById("fio").value.trim();
    const iinInput = document.getElementById("iin").value.trim();

    currentStudent = students.find(s => s.fio === fioInput && s.iin === iinInput);
    if (!currentStudent) {
        alert("ФИО или ИИН не найден!");
        return;
    }

    document.getElementById("login-section").style.display = "none";
    document.getElementById("student-section").style.display = "block";
    document.getElementById("student-name").textContent = currentStudent.fio;

    renderCenters();
}

function logout() {
    currentStudent = null;
    document.getElementById("login-section").style.display = "block";
    document.getElementById("student-section").style.display = "none";
}

function switchLanguage(lang) {
    currentLanguage = lang;
    renderCenters();
}

function renderCenters() {
    const container = document.getElementById("centers");
    container.innerHTML = "";

    centers.forEach(center => {
        const centerDiv = document.createElement("div");
        centerDiv.className = "center";

        const centerTitle = document.createElement("h3");
        centerTitle.textContent = currentLanguage === "kk" ? center.name_kk : center.name_ru;
        centerTitle.style.cursor = "pointer";
        centerTitle.addEventListener("click", () => {
            const themesDiv = centerDiv.querySelector(".themes");
            themesDiv.style.display = themesDiv.style.display === "none" ? "block" : "none";
        });

        const themesDiv = document.createElement("div");
        themesDiv.className = "themes";
        themesDiv.style.display = "none";

        center.topics.forEach((topic, index) => {
            const topicDiv = document.createElement("div");
            topicDiv.className = "topic";

            const topicTitle = document.createElement("span");
            topicTitle.textContent = currentLanguage === "kk" ? topic.kk : topic.ru;

            const isTaken = selectedTopics[topic.id] && selectedTopics[topic.id] !== currentStudent.iin;
            const selectBtn = document.createElement("button");
            selectBtn.textContent = isTaken ? "Занято" : "Выбрать";
            selectBtn.disabled = isTaken || !!Object.values(selectedTopics).includes(currentStudent.iin);

            selectBtn.addEventListener("click", () => {
                selectedTopics[topic.id] = currentStudent.iin;
                alert(`Вы выбрали тему: ${topicTitle.textContent}`);
                renderCenters(); // обновляем интерфейс, чтобы все видели занятые темы
            });

            topicDiv.appendChild(topicTitle);
            topicDiv.appendChild(selectBtn);
            themesDiv.appendChild(topicDiv);
        });

        centerDiv.appendChild(centerTitle);
        centerDiv.appendChild(themesDiv);
        container.appendChild(centerDiv);
    });
}

// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const students = require("./students");
const centers = require("./centers");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use(express.json());

// хранение выбранных тем: { centerId: { themeIndex: studentIIN } }
const selectedThemes = {};

app.get("/students", (req, res) => res.json(students));
app.get("/centers", (req, res) => res.json(centers));
app.get("/selected", (req, res) => res.json(selectedThemes));

io.on("connection", (socket) => {
  socket.on("selectTheme", ({ centerId, themeIndex, studentIIN }) => {
    if (!selectedThemes[centerId]) selectedThemes[centerId] = {};
    if (!selectedThemes[centerId][themeIndex]) {
      selectedThemes[centerId][themeIndex] = studentIIN;
      io.emit("updateSelected", { centerId, themeIndex, studentIIN, time: new Date().toLocaleString() });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

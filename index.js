const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const PROGRESS_FILE = "progress.json";

const readProgress = () => {
    try {
        if (fs.existsSync(PROGRESS_FILE)) {
            return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
        }
    } catch (error) {
        console.error("Error reading progress file:", error);
        return {};
    }
    return {};
};

const writeProgress = (data) => {
    fs.writeFile(PROGRESS_FILE, JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error("Error writing progress file:", err);
        }
    });
};

const ensureGameAndLoginExist = (progress, gameId, login) => {
    if (!progress[gameId]) {
        progress[gameId] = {};
    }
    if (!progress[gameId][login]) {
        progress[gameId][login] = {
            login,
            password: "",
            mail: "",
            database: {},
            lastUpdated: Date.now(),
        };
    }
};

// Реєстрація нового користувача
app.post("/register", async (req, res) => {
    const { gameId, login, password, mail } = req.body;

    if (!gameId || !login || !password || !mail) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const progress = readProgress();
    if (progress[gameId] && progress[gameId][login]) {
        return res.status(400).json({ success: false, message: "Login already exists in this game." });
    }

    // Хешування пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!progress[gameId]) {
        progress[gameId] = {};
    }

    progress[gameId][login] = {
        login,
        password: hashedPassword,
        mail,
        database: {},
        lastUpdated: Date.now(),
    };

    writeProgress(progress);
    res.json({ success: true, message: "Registration successful!" });
});

// Вхід користувача
app.post("/login", async (req, res) => {
    const { gameId, login, password } = req.body;

    if (!gameId || !login || !password) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const progress = readProgress();
    if (!progress[gameId] || !progress[gameId][login]) {
        return res.status(404).json({ success: false, message: "Login not found." });
    }

    const isMatch = await bcrypt.compare(password, progress[gameId][login].password);
    if (!isMatch) {
        return res.status(403).json({ success: false, message: "Invalid password." });
    }

    res.json({ success: true, message: "Login successful!" });
});

// Отримання прогресу
app.post("/progress/:gameId/:login", async (req, res) => {
    const { gameId, login } = req.params;
    const { password } = req.body;

    const progress = readProgress();
    if (!progress[gameId] || !progress[gameId][login]) {
        return res.status(404).json({ success: false, message: "Login not found." });
    }

    const isMatch = await bcrypt.compare(password, progress[gameId][login].password);
    if (!isMatch) {
        return res.status(403).json({ success: false, message: "Invalid password." });
    }

    res.json(progress[gameId][login].database || {});
});

// Збереження прогресу
app.put("/progress/:gameId/:login", async (req, res) => {
    const { gameId, login } = req.params;
    const { password, data } = req.body;

    const progress = readProgress();
    if (!progress[gameId] || !progress[gameId][login]) {
        return res.status(404).json({ success: false, message: "Login not found." });
    }

    const isMatch = await bcrypt.compare(password, progress[gameId][login].password);
    if (!isMatch) {
        return res.status(403).json({ success: false, message: "Invalid password." });
    }

    progress[gameId][login].database = data;
    progress[gameId][login].lastUpdated = Date.now();

    writeProgress(progress);
    res.json({ success: true, message: "Progress saved!" });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

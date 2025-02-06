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
    if (fs.existsSync(PROGRESS_FILE)) {
        return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    }
    return {};
};

const writeProgress = (data) => {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2));
};

const cleanupOldProgress = () => {
    const progress = readProgress();
    const now = Date.now();

    for (const playerId in progress) {
        const lastUpdated = progress[playerId].lastUpdated || 0;
        const threeYears = 3 * 365 * 24 * 60 * 60 * 1000;

        if (now - lastUpdated > threeYears) {
            delete progress[playerId];
        }
    }

    writeProgress(progress);
};
// hi!
app.post("/register", async (req, res) => {
    const { playerId, password } = req.body;

    if (!playerId || !password) {
        return res.status(400).json({
            success: false,
            message: "Player ID and password are required.",
        });
    }

    const progress = readProgress();

    if (progress[playerId]) {
        return res
            .status(400)
            .json({ success: false, message: "Player ID already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    progress[playerId] = {
        password: hashedPassword,
        data: {},
        lastUpdated: Date.now(),
    };

    writeProgress(progress);

    res.json({ success: true, message: "Registration successful!" });
});

app.post("/login", async (req, res) => {
    const { playerId, password } = req.body;

    if (!playerId || !password) {
        return res.status(400).json({
            success: false,
            message: "Player ID and password are required.",
        });
    }

    const progress = readProgress();

    if (!progress[playerId]) {
        return res
            .status(404)
            .json({ success: false, message: "Player ID not found." });
    }

    const isMatch = await bcrypt.compare(password, progress[playerId].password);

    if (!isMatch) {
        return res
            .status(403)
            .json({ success: false, message: "Invalid password." });
    }

    res.json({ success: true, message: "Login successful!" });
});

app.get("/progress/:playerId", async (req, res) => {
    const playerId = req.params.playerId;
    const { password } = req.body; // Отримуємо пароль із тіла запиту

    const progress = readProgress();

    if (!progress[playerId]) {
        return res
            .status(404)
            .json({ success: false, message: "Player ID not found." });
    }

    const isMatch = await bcrypt.compare(password, progress[playerId].password);
    if (!isMatch) {
        return res
            .status(403)
            .json({ success: false, message: "Invalid password." });
    }

    res.json(progress[playerId].data || {});
});

app.post("/progress/:playerId", async (req, res) => {
    const playerId = req.params.playerId;
    const { password, data } = req.body;

    const progress = readProgress();

    if (!progress[playerId]) {
        return res
            .status(404)
            .json({ success: false, message: "Player ID not found." });
    }

    const isMatch = await bcrypt.compare(password, progress[playerId].password);
    if (!isMatch) {
        return res
            .status(403)
            .json({ success: false, message: "Invalid password." });
    }

    progress[playerId].data = data;
    progress[playerId].lastUpdated = Date.now();

    writeProgress(progress);

    res.json({ success: true, message: "Progress saved!" });
});

setInterval(cleanupOldProgress, 24 * 60 * 60 * 1000);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

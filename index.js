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

app.post("/register", async (req, res) => {
    const { gameId, login, password, mail } = req.body;

    if (!gameId || !login || !password) {
        return res
            .status(400)
            .json({ success: false, message: "All fields are required." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedMail = await bcrypt.hash(mail, 10);
    const hashedLogin = await bcrypt.hash(login, 10);

    const progress = readProgress();
    let found = false;
    if (progress[gameId]) {
        for (const element of Object.values(progress[gameId])) {
            const isMatch = await bcrypt.compare(login, element.login);
            if (isMatch) {
                found = true;
                break;
            }
        }
    }

    if (found) {
        return res.status(400).json({
            success: false,
            message: "Login already exists in this game.",
        });
    }

    if (!progress[gameId]) {
        progress[gameId] = {};
    }

    progress[gameId][hashedLogin] = {
        login: hashedLogin,
        password: hashedPassword,
        mail: hashedMail,
        database: {},
        lastUpdated: Date.now(),
    };

    writeProgress(progress);
    res.json({ success: true, message: "Registration successful!" });
});

app.post("/login", async (req, res) => {
    const { gameId, login, password } = req.body;
    const hashedLogin = await bcrypt.hash(login, 10);

    if (!gameId || !login || !password) {
        return res
            .status(400)
            .json({ success: false, message: "All fields are required." });
    }

    const progress = readProgress();
    let found = false;
    let thisElement;
    if (progress[gameId]) {
        for (const element of Object.values(progress[gameId])) {
            const isMatch = await bcrypt.compare(login, element.login);
            if (isMatch) {
                found = true;
                thisElement = element;
                break;
            }
        }
    }
    if (!progress[gameId] || !found) {
        return res
            .status(404)
            .json({ success: false, message: "Login not found." });
    }

    const isMatch = await bcrypt.compare(password, thisElement.password);
    if (!isMatch) {
        return res
            .status(403)
            .json({ success: false, message: "Invalid password." });
    }

    res.json({ success: true, message: "Login successful!" });
});

app.post("/progress/:gameId/:login", async (req, res) => {
    const { gameId, login } = req.params;
    const { password } = req.body;

    const progress = readProgress();
    let found = false;
    let thisElement;
    if (progress[gameId]) {
        for (const element of Object.values(progress[gameId])) {
            const isMatch = await bcrypt.compare(login, element.login);
            if (isMatch) {
                found = true;
                thisElement = element;
                break;
            }
        }
    }
    if (!progress[gameId] || !found) {
        return res
            .status(404)
            .json({ success: false, message: "Login not found." });
    }

    const isMatch = await bcrypt.compare(password, thisElement.password);
    if (!isMatch) {
        return res
            .status(403)
            .json({ success: false, message: "Invalid password." });
    }

    res.json(thisElement.database || {});
});

app.put("/progress/:gameId/:login", async (req, res) => {
    const { gameId, login } = req.params;
    const { password, data } = req.body;

    const progress = readProgress();
    let found = false;
    let thisElement;
    if (progress[gameId]) {
        for (const element of Object.values(progress[gameId])) {
            const isMatch = await bcrypt.compare(login, element.login);
            if (isMatch) {
                found = true;
                thisElement = element;
                break;
            }
        }
    }
    if (!progress[gameId] || !found) {
        return res
            .status(404)
            .json({ success: false, message: "Login not found." });
    }

    const isMatch = await bcrypt.compare(password, thisElement.password);
    if (!isMatch) {
        return res
            .status(403)
            .json({ success: false, message: "Invalid password." });
    }

    thisElement.database = data;
    thisElement.lastUpdated = Date.now();

    writeProgress(progress);
    res.json({ success: true, message: "Progress saved!" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

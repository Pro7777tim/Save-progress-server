const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto-js");
require("dotenv").config();

const app = express();
const PORT = 3000 || 3001 || 3002;

const corsOptions = {
    origin: [process.env.frontend.toString()],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use((req, res, next) => {
    if (req.url.includes(".env")) {
        return res.status(403).send("You do not have access.");
    }
    next();
});
console.log(process.env.frontend.toString());
const PROGRESS_FILE = "progress.json";
const EMAIL = process.env.email.toString();
const EMAILPAS = process.env.emailpas.toString();
const KEY = process.env.key.toString();
const transporter = nodemailer.createTransport({
    //pls edit this
    host: "exampleHost",
    port: "examplePort",
    secure: "exampleSecure",
    auth: {
        user: EMAIL,
        pass: EMAILPAS,
    },
});

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
const symbols = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
    "q",
    "w",
    "e",
    "r",
    "t",
    "y",
    "u",
    "i",
    "o",
    "p",
    "[",
    "]",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    ";",
    "'",
    "z",
    "x",
    "c",
    "v",
    "b",
    "n",
    "m",
    ",",
    ".",
    "/",
    "*",
    "-",
    "+",
];
const createCode = (symb, length) => {
    let result = symb[Math.floor(Math.random() * symb.length)];
    for (let i = 1; i < length; i++) {
        result = result + symb[Math.floor(Math.random() * symb.length)];
    }
    return result;
};
function encrypt(text, key) {
    return crypto.AES.encrypt(text, key).toString();
}
function decrypt(text, key) {
    return crypto.AES.decrypt(text, key).toString(crypto.enc.Utf8);
}

app.post("/register", async (req, res) => {
    try {
        const { gameId, login, password, mail } = req.body;

        if (!gameId || !login || !password) {
            return res
                .status(400)
                .json({ success: false, message: "All fields are required." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedMail = await encrypt(mail, KEY);
        const hashedLogin = await bcrypt.hash(login, 10);
        const hashedCode = await bcrypt.hash(createCode(symbols, 12), 10);

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
            code: hashedCode,
            send: false,
            attempts: 3,
            database: {},
            lastUpdated: Date.now(),
        };

        writeProgress(progress);
        res.json({ success: true, message: "Registration successful!" });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "The server could not process the request.",
        });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { gameId, login, password } = req.body;

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
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "The server could not process the request.",
        });
    }
});

app.post("/progress/:gameId/:login", async (req, res) => {
    try {
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
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "The server could not process the request.",
        });
    }
});

app.post("/restore/:gameId/:login", async (req, res) => {
    try {
        const { gameId, login } = req.params;
        const body = req.body;

        if (!gameId || !login || !body.newPassword || !body.code) {
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
        if (thisElement.attempts <= 0) {
            return res
                .status(403)
                .json({ success: false, message: "Attempts exhausted." });
        } else {
            thisElement.attempts--;
            writeProgress(progress);
        }

        const isMatch = await bcrypt.compare(body.code, thisElement.code);
        if (!isMatch) {
            return res
                .status(403)
                .json({ success: false, message: "Invalid code." });
        }

        thisElement.password = await bcrypt.hash(body.newPassword, 10);
        writeProgress(progress);
        return res.json({ success: true, message: "Account restored." });
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "The server could not process the request.",
        });
    }
});

app.post("/inform/:gameId/:login", async (req, res) => {
    try {
        const { gameId, login } = req.params;
        const thisEmail = req.body;

        if (!gameId || !login || !thisEmail.mail) {
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

        const email = decrypt(thisElement.mail, KEY);
        const isMatch = thisEmail.mail == email;
        if (!isMatch) {
            return res
                .status(403)
                .json({ success: false, message: "Invalid mail." });
        }
        thisElement.send = true;
        writeProgress(progress);
        return res.json({ success: true, message: "Message sent." });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "The server could not process the request.",
        });
    }
});

app.put("/progress/:gameId/:login", async (req, res) => {
    try {
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
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "The server could not process the request.",
        });
    }
});

setInterval(async function () {
    let progress = readProgress();
    for (let key in progress) {
        if (progress.hasOwnProperty(key)) {
            for (let key2 in progress[key]) {
                let code = createCode(symbols, 12);
                progress[key][key2].code = await bcrypt.hash(code, 10);
                progress[key][key2].attempts = 3;
                if (progress[key][key2].send) {
                    let email = decrypt(progress[key][key2].mail, KEY);
                    let mailOptions = {
                        from: process.env.email.toString(),
                        to: email,
                        subject: "Recovery code!",
                        text: "This is your account recovery code: " + code,
                    };
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.log("Message not sent: " + error);
                        } else {
                            console.log("Message sent");
                        }
                    });
                    progress[key][key2].send = false;
                }
            }
        }
    }
    writeProgress(progress);
}, 80000);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

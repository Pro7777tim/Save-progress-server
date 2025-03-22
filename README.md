# Save progress server

## About the server

This js server is designed to store progress for games or other applications.
Uses npm, runs on node, and requires some libraries.
Has a reliable system for storing data, encrypted passwords, logins and email for various applications.
Gives the correct answer in any requests.
Stores data in progress.json, which has the structure: games - logins - data - progress.
Login can contain name, password, email (optional), progress, and last entry.
It is possible to recover your account via email.

### Starting the server

Replace the variables in the .env file and edit the transporter parameters in the index.js file to make the server work properly.
To run, run:

```
npm install
npm start
```

## Frontend API

### Query functions

```
const apiUrl = 'http://localhost:3000'; //server address

async function registerUser(gameId, login, password, email) {
    const response = await fetch(`${apiUrl}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId, login, password, email })
    });

    const data = await response.json();
    return data;
}

async function loginUser(gameId, login, password) {
    const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId, login, password })
    });

    const data = await response.json();
    return data;
}

async function getProgress(gameId, login, password) {
    const response = await fetch(`${apiUrl}/progress/${gameId}/${login}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
    });

    const data = await response.json();
    return data;
}

async function saveProgress(gameId, login, password, data) {
    const response = await fetch(`${apiUrl}/progress/${gameId}/${login}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, data })
    });

    const data = await response.json();
    return data;
}

async function restoreAcc(gameId, login, password, code) {
    const response = await fetch(`${apiUrl}/restore/${gameId}/${login}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: password, code })
    });

    const data = await response.json();
    return data;
}

async function sendEmail(gameId, login, mail) {
    const response = await fetch(`${apiUrl}/inform/${gameId}/${login}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mail })
    });

    const data = await response.json();
    return data;
}
```

### Example of use

```
registerUser('game1', 'user1', 'password123', 'user1@example.com');
loginUser('game1', 'user1', 'password123');
getProgress('game1', 'user1', 'password123');
saveProgress('game1', 'user1', 'password123', { score: 100, level: 5 });
sendEmail('game1', 'user1', 'email');
restoreAcc('game1', 'user1', 'newPassword123', 'exampleCode');
```

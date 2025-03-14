# Save progress server
## About the server
This js server is designed to store progress for games or other applications.
Uses npm, runs on node, and requires some libraries.
Has a reliable system for storing data, encrypted passwords, logins and email for various applications.
Gives the correct answer in any requests.
Stores data in progress.json, which has the structure: games - logins - data - progress.
Login can contain name, password, email (optional), progress, and last entry.
### Starting the server
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

    const result = await response.json();
    return result;
}
```
### Example of use
```
registerUser('game1', 'user1', 'password123', 'user1@example.com');
loginUser('game1', 'user1', 'password123');
getProgress('game1', 'user1', 'password123');
saveProgress('game1', 'user1', 'password123', { score: 100, level: 5 });

```

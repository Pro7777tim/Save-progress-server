# Save progress server
## About the server
This js server is designed to store progress for games.
Uses npm, node and other libraries.
Has a reliable system for storing data, logins and encrypted passwords.
Stores data in progress.json. To run, run:
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
    alert(data.message);
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
    alert(data.message);
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
    console.log(data);
    alert('Progress loaded in console');
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
    alert(result.message);
}

```

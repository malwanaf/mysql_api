const express = require('express');
const mysql = require('mysql');

const http = require("http");
const hostname = '0.0.0.0';
const port = 80;



const app = express();
// const port = 3000;

const conn = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'api_test'
});

// Middleware to enable CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

app.get('/strikes', (req, res) => {
  conn.query('SELECT * FROM strikes', (err, rows) => {
    if (err) {
      console.error("Error fetching strikes:", err);
      return res.status(500).json({ error: 'Failed to fetch strikes' });
    }
    res.json(rows);
  });
});

const express = require('express');
const mysql = require('mysql');

const app = express();
const port = 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const conn= mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'api_test'
});

// Create a new user
app.post('/post', (req, res) => {
    const { name, email } = req.body;
    conn.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], (err, result) => {
      if (err) throw err;
      res.send('User added successfully');
    });
  });

 // Get all users
app.get('/users', (req, res) => {
  conn.query('SELECT * FROM users', (err, rows) => {
    if (err) throw err;
    res.json(rows);
  });
});

// // Get user by ID
// app.get('/users/:id', (req, res) => {
//   const userId = req.params.id;
//   conn.query('SELECT * FROM users WHERE id = ?', userId, (err, rows) => {
//     if (err) throw err;
//     res.json(rows[0]);
//   });
// });
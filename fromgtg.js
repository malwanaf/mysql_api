const express = require('express');
const mysql = require('mysql');

const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Middleware to enable CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// MySQL connection pool
const conn = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'api_test'
});

// Create a new strike
// Create a new strike
app.use(express.json());
app.post('/strikes', (req, res) => {
  const { time, distance, intensity } = req.body;
  if (!time || !distance || !intensity) {
    return res.status(400).send('All fields (time, distance, intensity) are required');
  }
  conn.query('INSERT INTO strikes (time, distance, intensity) VALUES (?, ?, ?)', [time, distance, intensity], (err, result) => {
    if (err) {
      console.error(err); // Log the error to the console
      return res.status(500).send('Error creating strike');
    }
    res.status(201).send('Strike added successfully');
  });
});


// Get all strikes
app.get('/strikes', (req, res) => {
  conn.query('SELECT * FROM strikes', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching strikes');
    }
    res.json(rows);
  });
});

// Update strike by ID
app.put('/strikes/:id', (req, res) => {
  const strikeId = req.params.id;
  const { time, distance, intensity } = req.body;
  if (!time || !distance || !intensity) {
    return res.status(400).send('All fields (time, distance, intensity) are required');
  }
  conn.query('UPDATE strikes SET time = ?, distance = ?, intensity = ? WHERE id = ?', [time, distance, intensity, strikeId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error updating strike');
    }
    res.send('Strike updated successfully');
  });
});

// Delete strike by ID
app.delete('/strikes/:id', (req, res) => {
  const strikeId = req.params.id;
  conn.query('DELETE FROM strikes WHERE id = ?', strikeId, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error deleting strike');
    }
    res.send('Strike deleted successfully');
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
});

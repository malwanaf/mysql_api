const express = require('express');
const mysql = require('mysql');

const app = express();
const port = 3000; // Use port 3000 for simplicity, you can change it to 80 if needed

// Middleware to enable CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Middleware to parse JSON bodies
app.use(express.json());

const conn = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'api_test'
});

// Add a new strike
app.post('/post', (req, res) => {
  const strikes = req.body;

  // Extracting the values from the object
  const values = Object.values(strikes).map(strike => [strike.id, strike.time, strike.distance, strike.intensity]);

  conn.query('INSERT INTO strikes (id, time, distance, intensity) VALUES ?', [values], (err, result) => {
    if (err) {
      console.error("Error adding strike:", err);
      return res.status(500).json({ error: 'Failed to add strike' });
    }
    res.json({ message: 'Strikes added successfully', count: result.affectedRows });
  });
});


// GET strikes
app.get('/strikes', (req, res) => {
  conn.query('SELECT * FROM strikes', (err, rows) => {
    if (err) {
      console.error("Error fetching strikes:", err);
      return res.status(500).json({ error: 'Failed to fetch strikes' });
    }
    res.json(rows);
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
});

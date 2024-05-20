const express = require('express');
const mysql = require('mysql');
const http = require('http');
const WebSocket = require('ws');
const helmet = require('helmet');  // For added security
const cors = require('cors');      // For handling CORS

const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(express.json());
app.use(helmet()); // Security middleware
app.use(cors());   // Enable CORS for all routes

// MySQL connection pool
const conn = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'api_test'
});

// Create a new strike
app.post('/strikes', (req, res) => {
  const { time, distance, intensity } = req.body;
  if (!time || !distance || !intensity) {
    return res.status(400).send('All fields (time, distance, intensity) are required');
  }
  const sanitizedTime = mysql.escape(time);
  const sanitizedDistance = mysql.escape(distance);
  const sanitizedIntensity = mysql.escape(intensity);

  conn.query('INSERT INTO strikes (time, distance, intensity) VALUES (?, ?, ?)', 
    [sanitizedTime, sanitizedDistance, sanitizedIntensity], 
    (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error creating strike');
    }
    const newStrike = { id: result.insertId, time, distance, intensity };
    res.status(201).json(newStrike);
    broadcast({ type: 'new-strike', data: newStrike });
  });
});

// Get all strikes

// Get sorted strikes
app.get('/strikes', (req, res) => {
  let sortBy = req.query.sortBy || 'time'; // Default sort by time if sortBy parameter is not provided
  let sortOrder = req.query.sortOrder || 'ASC'; // Default sort order is ascending

  // Validate sort by field
  if (!['time', 'distance', 'intensity'].includes(sortBy)) {
    return res.status(400).send('Invalid sortBy parameter');
  }

  // Validate sort order
  if (!['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
    return res.status(400).send('Invalid sortOrder parameter');
  }

  const query = `SELECT * FROM strikes ORDER BY ${sortBy} ${sortOrder}`;

  conn.query(query, (err, rows) => {
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
  const sanitizedTime = mysql.escape(time);
  const sanitizedDistance = mysql.escape(distance);
  const sanitizedIntensity = mysql.escape(intensity);

  conn.query('UPDATE strikes SET time = ?, distance = ?, intensity = ? WHERE id = ?', 
    [sanitizedTime, sanitizedDistance, sanitizedIntensity, strikeId], 
    (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error updating strike');
    }
    const updatedStrike = { id: strikeId, time, distance, intensity };
    res.json(updatedStrike);
    broadcast({ type: 'update-strike', data: updatedStrike });
  });
});

// Delete strike by ID
app.delete('/strikes/:id', (req, res) => {
  const strikeId = req.params.id;
  conn.query('DELETE FROM strikes WHERE id = ?', [strikeId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error deleting strike');
    }
    res.send('Strike deleted successfully');
    broadcast({ type: 'delete-strike', data: { id: strikeId } });
  });
});

// Create HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Function to broadcast messages to all connected WebSocket clients
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Handle WebSocket connections
wss.on('connection', ws => {
  console.log('New WebSocket connection');

  ws.on('message', message => {
    console.log('Received message:', message);
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
});

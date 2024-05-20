const express = require('express');
const mysql = require('mysql');
const http = require('http');
const WebSocket = require('ws');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(express.json());
app.use(helmet());
app.use(cors());

const conn = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'api_test'
});

app.post('/strikes', (req, res) => {
  const { time, distance, intensity } = req.body;
  if (!time || !distance || !intensity) {
    return res.status(400).send('All fields (time, distance, intensity) are required');
  }
  conn.query('INSERT INTO strikes (time, distance, intensity) VALUES (?, ?, ?)', 
    [time, distance, intensity], 
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

app.get('/strikes', (req, res) => {
  let sortBy = req.query.sortBy || 'time';
  let sortOrder = req.query.sortOrder || 'ASC';

  if (!['time', 'distance', 'intensity'].includes(sortBy)) {
    return res.status(400).send('Invalid sortBy parameter');
  }
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

app.put('/strikes/:id', (req, res) => {
  const strikeId = req.params.id;
  const { time, distance, intensity } = req.body;
  if (!time || !distance || !intensity) {
    return res.status(400).send('All fields (time, distance, intensity) are required');
  }

  conn.query('UPDATE strikes SET time = ?, distance = ?, intensity = ? WHERE id = ?', 
    [time, distance, intensity, strikeId], 
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

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function broadcast(data) {
  console.log('Broadcasting:', data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

wss.on('connection', ws => {
    console.log('New WebSocket connection');
  
    conn.query('SELECT * FROM strikes', (err, rows) => {
      if (err) {
        console.error('Error fetching initial data:', err);
        ws.send(JSON.stringify({ type: 'error', message: 'Error fetching initial data' }));
        return;
      }
      ws.send(JSON.stringify({ type: 'initial-data', data: rows }));
    });
  
    ws.on('message', message => {
      console.log('Received message:', message);
    });
  
    ws.on('error', error => {
      console.error('WebSocket error:', error);
    });
  
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });
  

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
});

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(cors());
app.use(express.json());

// Clear all games when server starts
const clearGamesOnStartup = async () => {
    try {
      await pool.query('DELETE FROM games');
      console.log('Games cleared on server startup');
    } catch (error) {
      console.error('Error clearing games on startup:', error);
    }
  };
  
  // Run the cleanup when server starts
clearGamesOnStartup();

// Add a root route
app.get('/', (req, res) => {
  res.json({ message: 'Tic-Tac-Toe API is running!' });
});

// Existing routes
// Add this to your existing server.js endpoints
// Update these endpoints in your server.js

app.get('/api/games/latest', async (req, res) => {
    try {
      const query = `
        SELECT * FROM games 
        ORDER BY updated_at DESC 
        LIMIT 1;
      `;
      const result = await pool.query(query);
      res.json(result.rows[0] || null);
    } catch (error) {
      console.error('Error fetching latest game:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.post('/api/games', async (req, res) => {
    try {
      // First, delete all existing games
      await pool.query('DELETE FROM games');
      
      // Then create the new game
      const { board, isXNext, winner, winningSquares } = req.body;
      const query = `
        INSERT INTO games (board, is_x_next, winner, winning_squares)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const values = [board, isXNext, winner || null, winningSquares];
      const result = await pool.query(query, values);
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error creating game:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.put('/api/games/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { board, isXNext, winner, winningSquares } = req.body;
      const query = `
        UPDATE games 
        SET board = $1, is_x_next = $2, winner = $3, winning_squares = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *;
      `;
      const values = [board, isXNext, winner || null, winningSquares, id];
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Game not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating game:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
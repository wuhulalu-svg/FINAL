const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取所有告警
router.get('/', authenticateToken, async (req, res) => {
  try {
    const alerts = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM alerts WHERE user_id = ? ORDER BY date DESC',
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 创建告警
router.post('/', authenticateToken, async (req, res) => {
  const { title, description, type, metric, date } = req.body;
  
  try {
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO alerts (user_id, title, description, type, metric, date) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, title, description, type, metric, date],
        function(err) {
          if (err) reject(err);
          resolve(this);
        }
      );
    });
    res.status(201).json({ id: result.lastID, message: 'Alert created' });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 标记告警为已读
router.put('/:id/read', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE alerts SET read = 1 WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        function(err) {
          if (err) reject(err);
          resolve(this);
        }
      );
    });
    res.json({ message: 'Alert marked as read' });
  } catch (error) {
    console.error('Mark alert read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
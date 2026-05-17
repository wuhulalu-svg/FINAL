const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取所有目标
router.get('/', authenticateToken, async (req, res) => {
  try {
    const goals = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM health_goals WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows.map(row => ({
            ...row,
            missed_days: JSON.parse(row.missed_days || '[]')
          })));
        }
      );
    });

    res.json(goals);

  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 添加目标
router.post('/', authenticateToken, async (req, res) => {
  const { metric, metric_label, target_value, start_date, end_date, duration } = req.body;

  if (!metric || !metric_label || !target_value || !start_date || !end_date || !duration) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO health_goals (user_id, metric, metric_label, target_value, start_date, end_date, duration)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, metric, metric_label, target_value, start_date, end_date, duration],
        function(err) {
          if (err) reject(err);
          resolve(this);
        }
      );
    });

    const newGoal = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM health_goals WHERE id = ?',
        [result.lastID],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    res.status(201).json(newGoal);

  } catch (error) {
    console.error('Add goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 更新目标
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { completed, missed_days } = req.body;

  try {
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE health_goals SET completed = ?, missed_days = ? WHERE id = ? AND user_id = ?',
        [completed, JSON.stringify(missed_days || []), id, req.user.id],
        function(err) {
          if (err) reject(err);
          resolve(this);
        }
      );
    });

    res.json({ message: 'Goal updated successfully' });

  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 删除目标
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM health_goals WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        function(err) {
          if (err) reject(err);
          resolve(this);
        }
      );
    });

    res.json({ message: 'Goal deleted successfully' });

  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
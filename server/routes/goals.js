const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取所有目标
router.get('/', authenticateToken, (req, res) => {
    db.all(
        'SELECT * FROM health_goals WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id],
        (err, rows) => {
            if (err) {
                console.error('Get goals error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            // 解析 missed_days JSON 字段
            const goals = rows.map(row => ({
                ...row,
                missed_days: JSON.parse(row.missed_days || '[]')
            }));
            res.json(goals);
        }
    );
});

// 添加目标
router.post('/', authenticateToken, (req, res) => {
    const { metric, metric_label, target_value, start_date, end_date, duration } = req.body;

    if (!metric || !metric_label || !target_value || !start_date || !end_date || !duration) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    db.run(
        `INSERT INTO health_goals (user_id, metric, metric_label, target_value, start_date, end_date, duration)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, metric, metric_label, target_value, start_date, end_date, duration],
        function(err) {
            if (err) {
                console.error('Add goal error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            // 获取新创建的目标
            db.get(
                'SELECT * FROM health_goals WHERE id = ?',
                [this.lastID],
                (err, newGoal) => {
                    if (err) {
                        console.error('Get new goal error:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    if (newGoal) {
                        newGoal.missed_days = JSON.parse(newGoal.missed_days || '[]');
                    }
                    res.status(201).json(newGoal);
                }
            );
        }
    );
});

// 更新目标
router.put('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { completed, missed_days } = req.body;

    db.run(
        'UPDATE health_goals SET completed = ?, missed_days = ? WHERE id = ? AND user_id = ?',
        [completed, JSON.stringify(missed_days || []), id, req.user.id],
        function(err) {
            if (err) {
                console.error('Update goal error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json({ message: 'Goal updated successfully' });
        }
    );
});

// 删除目标
router.delete('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.run(
        'DELETE FROM health_goals WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        function(err) {
            if (err) {
                console.error('Delete goal error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json({ message: 'Goal deleted successfully' });
        }
    );
});

module.exports = router;
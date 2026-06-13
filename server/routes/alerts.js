const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { generateAlerts } = require('./alertGenerator');  // 改成 ./alertGenerator

const router = express.Router();

// 获取所有告警
router.get('/', authenticateToken, (req, res) => {
    db.all(
        `SELECT * FROM alerts WHERE user_id = ? ORDER BY 
         CASE WHEN type = 'critical' THEN 0 ELSE 1 END, 
         date DESC`,
        [req.user.id],
        (err, rows) => {
            if (err) {
                console.error('Get alerts error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json(rows || []);
        }
    );
});

// 获取未读告警数量
router.get('/unread-count', authenticateToken, (req, res) => {
    db.get(
        'SELECT COUNT(*) as count FROM alerts WHERE user_id = ? AND read = 0',
        [req.user.id],
        (err, row) => {
            if (err) {
                console.error('Get unread count error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json({ count: row?.count || 0 });
        }
    );
});

// 手动触发告警生成
router.post('/generate', authenticateToken, async (req, res) => {
    try {
        const alerts = await generateAlerts(req.user.id);
        res.json({ 
            message: `生成了 ${alerts.length} 条新告警`,
            redCount: alerts.filter(a => a.type === 'critical').length,
            yellowCount: alerts.filter(a => a.type === 'warning').length,
            alerts 
        });
    } catch (error) {
        console.error('生成告警失败:', error);
        res.status(500).json({ error: '生成告警失败: ' + error.message });
    }
});

// 标记告警为已读
router.put('/:id/read', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    db.run(
        'UPDATE alerts SET read = 1 WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        function(err) {
            if (err) {
                console.error('Mark alert read error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json({ message: 'Alert marked as read' });
        }
    );
});

// 批量标记所有告警为已读
router.put('/read-all', authenticateToken, (req, res) => {
    db.run(
        'UPDATE alerts SET read = 1 WHERE user_id = ? AND read = 0',
        [req.user.id],
        function(err) {
            if (err) {
                console.error('Mark all alerts read error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json({ message: `Marked ${this.changes} alerts as read` });
        }
    );
});

// 删除告警
router.delete('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    db.run(
        'DELETE FROM alerts WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        function(err) {
            if (err) {
                console.error('Delete alert error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json({ message: 'Alert deleted' });
        }
    );
});

module.exports = router;
const express = require('express');
const db = require('../db');
const router = express.Router();

// 中间件加载（保持不变）
let authenticateToken, requireAdmin;
try {
    const auth = require('../middleware/auth');
    authenticateToken = auth.authenticateToken;
    requireAdmin = auth.requireAdmin;
} catch (err) {
    console.error('无法加载 auth 中间件:', err.message);
    authenticateToken = (req, res, next) => next();
    requireAdmin = (req, res, next) => next();
}

// 获取所有用户（仅管理员）
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
    db.all(
        `SELECT id, name, email, age, gender, height, weight, role, created_at 
         FROM users 
         ORDER BY created_at DESC`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Get users error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json(rows);
        }
    );
});

// 获取单个用户详情
router.get('/users/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    
    db.get(
        `SELECT id, name, email, age, gender, height, weight, role, created_at 
         FROM users WHERE id = ?`,
        [id],
        (err, user) => {
            if (err) {
                console.error('Get user detail error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // 获取该用户的健康记录数量
            db.get(
                'SELECT COUNT(*) as count FROM health_records WHERE user_id = ?',
                [id],
                (err, countRow) => {
                    if (err) {
                        console.error('Get record count error:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    const recordCount = countRow?.count || 0;
                    res.json({ ...user, recordCount });
                }
            );
        }
    );
});

// 更新用户角色
router.put('/users/:id/role', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    
    db.run(
        'UPDATE users SET role = ? WHERE id = ?',
        [role, id],
        function(err) {
            if (err) {
                console.error('Update user role error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json({ message: 'User role updated successfully' });
        }
    );
});

// 删除用户
router.delete('/users/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    
    // 不允许删除自己
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // 按顺序删除关联数据
    db.run('DELETE FROM health_records WHERE user_id = ?', [id], (err) => {
        if (err) {
            console.error('Delete health_records error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        db.run('DELETE FROM health_goals WHERE user_id = ?', [id], (err) => {
            if (err) {
                console.error('Delete health_goals error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            db.run('DELETE FROM alerts WHERE user_id = ?', [id], (err) => {
                if (err) {
                    console.error('Delete alerts error:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                db.run('DELETE FROM square_posts WHERE user_id = ?', [id], (err) => {
                    if (err) {
                        console.error('Delete square_posts error:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    db.run('DELETE FROM square_likes WHERE user_id = ?', [id], (err) => {
                        if (err) {
                            console.error('Delete square_likes error:', err);
                            return res.status(500).json({ error: 'Internal server error' });
                        }
                        db.run('DELETE FROM square_comments WHERE user_id = ?', [id], (err) => {
                            if (err) {
                                console.error('Delete square_comments error:', err);
                                return res.status(500).json({ error: 'Internal server error' });
                            }
                            db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
                                if (err) {
                                    console.error('Delete user error:', err);
                                    return res.status(500).json({ error: 'Internal server error' });
                                }
                                res.json({ message: 'User deleted successfully' });
                            });
                        });
                    });
                });
            });
        });
    });
});

// 获取系统统计信息
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
    // 获取各项统计
    db.get(
        `SELECT 
            (SELECT COUNT(*) FROM users) as totalUsers,
            (SELECT COUNT(*) FROM health_records) as totalRecords,
            (SELECT COUNT(*) FROM square_posts) as totalPosts,
            (SELECT COUNT(*) FROM alerts WHERE read = 0) as activeAlerts`,
        [],
        (err, stats) => {
            if (err) {
                console.error('Get stats error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            // 获取最近7天活跃用户数
            db.all(
                `SELECT date, COUNT(DISTINCT user_id) as count
                 FROM health_records 
                 WHERE date >= date('now', '-7 days')
                 GROUP BY date
                 ORDER BY date`,
                [],
                (err, activeUsers) => {
                    if (err) {
                        console.error('Get active users error:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    res.json({ ...stats, activeUsers: activeUsers || [] });
                }
            );
        }
    );
});

module.exports = router;
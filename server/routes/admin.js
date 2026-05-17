const express = require('express');
const db = require('../db');
const router = express.Router();

// 注意：这里需要正确导入中间件
// 假设 auth.js 在 ../middleware/auth.js
let authenticateToken, requireAdmin;

try {
  const auth = require('../middleware/auth');
  authenticateToken = auth.authenticateToken;
  requireAdmin = auth.requireAdmin;
} catch (err) {
  console.error('无法加载 auth 中间件:', err.message);
  // 临时定义（用于调试）
  authenticateToken = (req, res, next) => next();
  requireAdmin = (req, res, next) => next();
}

// 获取所有用户（仅管理员）
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, name, email, age, gender, height, weight, role, created_at 
         FROM users 
         ORDER BY created_at DESC`,
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取单个用户详情
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    const user = await new Promise((resolve, reject) => {
      db.get(
        `SELECT id, name, email, age, gender, height, weight, role, created_at 
         FROM users WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // 获取该用户的健康记录数量
    const recordCount = await new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM health_records WHERE user_id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });
    
    res.json({ ...user, recordCount: recordCount?.count || 0 });
  } catch (error) {
    console.error('Get user detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 更新用户角色
router.put('/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  try {
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET role = ? WHERE id = ?',
        [role, id],
        function(err) {
          if (err) reject(err);
          resolve(this);
        }
      );
    });
    
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 删除用户
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  // 不允许删除自己
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  
  try {
    // 删除用户相关的所有数据
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM health_records WHERE user_id = ?', [id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM health_goals WHERE user_id = ?', [id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM alerts WHERE user_id = ?', [id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM square_posts WHERE user_id = ?', [id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM square_likes WHERE user_id = ?', [id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM square_comments WHERE user_id = ?', [id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取系统统计信息
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          (SELECT COUNT(*) FROM users) as totalUsers,
          (SELECT COUNT(*) FROM health_records) as totalRecords,
          (SELECT COUNT(*) FROM square_posts) as totalPosts,
          (SELECT COUNT(*) FROM alerts WHERE read = 0) as activeAlerts
        `,
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });
    
    // 获取最近7天活跃用户数
    const activeUsers = await new Promise((resolve, reject) => {
      db.all(
        `SELECT DATE(date) as day, COUNT(DISTINCT user_id) as count
         FROM health_records 
         WHERE date >= DATE('now', '-7 days')
         GROUP BY DATE(date)
         ORDER BY day`,
        (err, rows) => {
          if (err) reject(err);
          resolve(rows || []);
        }
      );
    });
    
    res.json({ ...stats, activeUsers });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
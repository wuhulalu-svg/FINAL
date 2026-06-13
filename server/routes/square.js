const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// 获取所有动态（按时间倒序）
router.get('/posts', authenticateToken, (req, res) => {
    db.all(`
        SELECT p.*, u.name as user_name, u.email as user_email,
               (SELECT COUNT(*) FROM square_likes WHERE post_id = p.id) as like_count,
               (SELECT COUNT(*) FROM square_comments WHERE post_id = p.id) as comment_count,
               EXISTS(SELECT 1 FROM square_likes WHERE post_id = p.id AND user_id = ?) as user_liked
        FROM square_posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
    `, [req.user.id], (err, rows) => {
        if (err) {
            console.error('获取动态失败:', err);
            return res.status(500).json({ error: '服务器错误' });
        }
        res.json(rows);
    });
});

// 发布动态
router.post('/posts', authenticateToken, (req, res) => {
    const { content, image } = req.body;

    if (!content || content.trim() === '') {
        return res.status(400).json({ error: '内容不能为空' });
    }

    db.run(
        'INSERT INTO square_posts (user_id, content, image) VALUES (?, ?, ?)',
        [req.user.id, content, image || null],
        function(err) {
            if (err) {
                console.error('发布动态失败:', err);
                return res.status(500).json({ error: '服务器错误' });
            }
            res.status(201).json({ id: this.lastID, message: '发布成功' });
        }
    );
});

// 点赞/取消点赞
router.post('/posts/:id/like', authenticateToken, (req, res) => {
    const { id } = req.params;

    // 检查是否已点赞
    db.get(
        'SELECT id FROM square_likes WHERE post_id = ? AND user_id = ?',
        [id, req.user.id],
        (err, existing) => {
            if (err) {
                console.error('点赞操作失败:', err);
                return res.status(500).json({ error: '服务器错误' });
            }

            if (existing) {
                // 取消点赞
                db.run(
                    'DELETE FROM square_likes WHERE post_id = ? AND user_id = ?',
                    [id, req.user.id],
                    (err) => {
                        if (err) {
                            console.error('取消点赞失败:', err);
                            return res.status(500).json({ error: '服务器错误' });
                        }
                        res.json({ liked: false, message: '取消点赞' });
                    }
                );
            } else {
                // 点赞
                db.run(
                    'INSERT INTO square_likes (post_id, user_id) VALUES (?, ?)',
                    [id, req.user.id],
                    (err) => {
                        if (err) {
                            console.error('点赞失败:', err);
                            return res.status(500).json({ error: '服务器错误' });
                        }
                        res.json({ liked: true, message: '点赞成功' });
                    }
                );
            }
        }
    );
});

// 获取评论
router.get('/posts/:id/comments', authenticateToken, (req, res) => {
    const { id } = req.params;

    db.all(`
        SELECT c.*, u.name as user_name, u.email as user_email
        FROM square_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
    `, [id], (err, rows) => {
        if (err) {
            console.error('获取评论失败:', err);
            return res.status(500).json({ error: '服务器错误' });
        }
        res.json(rows);
    });
});

// 发表评论
router.post('/posts/:id/comments', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
        return res.status(400).json({ error: '评论内容不能为空' });
    }

    db.run(
        'INSERT INTO square_comments (post_id, user_id, content) VALUES (?, ?, ?)',
        [id, req.user.id, content],
        function(err) {
            if (err) {
                console.error('发表评论失败:', err);
                return res.status(500).json({ error: '服务器错误' });
            }
            res.status(201).json({ id: this.lastID, message: '评论成功' });
        }
    );
});

// 删除自己的动态
router.delete('/posts/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    // 检查动态是否存在及其所有者
    db.get(
        'SELECT user_id FROM square_posts WHERE id = ?',
        [id],
        (err, post) => {
            if (err) {
                console.error('删除动态失败:', err);
                return res.status(500).json({ error: '服务器错误' });
            }

            if (!post) {
                return res.status(404).json({ error: '动态不存在' });
            }

            if (post.user_id !== req.user.id) {
                return res.status(403).json({ error: '只能删除自己的动态' });
            }

            // 删除动态（由于外键设置了 ON DELETE CASCADE，相关评论和点赞会自动删除）
            db.run('DELETE FROM square_posts WHERE id = ?', [id], (err) => {
                if (err) {
                    console.error('删除动态失败:', err);
                    return res.status(500).json({ error: '服务器错误' });
                }
                res.json({ message: '删除成功' });
            });
        }
    );
});

module.exports = router;
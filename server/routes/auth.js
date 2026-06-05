const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const { sendVerificationCode } = require('../config/email');

const router = express.Router();

// 存储注册验证码（内存，生产环境建议Redis）
const registerCodes = new Map();

// ========== 发送注册验证码 ==========
router.post('/send-register-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: '邮箱不能为空' });

  try {
    // 检查邮箱是否已注册
    const existing = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    if (existing) return res.status(400).json({ error: '该邮箱已注册' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    registerCodes.set(email, { code, expires: Date.now() + 5 * 60 * 1000 });

    const sent = await sendVerificationCode(email, code, 'register');
    if (sent) {
      res.json({ success: true, message: '验证码已发送' });
    } else {
      res.status(500).json({ error: '邮件发送失败' });
    }
  } catch (error) {
    console.error('发送注册验证码失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ========== 用户注册 ==========
router.post('/register', async (req, res) => {
  const { name, email, password, age, gender, height, weight, code } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: '姓名、邮箱和密码为必填项' });
  }
  if (!code) return res.status(400).json({ error: '请填写验证码' });

  try {
    // 校验验证码
    const record = registerCodes.get(email);
    if (!record || record.code !== code || record.expires < Date.now()) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    // 再次检查用户是否已存在（防止并发注册）
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已注册' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (name, email, password, age, gender, height, weight, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, hashedPassword, age || null, gender || null, height || null, weight || null, 'user'],
        function(err) {
          if (err) reject(err);
          resolve(this);
        }
      );
    });

    // 注册成功，删除验证码记录
    registerCodes.delete(email);

    // 生成JWT
    const token = jwt.sign({ id: result.lastID, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: '注册成功',
      token,
      user: { id: result.lastID, name, email, age, gender, height, weight, role: 'user' }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ========== 用户登录（不变） ==========
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码都不能为空' });
  }
  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    if (!user) return res.status(401).json({ error: '邮箱或密码错误' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: '邮箱或密码错误' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取当前用户信息（不变）
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, email, age, gender, height, weight, role FROM users WHERE id = ?', [req.user.id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json(user);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新用户信息（不变）
router.put('/me', authenticateToken, async (req, res) => {
  const { name, age, gender, height, weight } = req.body;
  try {
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET name = ?, age = ?, gender = ?, height = ?, weight = ? WHERE id = ?',
        [name, age, gender, height, weight, req.user.id],
        function(err) {
          if (err) reject(err);
          resolve(this);
        }
      );
    });
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, email, age, gender, height, weight, role FROM users WHERE id = ?', [req.user.id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    res.json(user);
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
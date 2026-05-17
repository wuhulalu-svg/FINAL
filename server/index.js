require('dotenv').config();
const express = require('express');
const cors = require('cors');

// 导入路由
const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');
const goalRoutes = require('./routes/goals');
const alertRoutes = require('./routes/alerts');
const passwordRoutes = require('./routes/password');
const squareRoutes = require('./routes/square');
const adminRoutes = require('./routes/admin');      // 👈 新增：管理员路由
const aiRoutes = require('./routes/ai');            // 👈 新增：AI对话路由
const visionRoutes = require('./routes/vision');    // 👈 新增：AI图片识别路由
const ocrRoutes = require('./routes/ocr');          // 👈 新增：百度OCR路由

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));  // 增大限制以支持图片上传
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/square', squareRoutes);
app.use('/api/admin', adminRoutes);        // 👈 新增：管理员路由
app.use('/api/ai', aiRoutes);              // 👈 新增：AI对话路由
app.use('/api/vision', visionRoutes);      // 👈 新增：AI图片识别路由
app.use('/api/ocr', ocrRoutes);            // 👈 新增：百度OCR路由

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`🔧 CORS enabled for http://localhost:3000 and http://localhost:5173`);
  console.log(`👑 Admin routes enabled at http://localhost:${PORT}/api/admin`);
});
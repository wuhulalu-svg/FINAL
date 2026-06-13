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
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const visionRoutes = require('./routes/vision');
const ocrRoutes = require('./routes/ocr');
const paddleOcrRoutes = require('./routes/paddleOcr');
const reportsRoutes = require('./routes/reports');
const healthSummaryRoutes = require('./routes/healthSummary');

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ CORS 配置：允许本地开发 + 所有 Vercel 域名（包括预览和正式域名）
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://final-hazel-seven-39.vercel.app',
    'http://final-hazel-seven-39.vercel.app',
    // 允许所有 Vercel 预览域名（正则匹配）
    /^https:\/\/final.*\.vercel\.app$/,
    /^https:\/\/.*\.vercel\.app$/  // 更宽松：允许所有 Vercel 子域名
];

app.use(cors({
    origin: function (origin, callback) {
        // 允许没有 origin 的请求（如 Postman、服务器间调用）
        if (!origin) return callback(null, true);
        
        // 检查是否在白名单中（支持字符串和正则表达式）
        let isAllowed = false;
        for (let allowed of allowedOrigins) {
            if (allowed instanceof RegExp) {
                // 正则匹配
                if (allowed.test(origin)) {
                    isAllowed = true;
                    break;
                }
            } else {
                // 字符串匹配（精确匹配 + 去掉尾部斜杠）
                if (origin === allowed || origin.replace(/\/$/, '') === allowed) {
                    isAllowed = true;
                    break;
                }
            }
        }
        
        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`❌ CORS 阻止了来自 ${origin} 的请求`);
            callback(new Error('CORS 不允许此域名访问'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/square', squareRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/paddle-ocr', paddleOcrRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/health-summary', healthSummaryRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api`);
    console.log(`🔧 CORS enabled for: ${allowedOrigins.join(', ')}`);
    console.log(`👑 Admin routes enabled`);
});

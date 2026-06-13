const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

function getWeekRange(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { startDate: formatDate(monday), endDate: formatDate(sunday) };
}

function getWeekNumber(date) {
    const d = new Date(date);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - yearStart) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + yearStart.getDay() + 1) / 7);
}

function getMonthName(month, isZh) {
    const monthsZh = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return isZh ? monthsZh[month - 1] : monthsEn[month - 1];
}

function isWeekComplete(date) {
    const today = new Date();
    const targetWeekEnd = new Date(date);
    const day = targetWeekEnd.getDay();
    const daysToSunday = day === 0 ? 0 : 7 - day;
    targetWeekEnd.setDate(targetWeekEnd.getDate() + daysToSunday);
    return today >= targetWeekEnd;
}

function isMonthComplete(year, month) {
    const today = new Date();
    const lastDayOfMonth = new Date(year, month, 0);
    return today >= lastDayOfMonth;
}

function isYearComplete(year) {
    const today = new Date();
    const lastDayOfYear = new Date(year, 11, 31);
    return today >= lastDayOfYear;
}

async function generateOneReport(userId, reportType, targetDate, isZh) {
    let startDate, endDate, title;
    const date = new Date(targetDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    if (reportType === 'week') {
        const { startDate: s, endDate: e } = getWeekRange(date);
        startDate = s;
        endDate = e;
        if (!isWeekComplete(date)) return null;
        const weekNum = getWeekNumber(date);
        title = isZh ? `${year}年第${weekNum}周` : `Week ${weekNum}, ${year}`;
    } else if (reportType === 'month') {
        startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0);
        endDate = lastDay.toISOString().split('T')[0];
        if (!isMonthComplete(year, month)) return null;
        title = isZh ? `${year}年${month}月` : `${getMonthName(month, isZh)} ${year}`;
    } else {
        startDate = `${year}-01-01`;
        endDate = `${year}-12-31`;
        if (!isYearComplete(year)) return null;
        title = isZh ? `${year}年` : `${year}`;
    }
    
    const existing = await new Promise((resolve) => {
        db.get('SELECT id FROM health_reports WHERE user_id = ? AND report_type = ? AND report_date = ?', [userId, reportType, endDate], (err, row) => resolve(row));
    });
    if (existing) return null;
    
    const records = await new Promise((resolve) => {
        db.all(`SELECT * FROM health_records WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC`, [userId, startDate, endDate], (err, rows) => resolve(rows || []));
    });
    
    if (records.length === 0) return null;
    
    let stepsSum = 0, stepsCount = 0;
    let sleepSum = 0, sleepCount = 0;
    let weightSum = 0, weightCount = 0;
    let bmiSum = 0, bmiCount = 0;
    let firstWeight = null, lastWeight = null;
    
    for (const record of records) {
        if (record.steps) { stepsSum += record.steps; stepsCount++; }
        if (record.sleep_level) { sleepSum += record.sleep_level; sleepCount++; }
        if (record.weight) { 
            weightSum += record.weight; weightCount++; 
            if (firstWeight === null) firstWeight = record.weight;
            lastWeight = record.weight;
        }
        if (record.bmi) { bmiSum += record.bmi; bmiCount++; }
    }
    
    const avgSteps = stepsCount > 0 ? Math.round(stepsSum / stepsCount) : null;
    const avgSleep = sleepCount > 0 ? Math.round(sleepSum / sleepCount) : null;
    const avgWeight = weightCount > 0 ? (weightSum / weightCount).toFixed(1) : null;
    const avgBmi = bmiCount > 0 ? (bmiSum / bmiCount).toFixed(1) : null;
    const weightChange = (firstWeight && lastWeight) ? (lastWeight - firstWeight).toFixed(1) : null;
    
    const metrics = { avgSteps, avgSleep, avgWeight, avgBmi, weightChange, recordCount: records.length };
    
    // 存储原始数据，前端负责翻译
    await new Promise((resolve) => {
        db.run(
            `INSERT INTO health_reports (user_id, report_type, report_date, title, metrics_data)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, reportType, endDate, title, JSON.stringify(metrics)],
            () => resolve()
        );
    });
    
    return { title, metrics };
}

router.post('/generate-all', authenticateToken, async (req, res) => {
    const { language } = req.body;
    const isZh = language === 'zh';
    const userId = req.user.id;
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    const years = await new Promise((resolve) => {
        db.all(`SELECT DISTINCT strftime('%Y', date) as year FROM health_records WHERE user_id = ? ORDER BY year`, [userId], (err, rows) => resolve(rows || []));
    });
    
    const results = { week: 0, month: 0, year: 0 };
    
    for (const y of years) {
        const year = parseInt(y.year);
        if (year < currentYear) {
            const yearReport = await generateOneReport(userId, 'year', `${year}-06-01`, isZh);
            if (yearReport) results.year++;
        }
        for (let m = 1; m <= 12; m++) {
            if (year === currentYear && m >= currentMonth) continue;
            const monthReport = await generateOneReport(userId, 'month', `${year}-${String(m).padStart(2, '0')}-15`, isZh);
            if (monthReport) results.month++;
        }
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = year < currentYear ? new Date(year, 11, 31) : new Date();
        let current = new Date(startOfYear);
        while (current <= endOfYear) {
            if (year === currentYear && !isWeekComplete(current)) {
                current.setDate(current.getDate() + 7);
                continue;
            }
            const weekReport = await generateOneReport(userId, 'week', current, isZh);
            if (weekReport) results.week++;
            current.setDate(current.getDate() + 7);
        }
    }
    
    res.json({ message: `生成完成：周报${results.week}份，月报${results.month}份，年报${results.year}份`, results });
});

router.get('/', authenticateToken, (req, res) => {
    db.all(`SELECT id, report_type, report_date, title, metrics_data, created_at FROM health_reports WHERE user_id = ? ORDER BY report_date DESC`, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        const formatted = rows.map(row => ({
            ...row,
            metrics_data: JSON.parse(row.metrics_data || '{}')
        }));
        res.json(formatted);
    });
});

router.get('/:id', authenticateToken, (req, res) => {
    db.get(`SELECT * FROM health_reports WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        if (!row) return res.status(404).json({ error: '报告不存在' });
        row.metrics_data = JSON.parse(row.metrics_data || '{}');
        res.json(row);
    });
});

module.exports = router;
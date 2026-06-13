const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// 辅助函数：检测是否为日期字段
function isDateField(fieldName, sampleValue) {
    const dateKeywords = ['date', 'time', 'day', '年月日', '日期', '时间', 'created', 'updated', 'recorded', '测量日期', '记录日期', 'year', 'month', 'timestamp'];
    const hasDateKeyword = dateKeywords.some(keyword => fieldName.toLowerCase().includes(keyword));
    
    if (hasDateKeyword) return true;
    
    if (sampleValue && typeof sampleValue === 'string') {
        const datePatterns = [
            /^\d{4}-\d{2}-\d{2}/,
            /^\d{4}\/\d{2}\/\d{2}/,
            /^\d{2}\/\d{2}\/\d{4}/,
            /^\d{4}年\d{1,2}月\d{1,2}日/,
            /^\d{4}-\d{2}-\d{2}T/,
        ];
        if (datePatterns.some(pattern => pattern.test(sampleValue))) return true;
    }
    
    return false;
}

// 获取用户所有医疗报告
router.get('/', authenticateToken, (req, res) => {
    db.all(
        'SELECT * FROM medical_reports WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id],
        (err, rows) => {
            if (err) {
                console.error('获取报告失败:', err);
                return res.status(500).json({ error: '服务器错误' });
            }
            const reports = rows.map(row => {
                try {
                    return {
                        ...row,
                        data: JSON.parse(row.data || '{}')
                    };
                } catch (e) {
                    return {
                        ...row,
                        data: {}
                    };
                }
            });
            res.json(reports);
        }
    );
});

// 获取单个报告详情
router.get('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.get(
        'SELECT * FROM medical_reports WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        (err, row) => {
            if (err) {
                console.error('获取报告详情失败:', err);
                return res.status(500).json({ error: '服务器错误' });
            }
            if (!row) return res.status(404).json({ error: '报告不存在' });
            try {
                row.data = JSON.parse(row.data);
            } catch (e) {
                row.data = {};
            }
            res.json(row);
        }
    );
});

// 上传医疗报告数据
router.post('/', authenticateToken, (req, res) => {
    const { name, description, data, dataType } = req.body;
    
    if (!name || !data) {
        return res.status(400).json({ error: '报告名称和数据不能为空' });
    }
    
    const dataStr = JSON.stringify(data);
    
    db.run(
        `INSERT INTO medical_reports (user_id, name, description, data, data_type, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [req.user.id, name, description || '', dataStr, dataType || 'json'],
        function(err) {
            if (err) {
                console.error('保存报告失败:', err);
                return res.status(500).json({ error: '服务器错误' });
            }
            res.status(201).json({ 
                id: this.lastID, 
                message: '报告保存成功',
                data: data
            });
        }
    );
});

// 删除报告
router.delete('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.run(
        'DELETE FROM medical_reports WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        function(err) {
            if (err) {
                console.error('删除报告失败:', err);
                return res.status(500).json({ error: '服务器错误' });
            }
            res.json({ message: '报告删除成功' });
        }
    );
});

// 分析数据字段（新增 dateFields 检测）
router.post('/analyze', authenticateToken, (req, res) => {
    const { data } = req.body;
    
    if (!data) {
        return res.status(400).json({ error: '数据不能为空' });
    }
    
    let parsedData = data;
    if (typeof data === 'string') {
        try {
            parsedData = JSON.parse(data);
        } catch (e) {
            return res.status(400).json({ error: '数据格式错误' });
        }
    }
    
    const analysis = {
        type: Array.isArray(parsedData) ? 'array' : 'object',
        fields: [],
        numericFields: [],
        categoryFields: [],
        dateFields: [],      // 新增：日期字段列表
        sampleData: Array.isArray(parsedData) ? parsedData.slice(0, 5) : parsedData,
        rowCount: Array.isArray(parsedData) ? parsedData.length : 1
    };
    
    if (Array.isArray(parsedData) && parsedData.length > 0) {
        analysis.fields = Object.keys(parsedData[0]);
        for (const field of analysis.fields) {
            const sampleValue = parsedData[0][field];
            if (typeof sampleValue === 'number') {
                analysis.numericFields.push(field);
            } else {
                analysis.categoryFields.push(field);
            }
            // 检测是否为日期字段
            if (isDateField(field, sampleValue)) {
                analysis.dateFields.push(field);
            }
        }
    } else if (typeof parsedData === 'object' && parsedData !== null) {
        analysis.fields = Object.keys(parsedData);
        for (const field of analysis.fields) {
            const sampleValue = parsedData[field];
            if (typeof sampleValue === 'number') {
                analysis.numericFields.push(field);
            } else {
                analysis.categoryFields.push(field);
            }
            if (isDateField(field, sampleValue)) {
                analysis.dateFields.push(field);
            }
        }
    }
    
    res.json(analysis);
});

module.exports = router;
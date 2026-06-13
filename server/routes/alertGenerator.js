const db = require('../db');

// 红色告警阈值（健康风险 - 严重偏离正常范围）
const RED_ALERT_THRESHOLDS = {
    weight: {
        normal: { min: 45, max: 80 },
        red: { min: 35, max: 100 }
    },
    bmi: {
        normal: { min: 18.5, max: 24.9 },
        red: { min: 16, max: 32 }
    },
    body_fat_male: {
        normal: { min: 10, max: 20 },
        red: { min: 8, max: 28 }
    },
    body_fat_female: {
        normal: { min: 18, max: 28 },
        red: { min: 14, max: 35 }
    },
    heart_rate: {
        normal: { min: 60, max: 100 },
        red: { min: 50, max: 120 }
    },
    blood_pressure_systolic: {
        normal: { min: 90, max: 120 },
        red: { min: 80, max: 140 }
    },
    blood_pressure_diastolic: {
        normal: { min: 60, max: 80 },
        red: { min: 50, max: 90 }
    },
    blood_sugar: {
        normal: { min: 3.9, max: 6.1 },
        red: { min: 3.5, max: 8.0 }
    },
    sleep_level: {
        normal: { min: 70, max: 100 },
        red: { min: 50 }
    },
    steps: {
        normal: { min: 8000, max: 15000 },
        red: { min: 3000 }
    }
};

// 红色告警描述
const RED_ALERT_DESCRIPTIONS = {
    weight_high: {
        title: '!!! 体重严重超标 !!!',
        description: '您的体重已严重超出健康范围，增加心血管疾病风险，请立即就医评估并制定减重计划。'
    },
    weight_low: {
        title: '!!! 体重严重不足 !!!',
        description: '您的体重已严重低于健康范围，可能导致营养不良和免疫力下降，请立即就医检查。'
    },
    bmi_high: {
        title: '!!! 重度肥胖风险 !!!',
        description: '您的BMI已严重超标，属于重度肥胖，增加糖尿病、高血压、心脏病风险，请立即就医！'
    },
    bmi_low: {
        title: '!!! 重度消瘦风险 !!!',
        description: '您的BMI已严重偏低，属于重度消瘦，可能影响器官功能，请立即就医检查！'
    },
    heart_rate_high: {
        title: '!!! 心动过速风险 !!!',
        description: '您的静息心率持续过高，可能增加心脏负担，请立即就医检查！'
    },
    heart_rate_low: {
        title: '!!! 心动过缓风险 !!!',
        description: '您的静息心率持续过低，可能影响心脏供血，请立即就医检查！'
    },
    blood_pressure_high: {
        title: '!!! 高血压风险 !!!',
        description: '您的血压持续偏高，增加心脑血管疾病风险，请立即就医！'
    },
    blood_pressure_low: {
        title: '!!! 低血压风险 !!!',
        description: '您的血压持续偏低，可能导致头晕乏力，请及时就医！'
    },
    blood_sugar_high: {
        title: '!!! 高血糖风险 !!!',
        description: '您的血糖持续偏高，需警惕糖尿病，请立即就医检查！'
    },
    blood_sugar_low: {
        title: '!!! 低血糖风险 !!!',
        description: '您的血糖持续偏低，可能导致晕厥，请立即补充糖分并就医！'
    },
    sleep_low: {
        title: '!!! 严重睡眠障碍 !!!',
        description: '您的睡眠质量严重不足，长期如此将严重影响身心健康，请就医咨询！'
    },
    steps_low: {
        title: '!!! 严重缺乏运动 !!!',
        description: '您的运动量严重不足，增加多种慢性病风险，请立即增加活动量！'
    },
    body_fat_high: {
        title: '!!! 体脂率严重超标 !!!',
        description: '您的体脂率严重超标，增加代谢疾病风险，请立即就医评估！'
    },
    body_fat_low: {
        title: '!!! 体脂率严重偏低 !!!',
        description: '您的体脂率严重偏低，可能影响内分泌和免疫功能，请咨询营养师！'
    }
};

// 获取用户性别
function getUserGender(userId) {
    return new Promise((resolve) => {
        db.get('SELECT gender FROM users WHERE id = ?', [userId], (err, row) => {
            resolve(row?.gender || 'male');
        });
    });
}

// 检查红色告警（健康风险）
async function checkRedAlerts(userId, records) {
    const redAlerts = [];
    const gender = await getUserGender(userId);
    
    if (!records || records.length === 0) return redAlerts;
    
    // 获取最新的一条记录
    const latestRecord = records[0];
    if (!latestRecord) return redAlerts;
    
    // 检查体重
    if (latestRecord.weight) {
        const weight = latestRecord.weight;
        if (weight >= RED_ALERT_THRESHOLDS.weight.red.max) {
            redAlerts.push(RED_ALERT_DESCRIPTIONS.weight_high);
        } else if (weight <= RED_ALERT_THRESHOLDS.weight.red.min) {
            redAlerts.push(RED_ALERT_DESCRIPTIONS.weight_low);
        }
    }
    
    // 检查BMI
    if (latestRecord.bmi) {
        const bmi = latestRecord.bmi;
        if (bmi >= RED_ALERT_THRESHOLDS.bmi.red.max) {
            redAlerts.push(RED_ALERT_DESCRIPTIONS.bmi_high);
        } else if (bmi <= RED_ALERT_THRESHOLDS.bmi.red.min) {
            redAlerts.push(RED_ALERT_DESCRIPTIONS.bmi_low);
        }
    }
    
    // 检查心率
    if (latestRecord.heart_rate) {
        const hr = latestRecord.heart_rate;
        if (hr >= RED_ALERT_THRESHOLDS.heart_rate.red.max) {
            redAlerts.push(RED_ALERT_DESCRIPTIONS.heart_rate_high);
        } else if (hr <= RED_ALERT_THRESHOLDS.heart_rate.red.min) {
            redAlerts.push(RED_ALERT_DESCRIPTIONS.heart_rate_low);
        }
    }
    
    // 检查血压
    if (latestRecord.blood_pressure) {
        const parts = latestRecord.blood_pressure.split('/');
        if (parts.length === 2) {
            const systolic = parseInt(parts[0]);
            const diastolic = parseInt(parts[1]);
            if (systolic >= RED_ALERT_THRESHOLDS.blood_pressure_systolic.red.max || 
                diastolic >= RED_ALERT_THRESHOLDS.blood_pressure_diastolic.red.max) {
                redAlerts.push(RED_ALERT_DESCRIPTIONS.blood_pressure_high);
            } else if (systolic <= RED_ALERT_THRESHOLDS.blood_pressure_systolic.red.min || 
                       diastolic <= RED_ALERT_THRESHOLDS.blood_pressure_diastolic.red.min) {
                redAlerts.push(RED_ALERT_DESCRIPTIONS.blood_pressure_low);
            }
        }
    }
    
    // 检查血糖
    if (latestRecord.blood_sugar) {
        const bs = latestRecord.blood_sugar;
        if (bs >= RED_ALERT_THRESHOLDS.blood_sugar.red.max) {
            redAlerts.push(RED_ALERT_DESCRIPTIONS.blood_sugar_high);
        } else if (bs <= RED_ALERT_THRESHOLDS.blood_sugar.red.min) {
            redAlerts.push(RED_ALERT_DESCRIPTIONS.blood_sugar_low);
        }
    }
    
    // 检查睡眠
    if (latestRecord.sleep_level && latestRecord.sleep_level <= RED_ALERT_THRESHOLDS.sleep_level.red.min) {
        redAlerts.push(RED_ALERT_DESCRIPTIONS.sleep_low);
    }
    
    // 检查步数
    if (latestRecord.steps && latestRecord.steps <= RED_ALERT_THRESHOLDS.steps.red.min) {
        redAlerts.push(RED_ALERT_DESCRIPTIONS.steps_low);
    }
    
    // 检查体脂率
    if (latestRecord.body_fat) {
        const bodyFatRange = gender === 'male' ? RED_ALERT_THRESHOLDS.body_fat_male : RED_ALERT_THRESHOLDS.body_fat_female;
        if (latestRecord.body_fat >= bodyFatRange.red.max) {
            redAlerts.push(RED_ALERT_DESCRIPTIONS.body_fat_high);
        } else if (latestRecord.body_fat <= bodyFatRange.red.min) {
            redAlerts.push(RED_ALERT_DESCRIPTIONS.body_fat_low);
        }
    }
    
    return redAlerts;
}

// 检查黄色告警（目标未完成）
async function checkYellowAlerts(userId) {
    const yellowAlerts = [];
    
    const goals = await new Promise((resolve) => {
        db.all(
            `SELECT * FROM health_goals 
             WHERE user_id = ? AND completed = 0 
             AND end_date >= date('now')`,
            [userId],
            (err, rows) => resolve(rows || [])
        );
    });
    
    for (const goal of goals) {
        // 获取目标期间的最新记录
        const record = await new Promise((resolve) => {
            db.get(
                `SELECT * FROM health_records 
                 WHERE user_id = ? AND date BETWEEN ? AND ?
                 ORDER BY date DESC LIMIT 1`,
                [userId, goal.start_date, goal.end_date],
                (err, row) => resolve(row)
            );
        });
        
        if (!record) continue;
        
        let currentValue = null;
        switch (goal.metric) {
            case 'steps': currentValue = record.steps; break;
            case 'weight': currentValue = record.weight; break;
            case 'bmi': currentValue = record.bmi; break;
            case 'body_fat': currentValue = record.body_fat; break;
            case 'heart_rate': currentValue = record.heart_rate; break;
            case 'blood_sugar': currentValue = record.blood_sugar; break;
            case 'sleep_level': currentValue = record.sleep_level; break;
            case 'calories': currentValue = record.calories; break;
            default: continue;
        }
        
        if (currentValue !== null && currentValue !== undefined && currentValue < goal.target_value) {
            yellowAlerts.push({
                title: `⚠️ ${goal.metric_label}目标未完成`,
                description: `您在 ${goal.start_date} 至 ${goal.end_date} 期间设定了 ${goal.metric_label} 目标为 ${goal.target_value}，当前值为 ${currentValue}，未达到目标。请继续努力！`,
                metric: goal.metric_label
            });
        }
    }
    
    return yellowAlerts;
}

// 生成并保存告警
async function generateAlerts(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    // 获取用户健康记录
    const records = await new Promise((resolve) => {
        db.all(
            'SELECT * FROM health_records WHERE user_id = ? ORDER BY date DESC',
            [userId],
            (err, rows) => resolve(rows || [])
        );
    });
    
    // 获取现有未读告警
    const existingAlerts = await new Promise((resolve) => {
        db.all(
            'SELECT type, title FROM alerts WHERE user_id = ? AND read = 0',
            [userId],
            (err, rows) => resolve(rows || [])
        );
    });
    
    const existingTitles = new Set(existingAlerts.map(a => `${a.type}_${a.title}`));
    const alertsToAdd = [];
    
    // 1. 红色告警（健康风险）
    const redAlerts = await checkRedAlerts(userId, records);
    for (const alert of redAlerts) {
        const key = `critical_${alert.title}`;
        if (!existingTitles.has(key)) {
            alertsToAdd.push({
                type: 'critical',
                title: alert.title,
                description: alert.description,
                metric: alert.title.replace(/[^a-zA-Z\u4e00-\u9fa5]/g, '').slice(0, 10),
                date: today
            });
        }
    }
    
    // 2. 黄色告警（目标未完成）
    const yellowAlerts = await checkYellowAlerts(userId);
    for (const alert of yellowAlerts) {
        const key = `warning_${alert.title}`;
        if (!existingTitles.has(key)) {
            alertsToAdd.push({
                type: 'warning',
                title: alert.title,
                description: alert.description,
                metric: alert.metric,
                date: today
            });
        }
    }
    
    // 保存告警
    for (const alert of alertsToAdd) {
        await new Promise((resolve) => {
            db.run(
                `INSERT INTO alerts (user_id, type, title, description, metric, date, read)
                 VALUES (?, ?, ?, ?, ?, ?, 0)`,
                [userId, alert.type, alert.title, alert.description, alert.metric, alert.date],
                (err) => {
                    if (err) console.error('保存告警失败:', err);
                    resolve();
                }
            );
        });
    }
    
    console.log(`✅ 用户 ${userId} 生成了 ${alertsToAdd.length} 条告警（红色: ${redAlerts.length}, 黄色: ${yellowAlerts.length}）`);
    return alertsToAdd;
}

// 为所有用户生成告警
async function generateAlertsForAllUsers() {
    const users = await new Promise((resolve) => {
        db.all('SELECT id FROM users', [], (err, rows) => resolve(rows || []));
    });
    
    let totalAlerts = 0;
    for (const user of users) {
        const alerts = await generateAlerts(user.id);
        totalAlerts += alerts.length;
    }
    
    console.log(`✅ 为 ${users.length} 个用户生成了 ${totalAlerts} 条告警`);
    return totalAlerts;
}

module.exports = { generateAlerts, generateAlertsForAllUsers, checkRedAlerts, checkYellowAlerts };
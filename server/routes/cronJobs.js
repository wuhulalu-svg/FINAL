// server/cronJobs.js
const cron = require('node-cron');
const db = require('./db');  // 确保 db.js 在同一目录

// 正常范围配置（示例）
const normalRanges = {
  heart_rate: { min: 60, max: 100, unit: 'bpm', title: '心率', description: '心率值 %.1f bpm，超出正常范围 (%d-%d)。请及时就医。' },
  blood_pressure_systolic: { min: 90, max: 120, unit: 'mmHg', title: '血压（收缩压）', description: '收缩压 %.0f mmHg，超出正常范围 (%d-%d)。请监测血压。' },
  blood_pressure_diastolic: { min: 60, max: 80, unit: 'mmHg', title: '血压（舒张压）', description: '舒张压 %.0f mmHg，超出正常范围 (%d-%d)。请监测血压。' },
  blood_sugar: { min: 3.9, max: 6.1, unit: 'mmol/L', title: '血糖', description: '血糖值 %.1f mmol/L，超出正常范围 (%.1f-%.1f)。请注意饮食。' },
  bmi: { min: 18.5, max: 24.9, unit: '', title: 'BMI', description: 'BMI %.1f，超出正常范围 (%.1f-%.1f)。请关注体重管理。' },
};

// 辅助函数：创建告警（避免重复）
async function createAlert(userId, type, title, description, metric, date) {
  try {
    const existing = await new Promise((resolve, reject) => {
      db.get(
        `SELECT id FROM alerts WHERE user_id = ? AND type = ? AND metric = ? AND date = ?`,
        [userId, type, metric, date],
        (err, row) => { if (err) reject(err); else resolve(row); }
      );
    });
    if (existing) return;
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO alerts (user_id, title, description, type, metric, date, read)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [userId, title, description, type, metric, date],
        function(err) { if (err) reject(err); else resolve(); }
      );
    });
  } catch (err) {
    console.error('创建告警失败:', err);
  }
}

// 每天凌晨1点检查目标未完成（黄色告警）
cron.schedule('0 1 * * *', async () => {
  console.log('[Cron] 检查未完成的目标...');
  const today = new Date().toISOString().split('T')[0];
  try {
    const goals = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM health_goals WHERE completed = 0 AND end_date >= date('now')`,
        (err, rows) => { if (err) reject(err); else resolve(rows); }
      );
    });
    for (const goal of goals) {
      const record = await new Promise((resolve, reject) => {
        db.get(
          `SELECT * FROM health_records WHERE user_id = ? AND date <= ? ORDER BY date DESC LIMIT 1`,
          [goal.user_id, today],
          (err, row) => { if (err) reject(err); else resolve(row); }
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
        case 'blood_pressure': 
          if (record.blood_pressure) currentValue = parseInt(record.blood_pressure.split('/')[0]);
          break;
        case 'blood_sugar': currentValue = record.blood_sugar; break;
        case 'sleep_level': currentValue = record.sleep_level; break;
        case 'calories': currentValue = record.calories; break;
        default: continue;
      }
      if (currentValue !== null && currentValue < goal.target_value) {
        const description = `您未完成 ${goal.metric_label} 目标（目标值 ${goal.target_value}，当前值 ${currentValue}）。请继续努力！`;
        await createAlert(goal.user_id, 'warning', `⚠️ ${goal.metric_label} 目标未达标`, description, goal.metric, today);
      }
    }
  } catch (err) {
    console.error('目标检查定时任务出错:', err);
  }
});

// 每天凌晨2点检查健康数据异常（红色告警）
cron.schedule('0 2 * * *', async () => {
  console.log('[Cron] 检查健康数据异常...');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];
  try {
    const records = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM health_records WHERE date = ?`, [dateStr], (err, rows) => {
        if (err) reject(err); else resolve(rows);
      });
    });
    for (const record of records) {
      // 心率
      if (record.heart_rate) {
        const range = normalRanges.heart_rate;
        if (record.heart_rate < range.min || record.heart_rate > range.max) {
          const description = `心率值为 ${record.heart_rate} bpm，超出正常范围 (${range.min}-${range.max})。请及时就医。`;
          await createAlert(record.user_id, 'critical', '!!! 心率异常 !!!', description, 'heart_rate', dateStr);
        }
      }
      // 血压
      if (record.blood_pressure) {
        const parts = record.blood_pressure.split('/');
        const systolic = parseInt(parts[0]);
        const diastolic = parseInt(parts[1]);
        const sysRange = normalRanges.blood_pressure_systolic;
        const diaRange = normalRanges.blood_pressure_diastolic;
        if (systolic < sysRange.min || systolic > sysRange.max) {
          const description = `收缩压 ${systolic} mmHg，超出正常范围 (${sysRange.min}-${sysRange.max})。请监测血压。`;
          await createAlert(record.user_id, 'critical', '!!! 血压异常 !!!', description, 'blood_pressure', dateStr);
        }
        if (diastolic < diaRange.min || diastolic > diaRange.max) {
          const description = `舒张压 ${diastolic} mmHg，超出正常范围 (${diaRange.min}-${diaRange.max})。请监测血压。`;
          await createAlert(record.user_id, 'critical', '!!! 血压异常 !!!', description, 'blood_pressure', dateStr);
        }
      }
      // 血糖
      if (record.blood_sugar) {
        const range = normalRanges.blood_sugar;
        if (record.blood_sugar < range.min || record.blood_sugar > range.max) {
          const description = `血糖值 ${record.blood_sugar} mmol/L，超出正常范围 (${range.min}-${range.max})。请注意饮食控制。`;
          await createAlert(record.user_id, 'critical', '!!! 血糖异常 !!!', description, 'blood_sugar', dateStr);
        }
      }
      // BMI
      if (record.bmi) {
        const range = normalRanges.bmi;
        if (record.bmi < range.min || record.bmi > range.max) {
          const description = `BMI ${record.bmi}，超出正常范围 (${range.min}-${range.max})。请关注体重管理。`;
          await createAlert(record.user_id, 'critical', '!!! BMI 异常 !!!', description, 'bmi', dateStr);
        }
      }
    }
  } catch (err) {
    console.error('健康数据异常检查定时任务出错:', err);
  }
});

console.log('Cron jobs initialized');
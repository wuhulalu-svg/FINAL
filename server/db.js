const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 确保 database 文件夹存在
const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('Created database directory:', dbDir);
}

// 数据库文件路径
const dbPath = path.join(dbDir, 'health.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// 初始化数据库表
db.serialize(() => {
  // 用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      age INTEGER,
      gender TEXT,
      height REAL,
      weight REAL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating users table:', err.message);
    else console.log('Users table ready');
  });
  // 健康报告表
db.run(`
    CREATE TABLE IF NOT EXISTS health_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        report_type TEXT NOT NULL,
        report_date TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        good_points TEXT DEFAULT '[]',
        improvement_points TEXT DEFAULT '[]',
        metrics_data TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
`, (err) => {
    if (err) console.error('Error creating health_reports table:', err.message);
    else console.log('Health_reports table ready');
});

  // 健康记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS health_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      weight REAL,
      bmi REAL,
      body_fat REAL,
      body_fat_mass REAL,
      body_water REAL,
      body_water_rate REAL,
      protein REAL,
      protein_rate REAL,
      muscle_mass REAL,
      muscle_rate REAL,
      skeletal_muscle_mass REAL,
      bone_mass REAL,
      bone_mass_rate REAL,
      lean_body_mass REAL,
      visceral_fat INTEGER,
      waist_hip_ratio REAL,
      body_age INTEGER,
      basal_metabolic_rate INTEGER,
      heart_rate INTEGER,
      blood_pressure TEXT,
      blood_sugar REAL,
      blood_oxygen REAL,
      sleep_level INTEGER,
      stress_level INTEGER,
      steps INTEGER,
      calories INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(user_id, date)
    )
  `, (err) => {
    if (err) console.error('Error creating health_records table:', err.message);
    else console.log('Health_records table ready');
  });

  // 健康目标表
  db.run(`
    CREATE TABLE IF NOT EXISTS health_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      metric TEXT NOT NULL,
      metric_label TEXT NOT NULL,
      target_value REAL NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      duration INTEGER NOT NULL,
      completed BOOLEAN DEFAULT 0,
      missed_days TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `, (err) => {
    if (err) console.error('Error creating health_goals table:', err.message);
    else console.log('Health_goals table ready');
  });

  // 告警表
  db.run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      metric TEXT,
      read BOOLEAN DEFAULT 0,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `, (err) => {
    if (err) console.error('Error creating alerts table:', err.message);
    else console.log('Alerts table ready');
  });

  // 广场动态表
  db.run(`
    CREATE TABLE IF NOT EXISTS square_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      image TEXT,
      likes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `, (err) => {
    if (err) console.error('Error creating square_posts table:', err.message);
    else console.log('Square_posts table ready');
  });

  // 点赞记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS square_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES square_posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(post_id, user_id)
    )
  `, (err) => {
    if (err) console.error('Error creating square_likes table:', err.message);
    else console.log('Square_likes table ready');
  });

  // 医疗报告表（修正：添加 db.run 执行）
  db.run(`
    CREATE TABLE IF NOT EXISTS medical_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      data TEXT NOT NULL,
      data_type TEXT DEFAULT 'json',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) console.error('Error creating medical_reports table:', err.message);
    else console.log('Medical_reports table ready');
  });

  // 评论表
  db.run(`
    CREATE TABLE IF NOT EXISTS square_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES square_posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) console.error('Error creating square_comments table:', err.message);
    else console.log('Square_comments table ready');
  });

  console.log('✅ SQLite 数据库表初始化完成');
});

module.exports = db;
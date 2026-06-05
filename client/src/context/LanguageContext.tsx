import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'zh' | 'en';

type Translations = {
  [key: string]: {
    zh: string;
    en: string;
  };
};

export const translations: Translations = {
  // 导航
  dashboard: { zh: '仪表盘', en: 'Dashboard' },
  dataRecords: { zh: '数据记录', en: 'Data Records' },
  healthSquare: { zh: '健康广场', en: 'Health Square' },
  importData: { zh: '导入数据', en: 'Import Data' },
  healthAnalysis: { zh: '健康分析', en: 'Health Analysis' },
  aiAssistant: { zh: 'AI助手', en: 'AI Assistant' },
  alerts: { zh: '告警', en: 'Alerts' },
  settings: { zh: '设置', en: 'Settings' },
  profile: { zh: '个人资料', en: 'Profile' },
  adminPanel: { zh: '管理面板', en: 'Admin Panel' },
  logout: { zh: '退出登录', en: 'Logout' },
  theme: { zh: '主题', en: 'Theme' },
  language: { zh: '语言', en: 'Language' },
  
  // 时间范围
  week: { zh: '最近一周', en: 'Last 7 Days' },
  month: { zh: '最近一月', en: 'Last 30 Days' },
  quarter: { zh: '最近三月', en: 'Last 90 Days' },
  halfYear: { zh: '最近半年', en: 'Last 180 Days' },
  year: { zh: '最近一年', en: 'Last 365 Days' },
  allTime: { zh: '全部', en: 'All Time' },
  
  // 仪表盘
  welcomeBack: { zh: '欢迎回来', en: 'Welcome back' },
  totalRecords: { zh: '总记录数', en: 'Total Records' },
  latestUpdate: { zh: '最新更新', en: 'Latest Update' },
  metricsTracked: { zh: '指标数量', en: 'Metrics Tracked' },
  healthTrends: { zh: '健康趋势', en: 'Health Trends' },
  selectMetrics: { zh: '选择指标', en: 'Select Metrics' },
  daysTracked: { zh: '天数据追踪', en: 'days tracked' },
  currentValue: { zh: '当前值', en: 'Current Value' },
  averageValue: { zh: '平均值', en: 'Average Value' },
  highestValue: { zh: '最高值', en: 'Highest Value' },
  lowestValue: { zh: '最低值', en: 'Lowest Value' },
  changeTrend: { zh: '变化趋势', en: 'Change Trend' },
  noData: { zh: '暂无数据', en: 'No Data Available' },
  date: { zh: '日期', en: 'Date' },
  change: { zh: '变化', en: 'Change' },
  records: { zh: '条记录', en: 'records' },

  // 新增缺失的键
  activeCharts: { zh: '活跃图表', en: 'Active Charts' },
  addChart: { zh: '添加图表', en: 'Add Chart' },
  chartsDisplayed: { zh: '当前图表数', en: 'Charts Displayed' },
  removeChart: { zh: '移除图表', en: 'Remove Chart' },
  noCharts: { zh: '暂无图表', en: 'No Charts' },
  clickAddChart: { zh: '点击上方按钮添加图表', en: 'Click the button above to add a chart' },
  noDataForMetric: { zh: '该指标暂无数据', en: 'No data for this metric' },
  noDataAvailable: { zh: '暂无可用健康数据', en: 'No health data available' },
  
  // AI助手
  aiHealthAssistant: { zh: 'AI健康助手', en: 'AI Health Assistant' },
  personalizedAdvice: { zh: '基于你的健康数据，为你提供个性化建议', en: 'Personalized advice based on your health data' },
  typeMessage: { zh: '问我关于你的健康数据...', en: 'Ask me about your health data...' },
  thinking: { zh: '正在思考...', en: 'Thinking...' },
  aiUnavailable: { zh: '抱歉，AI服务暂时不可用，请稍后再试。', en: 'Sorry, AI service is temporarily unavailable. Please try again later.' },
  tryAsking: { zh: '试试问这些问题：', en: 'Try asking these questions:' },
  aiNote: { zh: 'AI助手会基于你的健康数据提供个性化建议', en: 'AI assistant provides personalized advice based on your health data' },
  
  // 快捷问题
  askAdvice: { zh: '根据我的健康数据，有什么建议？', en: 'What advice based on my health data?' },
  askBMI: { zh: '我的BMI正常吗？', en: 'Is my BMI normal?' },
  askSleep: { zh: '如何改善睡眠质量？', en: 'How to improve sleep quality?' },
  askExercise: { zh: '推荐一些适合我的运动', en: 'Recommend some exercises for me' },
  askWeight: { zh: '我的体重需要控制吗？', en: 'Do I need to control my weight?' },
  askHeartRate: { zh: '如何降低心率？', en: 'How to lower my heart rate?' },
  
  // 导入页面
  importHealthData: { zh: '导入健康数据', en: 'Import Health Data' },
  importHealthDataDesc: { zh: '上传健康报告或手动输入数据', en: 'Upload health reports or manually enter data' },
  manualEntry: { zh: '手动输入', en: 'Manual Entry' },
  manualEntryDesc: { zh: '手动输入健康数据', en: 'Manually enter health data' },
  aiImageRecognition: { zh: 'AI图片识别', en: 'AI Image Recognition' },
  aiImageRecognitionDesc: { zh: 'AI自动从图片中提取数据', en: 'AI automatically extracts data from images' },
  csvTemplate: { zh: 'CSV模板', en: 'CSV Template' },
  csvTemplateDesc: { zh: '下载CSV模板文件', en: 'Download CSV template file' },
  uploadHealthReport: { zh: '上传健康报告', en: 'Upload Health Report' },
  aiPowered: { zh: 'AI驱动', en: 'AI Powered' },
  dragAndDrop: { zh: '拖放健康报告图片或CSV文件到此区域', en: 'Drag and drop health report image or CSV file here' },
  aiAnalyzing: { zh: 'AI正在分析您的健康报告...', en: 'AI is analyzing your health report...' },
  extractFailed: { zh: '未能从图片中识别出健康数据', en: 'Failed to extract health data from image' },
  aiExtractedData: { zh: 'AI提取的数据', en: 'AI Extracted Data' },
  metricsExtracted: { zh: '个指标已提取', en: 'metrics extracted' },
  saveRecord: { zh: '保存健康记录', en: 'Save Health Record' },
  saveSuccess: { zh: '保存成功', en: 'Save successful' },
  saveFailed: { zh: '保存失败，请重试', en: 'Save failed, please try again' },
  saving: { zh: '保存中...', en: 'Saving...' },
  unknownError: { zh: '未知错误', en: 'Unknown error' },
  cancel: { zh: '取消', en: 'Cancel' },
  aiRecognitionNote: { zh: '自动从您的图片中提取了', en: 'Automatically extracted' },
  metricsFromImage: { zh: '个指标。您可以在保存前编辑任何数值。', en: 'metrics from your image. You can edit any values before saving.' },
  recentRecords: { zh: '最近记录', en: 'Recent Records' },
  noRecords: { zh: '暂无健康记录', en: 'No health records yet' },
  startTracking: { zh: '开始上传或输入数据吧！', en: 'Start by uploading or entering data!' },
  latest: { zh: '最新', en: 'Latest' },
  recordsSaved: { zh: '条记录已保存', en: 'records saved' },
  uploadFailed: { zh: '上传失败', en: 'Upload failed' },
  invalidFile: { zh: '请上传有效的图片或CSV文件', en: 'Please upload a valid image or CSV file' },
  importSuccess: { zh: '导入成功', en: 'Import successful' },
  importFailed: { zh: '导入失败', en: 'Import failed' },
  failed: { zh: '条失败', en: 'failed' },
  
  // 数据记录页面
  dataRecordsTitle: { zh: '数据记录', en: 'Data Records' },
  dataRecordsDesc: { zh: '查看和管理您的每日健康数据', en: 'View and manage your daily health data' },
  exportCSV: { zh: '导出CSV', en: 'Export CSV' },
  noDataRecords: { zh: '暂无数据记录', en: 'No data records' },
  addDataFirst: { zh: '请先在"导入数据"页面添加您的健康数据', en: 'Please add your health data in the "Import Data" page first' },
  viewDetails: { zh: '查看详情', en: 'View Details' },
  collapse: { zh: '收起', en: 'Collapse' },
  confirmDelete: { zh: '确定要删除', en: 'Are you sure you want to delete' },
  dataFor: { zh: '的数据', en: ' data' },
  deleteSuccess: { zh: '删除成功', en: 'Delete successful' },
  deleteFailed: { zh: '删除失败', en: 'Delete failed' },
  deleteAll: { zh: '删除全部', en: 'Delete All' },
  confirmDeleteAll: { zh: '确认删除全部', en: 'Confirm Delete All' },
  deleteAllWarning: { zh: '确定要删除所有健康记录吗？此操作不可撤销！', en: 'Are you sure you want to delete all health records? This action cannot be undone!' },
  confirm: { zh: '确认', en: 'Confirm' },
  totalRecords: { zh: '共', en: 'Total' },
  
  // 个人资料
  editProfile: { zh: '编辑资料', en: 'Edit Profile' },
  saveChanges: { zh: '保存更改', en: 'Save Changes' },
  fullName: { zh: '全名', en: 'Full Name' },
  emailAddress: { zh: '邮箱地址', en: 'Email Address' },
  age: { zh: '年龄', en: 'Age' },
  gender: { zh: '性别', en: 'Gender' },
  male: { zh: '男', en: 'Male' },
  female: { zh: '女', en: 'Female' },
  other: { zh: '其他', en: 'Other' },
  heightCm: { zh: '身高 (厘米)', en: 'Height (cm)' },
  weightKg: { zh: '体重 (公斤)', en: 'Weight (kg)' },
  healthMetrics: { zh: '健康指标', en: 'Health Metrics' },
  memberSince: { zh: '注册时间', en: 'Member Since' },
  totalDataPoints: { zh: '总数据点数', en: 'Total Data Points' },
  dataPrivacy: { zh: '数据隐私', en: 'Data Privacy' },
  privacyDesc: { zh: '您的健康数据安全存储，仅用于个人健康追踪。我们使用匿名数据进行年龄段对比。', en: 'Your health data is stored securely and used only for your personal health tracking. We use anonymized data for age group comparisons.' },
  encrypted: { zh: '传输和存储数据加密', en: 'Data encrypted at rest and in transit' },
  anonymized: { zh: '匿名化用于基准比较', en: 'Anonymized for benchmark comparisons' },
  noSharing: { zh: '从不与第三方共享', en: 'Never shared with third parties' },
  changeAvatar: { zh: '更换头像', en: 'Change Avatar' },
  years: { zh: '岁', en: 'years' },
  active: { zh: '活跃', en: 'Active' },
  
  // 告警
  healthAlerts: { zh: '健康告警', en: 'Health Alerts' },
  monitorWarnings: { zh: '监控您的健康警告和目标进度', en: 'Monitor your health warnings and goal progress' },
  criticalAlerts: { zh: '严重告警', en: 'Critical Alerts' },
  warningAlerts: { zh: '警告', en: 'Warning Alerts' },
  resolved: { zh: '已解决', en: 'Resolved' },
  criticalHealthAlerts: { zh: '!!! 严重健康告警 !!!', en: '!!! Critical Health Alerts !!!' },
  goalWarnings: { zh: '目标警告', en: 'Goal Warnings' },
  markAsRead: { zh: '标记已读', en: 'Mark as Read' },
  allClear: { zh: '一切正常！', en: 'All Clear!' },
  noActiveAlerts: { zh: '您没有活跃告警。继续保持！', en: 'You have no active alerts. Keep up the great work!' },
  resolvedAlerts: { zh: '已解决告警', en: 'Resolved Alerts' },
  related: { zh: '相关指标', en: 'Related' },
  
  // 健康分析
  analysisPeriod: { zh: '分析周期', en: 'Analysis Period' },
  basedOnData: { zh: '基于', en: 'Based on' },
  daysOfData: { zh: '天健康数据', en: 'days of health data' },
  firstRecord: { zh: '首次记录', en: 'First Record' },
  latestRecord: { zh: '最新记录', en: 'Latest Record' },
  totalDays: { zh: '总天数', en: 'Total Days' },
  availableMetrics: { zh: '可用指标', en: 'Available Metrics' },
  comparisonBenchmark: { zh: '对比基准', en: 'Comparison Benchmark' },
  basedOnMedicalStandards: { zh: '基于医学健康标准', en: 'based on medical health standards' },
  selectMetricToCompare: { zh: '选择下方指标，查看您的平均值与健康基准值的对比', en: 'Select a metric below to compare your average with health benchmarks' },
  normalRange: { zh: '正常范围', en: 'Normal Range' },
  yourAverage: { zh: '您的平均值', en: 'Your Average' },
  healthBenchmark: { zh: '健康基准值', en: 'Health Benchmark' },
  difference: { zh: '差异', en: 'Difference' },
  normal: { zh: '正常', en: 'Normal' },
  aboveBenchmark: { zh: '优于基准', en: 'Above Benchmark' },
  belowBenchmark: { zh: '低于基准', en: 'Below Benchmark' },
  healthScoreAssessment: { zh: '健康评分', en: 'Health Score' },
  comprehensiveEvaluation: { zh: '综合评估您的整体健康状况', en: 'Comprehensive evaluation of your overall health' },
  startAssessment: { zh: '开始评估', en: 'Start Assessment' },
  assessing: { zh: '评估中...', en: 'Assessing...' },
  analyzingData: { zh: '正在分析您的健康数据...', en: 'Analyzing your health data...' },
  collectingCalculatingSuggesting: { zh: '收集指标 → 计算评分 → 生成建议', en: 'Collecting metrics → Calculating score → Generating suggestions' },
  excellent: { zh: '优秀！继续保持！', en: 'Excellent! Keep it up!' },
  good: { zh: '良好，还有提升空间', en: 'Good, there is room for improvement' },
  fair: { zh: '一般，需要改善', en: 'Fair, needs improvement' },
  poor: { zh: '较差，请重视健康管理', en: 'Poor, please pay attention to health management' },
  scoreBasis: { zh: '评分依据', en: 'Score Basis' },
  yourValue: { zh: '您的值', en: 'Your Value' },
  benchmark: { zh: '基准值', en: 'Benchmark' },
  points: { zh: '分', en: 'points' },
  
  // 健康广场
  shareYourHealthMoment: { zh: '分享你的健康时刻...', en: 'Share your health moment...' },
  publishPost: { zh: '发布', en: 'Post' },
  addImage: { zh: '添加图片', en: 'Add Image' },
  noPosts: { zh: '暂无动态', en: 'No posts yet' },
  beFirstToShare: { zh: '成为第一个分享健康时刻的人！', en: 'Be the first to share a health moment!' },
  deletePost: { zh: '确定要删除这条动态吗？', en: 'Are you sure you want to delete this post?' },
  writeComment: { zh: '写下你的评论...', en: 'Write your comment...' },
  noComments: { zh: '暂无评论，成为第一个评论的人', en: 'No comments yet, be the first to comment' },
  pleaseEnterContent: { zh: '请输入内容', en: 'Please enter content' },
  publishFailed: { zh: '发布失败', en: 'Publish failed' },
  commentFailed: { zh: '评论失败', en: 'Comment failed' },
  deleteFailed: { zh: '删除失败', en: 'Delete failed' },
  
  // 登录/注册
  signIn: { zh: '登录', en: 'Sign In' },
  signUp: { zh: '注册', en: 'Sign Up' },
  email: { zh: '邮箱', en: 'Email' },
  password: { zh: '密码', en: 'Password' },
  confirmPassword: { zh: '确认密码', en: 'Confirm Password' },
  forgotPassword: { zh: '忘记密码？', en: 'Forgot password?' },
  noAccount: { zh: '还没有账号？', en: "Don't have an account?" },
  haveAccount: { zh: '已有账号？', en: 'Already have an account?' },
  createAccount: { zh: '创建账号', en: 'Create Account' },
  demoAccount: { zh: '演示账号', en: 'Demo Account' },
  
  // 忘记密码
  forgotPasswordTitle: { zh: '忘记密码', en: 'Forgot Password' },
  enterEmailToReceiveCode: { zh: '输入您的邮箱以接收验证码', en: 'Enter your email to receive a verification code' },
  enterVerificationCode: { zh: '输入发送到您邮箱的验证码', en: 'Enter the verification code sent to your email' },
  setNewPassword: { zh: '设置新密码', en: 'Set New Password' },
  sendCode: { zh: '发送验证码', en: 'Send Code' },
  verifyCode: { zh: '验证码', en: 'Verification Code' },
  resendCode: { zh: '重新发送', en: 'Resend Code' },
  newPassword: { zh: '新密码', en: 'New Password' },
  resetPassword: { zh: '重置密码', en: 'Reset Password' },
  codeSent: { zh: '验证码已发送，请查收邮件', en: 'Verification code sent, please check your email' },
  codeVerified: { zh: '验证成功，请设置新密码', en: 'Verification successful, please set a new password' },
  passwordResetSuccess: { zh: '密码重置成功！请重新登录', en: 'Password reset successful! Please login again' },
  codeExpired: { zh: '验证码已过期，请重新获取', en: 'Verification code expired, please request again' },
  codeError: { zh: '验证码错误', en: 'Verification code error' },
  
  // 设置
  settingsAndGoals: { zh: '设置与目标', en: 'Settings & Goals' },
  profileInformation: { zh: '个人信息', en: 'Profile Information' },
  healthGoals: { zh: '健康目标', en: 'Health Goals' },
  addGoal: { zh: '添加目标', en: 'Add Goal' },
  notificationPreferences: { zh: '通知偏好', en: 'Notification Preferences' },
  goalMissedReminders: { zh: '目标未完成提醒', en: 'Goal missed reminders' },
  healthAnomalyAlerts: { zh: '健康异常告警', en: 'Health anomaly alerts' },
  dailyHealthSummary: { zh: '每日健康总结', en: 'Daily health summary' },
  nameLabel: { zh: '姓名', en: 'Name' },
  ageLabel: { zh: '年龄', en: 'Age' },
  genderLabel: { zh: '性别', en: 'Gender' },
  heightLabel: { zh: '身高', en: 'Height' },
  weightLabel: { zh: '体重', en: 'Weight' },
  targetValue: { zh: '目标值', en: 'Target Value' },
  durationDays: { zh: '时长(天)', en: 'Duration(days)' },
  createGoal: { zh: '创建目标', en: 'Create Goal' },
  activeGoals: { zh: '进行中的目标', en: 'Active Goals' },
  completedGoals: { zh: '已完成的目标', en: 'Completed Goals' },
  daysRemaining: { zh: '剩余天数', en: 'days remaining' },
  missedDaysCount: { zh: '未完成天数', en: 'missed days' },
  
  // 管理面板
  adminPanel: { zh: '管理面板', en: 'Admin Panel' },
  manageSystemUsers: { zh: '管理系统用户', en: 'Manage system users' },
  userList: { zh: '用户列表', en: 'User List' },
  userDetails: { zh: '用户详情', en: 'User Details' },
  clickToViewDetails: { zh: '点击用户查看详情', en: 'Click a user to view details' },
  makeAdmin: { zh: '设为管理员', en: 'Make Admin' },
  removeAdmin: { zh: '取消管理员', en: 'Remove Admin' },
  deleteUser: { zh: '删除用户', en: 'Delete User' },
  confirmDeleteUser: { zh: '确定要删除该用户吗？此操作不可撤销！', en: 'Are you sure you want to delete this user? This action cannot be undone!' },
  registered: { zh: '注册时间', en: 'Registered' },
  healthRecordsCount: { zh: '健康记录数', en: 'Health Records' },
  admin: { zh: '管理员', en: 'Admin' },
  user: { zh: '用户', en: 'User' },
  
  // 健康指标标签
  weightLabel: { zh: '体重', en: 'Weight' },
  bmiLabel: { zh: 'BMI', en: 'BMI' },
  bodyFatLabel: { zh: '体脂率', en: 'Body Fat' },
  bodyFatMassLabel: { zh: '脂肪量', en: 'Fat Mass' },
  bodyWaterLabel: { zh: '体水分量', en: 'Body Water' },
  bodyWaterRateLabel: { zh: '身体水分率', en: 'Body Water Rate' },
  proteinLabel: { zh: '蛋白质量', en: 'Protein Mass' },
  proteinRateLabel: { zh: '蛋白质率', en: 'Protein Rate' },
  muscleMassLabel: { zh: '肌肉量', en: 'Muscle Mass' },
  muscleRateLabel: { zh: '肌肉率', en: 'Muscle Rate' },
  skeletalMuscleMassLabel: { zh: '骨骼肌量', en: 'Skeletal Muscle' },
  boneMassLabel: { zh: '骨盐量', en: 'Bone Mass' },
  boneMassRateLabel: { zh: '骨盐率', en: 'Bone Mass Rate' },
  leanBodyMassLabel: { zh: '去脂体重', en: 'Lean Body Mass' },
  visceralFatLabel: { zh: '内脏脂肪等级', en: 'Visceral Fat' },
  waistHipRatioLabel: { zh: '腰臀比', en: 'Waist-Hip Ratio' },
  bodyAgeLabel: { zh: '身体年龄', en: 'Body Age' },
  bmrLabel: { zh: '基础代谢率', en: 'BMR' },
  heartRateLabel: { zh: '心率', en: 'Heart Rate' },
  bloodPressureLabel: { zh: '血压', en: 'Blood Pressure' },
  bloodSugarLabel: { zh: '血糖', en: 'Blood Sugar' },
  bloodOxygenLabel: { zh: '血氧饱和度', en: 'Blood Oxygen' },
  sleepLevelLabel: { zh: '睡眠等级', en: 'Sleep Level' },
  stressLevelLabel: { zh: '压力等级', en: 'Stress Level' },
  stepsLabel: { zh: '步数', en: 'Steps' },
  caloriesLabel: { zh: '卡路里', en: 'Calories' },
  
  // 通用
  loading: { zh: '加载中...', en: 'Loading...' },
  save: { zh: '保存', en: 'Save' },
  edit: { zh: '编辑', en: 'Edit' },
  delete: { zh: '删除', en: 'Delete' },
  back: { zh: '返回', en: 'Back' },
  submit: { zh: '提交', en: 'Submit' },
  ok: { zh: '确定', en: 'OK' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatShortDate: (date: Date | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'zh';
  });

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const locale = language === 'zh' ? 'zh-CN' : 'en-US';
    const defaultOptions: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    return dateObj.toLocaleDateString(locale, options || defaultOptions);
  };

  const formatShortDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const locale = language === 'zh' ? 'zh-CN' : 'en-US';
    return dateObj.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatDate, formatShortDate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
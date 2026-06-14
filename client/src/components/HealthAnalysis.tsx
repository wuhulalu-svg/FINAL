import { User, HealthRecord } from '../App';
import { Users, Calendar, BarChart3, Heart, Award, Sparkles, TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

interface HealthAnalysisProps {
  user: User | null;
  healthRecords: HealthRecord[];
}

// Metric configurations with bilingual support
const getMetrics = (isZh: boolean) => [
  { 
    key: 'bmi', label: isZh ? 'BMI' : 'BMI', unit: '', 
    getValue: (r: HealthRecord) => r.bmi, 
    getBenchmark: (u: User | null) => 22, 
    checkNormal: (val: number) => val >= 18.5 && val <= 24.9, 
    getDeduction: (val: number) => {
      if (val >= 18.5 && val <= 24.9) return 0;
      if (val > 24.9 && val <= 27) return 5;
      if (val > 27 && val <= 30) return 10;
      if (val > 30) return 15;
      if (val < 18.5 && val >= 17) return 5;
      return 15;
    }, 
    getSuggestion: (val: number, isZh: boolean) => {
      if (val >= 18.5 && val <= 24.9) return isZh ? '正常范围 (18.5-24.9)' : 'Normal range (18.5-24.9)';
      if (val > 24.9 && val <= 27) return isZh ? `BMI ${val}（超重），建议控制饮食和运动` : `BMI ${val} (overweight), diet and exercise recommended`;
      if (val > 27 && val <= 30) return isZh ? `BMI ${val}（肥胖），需要体重管理` : `BMI ${val} (obese), weight management needed`;
      if (val > 30) return isZh ? `BMI ${val}（严重肥胖），请咨询医生` : `BMI ${val} (severely obese), consult a doctor`;
      if (val < 18.5 && val >= 17) return isZh ? `BMI ${val}（偏瘦），增加营养摄入` : `BMI ${val} (underweight), increase nutrition`;
      return isZh ? `BMI ${val}（严重偏瘦），请咨询医生` : `BMI ${val} (severely underweight), consult a doctor`;
    } 
  },
  { 
    key: 'heart_rate', label: isZh ? '心率' : 'Heart Rate', unit: 'bpm', 
    getValue: (r: HealthRecord) => r.heart_rate, 
    getBenchmark: (u: User | null) => u?.gender === 'male' ? 68 : 72, 
    checkNormal: (val: number) => val >= 60 && val <= 80, 
    getDeduction: (val: number) => {
      if (val >= 60 && val <= 80) return 0;
      if (val > 80 && val <= 90) return 5;
      if (val > 90 && val <= 100) return 10;
      if (val > 100) return 15;
      if (val < 60 && val >= 55) return 5;
      if (val < 55 && val >= 50) return 10;
      return 15;
    }, 
    getSuggestion: (val: number, isZh: boolean) => {
      if (val >= 60 && val <= 80) return isZh ? '正常范围 (60-80 bpm)' : 'Normal range (60-80 bpm)';
      if (val > 80 && val <= 90) return isZh ? `心率 ${val} bpm（偏高），建议休息` : `Heart rate ${val} bpm (high), rest recommended`;
      if (val > 90 && val <= 100) return isZh ? `心率 ${val} bpm（过高），需要关注` : `Heart rate ${val} bpm (very high), needs attention`;
      if (val > 100) return isZh ? `心率 ${val} bpm（危险），请就医` : `Heart rate ${val} bpm (dangerous), see a doctor`;
      if (val < 60 && val >= 55) return isZh ? `心率 ${val} bpm（偏低），如无症状可接受` : `Heart rate ${val} bpm (low), acceptable if no symptoms`;
      if (val < 55 && val >= 50) return isZh ? `心率 ${val} bpm（过低），建议咨询医生` : `Heart rate ${val} bpm (very low), consult doctor`;
      return isZh ? `心率 ${val} bpm（危险过低），请就医` : `Heart rate ${val} bpm (dangerously low), see a doctor`;
    } 
  },
  { 
    key: 'blood_pressure', label: isZh ? '血压' : 'Blood Pressure', unit: 'mmHg', 
    getValue: (r: HealthRecord) => r.blood_pressure ? parseInt(r.blood_pressure.split('/')[0]) : null, 
    getBenchmark: () => 120, 
    checkNormal: (val: number) => val >= 90 && val <= 120, 
    getDeduction: (val: number) => {
      if (val >= 90 && val <= 120) return 0;
      if (val > 120 && val <= 130) return 5;
      if (val > 130 && val <= 140) return 10;
      if (val > 140) return 15;
      if (val < 90 && val >= 80) return 5;
      return 10;
    }, 
    getSuggestion: (val: number, isZh: boolean) => {
      if (val >= 90 && val <= 120) return isZh ? '正常范围 (90-120 mmHg)' : 'Normal range (90-120 mmHg)';
      if (val > 120 && val <= 130) return isZh ? `血压 ${val} mmHg（偏高），减少盐摄入` : `BP ${val} mmHg (high), reduce salt intake`;
      if (val > 130 && val <= 140) return isZh ? `血压 ${val} mmHg（过高），需要监测` : `BP ${val} mmHg (very high), needs monitoring`;
      if (val > 140) return isZh ? `血压 ${val} mmHg（危险），请就医` : `BP ${val} mmHg (dangerous), see a doctor`;
      if (val < 90 && val >= 80) return isZh ? `血压 ${val} mmHg（偏低），保持水分` : `BP ${val} mmHg (low), stay hydrated`;
      return isZh ? `血压 ${val} mmHg（过低），有头晕风险` : `BP ${val} mmHg (too low), risk of dizziness`;
    } 
  },
  { 
    key: 'blood_sugar', label: isZh ? '血糖' : 'Blood Sugar', unit: 'mmol/L', 
    getValue: (r: HealthRecord) => r.blood_sugar, 
    getBenchmark: () => 5.0, 
    checkNormal: (val: number) => val >= 3.9 && val <= 5.6, 
    getDeduction: (val: number) => {
      if (val >= 3.9 && val <= 5.6) return 0;
      if (val > 5.6 && val <= 6.1) return 5;
      if (val > 6.1 && val <= 7.0) return 10;
      if (val > 7.0) return 15;
      if (val < 3.9 && val >= 3.0) return 8;
      return 15;
    }, 
    getSuggestion: (val: number, isZh: boolean) => {
      if (val >= 3.9 && val <= 5.6) return isZh ? '正常范围 (3.9-5.6 mmol/L)' : 'Normal range (3.9-5.6 mmol/L)';
      if (val > 5.6 && val <= 6.1) return isZh ? `血糖 ${val}（略高），注意饮食` : `Blood sugar ${val} (slightly high), watch diet`;
      if (val > 6.1 && val <= 7.0) return isZh ? `血糖 ${val}（高），糖尿病前期` : `Blood sugar ${val} (high), pre-diabetic`;
      if (val > 7.0) return isZh ? `血糖 ${val}（危险），请就医` : `Blood sugar ${val} (dangerous), see a doctor`;
      if (val < 3.9 && val >= 3.0) return isZh ? `血糖 ${val}（偏低），吃点东西` : `Blood sugar ${val} (low), eat something`;
      return isZh ? `血糖 ${val}（严重偏低），立即就医` : `Blood sugar ${val} (critically low), seek immediate care`;
    } 
  },
  { 
    key: 'sleep_level', label: isZh ? '睡眠评分' : 'Sleep Score', unit: isZh ? '分' : 'pts', 
    getValue: (r: HealthRecord) => r.sleep_level, 
    getBenchmark: () => 80, 
    checkNormal: (val: number) => val >= 85, 
    getDeduction: (val: number) => {
      if (val >= 85) return 0;
      if (val >= 75) return 3;
      if (val >= 65) return 7;
      if (val >= 50) return 12;
      return 15;
    }, 
    getSuggestion: (val: number, isZh: boolean) => {
      if (val >= 85) return isZh ? '睡眠质量优秀 (≥85分)，保持规律作息' : 'Excellent sleep quality (≥85), maintain routine';
      if (val >= 75) return isZh ? `睡眠评分 ${val}（良好），可轻微改善` : `Sleep score ${val} (good), slight improvement possible`;
      if (val >= 65) return isZh ? `睡眠评分 ${val}（一般），改善睡眠习惯` : `Sleep score ${val} (fair), improve sleep routine`;
      if (val >= 50) return isZh ? `睡眠评分 ${val}（差），需要关注` : `Sleep score ${val} (poor), needs attention`;
      return isZh ? `睡眠评分 ${val}（极差），请咨询医生` : `Sleep score ${val} (very poor), consult a doctor`;
    } 
  },
  { 
    key: 'steps', label: isZh ? '步数' : 'Steps', unit: isZh ? '步' : 'steps', 
    getValue: (r: HealthRecord) => r.steps, 
    getBenchmark: () => 8000, 
    checkNormal: (val: number) => val >= 10000, 
    getDeduction: (val: number) => {
      if (val >= 12000) return 0;
      if (val >= 10000) return 2;
      if (val >= 8000) return 5;
      if (val >= 6000) return 9;
      if (val >= 4000) return 12;
      return 15;
    }, 
    getSuggestion: (val: number, isZh: boolean) => {
      if (val >= 12000) return isZh ? '运动量优秀 (≥12000步)，继续保持！' : 'Excellent activity level (≥12000 steps), keep it up!';
      if (val >= 10000) return isZh ? `步数 ${val}（充足），很好` : `Steps ${val} (great), good activity level`;
      if (val >= 8000) return isZh ? `步数 ${val}（达标），达到最低建议` : `Steps ${val} (good), meets minimum recommendation`;
      if (val >= 6000) return isZh ? `步数 ${val}（一般），增加活动量` : `Steps ${val} (average), increase activity`;
      if (val >= 4000) return isZh ? `步数 ${val}（不足），需要更多运动` : `Steps ${val} (low), need more exercise`;
      return isZh ? `步数 ${val}（严重不足），立即开始运动` : `Steps ${val} (very low), start exercising now`;
    } 
  },
  { 
    key: 'body_fat', label: isZh ? '体脂率' : 'Body Fat', unit: '%', 
    getValue: (r: HealthRecord) => r.body_fat, 
    getBenchmark: (u: User | null) => u?.gender === 'male' ? 15 : 25, 
    checkNormal: (val: number, u: User | null) => {
      const isMale = u?.gender === 'male';
      return isMale ? (val >= 10 && val <= 20) : (val >= 18 && val <= 28);
    }, 
    getDeduction: (val: number, u: User | null) => {
      const isMale = u?.gender === 'male';
      if ((isMale && val >= 10 && val <= 20) || (!isMale && val >= 18 && val <= 28)) return 0;
      if ((isMale && val > 20 && val <= 25) || (!isMale && val > 28 && val <= 32)) return 7;
      if ((isMale && val > 25 && val <= 30) || (!isMale && val > 32 && val <= 35)) return 12;
      return 15;
    }, 
    getSuggestion: (val: number, u: User | null, isZh: boolean) => {
      const isMale = u?.gender === 'male';
      if ((isMale && val >= 10 && val <= 20) || (!isMale && val >= 18 && val <= 28)) return isZh ? '体脂率标准，身材健康' : 'Standard range, healthy physique';
      if ((isMale && val > 20 && val <= 25) || (!isMale && val > 28 && val <= 32)) return isZh ? `体脂率 ${val}%（偏高），建议增加有氧运动` : `Body fat ${val}% (high), consider more cardio`;
      if ((isMale && val > 25 && val <= 30) || (!isMale && val > 32 && val <= 35)) return isZh ? `体脂率 ${val}%（过高），需要加强锻炼` : `Body fat ${val}% (too high), need more exercise`;
      return isZh ? `体脂率 ${val}%（严重超标），请咨询健身教练` : `Body fat ${val}% (severely high), consult a trainer`;
    } 
  },
  { 
    key: 'muscle_mass', label: isZh ? '肌肉量' : 'Muscle Mass', unit: 'kg', 
    getValue: (r: HealthRecord) => r.muscle_mass, 
    getBenchmark: (u: User | null) => u?.gender === 'male' ? 40 : 30, 
    checkNormal: (val: number, u: User | null) => {
      const isMale = u?.gender === 'male';
      return isMale ? val >= 40 : val >= 30;
    }, 
    getDeduction: (val: number, u: User | null) => {
      const isMale = u?.gender === 'male';
      if ((isMale && val >= 40) || (!isMale && val >= 30)) return 0;
      if ((isMale && val >= 35) || (!isMale && val >= 25)) return 5;
      if ((isMale && val >= 30) || (!isMale && val >= 20)) return 10;
      return 15;
    }, 
    getSuggestion: (val: number, u: User | null, isZh: boolean) => {
      const isMale = u?.gender === 'male';
      if ((isMale && val >= 40) || (!isMale && val >= 30)) return isZh ? '肌肉量充足，基础代谢良好' : 'Good muscle mass, healthy metabolism';
      if ((isMale && val >= 35) || (!isMale && val >= 25)) return isZh ? `肌肉量 ${val}kg（正常），可增加力量训练` : `Muscle mass ${val}kg (normal), consider strength training`;
      if ((isMale && val >= 30) || (!isMale && val >= 20)) return isZh ? `肌肉量 ${val}kg（偏低），建议力量训练` : `Muscle mass ${val}kg (low), consider strength training`;
      return isZh ? `肌肉量 ${val}kg（严重不足），需要力量训练` : `Muscle mass ${val}kg (very low), need strength training`;
    } 
  },
  { 
    key: 'calories', label: isZh ? '卡路里' : 'Calories', unit: 'kcal', 
    getValue: (r: HealthRecord) => r.calories, 
    getBenchmark: () => 2000, 
    checkNormal: (val: number) => val >= 1800 && val <= 2200, 
    getDeduction: (val: number) => {
      if (val >= 1800 && val <= 2200) return 0;
      if (val >= 1500 && val < 1800) return 7;
      if (val >= 1000 && val < 1500) return 12;
      if (val < 1000) return 15;
      if (val > 2200 && val <= 2500) return 5;
      if (val > 2500 && val <= 3000) return 10;
      return 15;
    }, 
    getSuggestion: (val: number, isZh: boolean) => {
      if (val >= 1800 && val <= 2200) return isZh ? `卡路里摄入 ${val} kcal，饮食良好` : `Calorie intake ${val} kcal, good diet`;
      if (val >= 1500 && val < 1800) return isZh ? `卡路里摄入 ${val} kcal（偏低），需要更多营养` : `Calories ${val} (low), need more nutrition`;
      if (val >= 1000 && val < 1500) return isZh ? `卡路里摄入 ${val} kcal（过低），严重缺乏能量` : `Calories ${val} (very low), significantly under-eating`;
      if (val < 1000) return isZh ? `卡路里摄入 ${val} kcal（危险过低），请就医` : `Calories ${val} (dangerously low), seek medical advice`;
      if (val > 2200 && val <= 2500) return isZh ? `卡路里摄入 ${val} kcal（偏高），注意控制` : `Calories ${val} (high), watch your intake`;
      if (val > 2500 && val <= 3000) return isZh ? `卡路里摄入 ${val} kcal（过高），减少摄入` : `Calories ${val} (very high), reduce intake`;
      return isZh ? `卡路里摄入 ${val} kcal（危险过高），请咨询医生` : `Calories ${val} (dangerously high), consult a doctor`;
    } 
  },
  { 
    key: 'body_water', label: isZh ? '体水分' : 'Body Water', unit: '%', 
    getValue: (r: HealthRecord) => r.body_water, 
    getBenchmark: (u: User | null) => u?.gender === 'male' ? 60 : 55, 
    checkNormal: (val: number, u: User | null) => {
      const ideal = u?.gender === 'male' ? 60 : 55;
      return Math.abs(val - ideal) / ideal <= 0.05;
    }, 
    getDeduction: (val: number, u: User | null) => {
      const ideal = u?.gender === 'male' ? 60 : 55;
      const diff = Math.abs(val - ideal) / ideal;
      if (diff <= 0.05) return 0;
      if (diff <= 0.1) return 5;
      if (diff <= 0.2) return 10;
      return 15;
    }, 
    getSuggestion: (val: number, u: User | null, isZh: boolean) => {
      const ideal = u?.gender === 'male' ? 60 : 55;
      const diff = Math.abs(val - ideal) / ideal;
      if (diff <= 0.05) return isZh ? `体水分 ${val}%，水分充足` : `Body water ${val}%, well hydrated`;
      if (diff <= 0.1) return isZh ? `体水分 ${val}%（略低），保持水分` : `Body water ${val}% (slightly off), stay hydrated`;
      if (diff <= 0.2) return isZh ? `体水分 ${val}%（显著偏低），多喝水` : `Body water ${val}% (significantly off), drink more water`;
      return isZh ? `体水分 ${val}%（严重异常），请咨询医生` : `Body water ${val}% (severely abnormal), consult a doctor`;
    } 
  },
];

export function HealthAnalysis({ user, healthRecords }: HealthAnalysisProps) {
  const { t, language, formatDate, formatShortDate } = useLanguage();
  const isZh = language === 'zh';
  const metrics = getMetrics(isZh);
  
  const [selectedMetric, setSelectedMetric] = useState<string>('bmi');
  const [showMetricSelector, setShowMetricSelector] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [scoreAnimation, setScoreAnimation] = useState(false);
  const [healthScore, setHealthScore] = useState<{ score: number; grade: string; gradeColor: string; details: any[]; normalCount: number; abnormalCount: number } | null>(null);

  const getLatestValue = (metric: any) => {
    if (healthRecords.length === 0) return null;
    const latest = healthRecords[0];
    return metric.getValue(latest);
  };

  const getLatestBenchmark = (metric: any) => {
    return metric.getBenchmark(user);
  };

  const getMetricByKey = (key: string) => metrics.find(m => m.key === key);

  const chartData = useMemo(() => {
    const metric = getMetricByKey(selectedMetric);
    if (!metric) return null;
    const userValue = getLatestValue(metric);
    const benchmark = getLatestBenchmark(metric);
    if (userValue === null || userValue === undefined) return null;
    return [
      { name: isZh ? '你的平均值' : 'You', value: userValue, color: '#6366f1' },
      { name: isZh ? '健康基准' : 'Benchmark', value: benchmark, color: '#94a3b8' },
    ];
  }, [selectedMetric, healthRecords, isZh]);

  const calculateHealthScore = () => {
    setIsCalculating(true);
    setShowScore(false);
    
    setTimeout(() => {
      let totalDeduction = 0;
      const details: any[] = [];
      
      for (const metric of metrics) {
        const value = getLatestValue(metric);
        if (value === null || value === undefined) continue;
        
        const isNormal = metric.checkNormal(value, user);
        const deduction = isNormal ? 0 : metric.getDeduction(value, user);
        const suggestion = metric.getSuggestion(value, user, isZh);
        
        totalDeduction += deduction;
        details.push({
          label: metric.label,
          value: value,
          benchmark: metric.getBenchmark(user),
          isNormal,
          deduction,
          suggestion,
        });
      }
      
      const finalScore = Math.max(0, 100 - totalDeduction);
      const normalCount = details.filter(d => d.isNormal).length;
      const abnormalCount = details.filter(d => !d.isNormal).length;
      
      let grade = '';
      let gradeColor = '';
      if (finalScore >= 90) { grade = isZh ? '优秀' : 'Excellent'; gradeColor = 'text-green-600'; }
      else if (finalScore >= 75) { grade = isZh ? '良好' : 'Good'; gradeColor = 'text-blue-600'; }
      else if (finalScore >= 60) { grade = isZh ? '一般' : 'Fair'; gradeColor = 'text-yellow-600'; }
      else { grade = isZh ? '需要关注' : 'Needs Attention'; gradeColor = 'text-red-600'; }
      
      setHealthScore({ score: finalScore, grade, gradeColor, details, normalCount, abnormalCount });
      setShowScore(true);
      setScoreAnimation(true);
      setTimeout(() => setScoreAnimation(false), 1000);
      setIsCalculating(false);
    }, 800);
  };

  const ageGroup = user ? `${Math.floor(user.age / 10) * 10}-${Math.floor(user.age / 10) * 10 + 9}` : '30-39';
  const genderText = isZh ? (user?.gender === 'male' ? '男性' : '女性') : (user?.gender === 'male' ? 'Male' : 'Female');

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-gray-800 dark:text-white text-2xl font-bold mb-2">{t('healthAnalysis')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('comparisonBenchmark')}</p>
      </header>

      <div className="space-y-6">
        {healthRecords.length > 0 ? (
          <>
            {/* Overview Card */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-white text-lg font-semibold mb-2">{t('analysisPeriod')}</h2>
                  <p className="text-indigo-100">{t('basedOnData')} {healthRecords.length} {t('daysOfData')}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl"><BarChart3 size={24} /></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-sm text-indigo-100">{t('firstRecord')}</p>
                  <p className="text-lg mt-1">{formatShortDate(healthRecords[healthRecords.length - 1].date)}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-sm text-indigo-100">{t('latestRecord')}</p>
                  <p className="text-lg mt-1">{formatShortDate(healthRecords[0].date)}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-sm text-indigo-100">{t('totalDays')}</p>
                  <p className="text-lg mt-1">{healthRecords.length} {t('days')}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-sm text-indigo-100">{t('availableMetrics')}</p>
                  <p className="text-lg mt-1">{metrics.filter(m => getLatestValue(m) !== null).length}</p>
                </div>
              </div>
            </div>

            {/* User Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-indigo-600" size={24} />
                <div>
                  <h2 className="text-gray-800 dark:text-white font-semibold">{t('comparisonBenchmark')}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('age')} {ageGroup} • {genderText} • {t('basedOnMedicalStandards')}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{t('selectMetricToCompare')}</p>
            </div>

            {/* Metric Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="relative">
                <button
                  onClick={() => setShowMetricSelector(!showMetricSelector)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {getMetricByKey(selectedMetric)?.label.charAt(0) || 'B'}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-800 dark:text-white">{getMetricByKey(selectedMetric)?.label}</p>
                      <p className="text-xs text-gray-500">
                        {isZh ? '正常范围' : 'Normal'}: {getMetricByKey(selectedMetric)?.checkNormal(getLatestValue(getMetricByKey(selectedMetric)!) || 0, user) ? (isZh ? '✓' : '✓') : (isZh ? '⚠' : '⚠')}
                      </p>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${showMetricSelector ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showMetricSelector && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-10 max-h-64 overflow-y-auto">
                    {metrics.map(metric => {
                      const value = getLatestValue(metric);
                      const hasData = value !== null && value !== undefined;
                      return (
                        <button
                          key={metric.key}
                          onClick={() => {
                            setSelectedMetric(metric.key);
                            setShowMetricSelector(false);
                          }}
                          disabled={!hasData}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${!hasData ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-sm font-medium">{metric.label.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white">{metric.label}</p>
                            <p className="text-xs text-gray-500">{metric.unit}</p>
                          </div>
                          {!hasData && <span className="ml-auto text-xs text-gray-400">{isZh ? '无数据' : 'No data'}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Comparison Chart */}
            {chartData && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <div className="text-center mb-6">
                  <h3 className="text-gray-800 dark:text-white font-semibold text-lg">{getMetricByKey(selectedMetric)?.label} {t('comparisonBenchmark')}</h3>
                  <p className="text-sm text-gray-500">{t('yourAverage')} vs {t('healthBenchmark')}</p>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" domain={[0, 'auto']} label={{ value: getMetricByKey(selectedMetric)?.unit || '', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#6b7280' } }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Health Score Assessment Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl p-6 shadow-lg border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl"><Award className="text-white" size={24} /></div>
                  <div>
                    <h2 className="text-gray-800 dark:text-white font-semibold text-lg">{t('healthScoreAssessment')}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('comprehensiveEvaluation')}</p>
                  </div>
                </div>
                <button onClick={calculateHealthScore} disabled={isCalculating} className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2">
                  <Sparkles size={18} />
                  {isCalculating ? (isZh ? '评估中...' : 'Assessing...') : (isZh ? '开始评估' : 'Start Assessment')}
                </button>
              </div>

              <AnimatePresence>
                {isCalculating && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="relative w-32 h-32 mx-auto">
                        <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0"><Heart className="w-full h-full text-pink-500" /></motion.div>
                        <motion.div animate={{ scale: [0, 1.5], opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="absolute inset-0 flex items-center justify-center"><Sparkles className="text-yellow-400" size={40} /></motion.div>
                      </div>
                      <p className="mt-4 text-gray-600 dark:text-gray-400">{isZh ? '正在分析您的健康数据...' : 'Analyzing your health data...'}</p>
                      <p className="text-sm text-gray-500 mt-2">{isZh ? '评估各项指标并计算分数' : 'Reviewing metrics and calculating score'}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {showScore && healthScore && !isCalculating && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="mt-4">
                  <div className="text-center mb-6">
                    <div className={`relative inline-block ${scoreAnimation ? 'animate-pulse' : ''}`}>
                      <div className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg">
                        <span className="text-5xl font-bold text-white">{healthScore.score}</span>
                      </div>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }} className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2">
                        <Award size={20} className="text-white" />
                      </motion.div>
                    </div>
                    <p className={`mt-3 font-bold text-xl ${healthScore.gradeColor}`}>{healthScore.grade}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {healthScore.normalCount} {isZh ? '项健康指标' : 'healthy indicators'} • {healthScore.abnormalCount} {isZh ? '项需要关注' : 'need attention'}
                    </p>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">{isZh ? '评分明细' : 'Score Breakdown'}</h3>
                    {healthScore.details.map((detail, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-800 dark:text-white">{detail.label}</span>
                          {detail.isNormal ? (
                            <span className="text-sm font-bold text-green-600 flex items-center gap-1"><CheckCircle size={14} /> {isZh ? '正常' : 'Normal'}</span>
                          ) : (
                            <span className="text-sm font-bold text-red-600">-{detail.deduction} {isZh ? '分' : 'points'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>{isZh ? '您的数值' : 'Your Value'}: {detail.value.toFixed(1)}</span>
                          <span>•</span>
                          <span>{isZh ? '基准值' : 'Benchmark'}: {detail.benchmark.toFixed(1)}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{detail.suggestion}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-8 text-center">
            <Calendar className="text-yellow-600 dark:text-yellow-500 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-semibold text-yellow-800 dark:text-yellow-400 mb-2">{t('noDataRecords')}</h3>
            <p className="text-yellow-600 dark:text-yellow-500">{t('addDataFirst')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

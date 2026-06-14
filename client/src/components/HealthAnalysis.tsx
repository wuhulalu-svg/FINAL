import { User, HealthRecord } from '../App';
import { Users, Calendar, BarChart3, Heart, Award, Sparkles, TrendingUp, TrendingDown, Minus, CheckCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

interface HealthAnalysisProps {
  user: User | null;
  healthRecords: HealthRecord[];
}

// 所有健康指标配置
const ALL_METRICS = [
  { key: 'weight', label: 'Weight', unit: 'kg', benchmark: null, getBenchmark: (user: User) => user ? (22 * Math.pow(user.height / 100, 2)) : 70, normalRange: 'BMI 18.5-24.9', higherIsBetter: false },
  { key: 'bmi', label: 'BMI', unit: '', benchmark: 22, getBenchmark: () => 22, normalRange: '18.5-24.9', higherIsBetter: false },
  { key: 'body_fat', label: 'Body Fat', unit: '%', benchmark: null, getBenchmark: (user: User) => user?.gender === 'male' ? 15 : 25, normalRange: 'Male 10-20% / Female 20-30%', higherIsBetter: false },
  { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', benchmark: null, getBenchmark: (user: User) => user?.gender === 'male' ? 68 : 72, normalRange: '60-100 bpm', higherIsBetter: false },
  { key: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg', benchmark: 120, getBenchmark: () => 120, normalRange: '90-120 mmHg', higherIsBetter: false },
  { key: 'blood_sugar', label: 'Blood Sugar', unit: 'mmol/L', benchmark: 5.0, getBenchmark: () => 5.0, normalRange: '3.9-6.1 mmol/L', higherIsBetter: false },
  { key: 'muscle_mass', label: 'Muscle Mass', unit: 'kg', benchmark: null, getBenchmark: (user: User) => user?.gender === 'male' ? 40 : 30, normalRange: 'Male 35-45kg / Female 25-35kg', higherIsBetter: true },
  { key: 'body_water', label: 'Body Water', unit: '%', benchmark: null, getBenchmark: (user: User) => user?.gender === 'male' ? 60 : 55, normalRange: 'Male 55-65% / Female 50-60%', higherIsBetter: true },
  { key: 'sleep_level', label: 'Sleep Score', unit: 'pts', benchmark: 80, getBenchmark: () => 80, normalRange: '70-100 points', higherIsBetter: true },
  { key: 'steps', label: 'Steps', unit: 'steps', benchmark: 8000, getBenchmark: () => 8000, normalRange: '8000-10000 steps', higherIsBetter: true },
  { key: 'calories', label: 'Calories', unit: 'kcal', benchmark: 2000, getBenchmark: () => 2000, normalRange: '1800-2200 kcal', higherIsBetter: false },
  { key: 'visceral_fat', label: 'Visceral Fat', unit: 'level', benchmark: 10, getBenchmark: () => 10, normalRange: 'Level 1-12', higherIsBetter: false },
  { key: 'basal_metabolic_rate', label: 'BMR', unit: 'kcal', benchmark: null, getBenchmark: (user: User) => user?.gender === 'male' ? 1600 : 1400, normalRange: 'Male 1500-1800 / Female 1200-1500', higherIsBetter: true },
];

// 计算健康评分（扣分机制：从100分开始扣）
const calculateHealthScoreData = (records: HealthRecord[], user: User | null) => {
  if (records.length === 0) return null;
  
  const latestRecord = records[0];
  let totalDeduction = 0;
  const details: { metric: string; value: number; benchmark: number; deduction: number; suggestion: string; isNormal: boolean }[] = [];
  
  for (const metric of ALL_METRICS) {
    let userValue: number | null = null;
    
    if (metric.key === 'blood_pressure' && latestRecord.blood_pressure) {
      const bpParts = latestRecord.blood_pressure.split('/');
      userValue = parseInt(bpParts[0]);
    } else {
      userValue = latestRecord[metric.key as keyof HealthRecord] as number | null;
    }
    
    if (userValue === null || userValue === undefined) continue;
    
    const benchmark = metric.getBenchmark ? metric.getBenchmark(user!) : metric.benchmark || 0;
    let deduction = 0;
    let suggestion = '';
    let isNormal = true;
    
    // ========== BMI 评分 ==========
    if (metric.key === 'bmi') {
      if (userValue >= 18.5 && userValue <= 24.9) {
        deduction = 0;
        suggestion = 'BMI in normal range (18.5-24.9)';
        isNormal = true;
      } else if (userValue > 24.9 && userValue <= 27) {
        deduction = 5;
        suggestion = `BMI ${userValue} (overweight), recommended to control diet and exercise`;
        isNormal = false;
      } else if (userValue > 27 && userValue <= 30) {
        deduction = 10;
        suggestion = `BMI ${userValue} (obese), weight management needed`;
        isNormal = false;
      } else if (userValue > 30) {
        deduction = 15;
        suggestion = `BMI ${userValue} (severely obese), please consult a doctor`;
        isNormal = false;
      } else if (userValue < 18.5 && userValue >= 17) {
        deduction = 5;
        suggestion = `BMI ${userValue} (underweight), increase nutrition intake`;
        isNormal = false;
      } else if (userValue < 17) {
        deduction = 15;
        suggestion = `BMI ${userValue} (severely underweight), please consult a doctor`;
        isNormal = false;
      }
    }
    // ========== 心率评分 ==========
    else if (metric.key === 'heart_rate') {
      if (userValue >= 60 && userValue <= 80) {
        deduction = 0;
        suggestion = 'Heart rate normal (60-80 bpm), good cardiovascular health';
        isNormal = true;
      } else if (userValue > 80 && userValue <= 90) {
        deduction = 5;
        suggestion = `Heart rate ${userValue} bpm (slightly high), rest recommended`;
        isNormal = false;
      } else if (userValue > 90 && userValue <= 100) {
        deduction = 10;
        suggestion = `Heart rate ${userValue} bpm (high), needs attention`;
        isNormal = false;
      } else if (userValue > 100) {
        deduction = 15;
        suggestion = `Heart rate ${userValue} bpm (dangerously high), see a doctor`;
        isNormal = false;
      } else if (userValue < 60 && userValue >= 55) {
        deduction = 5;
        suggestion = `Heart rate ${userValue} bpm (slightly low), acceptable if no symptoms`;
        isNormal = false;
      } else if (userValue < 55 && userValue >= 50) {
        deduction = 10;
        suggestion = `Heart rate ${userValue} bpm (low), consult doctor`;
        isNormal = false;
      } else if (userValue < 50) {
        deduction = 15;
        suggestion = `Heart rate ${userValue} bpm (dangerously low), see a doctor`;
        isNormal = false;
      }
    }
    // ========== 血压评分 ==========
    else if (metric.key === 'blood_pressure') {
      if (userValue >= 90 && userValue <= 120) {
        deduction = 0;
        suggestion = 'Blood pressure normal (90-120 mmHg), good cardiovascular health';
        isNormal = true;
      } else if (userValue > 120 && userValue <= 130) {
        deduction = 5;
        suggestion = `Blood pressure ${userValue} mmHg (high), reduce salt intake`;
        isNormal = false;
      } else if (userValue > 130 && userValue <= 140) {
        deduction = 10;
        suggestion = `Blood pressure ${userValue} mmHg (very high), needs monitoring`;
        isNormal = false;
      } else if (userValue > 140) {
        deduction = 15;
        suggestion = `Blood pressure ${userValue} mmHg (dangerously high), see a doctor`;
        isNormal = false;
      } else if (userValue < 90 && userValue >= 80) {
        deduction = 5;
        suggestion = `Blood pressure ${userValue} mmHg (low), stay hydrated`;
        isNormal = false;
      } else if (userValue < 80) {
        deduction = 10;
        suggestion = `Blood pressure ${userValue} mmHg (too low), risk of dizziness`;
        isNormal = false;
      }
    }
    // ========== 血糖评分 ==========
    else if (metric.key === 'blood_sugar') {
      if (userValue >= 3.9 && userValue <= 5.6) {
        deduction = 0;
        suggestion = 'Blood sugar normal (3.9-5.6 mmol/L), good metabolism';
        isNormal = true;
      } else if (userValue > 5.6 && userValue <= 6.1) {
        deduction = 5;
        suggestion = `Blood sugar ${userValue} mmol/L (slightly high), watch diet`;
        isNormal = false;
      } else if (userValue > 6.1 && userValue <= 7.0) {
        deduction = 10;
        suggestion = `Blood sugar ${userValue} mmol/L (high), pre-diabetic`;
        isNormal = false;
      } else if (userValue > 7.0) {
        deduction = 15;
        suggestion = `Blood sugar ${userValue} mmol/L (dangerously high), see a doctor`;
        isNormal = false;
      } else if (userValue < 3.9 && userValue >= 3.0) {
        deduction = 8;
        suggestion = `Blood sugar ${userValue} mmol/L (low), eat something`;
        isNormal = false;
      } else if (userValue < 3.0) {
        deduction = 15;
        suggestion = `Blood sugar ${userValue} mmol/L (critically low), seek immediate care`;
        isNormal = false;
      }
    }
    // ========== 睡眠评分 ==========
    else if (metric.key === 'sleep_level') {
      if (userValue >= 85) {
        deduction = 0;
        suggestion = 'Excellent sleep quality (≥85), maintain routine';
        isNormal = true;
      } else if (userValue >= 75) {
        deduction = 3;
        suggestion = `Sleep score ${userValue} (good), slight improvement possible`;
        isNormal = false;
      } else if (userValue >= 65) {
        deduction = 7;
        suggestion = `Sleep score ${userValue} (fair), improve sleep routine`;
        isNormal = false;
      } else if (userValue >= 50) {
        deduction = 12;
        suggestion = `Sleep score ${userValue} (poor), needs attention`;
        isNormal = false;
      } else {
        deduction = 15;
        suggestion = `Sleep score ${userValue} (very poor), consult a doctor`;
        isNormal = false;
      }
    }
    // ========== 步数评分 ==========
    else if (metric.key === 'steps') {
      if (userValue >= 12000) {
        deduction = 0;
        suggestion = 'Excellent activity level (≥12000 steps), keep it up!';
        isNormal = true;
      } else if (userValue >= 10000) {
        deduction = 2;
        suggestion = `Great activity level (${userValue} steps), good!`;
        isNormal = false;
      } else if (userValue >= 8000) {
        deduction = 5;
        suggestion = `Good activity level (${userValue} steps), meets minimum`;
        isNormal = false;
      } else if (userValue >= 6000) {
        deduction = 9;
        suggestion = `Average activity (${userValue} steps), increase activity`;
        isNormal = false;
      } else if (userValue >= 4000) {
        deduction = 12;
        suggestion = `Low activity (${userValue} steps), need more exercise`;
        isNormal = false;
      } else {
        deduction = 15;
        suggestion = `Very low activity (${userValue} steps), start exercising now`;
        isNormal = false;
      }
    }
    // ========== 体脂率评分 ==========
    else if (metric.key === 'body_fat') {
      const isMale = user?.gender === 'male';
      if ((isMale && userValue >= 10 && userValue <= 20) || (!isMale && userValue >= 18 && userValue <= 28)) {
        deduction = 0;
        suggestion = 'Body fat percentage is standard, healthy physique';
        isNormal = true;
      } else if ((isMale && userValue > 20 && userValue <= 25) || (!isMale && userValue > 28 && userValue <= 32)) {
        deduction = 7;
        suggestion = `Body fat ${userValue}% (high), consider more cardio`;
        isNormal = false;
      } else if ((isMale && userValue > 25 && userValue <= 30) || (!isMale && userValue > 32 && userValue <= 35)) {
        deduction = 12;
        suggestion = `Body fat ${userValue}% (too high), need more exercise`;
        isNormal = false;
      } else {
        deduction = 15;
        suggestion = `Body fat ${userValue}% (severely high), consult a fitness trainer`;
        isNormal = false;
      }
    }
    // ========== 肌肉量评分 ==========
    else if (metric.key === 'muscle_mass') {
      const isMale = user?.gender === 'male';
      if ((isMale && userValue >= 40) || (!isMale && userValue >= 30)) {
        deduction = 0;
        suggestion = 'Good muscle mass, healthy metabolism';
        isNormal = true;
      } else if ((isMale && userValue >= 35 && userValue < 40) || (!isMale && userValue >= 25 && userValue < 30)) {
        deduction = 5;
        suggestion = `Muscle mass ${userValue}kg (normal), consider strength training`;
        isNormal = false;
      } else if ((isMale && userValue >= 30 && userValue < 35) || (!isMale && userValue >= 20 && userValue < 25)) {
        deduction = 10;
        suggestion = `Muscle mass ${userValue}kg (low), consider strength training`;
        isNormal = false;
      } else {
        deduction = 15;
        suggestion = `Muscle mass ${userValue}kg (very low), need strength training`;
        isNormal = false;
      }
    }
    // ========== 体水分评分 ==========
    else if (metric.key === 'body_water') {
      const isMale = user?.gender === 'male';
      const idealWater = isMale ? 60 : 55;
      const percentDiff = Math.abs(userValue - idealWater) / idealWater;
      if (percentDiff <= 0.05) {
        deduction = 0;
        suggestion = `Body water ${userValue}%, well hydrated`;
        isNormal = true;
      } else if (percentDiff <= 0.1) {
        deduction = 5;
        suggestion = `Body water ${userValue}% (slightly off), stay hydrated`;
        isNormal = false;
      } else if (percentDiff <= 0.2) {
        deduction = 10;
        suggestion = `Body water ${userValue}% (significantly off), drink more water`;
        isNormal = false;
      } else {
        deduction = 15;
        suggestion = `Body water ${userValue}% (severely abnormal), consult a doctor`;
        isNormal = false;
      }
    }
    // ========== 卡路里评分 ==========
    else if (metric.key === 'calories') {
      if (userValue >= 1800 && userValue <= 2200) {
        deduction = 0;
        suggestion = `Calorie intake ${userValue} kcal, good diet`;
        isNormal = true;
      } else if (userValue >= 1500 && userValue < 1800) {
        deduction = 7;
        suggestion = `Calorie intake ${userValue} kcal (low), need more nutrition`;
        isNormal = false;
      } else if (userValue >= 1000 && userValue < 1500) {
        deduction = 12;
        suggestion = `Calorie intake ${userValue} kcal (very low), significantly under-eating`;
        isNormal = false;
      } else if (userValue < 1000) {
        deduction = 15;
        suggestion = `Calorie intake ${userValue} kcal (dangerously low), seek medical advice`;
        isNormal = false;
      } else if (userValue > 2200 && userValue <= 2500) {
        deduction = 5;
        suggestion = `Calorie intake ${userValue} kcal (high), watch your intake`;
        isNormal = false;
      } else if (userValue > 2500 && userValue <= 3000) {
        deduction = 10;
        suggestion = `Calorie intake ${userValue} kcal (very high), reduce intake`;
        isNormal = false;
      } else if (userValue > 3000) {
        deduction = 15;
        suggestion = `Calorie intake ${userValue} kcal (dangerously high), consult a doctor`;
        isNormal = false;
      }
    }
    // ========== 体重评分（与理想体重对比） ==========
    else if (metric.key === 'weight') {
      const idealWeight = user ? 22 * Math.pow(user.height / 100, 2) : 70;
      const percentDiff = Math.abs(userValue - idealWeight) / idealWeight;
      if (percentDiff <= 0.05) {
        deduction = 0;
        suggestion = `Weight ${userValue} kg, ideal weight (±${(percentDiff * 100).toFixed(0)}%)`;
        isNormal = true;
      } else if (percentDiff <= 0.1) {
        deduction = 5;
        suggestion = `Weight ${userValue} kg (slightly off), pay attention`;
        isNormal = false;
      } else if (percentDiff <= 0.2) {
        deduction = 10;
        suggestion = `Weight ${userValue} kg (significantly off), consider management`;
        isNormal = false;
      } else {
        deduction = 15;
        suggestion = `Weight ${userValue} kg (severely off), needs attention`;
        isNormal = false;
      }
    }
    // ========== 其他指标通用评分 ==========
    else {
      const percentDiff = Math.abs(userValue - benchmark) / benchmark;
      if (percentDiff <= 0.1) {
        deduction = 0;
        suggestion = `${metric.label} is normal`;
        isNormal = true;
      } else if (percentDiff <= 0.2) {
        deduction = 8;
        suggestion = `${metric.label} ${userValue} (slightly off), pay attention`;
        isNormal = false;
      } else {
        deduction = 15;
        suggestion = `${metric.label} ${userValue} (abnormal), needs attention`;
        isNormal = false;
      }
    }
    
    totalDeduction += deduction;
    details.push({
      metric: metric.label,
      value: userValue,
      benchmark,
      deduction,
      suggestion,
      isNormal,
    });
  }
  
  // 最终得分 = 100 - 总扣分，最低不低于0
  const finalScore = Math.max(0, 100 - totalDeduction);
  
  let grade = '';
  let gradeColor = '';
  if (finalScore >= 90) { grade = 'Excellent'; gradeColor = 'text-green-600'; }
  else if (finalScore >= 75) { grade = 'Good'; gradeColor = 'text-blue-600'; }
  else if (finalScore >= 60) { grade = 'Fair'; gradeColor = 'text-yellow-600'; }
  else { grade = 'Needs Attention'; gradeColor = 'text-red-600'; }
  
  return { 
    score: finalScore, 
    grade, 
    gradeColor, 
    details,
    totalDeduction
  };
};

export function HealthAnalysis({ user, healthRecords }: HealthAnalysisProps) {
  const { t, language, formatDate, formatShortDate } = useLanguage();
  const isZh = language === 'zh';
  const [selectedMetric, setSelectedMetric] = useState<string>('bmi');
  const [showMetricSelector, setShowMetricSelector] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [scoreAnimation, setScoreAnimation] = useState(false);
  const [healthScore, setHealthScore] = useState<{ score: number; grade: string; gradeColor: string; details: { metric: string; value: number; benchmark: number; deduction: number; suggestion: string; isNormal: boolean }[]; totalDeduction: number } | null>(null);

  const currentMetric = ALL_METRICS.find(m => m.key === selectedMetric) || ALL_METRICS[0];
  const currentMetricLabel = currentMetric.label;
  const currentNormalRange = currentMetric.normalRange;
  
  const getBenchmarkValue = (metric: typeof currentMetric): number => {
    if (metric.getBenchmark) {
      return metric.getBenchmark(user!);
    }
    return metric.benchmark || 0;
  };

  const getUserAverage = (metricKey: string): number | null => {
    const values = healthRecords
      .map(r => {
        let val = r[metricKey as keyof HealthRecord];
        if (metricKey === 'blood_pressure' && typeof val === 'string') {
          val = parseInt(val.split('/')[0]);
        }
        return typeof val === 'number' ? val : null;
      })
      .filter(v => v !== null) as number[];
    
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const chartData = useMemo(() => {
    const userValue = getUserAverage(selectedMetric);
    const benchmarkValue = getBenchmarkValue(currentMetric);
    
    if (userValue === null) return null;
    
    return [
      { name: t('yourAverage'), value: userValue, color: '#6366f1' },
      { name: t('healthBenchmark'), value: benchmarkValue, color: '#94a3b8' },
    ];
  }, [selectedMetric, healthRecords, user, currentMetric, t]);

  const comparison = useMemo(() => {
    const userValue = getUserAverage(selectedMetric);
    const benchmarkValue = getBenchmarkValue(currentMetric);
    
    if (userValue === null) return null;
    
    const diff = userValue - benchmarkValue;
    const percentDiff = (diff / benchmarkValue) * 100;
    const isHigher = diff > 0;
    const isBetter = currentMetric.higherIsBetter ? (isHigher ? diff > 0 : diff < 0) : (isHigher ? diff < 0 : diff > 0);
    
    let statusText = '';
    if (Math.abs(percentDiff) < 5) statusText = t('normal');
    else if (isBetter) statusText = t('aboveBenchmark');
    else statusText = t('belowBenchmark');
    
    let statusColor = '';
    if (Math.abs(percentDiff) < 5) statusColor = 'text-green-600';
    else if (isBetter) statusColor = 'text-green-600';
    else statusColor = 'text-red-600';
    
    return {
      diff: Math.abs(diff).toFixed(1),
      percentDiff: Math.abs(percentDiff).toFixed(1),
      isHigher,
      isBetter,
      statusText,
      statusColor,
    };
  }, [selectedMetric, healthRecords, user, currentMetric, t]);

  const calculateHealthScore = () => {
    setIsCalculating(true);
    setShowScore(false);
    
    setTimeout(() => {
      const result = calculateHealthScoreData(healthRecords, user);
      setHealthScore(result);
      setShowScore(true);
      setScoreAnimation(true);
      setTimeout(() => setScoreAnimation(false), 1000);
      setIsCalculating(false);
    }, 800);
  };

  const ageGroup = user ? `${Math.floor(user.age / 10) * 10}-${Math.floor(user.age / 10) * 10 + 9}` : '30-39';
  const genderText = user?.gender === 'male' ? 'Male' : 'Female';

  // 统计正常和不正常的指标数量
  const normalCount = healthScore?.details.filter(d => d.isNormal).length || 0;
  const abnormalCount = healthScore?.details.filter(d => !d.isNormal).length || 0;

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-gray-800 dark:text-white text-2xl font-bold mb-2">{t('healthAnalysis')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('comparisonBenchmark')}</p>
      </header>

      <div className="space-y-6">
        {healthRecords.length > 0 ? (
          <>
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
                  <p className="text-lg mt-1">{ALL_METRICS.filter(m => getUserAverage(m.key) !== null).length}</p>
                </div>
              </div>
            </div>

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

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="relative">
                <button
                  onClick={() => setShowMetricSelector(!showMetricSelector)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {currentMetricLabel.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-800 dark:text-white">{currentMetricLabel}</p>
                      <p className="text-xs text-gray-500">{t('normalRange')}: {currentNormalRange}</p>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${showMetricSelector ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showMetricSelector && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-10 max-h-64 overflow-y-auto">
                    {ALL_METRICS.map(metric => {
                      const hasData = getUserAverage(metric.key) !== null;
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
                          {!hasData && <span className="ml-auto text-xs text-gray-400">{t('noData')}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {chartData && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <div className="text-center mb-6">
                  <h3 className="text-gray-800 dark:text-white font-semibold text-lg">{currentMetricLabel} {t('comparisonBenchmark')}</h3>
                  <p className="text-sm text-gray-500">{t('yourAverage')} vs {t('healthBenchmark')}</p>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" domain={[0, 'auto']} label={{ value: currentMetric.unit, angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#6b7280' } }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => [`${value} ${currentMetric.unit}`, '']} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {comparison && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div><p className="text-xs text-gray-500">{t('yourAverage')}</p><p className="text-xl font-bold text-indigo-600">{chartData[0].value.toFixed(1)} {currentMetric.unit}</p></div>
                      <div><p className="text-xs text-gray-500">{t('healthBenchmark')}</p><p className="text-xl font-bold text-gray-600">{chartData[1].value.toFixed(1)} {currentMetric.unit}</p></div>
                      <div><p className="text-xs text-gray-500">{t('difference')}</p><p className={`text-xl font-bold ${comparison.statusColor}`}>{comparison.isHigher ? '+' : '-'}{comparison.diff} {currentMetric.unit}<span className="text-sm ml-1">({comparison.percentDiff}%)</span></p></div>
                    </div>
                    <div className="mt-3 text-center"><span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${comparison.statusColor} bg-opacity-10 bg-gray-100`}>{comparison.statusText === 'normal' && <Minus size={14} />}{comparison.statusText === 'aboveBenchmark' && <TrendingUp size={14} />}{comparison.statusText === 'belowBenchmark' && <TrendingDown size={14} />}{comparison.statusText}</span></div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl p-6 shadow-lg border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl"><Award className="text-white" size={24} /></div>
                  <div><h2 className="text-gray-800 dark:text-white font-semibold text-lg">{t('healthScoreAssessment')}</h2><p className="text-sm text-gray-600 dark:text-gray-400">{t('comprehensiveEvaluation')}</p></div>
                </div>
                <button onClick={calculateHealthScore} disabled={isCalculating} className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"><Sparkles size={18} />{isCalculating ? t('assessing') : t('startAssessment')}</button>
              </div>

              <AnimatePresence>
                {isCalculating && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="relative w-32 h-32 mx-auto">
                        <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0"><Heart className="w-full h-full text-pink-500" /></motion.div>
                        <motion.div animate={{ scale: [0, 1.5], opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="absolute inset-0 flex items-center justify-center"><Sparkles className="text-yellow-400" size={40} /></motion.div>
                      </div>
                      <p className="mt-4 text-gray-600 dark:text-gray-400">{t('analyzingData')}</p>
                      <p className="text-sm text-gray-500 mt-2">{t('collectingCalculatingSuggesting')}</p>
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
                      {normalCount} healthy indicators • {abnormalCount} need attention
                    </p>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Health Assessment Details</h3>
                    {healthScore.details.map((detail, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-800 dark:text-white">{detail.metric}</span>
                          {detail.isNormal ? (
                            <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                              <CheckCircle size={14} /> Normal
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-red-600">
                              -{detail.deduction} points
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>Your Value: {detail.value.toFixed(1)}</span>
                          <span>•</span>
                          <span>Benchmark: {detail.benchmark.toFixed(1)}</span>
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

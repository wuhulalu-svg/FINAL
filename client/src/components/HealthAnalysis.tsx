import { User, HealthRecord } from '../App';
import { Users, Calendar, BarChart3, Heart, Award, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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
  { key: 'weight', label: { zh: '体重', en: 'Weight' }, unit: 'kg', benchmark: null, getBenchmark: (user: User) => user ? (22 * Math.pow(user.height / 100, 2)) : 70, normalRange: { zh: 'BMI 18.5-24.9', en: 'BMI 18.5-24.9' }, higherIsBetter: false, color: '#3b82f6' },
  { key: 'bmi', label: { zh: 'BMI', en: 'BMI' }, unit: '', benchmark: 22, getBenchmark: () => 22, normalRange: { zh: '18.5-24.9', en: '18.5-24.9' }, higherIsBetter: false, color: '#8b5cf6' },
  { key: 'body_fat', label: { zh: '体脂率', en: 'Body Fat' }, unit: '%', benchmark: null, getBenchmark: (user: User) => user?.gender === 'male' ? 15 : 25, normalRange: { zh: '男10-20% / 女20-30%', en: 'Male 10-20% / Female 20-30%' }, higherIsBetter: false, color: '#f59e0b' },
  { key: 'heart_rate', label: { zh: '心率', en: 'Heart Rate' }, unit: 'bpm', benchmark: null, getBenchmark: (user: User) => user?.gender === 'male' ? 68 : 72, normalRange: { zh: '60-100 bpm', en: '60-100 bpm' }, higherIsBetter: false, color: '#ef4444' },
  { key: 'blood_pressure', label: { zh: '血压', en: 'Blood Pressure' }, unit: 'mmHg', benchmark: 120, getBenchmark: () => 120, normalRange: { zh: '90-120 mmHg', en: '90-120 mmHg' }, higherIsBetter: false, color: '#ec4899' },
  { key: 'blood_sugar', label: { zh: '血糖', en: 'Blood Sugar' }, unit: 'mmol/L', benchmark: 5.0, getBenchmark: () => 5.0, normalRange: { zh: '3.9-6.1 mmol/L', en: '3.9-6.1 mmol/L' }, higherIsBetter: false, color: '#10b981' },
  { key: 'muscle_mass', label: { zh: '肌肉量', en: 'Muscle Mass' }, unit: 'kg', benchmark: null, getBenchmark: (user: User) => user?.gender === 'male' ? 40 : 30, normalRange: { zh: '男35-45kg / 女25-35kg', en: 'Male 35-45kg / Female 25-35kg' }, higherIsBetter: true, color: '#6366f1' },
  { key: 'body_water', label: { zh: '体水分', en: 'Body Water' }, unit: '%', benchmark: null, getBenchmark: (user: User) => user?.gender === 'male' ? 60 : 55, normalRange: { zh: '男55-65% / 女50-60%', en: 'Male 55-65% / Female 50-60%' }, higherIsBetter: true, color: '#14b8a6' },
  { key: 'sleep_level', label: { zh: '睡眠等级', en: 'Sleep Score' }, unit: '分', benchmark: 80, getBenchmark: () => 80, normalRange: { zh: '70-100分', en: '70-100 points' }, higherIsBetter: true, color: '#6366f1' },
  { key: 'steps', label: { zh: '步数', en: 'Steps' }, unit: '步', benchmark: 8000, getBenchmark: () => 8000, normalRange: { zh: '8000-10000步', en: '8000-10000 steps' }, higherIsBetter: true, color: '#10b981' },
  { key: 'calories', label: { zh: '卡路里', en: 'Calories' }, unit: 'kcal', benchmark: 2000, getBenchmark: () => 2000, normalRange: { zh: '1800-2200 kcal', en: '1800-2200 kcal' }, higherIsBetter: false, color: '#f97316' },
  { key: 'visceral_fat', label: { zh: '内脏脂肪', en: 'Visceral Fat' }, unit: '级', benchmark: 10, getBenchmark: () => 10, normalRange: { zh: '1-12级', en: 'Level 1-12' }, higherIsBetter: false, color: '#f97316' },
  { key: 'basal_metabolic_rate', label: { zh: '基础代谢率', en: 'BMR' }, unit: 'kcal', benchmark: null, getBenchmark: (user: User) => user?.gender === 'male' ? 1600 : 1400, normalRange: { zh: '男1500-1800 / 女1200-1500', en: 'Male 1500-1800 / Female 1200-1500' }, higherIsBetter: true, color: '#8b5cf6' },
];

// 计算健康评分的函数
const calculateHealthScoreData = (records: HealthRecord[], user: User | null, language: string) => {
  if (records.length === 0) return null;
  
  const isZh = language === 'zh';
  const latestRecord = records[0];
  let totalScore = 0;
  let maxPossibleScore = 0;
  const details: { metric: string; value: number; benchmark: number; points: number; maxPoints: number; suggestion: string }[] = [];
  
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
    let points = 0;
    let maxPoints = 15;
    let suggestion = '';
    
    // ========== BMI 评分 ==========
    if (metric.key === 'bmi') {
      if (userValue >= 18.5 && userValue <= 24.9) {
        points = 15;
        suggestion = isZh ? 'BMI in normal range (18.5-24.9)' : 'BMI in normal range (18.5-24.9)';
      } else if (userValue > 24.9 && userValue <= 27) {
        points = 8;
        suggestion = isZh ? 'BMI high (overweight), diet and exercise recommended (-7 points)' : 'BMI high (overweight), diet and exercise recommended (-7 points)';
      } else if (userValue > 27 && userValue <= 30) {
        points = 3;
        suggestion = isZh ? 'BMI too high (obese), weight management needed (-12 points)' : 'BMI too high (obese), weight management needed (-12 points)';
      } else if (userValue > 30) {
        points = 0;
        suggestion = isZh ? 'BMI severely high (morbid obesity), consult a doctor (-15 points)' : 'BMI severely high (morbid obesity), consult a doctor (-15 points)';
      } else if (userValue < 18.5 && userValue >= 17) {
        points = 8;
        suggestion = isZh ? 'BMI low (underweight), increase nutrition (-7 points)' : 'BMI low (underweight), increase nutrition (-7 points)';
      } else if (userValue < 17) {
        points = 0;
        suggestion = isZh ? 'BMI severely low (malnutrition), consult a doctor (-15 points)' : 'BMI severely low (malnutrition), consult a doctor (-15 points)';
      }
    }
    // ========== 心率评分 ==========
    else if (metric.key === 'heart_rate') {
      if (userValue >= 60 && userValue <= 80) {
        points = 15;
        suggestion = isZh ? 'Heart rate normal (60-80 bpm), good cardiovascular health' : 'Heart rate normal (60-80 bpm), good cardiovascular health';
      } else if (userValue > 80 && userValue <= 90) {
        points = 10;
        suggestion = isZh ? 'Heart rate high (80-90 bpm), rest recommended (-5 points)' : 'Heart rate high (80-90 bpm), rest recommended (-5 points)';
      } else if (userValue > 90 && userValue <= 100) {
        points = 5;
        suggestion = isZh ? 'Heart rate very high (90-100 bpm), needs attention (-10 points)' : 'Heart rate very high (90-100 bpm), needs attention (-10 points)';
      } else if (userValue > 100) {
        points = 0;
        suggestion = isZh ? 'Heart rate dangerously high (>100 bpm), see a doctor (-15 points)' : 'Heart rate dangerously high (>100 bpm), see a doctor (-15 points)';
      } else if (userValue < 60 && userValue >= 55) {
        points = 10;
        suggestion = isZh ? 'Heart rate low (55-60 bpm), acceptable if no symptoms (-5 points)' : 'Heart rate low (55-60 bpm), acceptable if no symptoms (-5 points)';
      } else if (userValue < 55 && userValue >= 50) {
        points = 5;
        suggestion = isZh ? 'Heart rate very low (50-55 bpm), consult doctor (-10 points)' : 'Heart rate very low (50-55 bpm), consult doctor (-10 points)';
      } else if (userValue < 50) {
        points = 0;
        suggestion = isZh ? 'Heart rate dangerously low (<50 bpm), see a doctor (-15 points)' : 'Heart rate dangerously low (<50 bpm), see a doctor (-15 points)';
      }
    }
    // ========== 血压评分 ==========
    else if (metric.key === 'blood_pressure') {
      if (userValue >= 90 && userValue <= 120) {
        points = 15;
        suggestion = isZh ? 'Blood pressure normal (90-120 mmHg), good cardiovascular health' : 'Blood pressure normal (90-120 mmHg), good cardiovascular health';
      } else if (userValue > 120 && userValue <= 130) {
        points = 10;
        suggestion = isZh ? 'Blood pressure high (120-130 mmHg), reduce salt intake (-5 points)' : 'Blood pressure high (120-130 mmHg), reduce salt intake (-5 points)';
      } else if (userValue > 130 && userValue <= 140) {
        points = 5;
        suggestion = isZh ? 'Blood pressure very high (130-140 mmHg), needs monitoring (-10 points)' : 'Blood pressure very high (130-140 mmHg), needs monitoring (-10 points)';
      } else if (userValue > 140) {
        points = 0;
        suggestion = isZh ? 'Blood pressure dangerously high (>140 mmHg), see a doctor (-15 points)' : 'Blood pressure dangerously high (>140 mmHg), see a doctor (-15 points)';
      } else if (userValue < 90 && userValue >= 80) {
        points = 10;
        suggestion = isZh ? 'Blood pressure low (80-90 mmHg), stay hydrated (-5 points)' : 'Blood pressure low (80-90 mmHg), stay hydrated (-5 points)';
      } else if (userValue < 80) {
        points = 5;
        suggestion = isZh ? 'Blood pressure too low (<80 mmHg), risk of dizziness (-10 points)' : 'Blood pressure too low (<80 mmHg), risk of dizziness (-10 points)';
      }
    }
    // ========== 血糖评分 ==========
    else if (metric.key === 'blood_sugar') {
      if (userValue >= 3.9 && userValue <= 5.6) {
        points = 15;
        suggestion = isZh ? 'Blood sugar normal (3.9-5.6 mmol/L), good metabolism' : 'Blood sugar normal (3.9-5.6 mmol/L), good metabolism';
      } else if (userValue > 5.6 && userValue <= 6.1) {
        points = 10;
        suggestion = isZh ? 'Blood sugar slightly high (5.6-6.1 mmol/L), watch diet (-5 points)' : 'Blood sugar slightly high (5.6-6.1 mmol/L), watch diet (-5 points)';
      } else if (userValue > 6.1 && userValue <= 7.0) {
        points = 5;
        suggestion = isZh ? 'Blood sugar high (6.1-7.0 mmol/L), pre-diabetic (-10 points)' : 'Blood sugar high (6.1-7.0 mmol/L), pre-diabetic (-10 points)';
      } else if (userValue > 7.0) {
        points = 0;
        suggestion = isZh ? 'Blood sugar dangerously high (>7.0 mmol/L), see a doctor (-15 points)' : 'Blood sugar dangerously high (>7.0 mmol/L), see a doctor (-15 points)';
      } else if (userValue < 3.9 && userValue >= 3.0) {
        points = 8;
        suggestion = isZh ? 'Blood sugar low (3.0-3.9 mmol/L), eat something (-7 points)' : 'Blood sugar low (3.0-3.9 mmol/L), eat something (-7 points)';
      } else if (userValue < 3.0) {
        points = 0;
        suggestion = isZh ? 'Blood sugar critically low (<3.0 mmol/L), seek immediate care (-15 points)' : 'Blood sugar critically low (<3.0 mmol/L), seek immediate care (-15 points)';
      }
    }
    // ========== 睡眠评分 ==========
    else if (metric.key === 'sleep_level') {
      if (userValue >= 85) {
        points = 15;
        suggestion = isZh ? 'Excellent sleep quality (≥85), maintain routine' : 'Excellent sleep quality (≥85), maintain routine';
      } else if (userValue >= 75) {
        points = 12;
        suggestion = isZh ? 'Good sleep quality (75-85), keep it up (-3 points)' : 'Good sleep quality (75-85), keep it up (-3 points)';
      } else if (userValue >= 65) {
        points = 8;
        suggestion = isZh ? 'Fair sleep quality (65-75), improve routine (-7 points)' : 'Fair sleep quality (65-75), improve routine (-7 points)';
      } else if (userValue >= 50) {
        points = 3;
        suggestion = isZh ? 'Poor sleep quality (50-65), needs attention (-12 points)' : 'Poor sleep quality (50-65), needs attention (-12 points)';
      } else {
        points = 0;
        suggestion = isZh ? 'Very poor sleep quality (<50), consult a doctor (-15 points)' : 'Very poor sleep quality (<50), consult a doctor (-15 points)';
      }
    }
    // ========== 步数评分 ==========
    else if (metric.key === 'steps') {
      if (userValue >= 12000) {
        points = 15;
        suggestion = isZh ? 'Excellent activity level (≥12000 steps), keep it up!' : 'Excellent activity level (≥12000 steps), keep it up!';
      } else if (userValue >= 10000) {
        points = 13;
        suggestion = isZh ? 'Great activity level (10000-12000 steps), great! (-2 points)' : 'Great activity level (10000-12000 steps), great! (-2 points)';
      } else if (userValue >= 8000) {
        points = 10;
        suggestion = isZh ? 'Good activity level (8000-10000 steps), good (-5 points)' : 'Good activity level (8000-10000 steps), good (-5 points)';
      } else if (userValue >= 6000) {
        points = 6;
        suggestion = isZh ? 'Average activity (6000-8000 steps), increase activity (-9 points)' : 'Average activity (6000-8000 steps), increase activity (-9 points)';
      } else if (userValue >= 4000) {
        points = 3;
        suggestion = isZh ? 'Low activity (4000-6000 steps), need more exercise (-12 points)' : 'Low activity (4000-6000 steps), need more exercise (-12 points)';
      } else {
        points = 0;
        suggestion = isZh ? 'Very low activity (<4000 steps), start exercising now (-15 points)' : 'Very low activity (<4000 steps), start exercising now (-15 points)';
      }
    }
    // ========== 体脂率评分 ==========
    else if (metric.key === 'body_fat') {
      const isMale = user?.gender === 'male';
      if ((isMale && userValue >= 10 && userValue <= 20) || (!isMale && userValue >= 18 && userValue <= 28)) {
        points = 15;
        suggestion = isZh ? 'Body fat is standard, healthy physique' : 'Body fat is standard, healthy physique';
      } else if ((isMale && userValue > 20 && userValue <= 25) || (!isMale && userValue > 28 && userValue <= 32)) {
        points = 8;
        suggestion = isZh ? 'Body fat high, consider more cardio (-7 points)' : 'Body fat high, consider more cardio (-7 points)';
      } else if ((isMale && userValue > 25 && userValue <= 30) || (!isMale && userValue > 32 && userValue <= 35)) {
        points = 3;
        suggestion = isZh ? 'Body fat too high, need more exercise (-12 points)' : 'Body fat too high, need more exercise (-12 points)';
      } else {
        points = 0;
        suggestion = isZh ? 'Body fat severely high, consult a fitness trainer (-15 points)' : 'Body fat severely high, consult a fitness trainer (-15 points)';
      }
    }
    // ========== 肌肉量评分 ==========
    else if (metric.key === 'muscle_mass') {
      const isMale = user?.gender === 'male';
      if ((isMale && userValue >= 40) || (!isMale && userValue >= 30)) {
        points = 15;
        suggestion = isZh ? 'Good muscle mass, healthy metabolism' : 'Good muscle mass, healthy metabolism';
      } else if ((isMale && userValue >= 35 && userValue < 40) || (!isMale && userValue >= 25 && userValue < 30)) {
        points = 10;
        suggestion = isZh ? 'Normal muscle mass, consider strength training (-5 points)' : 'Normal muscle mass, consider strength training (-5 points)';
      } else if ((isMale && userValue >= 30 && userValue < 35) || (!isMale && userValue >= 20 && userValue < 25)) {
        points = 5;
        suggestion = isZh ? 'Low muscle mass, consider strength training (-10 points)' : 'Low muscle mass, consider strength training (-10 points)';
      } else {
        points = 0;
        suggestion = isZh ? 'Very low muscle mass, need strength training (-15 points)' : 'Very low muscle mass, need strength training (-15 points)';
      }
    }
    // ========== 体水分评分 ==========
    else if (metric.key === 'body_water') {
      const isMale = user?.gender === 'male';
      const idealWater = isMale ? 60 : 55;
      const percentDiff = Math.abs(userValue - idealWater) / idealWater;
      if (percentDiff <= 0.05) {
        points = 15;
        suggestion = isZh ? `Body water normal (${userValue}%), well hydrated` : `Body water normal (${userValue}%), well hydrated`;
      } else if (percentDiff <= 0.1) {
        points = 10;
        suggestion = isZh ? `Body water slightly off (±${(percentDiff * 100).toFixed(0)}%), stay hydrated (-5 points)` : `Body water slightly off (±${(percentDiff * 100).toFixed(0)}%), stay hydrated (-5 points)`;
      } else if (percentDiff <= 0.2) {
        points = 5;
        suggestion = isZh ? `Body water significantly off, drink more water (-10 points)` : `Body water significantly off, drink more water (-10 points)`;
      } else {
        points = 0;
        suggestion = isZh ? `Body water severely abnormal, consult a doctor (-15 points)` : `Body water severely abnormal, consult a doctor (-15 points)`;
      }
    }
    // ========== 卡路里评分 ==========
    else if (metric.key === 'calories') {
      if (userValue >= 1800 && userValue <= 2200) {
        points = 15;
        suggestion = isZh ? `Calorie intake normal (${userValue} kcal), good diet` : `Calorie intake normal (${userValue} kcal), good diet`;
      } else if (userValue >= 1500 && userValue < 1800) {
        points = 8;
        suggestion = isZh ? `Calorie intake low (${userValue} kcal), need more nutrition (-7 points)` : `Calorie intake low (${userValue} kcal), need more nutrition (-7 points)`;
      } else if (userValue >= 1000 && userValue < 1500) {
        points = 3;
        suggestion = isZh ? `Calorie intake very low (${userValue} kcal), significantly under-eating (-12 points)` : `Calorie intake very low (${userValue} kcal), significantly under-eating (-12 points)`;
      } else if (userValue < 1000) {
        points = 0;
        suggestion = isZh ? `Calorie intake dangerously low (<1000 kcal), seek medical advice (-15 points)` : `Calorie intake dangerously low (<1000 kcal), seek medical advice (-15 points)`;
      } else if (userValue > 2200 && userValue <= 2500) {
        points = 10;
        suggestion = isZh ? `Calorie intake high (2200-2500 kcal), watch your intake (-5 points)` : `Calorie intake high (2200-2500 kcal), watch your intake (-5 points)`;
      } else if (userValue > 2500 && userValue <= 3000) {
        points = 5;
        suggestion = isZh ? `Calorie intake very high (2500-3000 kcal), reduce intake (-10 points)` : `Calorie intake very high (2500-3000 kcal), reduce intake (-10 points)`;
      } else if (userValue > 3000) {
        points = 0;
        suggestion = isZh ? `Calorie intake dangerously high (>3000 kcal), consult a doctor (-15 points)` : `Calorie intake dangerously high (>3000 kcal), consult a doctor (-15 points)`;
      }
    }
    // ========== 体重评分（与理想体重对比） ==========
    else if (metric.key === 'weight') {
      const idealWeight = user ? 22 * Math.pow(user.height / 100, 2) : 70;
      const percentDiff = Math.abs(userValue - idealWeight) / idealWeight;
      if (percentDiff <= 0.05) {
        points = 15;
        suggestion = isZh ? `Ideal weight (${userValue} kg), ${(percentDiff * 100).toFixed(0)}% from standard` : `Ideal weight (${userValue} kg), ${(percentDiff * 100).toFixed(0)}% from standard`;
      } else if (percentDiff <= 0.1) {
        points = 10;
        suggestion = isZh ? `Slightly off weight (±${(percentDiff * 100).toFixed(0)}%), pay attention (-5 points)` : `Slightly off weight (±${(percentDiff * 100).toFixed(0)}%), pay attention (-5 points)`;
      } else if (percentDiff <= 0.2) {
        points = 5;
        suggestion = isZh ? `Significantly off weight (±${(percentDiff * 100).toFixed(0)}%), consider management (-10 points)` : `Significantly off weight (±${(percentDiff * 100).toFixed(0)}%), consider management (-10 points)`;
      } else {
        points = 0;
        suggestion = isZh ? `Severely off weight (±${(percentDiff * 100).toFixed(0)}%), needs attention (-15 points)` : `Severely off weight (±${(percentDiff * 100).toFixed(0)}%), needs attention (-15 points)`;
      }
    }
    // ========== 其他指标通用评分 ==========
    else {
      const percentDiff = Math.abs(userValue - benchmark) / benchmark;
      if (percentDiff <= 0.05) {
        points = 15;
        suggestion = `${metric.label.en} is excellent`;
      } else if (percentDiff <= 0.1) {
        points = 10;
        suggestion = `${metric.label.en} is good (-5 points)`;
      } else if (percentDiff <= 0.2) {
        points = 5;
        suggestion = `${metric.label.en} is fair (-10 points)`;
      } else {
        points = 0;
        suggestion = `${metric.label.en} is poor (-15 points)`;
      }
    }
    
    totalScore += points;
    maxPossibleScore += maxPoints;
    details.push({
      metric: metric.label.en,
      value: userValue,
      benchmark,
      points,
      maxPoints,
      suggestion,
    });
  }
  
  // 计算百分比得分
  const percentageScore = Math.round((totalScore / maxPossibleScore) * 100);
  
  let grade = '';
  let gradeColor = '';
  if (percentageScore >= 90) { grade = 'Excellent'; gradeColor = 'text-green-600'; }
  else if (percentageScore >= 75) { grade = 'Good'; gradeColor = 'text-blue-600'; }
  else if (percentageScore >= 60) { grade = 'Fair'; gradeColor = 'text-yellow-600'; }
  else { grade = 'Needs Attention'; gradeColor = 'text-red-600'; }
  
  return { 
    score: percentageScore, 
    grade, 
    gradeColor, 
    details,
    totalEarned: totalScore,
    totalPossible: maxPossibleScore
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
  const [healthScore, setHealthScore] = useState<{ score: number; grade: string; gradeColor: string; details: { metric: string; value: number; benchmark: number; points: number; suggestion: string }[] } | null>(null);

  const currentMetric = ALL_METRICS.find(m => m.key === selectedMetric) || ALL_METRICS[0];
  const currentMetricLabel = currentMetric.label[language];
  const currentNormalRange = currentMetric.normalRange[language];
  
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
      const result = calculateHealthScoreData(healthRecords, user, 'en');
      setHealthScore(result);
      setShowScore(true);
      setScoreAnimation(true);
      setTimeout(() => setScoreAnimation(false), 1000);
      setIsCalculating(false);
    }, 800);
  };

  const ageGroup = user ? `${Math.floor(user.age / 10) * 10}-${Math.floor(user.age / 10) * 10 + 9}` : '30-39';
  const genderText = user?.gender === 'male' ? 'Male' : 'Female';

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
                      const metricLabel = metric.label[language];
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
                            <span className="text-sm font-medium">{metricLabel.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white">{metricLabel}</p>
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
                      <div className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg"><span className="text-5xl font-bold text-white">{healthScore.score}</span></div>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }} className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2"><Award size={20} className="text-white" /></motion.div>
                    </div>
                    <p className={`mt-3 font-bold text-xl ${healthScore.gradeColor}`}>{healthScore.grade}</p>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">{t('scoreBasis')}</h3>
                    {healthScore.details.map((detail, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-800 dark:text-white">{detail.metric}</span>
                          <span className={`text-sm font-bold ${detail.points >= 10 ? 'text-green-600' : detail.points >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {detail.points >= 10 ? '+' : ''}{detail.points} {t('points')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>{t('yourValue')}: {detail.value.toFixed(1)}</span>
                          <span>•</span>
                          <span>{t('benchmark')}: {detail.benchmark.toFixed(1)}</span>
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

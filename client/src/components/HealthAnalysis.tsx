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

// Metric configurations
const METRICS = [
  { key: 'bmi', label: 'BMI', unit: '', getValue: (r: HealthRecord) => r.bmi, getBenchmark: (u: User | null) => 22, checkNormal: (val: number, u: User | null) => val >= 18.5 && val <= 24.9, getDeduction: (val: number) => {
    if (val >= 18.5 && val <= 24.9) return 0;
    if (val > 24.9 && val <= 27) return 5;
    if (val > 27 && val <= 30) return 10;
    if (val > 30) return 15;
    if (val < 18.5 && val >= 17) return 5;
    return 15;
  }, getSuggestion: (val: number, u: User | null) => {
    if (val >= 18.5 && val <= 24.9) return 'Normal range (18.5-24.9)';
    if (val > 24.9 && val <= 27) return `BMI ${val} (overweight), diet and exercise recommended`;
    if (val > 27 && val <= 30) return `BMI ${val} (obese), weight management needed`;
    if (val > 30) return `BMI ${val} (severely obese), consult a doctor`;
    if (val < 18.5 && val >= 17) return `BMI ${val} (underweight), increase nutrition`;
    return `BMI ${val} (severely underweight), consult a doctor`;
  } },
  { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', getValue: (r: HealthRecord) => r.heart_rate, getBenchmark: (u: User | null) => u?.gender === 'male' ? 68 : 72, checkNormal: (val: number) => val >= 60 && val <= 80, getDeduction: (val: number) => {
    if (val >= 60 && val <= 80) return 0;
    if (val > 80 && val <= 90) return 5;
    if (val > 90 && val <= 100) return 10;
    if (val > 100) return 15;
    if (val < 60 && val >= 55) return 5;
    if (val < 55 && val >= 50) return 10;
    return 15;
  }, getSuggestion: (val: number) => {
    if (val >= 60 && val <= 80) return 'Normal range (60-80 bpm)';
    if (val > 80 && val <= 90) return `Heart rate ${val} bpm (high), rest recommended`;
    if (val > 90 && val <= 100) return `Heart rate ${val} bpm (very high), needs attention`;
    if (val > 100) return `Heart rate ${val} bpm (dangerous), see a doctor`;
    if (val < 60 && val >= 55) return `Heart rate ${val} bpm (low), acceptable if no symptoms`;
    if (val < 55 && val >= 50) return `Heart rate ${val} bpm (very low), consult doctor`;
    return `Heart rate ${val} bpm (dangerously low), see a doctor`;
  } },
  { key: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg', getValue: (r: HealthRecord) => r.blood_pressure ? parseInt(r.blood_pressure.split('/')[0]) : null, getBenchmark: () => 120, checkNormal: (val: number) => val >= 90 && val <= 120, getDeduction: (val: number) => {
    if (val >= 90 && val <= 120) return 0;
    if (val > 120 && val <= 130) return 5;
    if (val > 130 && val <= 140) return 10;
    if (val > 140) return 15;
    if (val < 90 && val >= 80) return 5;
    return 10;
  }, getSuggestion: (val: number) => {
    if (val >= 90 && val <= 120) return 'Normal range (90-120 mmHg)';
    if (val > 120 && val <= 130) return `BP ${val} mmHg (high), reduce salt intake`;
    if (val > 130 && val <= 140) return `BP ${val} mmHg (very high), needs monitoring`;
    if (val > 140) return `BP ${val} mmHg (dangerous), see a doctor`;
    if (val < 90 && val >= 80) return `BP ${val} mmHg (low), stay hydrated`;
    return `BP ${val} mmHg (too low), risk of dizziness`;
  } },
  { key: 'blood_sugar', label: 'Blood Sugar', unit: 'mmol/L', getValue: (r: HealthRecord) => r.blood_sugar, getBenchmark: () => 5.0, checkNormal: (val: number) => val >= 3.9 && val <= 5.6, getDeduction: (val: number) => {
    if (val >= 3.9 && val <= 5.6) return 0;
    if (val > 5.6 && val <= 6.1) return 5;
    if (val > 6.1 && val <= 7.0) return 10;
    if (val > 7.0) return 15;
    if (val < 3.9 && val >= 3.0) return 8;
    return 15;
  }, getSuggestion: (val: number) => {
    if (val >= 3.9 && val <= 5.6) return 'Normal range (3.9-5.6 mmol/L)';
    if (val > 5.6 && val <= 6.1) return `Blood sugar ${val} (slightly high), watch diet`;
    if (val > 6.1 && val <= 7.0) return `Blood sugar ${val} (high), pre-diabetic`;
    if (val > 7.0) return `Blood sugar ${val} (dangerous), see a doctor`;
    if (val < 3.9 && val >= 3.0) return `Blood sugar ${val} (low), eat something`;
    return `Blood sugar ${val} (critically low), seek immediate care`;
  } },
  { key: 'sleep_level', label: 'Sleep Score', unit: 'pts', getValue: (r: HealthRecord) => r.sleep_level, getBenchmark: () => 80, checkNormal: (val: number) => val >= 85, getDeduction: (val: number) => {
    if (val >= 85) return 0;
    if (val >= 75) return 3;
    if (val >= 65) return 7;
    if (val >= 50) return 12;
    return 15;
  }, getSuggestion: (val: number) => {
    if (val >= 85) return 'Excellent sleep quality (≥85), maintain routine';
    if (val >= 75) return `Sleep score ${val} (good), slight improvement possible`;
    if (val >= 65) return `Sleep score ${val} (fair), improve sleep routine`;
    if (val >= 50) return `Sleep score ${val} (poor), needs attention`;
    return `Sleep score ${val} (very poor), consult a doctor`;
  } },
  { key: 'steps', label: 'Steps', unit: 'steps', getValue: (r: HealthRecord) => r.steps, getBenchmark: () => 8000, checkNormal: (val: number) => val >= 10000, getDeduction: (val: number) => {
    if (val >= 12000) return 0;
    if (val >= 10000) return 2;
    if (val >= 8000) return 5;
    if (val >= 6000) return 9;
    if (val >= 4000) return 12;
    return 15;
  }, getSuggestion: (val: number) => {
    if (val >= 12000) return 'Excellent activity level (≥12000 steps), keep it up!';
    if (val >= 10000) return `Steps ${val} (great), good activity level`;
    if (val >= 8000) return `Steps ${val} (good), meets minimum recommendation`;
    if (val >= 6000) return `Steps ${val} (average), increase activity`;
    if (val >= 4000) return `Steps ${val} (low), need more exercise`;
    return `Steps ${val} (very low), start exercising now`;
  } },
  { key: 'body_fat', label: 'Body Fat', unit: '%', getValue: (r: HealthRecord) => r.body_fat, getBenchmark: (u: User | null) => u?.gender === 'male' ? 15 : 25, checkNormal: (val: number, u: User | null) => {
    const isMale = u?.gender === 'male';
    return isMale ? (val >= 10 && val <= 20) : (val >= 18 && val <= 28);
  }, getDeduction: (val: number, u: User | null) => {
    const isMale = u?.gender === 'male';
    if ((isMale && val >= 10 && val <= 20) || (!isMale && val >= 18 && val <= 28)) return 0;
    if ((isMale && val > 20 && val <= 25) || (!isMale && val > 28 && val <= 32)) return 7;
    if ((isMale && val > 25 && val <= 30) || (!isMale && val > 32 && val <= 35)) return 12;
    return 15;
  }, getSuggestion: (val: number, u: User | null) => {
    const isMale = u?.gender === 'male';
    if ((isMale && val >= 10 && val <= 20) || (!isMale && val >= 18 && val <= 28)) return 'Standard range, healthy physique';
    if ((isMale && val > 20 && val <= 25) || (!isMale && val > 28 && val <= 32)) return `Body fat ${val}% (high), consider more cardio`;
    if ((isMale && val > 25 && val <= 30) || (!isMale && val > 32 && val <= 35)) return `Body fat ${val}% (too high), need more exercise`;
    return `Body fat ${val}% (severely high), consult a trainer`;
  } },
  { key: 'muscle_mass', label: 'Muscle Mass', unit: 'kg', getValue: (r: HealthRecord) => r.muscle_mass, getBenchmark: (u: User | null) => u?.gender === 'male' ? 40 : 30, checkNormal: (val: number, u: User | null) => {
    const isMale = u?.gender === 'male';
    return isMale ? val >= 40 : val >= 30;
  }, getDeduction: (val: number, u: User | null) => {
    const isMale = u?.gender === 'male';
    if ((isMale && val >= 40) || (!isMale && val >= 30)) return 0;
    if ((isMale && val >= 35) || (!isMale && val >= 25)) return 5;
    if ((isMale && val >= 30) || (!isMale && val >= 20)) return 10;
    return 15;
  }, getSuggestion: (val: number, u: User | null) => {
    const isMale = u?.gender === 'male';
    if ((isMale && val >= 40) || (!isMale && val >= 30)) return 'Good muscle mass, healthy metabolism';
    if ((isMale && val >= 35) || (!isMale && val >= 25)) return `Muscle mass ${val}kg (normal), consider strength training`;
    if ((isMale && val >= 30) || (!isMale && val >= 20)) return `Muscle mass ${val}kg (low), consider strength training`;
    return `Muscle mass ${val}kg (very low), need strength training`;
  } },
  { key: 'calories', label: 'Calories', unit: 'kcal', getValue: (r: HealthRecord) => r.calories, getBenchmark: () => 2000, checkNormal: (val: number) => val >= 1800 && val <= 2200, getDeduction: (val: number) => {
    if (val >= 1800 && val <= 2200) return 0;
    if (val >= 1500 && val < 1800) return 7;
    if (val >= 1000 && val < 1500) return 12;
    if (val < 1000) return 15;
    if (val > 2200 && val <= 2500) return 5;
    if (val > 2500 && val <= 3000) return 10;
    return 15;
  }, getSuggestion: (val: number) => {
    if (val >= 1800 && val <= 2200) return 'Normal calorie intake, good diet';
    if (val >= 1500 && val < 1800) return `Calories ${val} (low), need more nutrition`;
    if (val >= 1000 && val < 1500) return `Calories ${val} (very low), significantly under-eating`;
    if (val < 1000) return `Calories ${val} (dangerously low), seek medical advice`;
    if (val > 2200 && val <= 2500) return `Calories ${val} (high), watch your intake`;
    if (val > 2500 && val <= 3000) return `Calories ${val} (very high), reduce intake`;
    return `Calories ${val} (dangerously high), consult a doctor`;
  } },
  { key: 'body_water', label: 'Body Water', unit: '%', getValue: (r: HealthRecord) => r.body_water, getBenchmark: (u: User | null) => u?.gender === 'male' ? 60 : 55, checkNormal: (val: number, u: User | null) => {
    const ideal = u?.gender === 'male' ? 60 : 55;
    return Math.abs(val - ideal) / ideal <= 0.05;
  }, getDeduction: (val: number, u: User | null) => {
    const ideal = u?.gender === 'male' ? 60 : 55;
    const diff = Math.abs(val - ideal) / ideal;
    if (diff <= 0.05) return 0;
    if (diff <= 0.1) return 5;
    if (diff <= 0.2) return 10;
    return 15;
  }, getSuggestion: (val: number, u: User | null) => {
    const ideal = u?.gender === 'male' ? 60 : 55;
    const diff = Math.abs(val - ideal) / ideal;
    if (diff <= 0.05) return `Body water ${val}%, well hydrated`;
    if (diff <= 0.1) return `Body water ${val}% (slightly off), stay hydrated`;
    if (diff <= 0.2) return `Body water ${val}% (significantly off), drink more water`;
    return `Body water ${val}% (severely abnormal), consult a doctor`;
  } },
  { key: 'visceral_fat', label: 'Visceral Fat', unit: 'level', getValue: (r: HealthRecord) => r.visceral_fat, getBenchmark: () => 10, checkNormal: (val: number) => val <= 10, getDeduction: (val: number) => {
    if (val <= 10) return 0;
    if (val <= 15) return 5;
    if (val <= 20) return 10;
    return 15;
  }, getSuggestion: (val: number) => {
    if (val <= 10) return 'Normal range (≤10), healthy';
    if (val <= 15) return `Visceral fat level ${val} (high), watch diet`;
    if (val <= 20) return `Visceral fat level ${val} (very high), need exercise`;
    return `Visceral fat level ${val} (dangerous), consult a doctor`;
  } },
];

export function HealthAnalysis({ user, healthRecords }: HealthAnalysisProps) {
  const { t, language, formatDate, formatShortDate } = useLanguage();
  const isZh = language === 'zh';
  const [selectedMetric, setSelectedMetric] = useState<string>('bmi');
  const [showMetricSelector, setShowMetricSelector] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [scoreAnimation, setScoreAnimation] = useState(false);
  const [healthScore, setHealthScore] = useState<{ score: number; grade: string; gradeColor: string; details: any[]; normalCount: number; abnormalCount: number } | null>(null);

  const getLatestValue = (metric: typeof METRICS[0]) => {
    if (healthRecords.length === 0) return null;
    const latest = healthRecords[0];
    return metric.getValue(latest);
  };

  const getLatestBenchmark = (metric: typeof METRICS[0]) => {
    return metric.getBenchmark(user);
  };

  const chartData = useMemo(() => {
    const metric = METRICS.find(m => m.key === selectedMetric);
    if (!metric) return null;
    const userValue = getLatestValue(metric);
    const benchmark = getLatestBenchmark(metric);
    if (userValue === null || userValue === undefined) return null;
    return [
      { name: 'You', value: userValue, color: '#6366f1' },
      { name: 'Benchmark', value: benchmark, color: '#94a3b8' },
    ];
  }, [selectedMetric, healthRecords]);

  const calculateHealthScore = () => {
    setIsCalculating(true);
    setShowScore(false);
    
    setTimeout(() => {
      let totalDeduction = 0;
      const details: any[] = [];
      
      for (const metric of METRICS) {
        const value = getLatestValue(metric);
        if (value === null || value === undefined) continue;
        
        const isNormal = metric.checkNormal(value, user);
        const deduction = isNormal ? 0 : metric.getDeduction(value, user);
        const suggestion = metric.getSuggestion(value, user);
        
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
      if (finalScore >= 90) { grade = 'Excellent'; gradeColor = 'text-green-600'; }
      else if (finalScore >= 75) { grade = 'Good'; gradeColor = 'text-blue-600'; }
      else if (finalScore >= 60) { grade = 'Fair'; gradeColor = 'text-yellow-600'; }
      else { grade = 'Needs Attention'; gradeColor = 'text-red-600'; }
      
      setHealthScore({ score: finalScore, grade, gradeColor, details, normalCount, abnormalCount });
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
        <h1 className="text-gray-800 dark:text-white text-2xl font-bold mb-2">Health Analysis</h1>
        <p className="text-gray-600 dark:text-gray-400">Compare your metrics with health benchmarks</p>
      </header>

      <div className="space-y-6">
        {healthRecords.length > 0 ? (
          <>
            {/* Overview Card */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-white text-lg font-semibold mb-2">Analysis Period</h2>
                  <p className="text-indigo-100">Based on data from {healthRecords.length} days</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl"><BarChart3 size={24} /></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-sm text-indigo-100">First Record</p>
                  <p className="text-lg mt-1">{formatShortDate(healthRecords[healthRecords.length - 1].date)}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-sm text-indigo-100">Latest Record</p>
                  <p className="text-lg mt-1">{formatShortDate(healthRecords[0].date)}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-sm text-indigo-100">Total Days</p>
                  <p className="text-lg mt-1">{healthRecords.length} days</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-sm text-indigo-100">Available Metrics</p>
                  <p className="text-lg mt-1">{METRICS.filter(m => getLatestValue(m) !== null).length}</p>
                </div>
              </div>
            </div>

            {/* User Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-indigo-600" size={24} />
                <div>
                  <h2 className="text-gray-800 dark:text-white font-semibold">Comparison Benchmark</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Age {ageGroup} • {genderText} • Based on medical standards
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400">Select a metric below to compare</p>
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
                      {METRICS.find(m => m.key === selectedMetric)?.label.charAt(0) || 'B'}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-800 dark:text-white">{METRICS.find(m => m.key === selectedMetric)?.label}</p>
                      <p className="text-xs text-gray-500">
                        Normal: {METRICS.find(m => m.key === selectedMetric)?.checkNormal(getLatestValue(METRICS.find(m => m.key === selectedMetric)!) || 0, user) ? '✓' : '⚠'}
                      </p>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${showMetricSelector ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showMetricSelector && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-10 max-h-64 overflow-y-auto">
                    {METRICS.map(metric => {
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
                          {!hasData && <span className="ml-auto text-xs text-gray-400">No data</span>}
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
                  <h3 className="text-gray-800 dark:text-white font-semibold text-lg">{METRICS.find(m => m.key === selectedMetric)?.label} Comparison</h3>
                  <p className="text-sm text-gray-500">You vs Health Benchmark</p>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" domain={[0, 'auto']} label={{ value: METRICS.find(m => m.key === selectedMetric)?.unit || '', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#6b7280' } }} />
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
                    <h2 className="text-gray-800 dark:text-white font-semibold text-lg">Health Score Assessment</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Comprehensive evaluation of your overall health</p>
                  </div>
                </div>
                <button onClick={calculateHealthScore} disabled={isCalculating} className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2">
                  <Sparkles size={18} />
                  {isCalculating ? 'Assessing...' : 'Start Assessment'}
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
                      <p className="mt-4 text-gray-600 dark:text-gray-400">Analyzing your health data...</p>
                      <p className="text-sm text-gray-500 mt-2">Reviewing metrics and calculating score</p>
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
                      {healthScore.normalCount} healthy indicators • {healthScore.abnormalCount} need attention
                    </p>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Score Breakdown</h3>
                    {healthScore.details.map((detail, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-800 dark:text-white">{detail.label}</span>
                          {detail.isNormal ? (
                            <span className="text-sm font-bold text-green-600 flex items-center gap-1"><CheckCircle size={14} /> Normal</span>
                          ) : (
                            <span className="text-sm font-bold text-red-600">-{detail.deduction} points</span>
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
            <h3 className="text-xl font-semibold text-yellow-800 dark:text-yellow-400 mb-2">No Data Records</h3>
            <p className="text-yellow-600 dark:text-yellow-500">Add your first health record to start analysis</p>
          </div>
        )}
      </div>
    </div>
  );
}

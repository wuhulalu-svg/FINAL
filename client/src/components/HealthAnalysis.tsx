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

export function HealthAnalysis({ user, healthRecords }: HealthAnalysisProps) {
  const { t, language, formatDate, formatShortDate } = useLanguage();
  const [selectedMetric, setSelectedMetric] = useState<string>('bmi');
  const [showMetricSelector, setShowMetricSelector] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [scoreAnimation, setScoreAnimation] = useState(false);
  const [healthScore, setHealthScore] = useState<{ score: number; details: { metric: string; value: number; benchmark: number; points: number; suggestion: string }[] } | null>(null);

  // 获取当前选中指标的配置
  const currentMetric = ALL_METRICS.find(m => m.key === selectedMetric) || ALL_METRICS[0];
  const currentMetricLabel = currentMetric.label[language];
  const currentNormalRange = currentMetric.normalRange[language];
  
  // 获取基准值
  const getBenchmarkValue = (metric: typeof currentMetric): number => {
    if (metric.getBenchmark) {
      return metric.getBenchmark(user!);
    }
    return metric.benchmark || 0;
  };

  // 计算用户平均值
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

  // 准备柱状图数据
  const chartData = useMemo(() => {
    const userValue = getUserAverage(selectedMetric);
    const benchmarkValue = getBenchmarkValue(currentMetric);
    
    if (userValue === null) return null;
    
    return [
      { name: t('yourAverage'), value: userValue, color: '#6366f1' },
      { name: t('healthBenchmark'), value: benchmarkValue, color: '#94a3b8' },
    ];
  }, [selectedMetric, healthRecords, user, currentMetric, t]);

  // 计算差异和状态
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

  // 计算健康评分
  const calculateHealthScore = () => {
    setIsCalculating(true);
    setShowScore(false);
    
    setTimeout(() => {
      let totalScore = 80;
      const details: { metric: string; value: number; benchmark: number; points: number; suggestion: string }[] = [];
      
      for (const metric of ALL_METRICS) {
        const userValue = getUserAverage(metric.key);
        if (userValue === null) continue;
        
        const benchmark = getBenchmarkValue(metric);
        let points = 0;
        let suggestion = '';
        
        if (metric.key === 'bmi') {
          if (userValue >= 18.5 && userValue <= 24.9) { points = 10; suggestion = language === 'zh' ? 'BMI在正常范围内，很好！' : 'BMI is within normal range, great!'; }
          else if (userValue > 24.9 && userValue < 28) { points = 5; suggestion = language === 'zh' ? 'BMI偏高，建议控制饮食增加运动。' : 'BMI is high, consider diet control and more exercise.'; }
          else if (userValue >= 28) { points = 0; suggestion = language === 'zh' ? 'BMI过高，需要重视体重管理。' : 'BMI is too high, need to focus on weight management.'; }
          else if (userValue < 18.5) { points = 5; suggestion = language === 'zh' ? 'BMI偏低，建议增加营养摄入。' : 'BMI is low, consider increasing nutrition intake.'; }
        }
        else if (metric.key === 'heart_rate') {
          if (userValue >= 60 && userValue <= 80) { points = 10; suggestion = language === 'zh' ? '心率正常，心血管健康良好。' : 'Heart rate is normal, cardiovascular health is good.'; }
          else if (userValue > 80 && userValue <= 100) { points = 5; suggestion = language === 'zh' ? '心率偏高，建议适当休息。' : 'Heart rate is high, consider resting more.'; }
          else if (userValue > 100) { points = 0; suggestion = language === 'zh' ? '心率过高，请及时就医检查。' : 'Heart rate is too high, please consult a doctor.'; }
          else if (userValue < 60) { points = 5; suggestion = language === 'zh' ? '心率偏低，如无不适属正常。' : 'Heart rate is low, normal if no discomfort.'; }
        }
        else if (metric.key === 'blood_pressure') {
          if (userValue <= 120) { points = 10; suggestion = language === 'zh' ? '血压正常，心血管健康。' : 'Blood pressure is normal, cardiovascular health is good.'; }
          else if (userValue <= 140) { points = 5; suggestion = language === 'zh' ? '血压偏高，注意低盐饮食。' : 'Blood pressure is high, watch your salt intake.'; }
          else { points = 0; suggestion = language === 'zh' ? '血压过高，请及时就医。' : 'Blood pressure is too high, please consult a doctor.'; }
        }
        else if (metric.key === 'sleep_level') {
          if (userValue >= 85) { points = 10; suggestion = language === 'zh' ? '睡眠质量优秀！' : 'Excellent sleep quality!'; }
          else if (userValue >= 70) { points = 7; suggestion = language === 'zh' ? '睡眠质量良好。' : 'Good sleep quality.'; }
          else if (userValue >= 60) { points = 4; suggestion = language === 'zh' ? '睡眠质量一般，建议改善作息。' : 'Average sleep quality, consider improving your routine.'; }
          else { points = 0; suggestion = language === 'zh' ? '睡眠质量差，需要重点关注。' : 'Poor sleep quality, needs attention.'; }
        }
        else if (metric.key === 'steps') {
          if (userValue >= 10000) { points = 10; suggestion = language === 'zh' ? '运动量充足，继续保持！' : 'Great activity level, keep it up!'; }
          else if (userValue >= 8000) { points = 7; suggestion = language === 'zh' ? '运动量良好，再努力一下。' : 'Good activity level, keep pushing.'; }
          else if (userValue >= 5000) { points = 4; suggestion = language === 'zh' ? '运动量不足，建议增加活动。' : 'Low activity level, consider moving more.'; }
          else { points = 0; suggestion = language === 'zh' ? '运动量严重不足。' : 'Very low activity level.'; }
        }
        else if (metric.key === 'body_fat') {
          const isMale = user?.gender === 'male';
          if ((isMale && userValue <= 20) || (!isMale && userValue <= 28)) { points = 10; suggestion = language === 'zh' ? '体脂率标准，身材健康。' : 'Body fat is standard, healthy physique.'; }
          else if ((isMale && userValue <= 25) || (!isMale && userValue <= 32)) { points = 5; suggestion = language === 'zh' ? '体脂率偏高，建议增加有氧运动。' : 'Body fat is high, consider more cardio.'; }
          else { points = 0; suggestion = language === 'zh' ? '体脂率过高，需要加强锻炼。' : 'Body fat is too high, need more exercise.'; }
        }
        else if (metric.key === 'muscle_mass') {
          const isMale = user?.gender === 'male';
          if ((isMale && userValue >= 38) || (!isMale && userValue >= 28)) { points = 10; suggestion = language === 'zh' ? '肌肉量充足，基础代谢良好。' : 'Good muscle mass, healthy metabolism.'; }
          else if ((isMale && userValue >= 35) || (!isMale && userValue >= 25)) { points = 5; suggestion = language === 'zh' ? '肌肉量正常，可适当增加力量训练。' : 'Normal muscle mass, consider strength training.'; }
          else { points = 0; suggestion = language === 'zh' ? '肌肉量不足，建议增加力量训练。' : 'Low muscle mass, consider strength training.'; }
        }
        else {
          const diff = Math.abs(userValue - benchmark);
          const percentDiff = diff / benchmark;
          if (percentDiff <= 0.1) { points = 10; suggestion = `${metric.label[language]} ${language === 'zh' ? '指标正常，继续保持。' : 'is normal, keep it up.'}`; }
          else if (percentDiff <= 0.2) { points = 5; suggestion = `${metric.label[language]} ${language === 'zh' ? '指标略有偏差，注意调整。' : 'is slightly off, pay attention.'}`; }
          else { points = 0; suggestion = `${metric.label[language]} ${language === 'zh' ? '指标异常，需要关注。' : 'is abnormal, needs attention.'}`; }
        }
        
        details.push({
          metric: metric.label[language],
          value: userValue,
          benchmark,
          points,
          suggestion,
        });
        
        totalScore += points - 5;
      }
      
      totalScore = Math.min(Math.max(totalScore, 0), 100);
      
      setHealthScore({ score: totalScore, details });
      setShowScore(true);
      setScoreAnimation(true);
      setTimeout(() => setScoreAnimation(false), 1000);
      setIsCalculating(false);
    }, 1500);
  };

  // 年龄组
  const ageGroup = user ? `${Math.floor(user.age / 10) * 10}-${Math.floor(user.age / 10) * 10 + 9}` : '30-39';
  const genderText = language === 'zh' ? (user?.gender === 'male' ? '男性' : '女性') : (user?.gender === 'male' ? 'Male' : 'Female');

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-gray-800 dark:text-white text-2xl font-bold mb-2">{t('healthAnalysis')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('comparisonBenchmark')}</p>
      </header>

      <div className="space-y-6">
        {healthRecords.length > 0 ? (
          <>
            {/* 统计概览 */}
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

            {/* 年龄组信息 */}
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

            {/* 指标选择器 */}
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

            {/* 竖版柱状图 */}
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
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`${value} ${currentMetric.unit}`, '']}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 对比详情卡片 */}
                {comparison && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-500">{t('yourAverage')}</p>
                        <p className="text-xl font-bold text-indigo-600">{chartData[0].value.toFixed(1)} {currentMetric.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('healthBenchmark')}</p>
                        <p className="text-xl font-bold text-gray-600">{chartData[1].value.toFixed(1)} {currentMetric.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('difference')}</p>
                        <p className={`text-xl font-bold ${comparison.statusColor}`}>
                          {comparison.isHigher ? '+' : '-'}{comparison.diff} {currentMetric.unit}
                          <span className="text-sm ml-1">({comparison.percentDiff}%)</span>
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${comparison.statusColor} bg-opacity-10 bg-gray-100`}>
                        {comparison.statusText === 'normal' && <Minus size={14} />}
                        {comparison.statusText === 'aboveBenchmark' && <TrendingUp size={14} />}
                        {comparison.statusText === 'belowBenchmark' && <TrendingDown size={14} />}
                        {comparison.statusText}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 健康评分卡片 */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl p-6 shadow-lg border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl">
                    <Award className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-gray-800 dark:text-white font-semibold text-lg">{t('healthScoreAssessment')}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('comprehensiveEvaluation')}</p>
                  </div>
                </div>
                <button
                  onClick={calculateHealthScore}
                  disabled={isCalculating}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Sparkles size={18} />
                  {isCalculating ? t('assessing') : t('startAssessment')}
                </button>
              </div>

              <AnimatePresence>
                {isCalculating && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="relative w-32 h-32 mx-auto">
                        <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0">
                          <Heart className="w-full h-full text-pink-500" />
                        </motion.div>
                        <motion.div animate={{ scale: [0, 1.5], opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="text-yellow-400" size={40} />
                        </motion.div>
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
                    <p className="mt-3 text-gray-700 dark:text-gray-300 font-medium">
                      {healthScore.score >= 90 ? t('excellent') : healthScore.score >= 70 ? t('good') : healthScore.score >= 50 ? t('fair') : t('poor')}
                    </p>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">{t('scoreBasis')}</h3>
                    {healthScore.details.map((detail, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-800 dark:text-white">{detail.metric}</span>
                          <span className={`text-sm font-bold ${detail.points >= 8 ? 'text-green-600' : detail.points >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>+{detail.points} {t('points')}</span>
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
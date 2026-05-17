import { User, HealthRecord } from '../App';
import { LineChart, Settings as SettingsIcon, TrendingUp, Activity, Calendar, ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

interface DashboardProps {
  user: User | null;
  healthRecords: HealthRecord[];
}

const AVAILABLE_METRICS = [
  { key: 'weight', labelZh: '体重', labelEn: 'Weight', unit: 'kg', color: '#3b82f6', icon: '⚖️' },
  { key: 'bmi', labelZh: 'BMI', labelEn: 'BMI', unit: '', color: '#8b5cf6', icon: '📊' },
  { key: 'body_fat', labelZh: '体脂率', labelEn: 'Body Fat', unit: '%', color: '#f59e0b', icon: '🔥' },
  { key: 'heart_rate', labelZh: '心率', labelEn: 'Heart Rate', unit: 'bpm', color: '#ef4444', icon: '❤️' },
  { key: 'blood_pressure', labelZh: '血压', labelEn: 'Blood Pressure', unit: 'mmHg', color: '#ec4899', icon: '💓' },
  { key: 'blood_sugar', labelZh: '血糖', labelEn: 'Blood Sugar', unit: 'mmol/L', color: '#10b981', icon: '🩸' },
  { key: 'blood_oxygen', labelZh: '血氧', labelEn: 'Blood Oxygen', unit: '%', color: '#06b6d4', icon: '💨' },
  { key: 'muscle_mass', labelZh: '肌肉量', labelEn: 'Muscle Mass', unit: 'kg', color: '#6366f1', icon: '💪' },
  { key: 'body_water', labelZh: '体水分', labelEn: 'Body Water', unit: 'kg', color: '#14b8a6', icon: '💧' },
  { key: 'visceral_fat', labelZh: '内脏脂肪', labelEn: 'Visceral Fat', unit: '级', color: '#f97316', icon: '🎯' },
  { key: 'basal_metabolic_rate', labelZh: '基础代谢率', labelEn: 'BMR', unit: 'kcal', color: '#8b5cf6', icon: '⚡' },
  { key: 'sleep_level', labelZh: '睡眠等级', labelEn: 'Sleep Score', unit: '分', color: '#6366f1', icon: '😴' },
  { key: 'steps', labelZh: '步数', labelEn: 'Steps', unit: '步', color: '#10b981', icon: '👣' },
  { key: 'calories', labelZh: '卡路里', labelEn: 'Calories', unit: 'kcal', color: '#f97316', icon: '🔥' },
];

type TimeRange = 'week' | 'month' | 'quarter' | 'halfYear' | 'year' | 'all';

const timeRangeOptions: { value: TimeRange; labelKey: string; days: number | null }[] = [
  { value: 'week', labelKey: 'week', days: 7 },
  { value: 'month', labelKey: 'month', days: 30 },
  { value: 'quarter', labelKey: 'quarter', days: 90 },
  { value: 'halfYear', labelKey: 'halfYear', days: 180 },
  { value: 'year', labelKey: 'year', days: 365 },
  { value: 'all', labelKey: 'allTime', days: null },
];

// 辅助函数：安全地解析日期字符串
const parseDateSafe = (dateStr: string): Date => {
  if (dateStr && dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
    }
  }
  return new Date(dateStr);
};

// 辅助函数：比较日期
const isDateAfter = (dateStr: string, cutoffDate: Date): boolean => {
  const recordDate = parseDateSafe(dateStr);
  recordDate.setUTCHours(0, 0, 0, 0);
  cutoffDate.setUTCHours(0, 0, 0, 0);
  return recordDate >= cutoffDate;
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  hover: { scale: 1.02, transition: { duration: 0.2 } }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export function Dashboard({ user, healthRecords }: DashboardProps) {
  const { t, language, formatDate, formatShortDate } = useLanguage();
  const [selectedMetric, setSelectedMetric] = useState<string>('heart_rate');
  const [showMetricSelector, setShowMetricSelector] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('quarter'); // 默认显示最近三月
  const [showTimeRangeSelector, setShowTimeRangeSelector] = useState(false);

  const today = new Date();
  const formattedToday = formatDate(today, { 
    weekday: language === 'zh' ? 'long' : undefined,
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const currentMetric = AVAILABLE_METRICS.find(m => m.key === selectedMetric) || AVAILABLE_METRICS[0];
  const currentMetricLabel = language === 'zh' ? currentMetric.labelZh : currentMetric.labelEn;
  const currentMetricUnit = currentMetric.unit;

  // 筛选时间范围
  const filteredRecords = useMemo(() => {
    const option = timeRangeOptions.find(opt => opt.value === timeRange);
    const days = option?.days;
    
    // 先按日期排序（从旧到新）
    const sortedRecords = [...healthRecords].sort((a, b) => {
      return parseDateSafe(a.date).getTime() - parseDateSafe(b.date).getTime();
    });
    
    // 如果是 'all' 或者没有 days 限制，返回所有记录
    if (days === null) {
      return sortedRecords;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    cutoffDate.setUTCHours(0, 0, 0, 0);
    
    const filtered = sortedRecords.filter(record => {
      if (!record.date) return false;
      return isDateAfter(record.date, cutoffDate);
    });
    
    return filtered;
  }, [healthRecords, timeRange]);

  // 生成图表数据
  const chartData = useMemo(() => {
    const data = filteredRecords.map(record => {
      let value = record[selectedMetric as keyof HealthRecord];
      
      if (selectedMetric === 'blood_pressure' && typeof value === 'string') {
        const parts = value.split('/');
        value = parseInt(parts[0]);
      }
      
      const isValidValue = value !== undefined && value !== null && !isNaN(Number(value));
      
      return {
        date: formatShortDate(record.date),
        fullDate: record.date,
        value: isValidValue ? Number(value) : null,
      };
    }).filter(item => item.value !== null);
    
    return data;
  }, [filteredRecords, selectedMetric, formatShortDate]);

  const yAxisDomain = useMemo(() => {
    const values = chartData.map(d => d.value).filter(v => v !== null) as number[];
    if (values.length === 0) return ['auto', 'auto'];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1;
    
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [chartData]);

  const stats = useMemo(() => {
    if (filteredRecords.length === 0) return null;
    
    let values = filteredRecords
      .map(r => r[selectedMetric as keyof HealthRecord] as number | string)
      .filter(v => v !== undefined && v !== null);
    
    if (selectedMetric === 'blood_pressure') {
      values = values.map(v => {
        if (typeof v === 'string') {
          const parsed = parseInt(v.split('/')[0]);
          return isNaN(parsed) ? null : parsed;
        }
        return v;
      }).filter(v => v !== null);
    }
    
    const numericValues = values as number[];
    if (numericValues.length === 0) return null;
    
    const latest = numericValues[numericValues.length - 1];
    const first = numericValues[0];
    const avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    const max = Math.max(...numericValues);
    const min = Math.min(...numericValues);
    const change = first !== 0 ? ((latest - first) / first * 100).toFixed(1) : null;
    
    return {
      latest,
      avg: avg.toFixed(1),
      max,
      min,
      change,
      totalDays: filteredRecords.length,
      startDate: filteredRecords[0].date,
      endDate: filteredRecords[filteredRecords.length - 1].date,
    };
  }, [filteredRecords, selectedMetric]);

  const currentRangeLabel = t(timeRangeOptions.find(opt => opt.value === timeRange)?.labelKey || 'quarter');

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-7xl mx-auto">
      <motion.header variants={cardVariants} className="mb-8">
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
          <h1 className="text-2xl font-bold mb-1">{t('welcomeBack')}, {user?.name}! 👋</h1>
          <p className="text-indigo-100">{formattedToday}</p>
        </div>
      </motion.header>

      <div className="space-y-6">
        <motion.div variants={cardVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative">
              <button
                onClick={() => setShowTimeRangeSelector(!showTimeRangeSelector)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all"
              >
                <Calendar size={18} />
                <span>{currentRangeLabel}</span>
                <ChevronDown size={16} className={`transition-transform ${showTimeRangeSelector ? 'rotate-180' : ''}`} />
              </button>
              {showTimeRangeSelector && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-10 overflow-hidden">
                  {timeRangeOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTimeRange(option.value);
                        setShowTimeRangeSelector(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        timeRange === option.value ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {t(option.labelKey)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMetricSelector(!showMetricSelector)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all"
              >
                <SettingsIcon size={18} />
                <span>{currentMetricLabel}</span>
                <ChevronDown size={16} className={`transition-transform ${showMetricSelector ? 'rotate-180' : ''}`} />
              </button>
              {showMetricSelector && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-10 overflow-hidden w-52">
                  {AVAILABLE_METRICS.map(metric => {
                    const metricLabel = language === 'zh' ? metric.labelZh : metric.labelEn;
                    return (
                      <button
                        key={metric.key}
                        onClick={() => {
                          setSelectedMetric(metric.key);
                          setShowMetricSelector(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          selectedMetric === metric.key ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="mr-2">{metric.icon}</span>
                        {metricLabel}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {stats && (
          <motion.div variants={cardVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('currentValue')}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.latest} {currentMetricUnit}</p>
              <p className="text-xs text-gray-400">{formatDate(stats.endDate)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('averageValue')}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.avg} {currentMetricUnit}</p>
              <p className="text-xs text-gray-400">{t('daysTracked')}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('highestValue')}</p>
              <p className="text-2xl font-bold text-green-600">{stats.max} {currentMetricUnit}</p>
              <p className="text-xs text-gray-400">{t('highestValue')}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('lowestValue')}</p>
              <p className="text-2xl font-bold text-blue-600">{stats.min} {currentMetricUnit}</p>
              <p className="text-xs text-gray-400">{t('lowestValue')}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('changeTrend')}</p>
              <p className={`text-2xl font-bold ${stats.change && parseFloat(stats.change) > 0 ? 'text-red-600' : parseFloat(stats.change || '0') < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                {stats.change && parseFloat(stats.change) > 0 ? '+' : ''}{stats.change || '0'}%
              </p>
              <p className="text-xs text-gray-400">{t('changeTrend')}</p>
            </div>
          </motion.div>
        )}

        {filteredRecords.length > 0 && chartData.length > 0 ? (
          <motion.div variants={cardVariants} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-gray-800 dark:text-white font-semibold text-lg">{currentMetricLabel} {t('healthTrends')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{currentRangeLabel}{t('daysTracked')} · {filteredRecords.length} {t('records')}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentMetric.color }}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{currentMetricLabel}</span>
              </div>
            </div>
            
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis 
                    stroke="#6b7280" 
                    style={{ fontSize: '12px' }}
                    domain={yAxisDomain as [number, number]}
                    label={{ 
                      value: currentMetricUnit, 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fontSize: '12px', fill: '#6b7280' }
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value: any) => [`${value} ${currentMetricUnit}`, currentMetricLabel]}
                    labelFormatter={(label) => `${t('date')}: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={currentMetric.color}
                    strokeWidth={3}
                    dot={{ r: 5, fill: currentMetric.color, strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">{t('date')}</th>
                    <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">{currentMetricLabel} ({currentMetricUnit})</th>
                    <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">{t('change')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...chartData].reverse().map((item, index) => {
                    const prevValue = chartData[chartData.length - 1 - (index + 1)]?.value as number;
                    const currentValue = item.value as number;
                    const change = prevValue ? ((currentValue - prevValue) / prevValue * 100).toFixed(1) : null;
                    const isIncrease = change && parseFloat(change) > 0;
                    
                    return (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{item.date}</td>
                        <td className="text-right py-2 px-3 font-medium text-gray-800 dark:text-white">{currentValue} {currentMetricUnit}</td>
                        <td className="text-right py-2 px-3">
                          {change ? (
                            <span className={isIncrease ? 'text-red-500' : 'text-green-500'}>
                              {isIncrease ? '↑' : '↓'} {Math.abs(parseFloat(change))}%
                            </span>
                          ) : '-'}
                        </td>
                       </tr>
                    );
                  })}
                </tbody>
               </table>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={cardVariants} className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-yellow-100 dark:bg-yellow-900/50 p-4 rounded-full"><Activity className="text-yellow-600 dark:text-yellow-500" size={48} /></div>
              <div>
                <h3 className="text-xl font-semibold text-yellow-800 dark:text-yellow-400 mb-2">{t('noData')}</h3>
                <p className="text-yellow-600 dark:text-yellow-500">{t('addDataFirst')}</p>
              </div>
            </div>
          </motion.div>
        )}

        {filteredRecords.length > 0 && stats && (
          <motion.div variants={cardVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div whileHover="hover" variants={cardVariants} className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-blue-100">{t('totalRecords')}</h3>
                <div className="bg-white/20 p-2 rounded-xl"><TrendingUp size={20} /></div>
              </div>
              <p className="text-3xl font-bold">{filteredRecords.length}</p>
              <p className="text-sm text-blue-100 mt-1">{currentRangeLabel}</p>
            </motion.div>

            <motion.div whileHover="hover" variants={cardVariants} className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-purple-100">{t('latestUpdate')}</h3>
                <div className="bg-white/20 p-2 rounded-xl"><Activity size={20} /></div>
              </div>
              <p className="text-xl font-bold">{filteredRecords[filteredRecords.length - 1]?.date || 'N/A'}</p>
              <p className="text-sm text-purple-100 mt-1">{t('latest')}</p>
            </motion.div>

            <motion.div whileHover="hover" variants={cardVariants} className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-green-100">{t('metricsTracked')}</h3>
                <div className="bg-white/20 p-2 rounded-xl"><LineChart size={20} /></div>
              </div>
              <p className="text-3xl font-bold">{currentMetricLabel}</p>
              <p className="text-sm text-green-100 mt-1">{t('currentValue')}</p>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
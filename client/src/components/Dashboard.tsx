import { User, HealthRecord } from '../App';
import { TrendingUp, Activity, Calendar, ChevronDown, Plus, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

interface DashboardProps {
  user: User | null;
  healthRecords: HealthRecord[];
}

// 所有可能指标的配置（用于显示标签和单位）
const ALL_METRICS_CONFIG = [
  { key: 'heart_rate', labelZh: '心率', labelEn: 'Heart Rate', unit: 'bpm', color: '#ef4444', icon: '❤️' },
  { key: 'steps', labelZh: '步数', labelEn: 'Steps', unit: '步', color: '#10b981', icon: '👣' },
  { key: 'blood_pressure', labelZh: '血压', labelEn: 'Blood Pressure', unit: 'mmHg', color: '#ec4899', icon: '💓' },
  { key: 'weight', labelZh: '体重', labelEn: 'Weight', unit: 'kg', color: '#3b82f6', icon: '⚖️' },
  { key: 'bmi', labelZh: 'BMI', labelEn: 'BMI', unit: '', color: '#8b5cf6', icon: '📊' },
  { key: 'body_fat', labelZh: '体脂率', labelEn: 'Body Fat', unit: '%', color: '#f59e0b', icon: '🔥' },
  { key: 'blood_sugar', labelZh: '血糖', labelEn: 'Blood Sugar', unit: 'mmol/L', color: '#10b981', icon: '🩸' },
  { key: 'sleep_level', labelZh: '睡眠等级', labelEn: 'Sleep Score', unit: '分', color: '#6366f1', icon: '😴' },
  { key: 'calories', labelZh: '卡路里', labelEn: 'Calories', unit: 'kcal', color: '#f97316', icon: '🔥' },
  { key: 'muscle_mass', labelZh: '肌肉量', labelEn: 'Muscle Mass', unit: 'kg', color: '#6366f1', icon: '💪' },
  { key: 'visceral_fat', labelZh: '内脏脂肪', labelEn: 'Visceral Fat', unit: '级', color: '#f97316', icon: '🎯' },
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

// 辅助日期函数
const parseDateSafe = (dateStr: string): Date => {
  if (dateStr && dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) return new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
  }
  return new Date(dateStr);
};

const isDateAfter = (dateStr: string, cutoffDate: Date): boolean => {
  const recordDate = parseDateSafe(dateStr);
  recordDate.setUTCHours(0, 0, 0, 0);
  cutoffDate.setUTCHours(0, 0, 0, 0);
  return recordDate >= cutoffDate;
};

// 获取健康记录中实际有数据的指标列表
const getAvailableMetrics = (records: HealthRecord[]): string[] => {
  const available: string[] = [];
  for (const metric of ALL_METRICS_CONFIG) {
    const hasData = records.some(record => {
      let val = record[metric.key as keyof HealthRecord];
      if (metric.key === 'blood_pressure' && typeof val === 'string') val = parseInt(val.split('/')[0]);
      return val !== undefined && val !== null && !isNaN(Number(val));
    });
    if (hasData) available.push(metric.key);
  }
  return available;
};

// 单个图表组件 (独立管理自己的指标和时间范围)
interface ChartCardProps {
  id: string;
  metricKey: string;
  timeRange: TimeRange;
  records: HealthRecord[];
  availableMetrics: string[];
  language: 'zh' | 'en';
  formatShortDate: (date: string) => string;
  onMetricChange: (newMetric: string) => void;
  onTimeRangeChange: (newRange: TimeRange) => void;
  onRemove: () => void;
}

function ChartCard({
  metricKey,
  timeRange,
  records,
  availableMetrics,
  language,
  formatShortDate,
  onMetricChange,
  onTimeRangeChange,
  onRemove,
}: ChartCardProps) {
  const { t } = useLanguage();
  const [showMetricSelector, setShowMetricSelector] = useState(false);
  const [showTimeSelector, setShowTimeSelector] = useState(false);

  const metricConfig = ALL_METRICS_CONFIG.find(m => m.key === metricKey);
  const metricLabel = metricConfig ? (language === 'zh' ? metricConfig.labelZh : metricConfig.labelEn) : metricKey;
  const metricUnit = metricConfig?.unit || '';
  const metricColor = metricConfig?.color || '#6366f1';
  const metricIcon = metricConfig?.icon || '📈';

  const currentRangeLabel = t(timeRangeOptions.find(opt => opt.value === timeRange)?.labelKey || 'allTime');

  // 生成图表数据
  const chartData = useMemo(() => {
    // 1. 排序
    let filtered = [...records].sort((a, b) => 
      parseDateSafe(a.date).getTime() - parseDateSafe(b.date).getTime()
    );
    // 2. 时间范围过滤
    const option = timeRangeOptions.find(opt => opt.value === timeRange);
    const days = option?.days;
    if (days !== null) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      cutoffDate.setUTCHours(0, 0, 0, 0);
      filtered = filtered.filter(record => isDateAfter(record.date, cutoffDate));
    }
    // 3. 提取数值
    const data = filtered.map(record => {
      let value = record[metricKey as keyof HealthRecord];
      if (metricKey === 'blood_pressure' && typeof value === 'string') {
        const parts = value.split('/');
        value = parseInt(parts[0]); // 收缩压
      }
      const isValid = value !== undefined && value !== null && !isNaN(Number(value));
      return {
        date: formatShortDate(record.date),
        fullDate: record.date,
        value: isValid ? Number(value) : null,
      };
    }).filter(item => item.value !== null);
    return data;
  }, [records, timeRange, metricKey, formatShortDate]);

  // 统计信息
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const values = chartData.map(d => d.value as number);
    const latest = values[values.length - 1];
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { latest, avg: avg.toFixed(1), count: values.length };
  }, [chartData]);

  // Y轴范围
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return ['auto', 'auto'];
    const values = chartData.map(d => d.value as number);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [chartData]);

  const handleMetricSelect = (key: string) => {
    onMetricChange(key);
    setShowMetricSelector(false);
  };

  const handleTimeSelect = (range: TimeRange) => {
    onTimeRangeChange(range);
    setShowTimeSelector(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{metricIcon}</span>
            {/* 指标选择下拉 */}
            <div className="relative">
              <button
                onClick={() => setShowMetricSelector(!showMetricSelector)}
                className="flex items-center gap-1 px-2 py-1 text-sm font-semibold text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {metricLabel}
                <ChevronDown size={14} className={`transition-transform ${showMetricSelector ? 'rotate-180' : ''}`} />
              </button>
              {showMetricSelector && (
                <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 min-w-[120px]">
                  {availableMetrics.map(key => {
                    const cfg = ALL_METRICS_CONFIG.find(m => m.key === key);
                    const label = cfg ? (language === 'zh' ? cfg.labelZh : cfg.labelEn) : key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleMetricSelect(key)}
                        className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          metricKey === key ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {stats && (
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {stats.count} {t('records')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* 时间范围选择 */}
            <div className="relative">
              <button
                onClick={() => setShowTimeSelector(!showTimeSelector)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Calendar size={12} />
                <span>{currentRangeLabel}</span>
                <ChevronDown size={12} className={`transition-transform ${showTimeSelector ? 'rotate-180' : ''}`} />
              </button>
              {showTimeSelector && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 w-28">
                  {timeRangeOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleTimeSelect(opt.value)}
                      className={`block w-full text-left px-3 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        timeRange === opt.value ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {t(opt.labelKey)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* 删除按钮 */}
            <button
              onClick={onRemove}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title={t('removeChart')}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {stats && (
          <div className="flex gap-4 mt-3 text-xs">
            <div><span className="text-gray-500">{t('currentValue')}: </span><span className="font-medium">{stats.latest} {metricUnit}</span></div>
            <div><span className="text-gray-500">{t('averageValue')}: </span><span className="font-medium">{stats.avg} {metricUnit}</span></div>
          </div>
        )}
      </div>
      <div className="p-3 h-56">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis stroke="#6b7280" fontSize={10} domain={yAxisDomain as [number, number]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                formatter={(value: any) => [`${value} ${metricUnit}`, metricLabel]}
                labelFormatter={(label) => `${t('date')}: ${label}`}
              />
              <Line type="monotone" dataKey="value" stroke={metricColor} strokeWidth={2} dot={{ r: 3, fill: metricColor }} activeDot={{ r: 5 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            {t('noDataForMetric')}
          </div>
        )}
      </div>
    </div>
  );
}

export function Dashboard({ user, healthRecords }: DashboardProps) {
  const { t, language, formatDate, formatShortDate } = useLanguage();

  // 获取有数据的指标列表
  const availableMetrics = useMemo(() => getAvailableMetrics(healthRecords), [healthRecords]);

  // 图表列表状态：每个图表包含唯一id，选择的指标，时间范围
  const [charts, setCharts] = useState<Array<{ id: string; metricKey: string; timeRange: TimeRange }>>([]);

  // 初始化：默认添加心率和步数（如果它们有数据）
  useMemo(() => {
    if (charts.length === 0 && availableMetrics.length > 0) {
      const defaultCharts = [];
      if (availableMetrics.includes('heart_rate')) defaultCharts.push({ id: crypto.randomUUID(), metricKey: 'heart_rate', timeRange: 'all' });
      if (availableMetrics.includes('steps')) defaultCharts.push({ id: crypto.randomUUID(), metricKey: 'steps', timeRange: 'all' });
      if (defaultCharts.length === 0 && availableMetrics.length > 0) {
        // 如果心率和步数都没有，则添加第一个可用指标
        defaultCharts.push({ id: crypto.randomUUID(), metricKey: availableMetrics[0], timeRange: 'all' });
      }
      if (defaultCharts.length > 0) setCharts(defaultCharts);
    }
  }, [availableMetrics, charts.length]);

  const addNewChart = () => {
    if (availableMetrics.length === 0) return;
    // 选择一个未使用或默认第一个
    const usedMetrics = charts.map(c => c.metricKey);
    let newMetric = availableMetrics.find(m => !usedMetrics.includes(m));
    if (!newMetric) newMetric = availableMetrics[0];
    const newChart = {
      id: crypto.randomUUID(),
      metricKey: newMetric,
      timeRange: 'all' as TimeRange,
    };
    setCharts([...charts, newChart]);
  };

  const updateChartMetric = (chartId: string, newMetric: string) => {
    setCharts(charts.map(chart => chart.id === chartId ? { ...chart, metricKey: newMetric } : chart));
  };

  const updateChartTimeRange = (chartId: string, newRange: TimeRange) => {
    setCharts(charts.map(chart => chart.id === chartId ? { ...chart, timeRange: newRange } : chart));
  };

  const removeChart = (chartId: string) => {
    setCharts(charts.filter(chart => chart.id !== chartId));
  };

  const today = new Date();
  const formattedToday = formatDate(today, {
    weekday: language === 'zh' ? 'long' : undefined,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sortedRecords = useMemo(() => {
    return [...healthRecords].sort((a, b) => parseDateSafe(a.date).getTime() - parseDateSafe(b.date).getTime());
  }, [healthRecords]);

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
          <h1 className="text-2xl font-bold mb-1">{t('welcomeBack')}, {user?.name}! 👋</h1>
          <p className="text-indigo-100">{formattedToday}</p>
          <div className="mt-3 text-sm text-indigo-100 flex flex-wrap gap-4">
            <span>📊 {t('totalRecords')}: {healthRecords.length}</span>
            <span>📈 {t('activeCharts')}: {charts.length}</span>
          </div>
        </div>
      </header>

      {/* 添加图表按钮 */}
      {availableMetrics.length > 0 && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={addNewChart}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>{t('addChart')}</span>
          </button>
        </div>
      )}

      {/* 图表网格 */}
      {charts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
          <Activity className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-gray-800 dark:text-white font-medium mb-2">{t('noCharts')}</h3>
          <p className="text-gray-500">{t('clickAddChart')}</p>
          {availableMetrics.length === 0 && <p className="text-gray-400 text-sm mt-2">{t('noDataAvailable')}</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {charts.map(chart => (
              <motion.div
                key={chart.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <ChartCard
                  id={chart.id}
                  metricKey={chart.metricKey}
                  timeRange={chart.timeRange}
                  records={sortedRecords}
                  availableMetrics={availableMetrics}
                  language={language}
                  formatShortDate={formatShortDate}
                  onMetricChange={(newMetric) => updateChartMetric(chart.id, newMetric)}
                  onTimeRangeChange={(newRange) => updateChartTimeRange(chart.id, newRange)}
                  onRemove={() => removeChart(chart.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 底部统计卡片 */}
      {sortedRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-blue-100 text-sm">{t('totalRecords')}</h3>
              <TrendingUp size={20} className="text-blue-100" />
            </div>
            <p className="text-3xl font-bold">{sortedRecords.length}</p>
            <p className="text-xs text-blue-100 mt-1">{t('allTime')}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-purple-100 text-sm">{t('latestUpdate')}</h3>
              <Activity size={20} className="text-purple-100" />
            </div>
            <p className="text-xl font-bold">{sortedRecords[sortedRecords.length - 1]?.date || 'N/A'}</p>
            <p className="text-xs text-purple-100 mt-1">{t('latest')}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-green-100 text-sm">{t('activeCharts')}</h3>
              <SettingsIcon size={20} className="text-green-100" />
            </div>
            <p className="text-3xl font-bold">{charts.length}</p>
            <p className="text-xs text-green-100 mt-1">{t('chartsDisplayed')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
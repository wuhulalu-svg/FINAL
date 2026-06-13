import { User, Alert, HealthGoal } from '../App';
import { AlertTriangle, AlertCircle, CheckCircle, Calendar, X, Target, Heart, Activity, Droplet, Scale } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AlertsProps {
  user: User | null;
  alerts: Alert[];
  healthGoals: HealthGoal[];
  onMarkAsRead: (alertId: number) => void;
}

// 目标未完成告警的翻译
const goalAlertTranslations: { [key: string]: { zh: string; en: string } } = {
  '步数目标未完成': { zh: '步数目标未完成', en: 'Steps Goal Not Achieved' },
  '体重目标未完成': { zh: '体重目标未完成', en: 'Weight Goal Not Achieved' },
  'BMI目标未完成': { zh: 'BMI目标未完成', en: 'BMI Goal Not Achieved' },
  '体脂率目标未完成': { zh: '体脂率目标未完成', en: 'Body Fat Goal Not Achieved' },
  '心率目标未完成': { zh: '心率目标未完成', en: 'Heart Rate Goal Not Achieved' },
  '血糖目标未完成': { zh: '血糖目标未完成', en: 'Blood Sugar Goal Not Achieved' },
  '睡眠质量目标未完成': { zh: '睡眠质量目标未完成', en: 'Sleep Quality Goal Not Achieved' },
  '卡路里目标未完成': { zh: '卡路里目标未完成', en: 'Calories Goal Not Achieved' },
  'Steps目标未完成': { zh: '步数目标未完成', en: 'Steps Goal Not Achieved' },
  'Weight目标未完成': { zh: '体重目标未完成', en: 'Weight Goal Not Achieved' },
  'Body Fat目标未完成': { zh: '体脂率目标未完成', en: 'Body Fat Goal Not Achieved' },
  'Heart Rate目标未完成': { zh: '心率目标未完成', en: 'Heart Rate Goal Not Achieved' },
  'Blood Sugar目标未完成': { zh: '血糖目标未完成', en: 'Blood Sugar Goal Not Achieved' },
  'Sleep Quality目标未完成': { zh: '睡眠质量目标未完成', en: 'Sleep Quality Goal Not Achieved' },
  'Calories目标未完成': { zh: '卡路里目标未完成', en: 'Calories Goal Not Achieved' },
};

// 红色警告（健康风险）标题的翻译
const criticalAlertTranslations: { [key: string]: { zh: string; en: string } } = {
  '!!! 心动过速风险 !!!': { zh: '!!! 心动过速风险 !!!', en: '!!! Tachycardia Risk !!!' },
  '!!! 心动过缓风险 !!!': { zh: '!!! 心动过缓风险 !!!', en: '!!! Bradycardia Risk !!!' },
  '!!! 高血压风险 !!!': { zh: '!!! 高血压风险 !!!', en: '!!! Hypertension Risk !!!' },
  '!!! 低血压风险 !!!': { zh: '!!! 低血压风险 !!!', en: '!!! Hypotension Risk !!!' },
  '!!! 糖尿病风险 !!!': { zh: '!!! 糖尿病风险 !!!', en: '!!! Diabetes Risk !!!' },
  '!!! 高血糖风险 !!!': { zh: '!!! 高血糖风险 !!!', en: '!!! High Blood Sugar Risk !!!' },
  '!!! 低血糖风险 !!!': { zh: '!!! 低血糖风险 !!!', en: '!!! Hypoglycemia Risk !!!' },
  '!!! 肥胖风险 !!!': { zh: '!!! 肥胖风险 !!!', en: '!!! Obesity Risk !!!' },
  '!!! 体重严重不足 !!!': { zh: '!!! 体重严重不足 !!!', en: '!!! Severely Underweight !!!' },
  '!!! 营养不良风险 !!!': { zh: '!!! 营养不良风险 !!!', en: '!!! Malnutrition Risk !!!' },
  '!!! 严重睡眠障碍 !!!': { zh: '!!! 严重睡眠障碍 !!!', en: '!!! Severe Sleep Disorder !!!' },
  '!!! 严重缺乏运动 !!!': { zh: '!!! 严重缺乏运动 !!!', en: '!!! Severe Lack of Exercise !!!' },
  '!!! 体脂率严重超标 !!!': { zh: '!!! 体脂率严重超标 !!!', en: '!!! Critical Body Fat !!!' },
  '!!! 体脂率严重偏低 !!!': { zh: '!!! 体脂率严重偏低 !!!', en: '!!! Critical Low Body Fat !!!' },
};

// 告警描述直接映射表（中文 -> 英文）
const descriptionTranslations: { [key: string]: string } = {
  // 体重严重不足
  '您的体重已严重低于健康范围，可能导致营养不良和免疫力下降，请立即就医检查。': 'Your weight is severely below the healthy range, which may lead to malnutrition and weakened immunity. Please consult a doctor immediately.',
  
  // 高血糖风险
  '您的血糖持续偏高，需警惕糖尿病，请立即就医检查！': 'Your blood sugar remains high, which may indicate diabetes risk. Please consult a doctor immediately!',
  '您的血糖持续偏高，需警惕糖尿病，请立即就医检查。': 'Your blood sugar remains high, which may indicate diabetes risk. Please consult a doctor immediately.',
  
  // 低血糖风险
  '您的血糖持续偏低，可能导致晕厥，请立即补充糖分并就医！': 'Your blood sugar remains low, which may cause fainting. Please consume sugar immediately and seek medical attention!',
  '您过去7天的平均血糖为6.5 mmol/L，高于正常范围(3.9-6.1 mmol/L)。请注意饮食控制。': 'Your average blood sugar over the past 7 days is 6.5 mmol/L, which is higher than the normal range (3.9-6.1 mmol/L). Please pay attention to diet control.',
  '您过去7天的平均血糖为3.5 mmol/L，低于正常范围(3.9-6.1 mmol/L)。请注意补充能量。': 'Your average blood sugar over the past 7 days is 3.5 mmol/L, which is lower than the normal range (3.9-6.1 mmol/L). Please supplement energy in time.',
  
  // 心率相关
  '您过去7天的平均心率为110 bpm，高于正常范围(60-100 bpm)。请及时就医检查。': 'Your average heart rate over the past 7 days is 110 bpm, which is higher than the normal range (60-100 bpm). Please consult a doctor.',
  '您过去7天的平均心率为45 bpm，低于正常范围(60-100 bpm)。请及时就医检查。': 'Your average heart rate over the past 7 days is 45 bpm, which is lower than the normal range (60-100 bpm). Please consult a doctor.',
  
  // 血压相关
  '您过去7天中有5天血压偏高，平均收缩压145 mmHg。请监测血压并及时就医。': 'You had high blood pressure for 5 out of 7 days in the past week. Average systolic pressure was 145 mmHg. Please monitor your blood pressure.',
  
  // BMI相关
  '您的BMI为30.5，属于肥胖范围。建议控制饮食，增加运动。': 'Your BMI is 30.5, which is in the obese range. It is recommended to control your diet and increase exercise.',
  '您的BMI为17.5，属于偏瘦范围。建议增加营养摄入。': 'Your BMI is 17.5, which is in the underweight range. Please increase nutritional intake.',
  
  // 体脂相关
  '您的体脂率为28%，高于健康范围。建议加强有氧运动。': 'Your body fat percentage is 28%, which is higher than the healthy range. It is recommended to increase aerobic exercise.',
  
  // 睡眠相关
  '您过去7天的平均睡眠评分为45分，低于健康标准。建议保持规律作息。': 'Your average sleep score over the past 7 days is 45, which is below the healthy standard. Please maintain a regular sleep schedule.',
  
  // 运动相关
  '您过去7天的平均步数为3500步，低于推荐值(8000步/天)。建议增加日常活动量。': 'Your average daily steps over the past 7 days is 3500, which is below the recommended value (8000 steps/day). Please increase daily activity.',
  
  // 体重变化
  '7天内体重增加了3kg，变化过快。请注意健康管理。': 'Your weight increased by 3kg in 7 days, which is too rapid. Please pay attention to health management.',
  '7天内体重减少了3kg，变化过快。请注意健康管理。': 'Your weight decreased by 3kg in 7 days, which is too rapid. Please pay attention to health management.',
  
  // 肌肉量
  '您的肌肉量为30kg，低于健康标准。建议增加力量训练。': 'Your muscle mass is 30kg, which is below the healthy standard. It is recommended to increase strength training.',
};

// 翻译告警描述内容
const translateAlertDescription = (description: string, isZh: boolean): string => {
  if (isZh) return description;
  
  // 1. 精确匹配映射表
  if (descriptionTranslations[description]) {
    return descriptionTranslations[description];
  }
  
  // 2. 模糊匹配
  // 体重严重不足
  if (description.includes('体重已严重低于健康范围')) {
    return 'Your weight is severely below the healthy range, which may lead to malnutrition and weakened immunity. Please consult a doctor immediately.';
  }
  
  // 高血糖风险
  if (description.includes('血糖持续偏高') && description.includes('警惕糖尿病')) {
    return 'Your blood sugar remains high, which may indicate diabetes risk. Please consult a doctor immediately!';
  }
  if (description.includes('血糖持续偏高')) {
    return 'Your blood sugar remains high. Please consult a doctor for advice.';
  }
  
  // 低血糖
  if (description.includes('血糖持续偏低')) {
    return 'Your blood sugar remains low, which may cause fainting. Please consume sugar immediately and seek medical attention!';
  }
  if (description.includes('血糖偏高')) {
    const match = description.match(/(\d+\.?\d*)/);
    return `Your blood sugar is ${match?.[0] || ''} mmol/L, which is higher than the normal range (3.9-6.1 mmol/L). Please pay attention to diet control.`;
  }
  if (description.includes('血糖偏低')) {
    const match = description.match(/(\d+\.?\d*)/);
    return `Your blood sugar is ${match?.[0] || ''} mmol/L, which is lower than the normal range (3.9-6.1 mmol/L). Please supplement energy in time.`;
  }
  
  // 心率
  if (description.includes('心率过高')) {
    const match = description.match(/(\d+)/);
    return `Your heart rate is ${match?.[0] || ''} bpm, which is higher than the normal range (60-100 bpm). Please consult a doctor.`;
  }
  if (description.includes('心率过低')) {
    const match = description.match(/(\d+)/);
    return `Your heart rate is ${match?.[0] || ''} bpm, which is lower than the normal range (60-100 bpm). Please consult a doctor.`;
  }
  
  // 血压
  if (description.includes('血压偏高') && description.includes('收缩压')) {
    const match = description.match(/(\d+)/);
    return `Your blood pressure is elevated. Average systolic pressure was ${match?.[0] || ''} mmHg. Please monitor your blood pressure.`;
  }
  if (description.includes('血压偏高') || description.includes('血压异常')) {
    return 'Your blood pressure is abnormal. Please monitor and consult a doctor.';
  }
  
  // BMI
  if (description.includes('BMI超标') || (description.includes('BMI') && description.includes('肥胖'))) {
    const match = description.match(/(\d+\.?\d*)/);
    return `Your BMI is ${match?.[0] || ''}, which is in the obese range. It is recommended to control your diet and increase exercise.`;
  }
  if (description.includes('BMI偏低') || (description.includes('BMI') && description.includes('偏瘦'))) {
    const match = description.match(/(\d+\.?\d*)/);
    return `Your BMI is ${match?.[0] || ''}, which is in the underweight range. Please increase nutritional intake.`;
  }
  
  // 体脂
  if (description.includes('体脂率过高')) {
    const match = description.match(/(\d+\.?\d*)/);
    return `Your body fat percentage is ${match?.[0] || ''}%, which is higher than the healthy range. It is recommended to increase aerobic exercise.`;
  }
  
  // 睡眠
  if (description.includes('睡眠质量差')) {
    const match = description.match(/(\d+)/);
    return `Your sleep score is ${match?.[0] || ''}, which is below the healthy standard. Please maintain a regular sleep schedule.`;
  }
  
  // 运动
  if (description.includes('运动量不足')) {
    const match = description.match(/(\d+)/);
    return `Your average daily steps is ${match?.[0] || ''}, which is below the recommended value (8000 steps/day). Please increase daily activity.`;
  }
  
  // 体重快速变化
  if (description.includes('体重快速上升')) {
    const match = description.match(/(\d+)/g);
    if (match) {
      return `Your weight increased by ${match[0]}kg in ${match[1] || '7'} days, which is too rapid. Please pay attention to health management.`;
    }
    return 'Your weight is increasing too rapidly. Please pay attention to health management.';
  }
  if (description.includes('体重快速下降')) {
    const match = description.match(/(\d+)/g);
    if (match) {
      return `Your weight decreased by ${match[0]}kg in ${match[1] || '7'} days, which is too rapid. Please pay attention to health management.`;
    }
    return 'Your weight is decreasing too rapidly. Please pay attention to health management.';
  }
  
  // 肌肉量
  if (description.includes('肌肉量不足')) {
    const match = description.match(/(\d+\.?\d*)/);
    return `Your muscle mass is ${match?.[0] || ''}kg, which is below the healthy standard. Please increase strength training.`;
  }
  
  // 目标未完成
  const startDateMatch = description.match(/在 (\d{4}-\d{2}-\d{2}) 至 (\d{4}-\d{2}-\d{2}) 期间/);
  const targetMatch = description.match(/目标为?\s*([\d.]+)/);
  const currentMatch = description.match(/当前值为?\s*([\d.]+)/);
  
  let metricEn = 'goal';
  if (description.includes('步数') || description.includes('Steps')) metricEn = 'Steps';
  else if (description.includes('体重') || description.includes('Weight')) metricEn = 'Weight';
  else if (description.includes('BMI')) metricEn = 'BMI';
  else if (description.includes('体脂率') || description.includes('Body Fat')) metricEn = 'Body Fat';
  else if (description.includes('心率') || description.includes('Heart Rate')) metricEn = 'Heart Rate';
  else if (description.includes('血糖') || description.includes('Blood Sugar')) metricEn = 'Blood Sugar';
  else if (description.includes('睡眠质量') || description.includes('Sleep Quality')) metricEn = 'Sleep Quality';
  else if (description.includes('卡路里') || description.includes('Calories')) metricEn = 'Calories';
  
  if (startDateMatch && targetMatch && currentMatch) {
    return `You set a ${metricEn} goal of ${targetMatch[1]} from ${startDateMatch[1]} to ${startDateMatch[2]}, current value is ${currentMatch[1]}. Keep working on it!`;
  }
  
  const uncompletedMatch = description.match(/您未完成\s*(\S+?)\s*目标[（(]目标值\s*([\d.]+)[，,]\s*当前值\s*([\d.]+)[）)]/);
  if (uncompletedMatch) {
    let metric = uncompletedMatch[1];
    if (metric === '步数') metric = 'Steps';
    else if (metric === '体重') metric = 'Weight';
    else if (metric === '体脂率') metric = 'Body Fat';
    else if (metric === '心率') metric = 'Heart Rate';
    else if (metric === '血糖') metric = 'Blood Sugar';
    else if (metric === '睡眠质量') metric = 'Sleep Quality';
    else if (metric === '卡路里') metric = 'Calories';
    return `You have not completed the ${metric} goal (target: ${uncompletedMatch[2]}, current: ${uncompletedMatch[3]}). Keep working hard!`;
  }
  
  // 如果都不匹配，尝试提取通用信息
  if (description.includes('血糖')) {
    return 'Your blood glucose level requires attention. Normal range is 3.9-6.1 mmol/L. Please consult a doctor if needed.';
  }
  if (description.includes('心率')) {
    return 'Your heart rate requires attention. Normal range is 60-100 bpm. Please consult a doctor if needed.';
  }
  if (description.includes('血压')) {
    return 'Your blood pressure requires attention. Normal range is 90-120/60-80 mmHg. Please monitor regularly.';
  }
  if (description.includes('BMI')) {
    return 'Your BMI requires attention. Healthy range is 18.5-24.9. Please consult a doctor for advice.';
  }
  
  return description;
};

export function Alerts({ user, alerts, healthGoals, onMarkAsRead }: AlertsProps) {
  const { language, formatDate } = useLanguage();
  const isZh = language === 'zh';
  
  const criticalAlerts = alerts.filter(a => !a.read && a.type === 'critical');
  const warningAlerts = alerts.filter(a => !a.read && a.type === 'warning');
  const readAlerts = alerts.filter(a => a.read);

  const translateTitle = (title: string, type: string): string => {
    if (type === 'critical') {
      return criticalAlertTranslations[title]?.[language] || title;
    } else {
      for (const key of Object.keys(goalAlertTranslations)) {
        if (title.includes(key) || key.includes(title)) {
          return goalAlertTranslations[key][language];
        }
      }
      return title;
    }
  };

  const getAlertIcon = (title: string) => {
    if (title.includes('心率') || title.includes('Heart')) return <Heart size={20} />;
    if (title.includes('血压') || title.includes('Blood Pressure')) return <Activity size={20} />;
    if (title.includes('血糖') || title.includes('Blood Sugar')) return <Droplet size={20} />;
    if (title.includes('BMI') || title.includes('体脂') || title.includes('Body Fat')) return <Scale size={20} />;
    return <Target size={20} />;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          {isZh ? '健康告警' : 'Health Alerts'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {isZh ? '红色告警：健康风险 | 黄色告警：目标未完成' : 'Red: Health Risks | Yellow: Goals Not Achieved'}
        </p>
      </header>

      <div className="space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-lg">
                <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{criticalAlerts.length}</p>
                <p className="text-sm text-red-600 dark:text-red-400">{isZh ? '红色告警（健康风险）' : 'Red Alerts (Health Risks)'}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded-lg">
                <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{warningAlerts.length}</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">{isZh ? '黄色告警（目标未完成）' : 'Yellow Alerts (Goals Not Achieved)'}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-lg">
                <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{readAlerts.length}</p>
                <p className="text-sm text-green-600 dark:text-green-400">{isZh ? '已读告警' : 'Read Alerts'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 红色警告 - 健康风险 */}
        {criticalAlerts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-red-200 dark:border-red-800">
              <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
              <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">
                {isZh ? '红色告警 - 健康风险' : 'Red Alerts - Health Risks'}
              </h2>
            </div>
            <div className="space-y-3">
              {criticalAlerts.map(alert => (
                <div key={alert.id} className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-red-200 dark:bg-red-800 p-1 rounded-full">
                          {getAlertIcon(alert.title)}
                        </div>
                        <h3 className="text-red-800 dark:text-red-300 font-bold">
                          {translateTitle(alert.title, 'critical')}
                        </h3>
                      </div>
                      <p className="text-red-700 dark:text-red-300 text-sm mb-3">
                        {translateAlertDescription(alert.description, isZh)}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-red-500 dark:text-red-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(alert.date)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onMarkAsRead(alert.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm whitespace-nowrap"
                    >
                      {isZh ? '标记已读' : 'Mark Read'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 黄色警告 - 目标未完成 */}
        {warningAlerts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={24} />
              <h2 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400">
                {isZh ? '黄色告警 - 目标未完成' : 'Yellow Alerts - Goals Not Achieved'}
              </h2>
            </div>
            <div className="space-y-3">
              {warningAlerts.map(alert => (
                <div key={alert.id} className="bg-yellow-50 dark:bg-yellow-950/30 border-l-4 border-yellow-500 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-yellow-200 dark:bg-yellow-800 p-1 rounded-full">
                          {getAlertIcon(alert.title)}
                        </div>
                        <h3 className="text-yellow-800 dark:text-yellow-300 font-semibold">
                          {translateTitle(alert.title, 'warning')}
                        </h3>
                      </div>
                      <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
                        {translateAlertDescription(alert.description, isZh)}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-yellow-500 dark:text-yellow-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(alert.date)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onMarkAsRead(alert.id)}
                      className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm whitespace-nowrap"
                    >
                      {isZh ? '标记已读' : 'Mark Read'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 无活跃告警 */}
        {criticalAlerts.length === 0 && warningAlerts.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm text-center">
            <div className="inline-flex items-center justify-center bg-green-100 dark:bg-green-900/50 p-4 rounded-full mb-4">
              <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              {isZh ? '一切正常！' : 'All Clear!'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {isZh ? '您没有活跃告警。继续保持良好的健康习惯！' : 'You have no active alerts. Keep up the good health habits!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
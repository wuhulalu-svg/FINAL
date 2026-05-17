import { User, Alert, HealthGoal } from '../App';
import { AlertTriangle, AlertCircle, CheckCircle, Calendar, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AlertsProps {
  user: User | null;
  alerts: Alert[];
  healthGoals: HealthGoal[];
  onMarkAsRead: (alertId: number) => void;
}

// 中文到英文的翻译映射
const alertTranslations: { [key: string]: { zh: string; en: string } } = {
  '!!! 心率过高 !!!': {
    zh: '!!! 心率过高 !!!',
    en: '!!! High Heart Rate !!!'
  },
  '!!! 心率过低 !!!': {
    zh: '!!! 心率过低 !!!',
    en: '!!! Low Heart Rate !!!'
  },
  '!!! 血压异常 !!!': {
    zh: '!!! 血压异常 !!!',
    en: '!!! Abnormal Blood Pressure !!!'
  },
  '!!! 血糖偏高 !!!': {
    zh: '!!! 血糖偏高 !!!',
    en: '!!! High Blood Sugar !!!'
  },
  '!!! 血糖偏低 !!!': {
    zh: '!!! 血糖偏低 !!!',
    en: '!!! Low Blood Sugar !!!'
  },
  '⚠️ BMI超标': {
    zh: '⚠️ BMI超标',
    en: '⚠️ High BMI'
  },
  '⚠️ BMI偏低': {
    zh: '⚠️ BMI偏低',
    en: '⚠️ Low BMI'
  },
  '⚠️ 体脂率过高': {
    zh: '⚠️ 体脂率过高',
    en: '⚠️ High Body Fat'
  },
  '⚠️ 睡眠质量差': {
    zh: '⚠️ 睡眠质量差',
    en: '⚠️ Poor Sleep Quality'
  },
  '⚠️ 运动量不足': {
    zh: '⚠️ 运动量不足',
    en: '⚠️ Insufficient Activity'
  },
  '⚠️ 体重快速上升': {
    zh: '⚠️ 体重快速上升',
    en: '⚠️ Rapid Weight Gain'
  },
  '⚠️ 体重快速下降': {
    zh: '⚠️ 体重快速下降',
    en: '⚠️ Rapid Weight Loss'
  },
  '⚠️ 肌肉量不足': {
    zh: '⚠️ 肌肉量不足',
    en: '⚠️ Insufficient Muscle Mass'
  }
};

// 使用正则表达式翻译描述文本
const translateDescription = (description: string, language: 'zh' | 'en'): string => {
  if (language === 'zh') {
    return description;
  }

  // 英文翻译规则
  let result = description;
  
  // 心率相关
  result = result.replace(/您过去(\d+)天的平均心率为(\d+) bpm，高于正常范围\(60-100 bpm\)。请及时就医检查。/g, 
    `Your average heart rate over the past $1 days was $2 bpm, which is higher than the normal range (60-100 bpm). Please consult a doctor.`);
  
  result = result.replace(/您过去(\d+)天的平均心率为(\d+) bpm，低于正常范围\(60-100 bpm\)。请及时就医检查。/g,
    `Your average heart rate over the past $1 days was $2 bpm, which is lower than the normal range (60-100 bpm). Please consult a doctor.`);
  
  // 血压相关
  result = result.replace(/您过去(\d+)天中有(\d+)天血压偏高，平均收缩压(\d+) mmHg。请监测血压并及时就医。/g,
    `You had high blood pressure for $2 out of $1 days in the past week. Average systolic pressure was $3 mmHg. Please consult a doctor.`);
  
  // 血糖相关 - 偏高
  result = result.replace(/您过去(\d+)天的平均血糖为([\d.]+) mmol\/L，高于正常范围\(3\.9-6\.1 mmol\/L\)。请注意饮食控制。/g,
    `Your average blood sugar over the past $1 days was $2 mmol/L, which is higher than the normal range (3.9-6.1 mmol/L). Please focus on dietary control.`);
  
  // 血糖相关 - 偏低
  result = result.replace(/您过去(\d+)天的平均血糖为([\d.]+) mmol\/L，低于正常范围\(3\.9-6\.1 mmol\/L\)。请注意补充能量。/g,
    `Your average blood sugar over the past $1 days was $2 mmol/L, which is lower than the normal range (3.9-6.1 mmol/L). Please ensure adequate nutrition.`);
  
  // BMI相关 - 超标
  result = result.replace(/您的BMI为([\d.]+)，属于肥胖范围。建议控制饮食，增加运动。/g,
    `Your BMI is $1, which is in the obese range. It is recommended to control your diet and increase exercise.`);
  
  // BMI相关 - 偏低
  result = result.replace(/您的BMI为([\d.]+)，属于偏瘦范围。建议增加营养摄入。/g,
    `Your BMI is $1, which is in the underweight range. It is recommended to increase your nutritional intake.`);
  
  // 体脂率相关
  result = result.replace(/您的体脂率为([\d.]+)%，高于健康范围。建议加强有氧运动。/g,
    `Your body fat percentage is $1%, which is higher than the healthy range. It is recommended to increase aerobic exercise.`);
  
  // 睡眠相关
  result = result.replace(/您过去(\d+)天的平均睡眠评分为(\d+)分，低于健康标准。建议保持规律作息。/g,
    `Your average sleep score over the past $1 days is $2, which is below the healthy standard. It is recommended to maintain a regular sleep schedule.`);
  
  // 步数相关
  result = result.replace(/您过去(\d+)天的平均步数为(\d+)步，低于推荐值\(8000步\/天\)。建议增加日常活动量。/g,
    `Your average daily steps over the past $1 days is $2, which is below the recommended value (8000 steps/day). It is recommended to increase your daily activity.`);
  
  // 体重快速上升
  result = result.replace(/(\d+)天内体重增加了([\d.]+)kg，变化过快。请注意健康管理。/g,
    `Your weight increased by $2kg in $1 days, which is too rapid. Please pay attention to health management.`);
  
  // 体重快速下降
  result = result.replace(/(\d+)天内体重��少了([\d.]+)kg，变化过快。请注意健康管理。/g,
    `Your weight decreased by $2kg in $1 days, which is too rapid. Please pay attention to health management.`);
  
  // 肌肉量相关
  result = result.replace(/您的肌肉量为([\d.]+)kg，低于健康标准。建议增加力量训练。/g,
    `Your muscle mass is $1kg, which is below the healthy standard. It is recommended to increase strength training.`);

  return result;
};

export function Alerts({ user, alerts, healthGoals, onMarkAsRead }: AlertsProps) {
  const { language, formatDate } = useLanguage();
  
  const unreadAlerts = alerts.filter(a => !a.read);
  const readAlerts = alerts.filter(a => a.read);
  
  const criticalAlerts = unreadAlerts.filter(a => a.type === 'critical');
  const warningAlerts = unreadAlerts.filter(a => a.type === 'warning');

  // 翻译告警标题
  const translateTitle = (title: string): string => {
    return alertTranslations[title]?.[language] || title;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-gray-800 mb-2">{language === 'zh' ? '健康告警' : 'Health Alerts'}</h1>
        <p className="text-gray-600">{language === 'zh' ? '监控您的健康警告和目标进度' : 'Monitor your health warnings and goal progress'}</p>
      </header>

      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-900">{criticalAlerts.length}</p>
                <p className="text-sm text-red-700">{language === 'zh' ? '严重告警' : 'Critical Alerts'}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <AlertTriangle className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-900">{warningAlerts.length}</p>
                <p className="text-sm text-yellow-700">{language === 'zh' ? '警告' : 'Warning Alerts'}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">{readAlerts.length}</p>
                <p className="text-sm text-green-700">{language === 'zh' ? '已解决' : 'Resolved'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Alerts (Red - 3 exclamation marks) */}
        {criticalAlerts.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-red-600" size={24} />
              <h2 className="text-gray-800">{language === 'zh' ? '!!! 严重健康告警 !!!' : '!!! Critical Health Alerts !!!'}</h2>
            </div>
            <div className="space-y-3">
              {criticalAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className="bg-red-50 border-2 border-red-500 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-red-600 font-bold">!!!</span>
                        <h3 className="text-red-900 font-semibold">{translateTitle(alert.title)}</h3>
                        <span className="text-red-600 font-bold">!!!</span>
                      </div>
                      <p className="text-red-800 text-sm mb-2">{translateDescription(alert.description, language)}</p>
                      <div className="flex items-center gap-4 text-xs text-red-600">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(alert.date)}
                        </span>
                        {alert.metric && <span className="px-2 py-0.5 bg-red-200 rounded">{language === 'zh' ? '相关指标' : 'Related'}: {alert.metric}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => onMarkAsRead(alert.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      {language === 'zh' ? '标记已读' : 'Mark as Read'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning Alerts (Yellow - 1 exclamation mark) */}
        {warningAlerts.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-yellow-600" size={24} />
              <h2 className="text-gray-800">{language === 'zh' ? '目标警告' : 'Goal Warnings'}</h2>
            </div>
            <div className="space-y-3">
              {warningAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-yellow-600 font-bold">!</span>
                        <h3 className="text-yellow-900 font-semibold">{translateTitle(alert.title)}</h3>
                      </div>
                      <p className="text-yellow-800 text-sm mb-2">{translateDescription(alert.description, language)}</p>
                      <div className="flex items-center gap-4 text-xs text-yellow-600">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(alert.date)}
                        </span>
                        {alert.metric && <span className="px-2 py-0.5 bg-yellow-200 rounded">Metric: {alert.metric}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => onMarkAsRead(alert.id)}
                      className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                    >
                      {language === 'zh' ? '标记已读' : 'Mark as Read'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Active Alerts */}
        {unreadAlerts.length === 0 && (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <div className="inline-flex items-center justify-center bg-green-100 p-4 rounded-full mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h3 className="text-gray-800 mb-2">{language === 'zh' ? '一切正常！' : 'All Clear!'}</h3>
            <p className="text-gray-600">{language === 'zh' ? '您没有活跃告警。继续保持！' : 'You have no active alerts. Keep up the great work!'}</p>
          </div>
        )}

        {/* Read Alerts */}
        {readAlerts.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-gray-800 mb-4">{language === 'zh' ? '已解决告警' : 'Resolved Alerts'}</h2>
            <div className="space-y-2">
              {readAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-gray-700 text-sm font-medium">{translateTitle(alert.title)}</h3>
                      <p className="text-xs text-gray-500">
                        {formatDate(alert.date)}
                      </p>
                    </div>
                    <CheckCircle className="text-gray-400" size={20} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { Award, TrendingUp, Activity, Moon, Heart, Apple, Footprints } from 'lucide-react';
import { User, HealthRecord } from '../App';

interface HealthScoreCardProps {
  user: User | null;
  healthRecords?: HealthRecord[];  // 添加健康记录参数
}

export function HealthScoreCard({ user, healthRecords = [] }: HealthScoreCardProps) {
  // 获取最新的健康记录
  const latestRecord = healthRecords.length > 0 ? healthRecords[0] : null;
  
  // 计算各项指标得分和总分
  const calculateScores = () => {
    let activityScore = 70;  // 基础分70
    let sleepScore = 70;
    let vitalsScore = 70;
    let nutritionScore = 70;
    
    // ========== 活动分（步数） ==========
    if (latestRecord?.steps) {
      const steps = latestRecord.steps;
      if (steps >= 10000) activityScore = 100;
      else if (steps >= 8000) activityScore = 90;
      else if (steps >= 6000) activityScore = 80;
      else if (steps >= 5000) activityScore = 70;
      else if (steps >= 3000) activityScore = 55;
      else if (steps >= 1000) activityScore = 40;
      else activityScore = 30;
    } else {
      activityScore = 65; // 无数据时给基础分
    }
    
    // ========== 睡眠分（睡眠等级） ==========
    if (latestRecord?.sleep_level) {
      const sleep = latestRecord.sleep_level;
      if (sleep >= 90) sleepScore = 100;
      else if (sleep >= 80) sleepScore = 90;
      else if (sleep >= 70) sleepScore = 80;
      else if (sleep >= 60) sleepScore = 65;
      else if (sleep >= 50) sleepScore = 50;
      else sleepScore = 35;
    } else {
      sleepScore = 65;
    }
    
    // ========== 生命体征分（BMI + 心率 + 血压 + 血糖） ==========
    let vitalPoints = 70;
    let vitalCount = 1; // 至少有一个基础分
    
    // BMI 评分
    if (latestRecord?.bmi) {
      vitalCount++;
      const bmi = latestRecord.bmi;
      if (bmi >= 18.5 && bmi <= 24) vitalPoints += 15;      // 理想范围 +15
      else if (bmi > 24 && bmi <= 27) vitalPoints += 5;      // 轻微超重 +5
      else if (bmi > 27 && bmi <= 30) vitalPoints -= 5;      // 超重 -5
      else if (bmi > 30) vitalPoints -= 15;                   // 肥胖 -15
      else if (bmi < 18.5 && bmi >= 17) vitalPoints -= 5;    // 偏瘦 -5
      else if (bmi < 17) vitalPoints -= 15;                   // 严重偏瘦 -15
    }
    
    // 心率评分
    if (latestRecord?.heart_rate) {
      vitalCount++;
      const hr = latestRecord.heart_rate;
      if (hr >= 60 && hr <= 80) vitalPoints += 10;           // 理想心率 +10
      else if (hr > 80 && hr <= 100) vitalPoints += 0;       // 正常偏高 +0
      else if (hr > 100 && hr <= 120) vitalPoints -= 10;      // 心动过速 -10
      else if (hr > 120) vitalPoints -= 20;                   // 严重心动过速 -20
      else if (hr < 60 && hr >= 50) vitalPoints -= 5;        // 心动过缓 -5
      else if (hr < 50) vitalPoints -= 15;                    // 严重心动过缓 -15
    }
    
    // 血压评分
    if (latestRecord?.blood_pressure) {
      vitalCount++;
      const bpParts = latestRecord.blood_pressure.split('/');
      if (bpParts.length === 2) {
        const systolic = parseInt(bpParts[0]);
        const diastolic = parseInt(bpParts[1]);
        if (systolic >= 90 && systolic <= 120 && diastolic >= 60 && diastolic <= 80) {
          vitalPoints += 10;  // 理想血压 +10
        } else if (systolic > 120 && systolic <= 140) {
          vitalPoints -= 5;   // 正常高值 -5
        } else if (systolic > 140) {
          vitalPoints -= 15;   // 高血压 -15
        } else if (systolic < 90) {
          vitalPoints -= 10;   // 低血压 -10
        }
      }
    }
    
    // 血糖评分
    if (latestRecord?.blood_sugar) {
      vitalCount++;
      const bs = latestRecord.blood_sugar;
      if (bs >= 3.9 && bs <= 6.1) vitalPoints += 10;         // 正常血糖 +10
      else if (bs > 6.1 && bs <= 7.0) vitalPoints -= 10;      // 糖尿病前期 -10
      else if (bs > 7.0) vitalPoints -= 20;                   // 高血糖 -20
      else if (bs < 3.9 && bs >= 3.0) vitalPoints -= 10;      // 低血糖 -10
      else if (bs < 3.0) vitalPoints -= 20;                   // 严重低血糖 -20
    }
    
    // 计算平均分
    vitalsScore = Math.max(20, Math.min(100, Math.round(vitalPoints / vitalCount)));
    
    // ========== 营养分（体重变化趋势） ==========
    if (latestRecord?.weight) {
      const weight = latestRecord.weight;
      const userWeight = user?.weight;
      if (userWeight && weight) {
        const weightDiff = Math.abs(weight - userWeight);
        if (weightDiff <= 2) nutritionScore = 90;      // 体重稳定
        else if (weightDiff <= 5) nutritionScore = 75;  // 轻微波动
        else nutritionScore = 55;                       // 波动较大
      } else {
        nutritionScore = 70;
      }
    } else {
      nutritionScore = 70;
    }
    
    // ========== 计算总分 ==========
    const totalScore = Math.round(
      (activityScore * 0.3) +      // 活动分权重 30%
      (sleepScore * 0.25) +        // 睡眠分权重 25%
      (vitalsScore * 0.35) +       // 生命体征分权重 35%
      (nutritionScore * 0.1)       // 营养分权重 10%
    );
    
    return {
      totalScore: Math.min(100, Math.max(0, totalScore)),
      activityScore,
      sleepScore,
      vitalsScore,
      nutritionScore,
      scores: [
        { label: 'Activity', score: activityScore, icon: Footprints, key: 'activity' },
        { label: 'Sleep', score: sleepScore, icon: Moon, key: 'sleep' },
        { label: 'Vitals', score: vitalsScore, icon: Heart, key: 'vitals' },
        { label: 'Nutrition', score: nutritionScore, icon: Apple, key: 'nutrition' },
      ]
    };
  };
  
  const { totalScore, scores } = calculateScores();
  
  // 计算与上周的分数变化（模拟，实际需要对比历史数据）
  const scoreChange = 0; // 可以后续实现真正的周对比
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Attention';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-50';
    if (score >= 70) return 'bg-blue-50';
    if (score >= 50) return 'bg-yellow-50';
    return 'bg-red-50';
  };
  
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp size={16} />;
    if (change < 0) return <TrendingUp size={16} className="rotate-180" />;
    return null;
  };

  return (
    <div className={`${getScoreBgColor(totalScore)} rounded-2xl p-8 border-2 ${getScoreColor(totalScore).replace('text-', 'border-')}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Award className={getScoreColor(totalScore)} size={32} />
            <h2 className="text-gray-800 font-semibold">Your Health Score</h2>
          </div>
          <div className="flex items-baseline gap-3 mb-2">
            <span className={`text-5xl font-bold ${getScoreColor(totalScore)}`}>{totalScore}</span>
            <span className="text-2xl text-gray-500">/ 100</span>
          </div>
          <p className={`text-lg font-medium ${getScoreColor(totalScore)}`}>{getScoreLabel(totalScore)}</p>
          <p className="text-sm text-gray-500 mt-2">
            Based on your recent health data
          </p>
        </div>
        <div className="text-right">
          {scoreChange !== 0 && (
            <div className={`flex items-center gap-1 ${getChangeColor(scoreChange)} mb-2`}>
              {getChangeIcon(scoreChange)}
              <span className="font-medium">{Math.abs(scoreChange)} points</span>
            </div>
          )}
          <p className="text-xs text-gray-400">
            {latestRecord ? `Updated: ${latestRecord.date}` : 'No data yet'}
          </p>
        </div>
      </div>
      
      {/* Score Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
        {scores.map((item) => (
          <div key={item.key} className="text-center">
            <div className="flex justify-center mb-2">
              <item.icon size={24} className={getScoreColor(item.score)} />
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(item.score)} mb-1`}>{item.score}</div>
            <div className="text-sm text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>
      
      {/* 健康建议 */}
      {totalScore < 70 && latestRecord && (
        <div className="mt-4 p-3 bg-orange-100 rounded-lg">
          <p className="text-sm text-orange-700">
            💡 {totalScore < 50 ? 'Your health needs attention. Consider consulting a doctor.' : 'Keep working on improving your health metrics!'}
          </p>
        </div>
      )}
    </div>
  );
}

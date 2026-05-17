import { Award, TrendingUp } from 'lucide-react';
import { User } from '../App';

interface HealthScoreCardProps {
  user: User | null;
}

export function HealthScoreCard({ user }: HealthScoreCardProps) {
  // Mock health score calculation (0-100)
  const healthScore = 87;
  
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

  return (
    <div className={`${getScoreBgColor(healthScore)} rounded-2xl p-8 border-2 ${getScoreColor(healthScore).replace('text-', 'border-')}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Award className={getScoreColor(healthScore)} size={32} />
            <h2 className="text-gray-800">Your Health Score</h2>
          </div>
          <div className="flex items-baseline gap-3 mb-2">
            <span className={`text-5xl ${getScoreColor(healthScore)}`}>{healthScore}</span>
            <span className="text-2xl text-gray-500">/ 100</span>
          </div>
          <p className={`text-lg ${getScoreColor(healthScore)}`}>{getScoreLabel(healthScore)}</p>
          <p className="text-sm text-gray-600 mt-2">
            Based on multiple health indicators including activity, sleep, and vital signs
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <TrendingUp size={20} />
            <span>+5 points</span>
          </div>
          <p className="text-sm text-gray-600">from last week</p>
        </div>
      </div>
      
      {/* Score Breakdown */}
      <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
        {[
          { label: 'Activity', score: 85 },
          { label: 'Sleep', score: 92 },
          { label: 'Vitals', score: 88 },
          { label: 'Nutrition', score: 82 },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-2xl text-gray-800 mb-1">{item.score}</div>
            <div className="text-sm text-gray-600">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

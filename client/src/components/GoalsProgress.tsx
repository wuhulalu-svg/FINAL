import { Target, Award, Zap } from 'lucide-react';

const goals = [
  {
    name: 'Weekly Steps',
    current: 58247,
    target: 70000,
    icon: Target,
    color: 'text-blue-600',
  },
  {
    name: 'Active Days',
    current: 5,
    target: 7,
    icon: Zap,
    color: 'text-yellow-600',
  },
  {
    name: 'Workout Streak',
    current: 12,
    target: 14,
    icon: Award,
    color: 'text-purple-600',
  },
];

export function GoalsProgress() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-gray-800 mb-4">Goals</h2>
      <div className="space-y-6">
        {goals.map((goal, index) => {
          const Icon = goal.icon;
          const percentage = Math.round((goal.current / goal.target) * 100);
          
          return (
            <div key={index}>
              <div className="flex items-center gap-3 mb-2">
                <Icon className={goal.color} size={20} />
                <span className="text-sm text-gray-600">{goal.name}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-900">
                    {goal.current.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {goal.target.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${
                      percentage >= 100 ? 'bg-green-500' : 'bg-indigo-500'
                    } h-2 rounded-full transition-all`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500">{percentage}% complete</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { Footprints, Heart, Flame, Moon } from 'lucide-react';

const metrics = [
  {
    label: 'Steps',
    value: '8,547',
    goal: '10,000',
    percentage: 85,
    icon: Footprints,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-100',
  },
  {
    label: 'Heart Rate',
    value: '72',
    goal: 'bpm',
    percentage: 100,
    icon: Heart,
    color: 'bg-red-500',
    lightColor: 'bg-red-100',
  },
  {
    label: 'Calories',
    value: '1,847',
    goal: '2,200',
    percentage: 84,
    icon: Flame,
    color: 'bg-orange-500',
    lightColor: 'bg-orange-100',
  },
  {
    label: 'Sleep',
    value: '7.5h',
    goal: '8h',
    percentage: 94,
    icon: Moon,
    color: 'bg-indigo-500',
    lightColor: 'bg-indigo-100',
  },
];

export function MetricsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${metric.lightColor} p-3 rounded-lg`}>
                <Icon className={`${metric.color.replace('bg-', 'text-')}`} size={24} />
              </div>
              <span className="text-sm text-gray-500">{metric.percentage}%</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">{metric.label}</p>
              <p className="text-gray-900">
                {metric.value} <span className="text-sm text-gray-500">/ {metric.goal}</span>
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${metric.color} h-2 rounded-full transition-all`}
                  style={{ width: `${metric.percentage}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

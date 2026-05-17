import { Dumbbell, Bike, PersonStanding, Waves } from 'lucide-react';

const activities = [
  {
    type: 'Running',
    duration: '45 min',
    calories: 420,
    time: '2 hours ago',
    icon: PersonStanding,
    color: 'bg-green-100 text-green-600',
  },
  {
    type: 'Cycling',
    duration: '1h 15min',
    calories: 680,
    time: 'Yesterday',
    icon: Bike,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    type: 'Strength Training',
    duration: '30 min',
    calories: 280,
    time: '2 days ago',
    icon: Dumbbell,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    type: 'Swimming',
    duration: '50 min',
    calories: 520,
    time: '3 days ago',
    icon: Waves,
    color: 'bg-cyan-100 text-cyan-600',
  },
];

export function RecentActivities() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-gray-800 mb-4">Recent Activities</h2>
      <div className="space-y-3">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className={`${activity.color} p-3 rounded-lg`}>
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <p className="text-gray-900">{activity.type}</p>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-900">{activity.duration}</p>
                <p className="text-sm text-gray-500">{activity.calories} cal</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

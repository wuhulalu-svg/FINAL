import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const data = [
  { day: 'Mon', steps: 7500, calories: 1850 },
  { day: 'Tue', steps: 9200, calories: 2100 },
  { day: 'Wed', steps: 6800, calories: 1650 },
  { day: 'Thu', steps: 10500, calories: 2350 },
  { day: 'Fri', steps: 8547, calories: 1847 },
  { day: 'Sat', steps: 11200, calories: 2450 },
  { day: 'Sun', steps: 9800, calories: 2200 },
];

export function ActivityChart() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-gray-800">Weekly Activity</h2>
          <p className="text-sm text-gray-500">Steps and calories burned</p>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <TrendingUp size={20} />
          <span className="text-sm">+12%</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="day" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Line
            type="monotone"
            dataKey="steps"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="calories"
            stroke="#f97316"
            strokeWidth={3}
            dot={{ fill: '#f97316', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-gray-600">Steps</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-sm text-gray-600">Calories</span>
        </div>
      </div>
    </div>
  );
}

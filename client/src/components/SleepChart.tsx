import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Moon } from 'lucide-react';

const data = [
  { day: 'Mon', hours: 7.2, quality: 85 },
  { day: 'Tue', hours: 6.8, quality: 78 },
  { day: 'Wed', hours: 8.1, quality: 92 },
  { day: 'Thu', hours: 7.5, quality: 88 },
  { day: 'Fri', hours: 7.5, quality: 87 },
  { day: 'Sat', hours: 8.5, quality: 95 },
  { day: 'Sun', hours: 7.9, quality: 90 },
];

export function SleepChart() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-gray-800">Sleep Patterns</h2>
          <p className="text-sm text-gray-500">Hours per night</p>
        </div>
        <div className="bg-indigo-100 p-2 rounded-lg">
          <Moon className="text-indigo-600" size={20} />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
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
          <Bar dataKey="hours" fill="#6366f1" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Average Quality</span>
          <span className="text-indigo-600">88%</span>
        </div>
      </div>
    </div>
  );
}

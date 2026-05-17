import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { week: 'Week 1', userAvg: 7500, benchmark: 8500 },
  { week: 'Week 2', userAvg: 8200, benchmark: 8500 },
  { week: 'Week 3', userAvg: 8800, benchmark: 8500 },
  { week: 'Week 4', userAvg: 8547, benchmark: 8500 },
];

export function ComparisonChart() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-gray-800 mb-4">Weekly Steps Comparison</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="week" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="userAvg"
            name="Your Average"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ fill: '#6366f1', r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="benchmark"
            name="Age Group Benchmark"
            stroke="#94a3b8"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ fill: '#94a3b8', r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

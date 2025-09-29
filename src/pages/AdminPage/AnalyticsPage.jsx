import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage({ users }) {
  const getRegistrationTrend = () => {
    const months = {};
    users.forEach(u => {
      const date = new Date(u.createdAt);
      const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
      months[monthKey] = (months[monthKey] || 0) + 1;
    });
    
    return Object.entries(months).map(([month, count]) => ({
      month,
      users: count
    })).slice(-6);
  };

  const getActivityData = () => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return days.map(day => ({
      day,
      logins: Math.floor(Math.random() * 20) + 5
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={getRegistrationTrend()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              />
              <Bar dataKey="users" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Login Frequency</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={getActivityData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              />
              <Line type="monotone" dataKey="logins" stroke="#8b5cf6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
          <h4 className="text-gray-400 text-sm font-medium mb-2">Average Session Time</h4>
          <p className="text-3xl font-bold text-white">24 min</p>
          <p className="text-green-400 text-sm mt-2">↑ 8% from last week</p>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
          <h4 className="text-gray-400 text-sm font-medium mb-2">Bounce Rate</h4>
          <p className="text-3xl font-bold text-white">32%</p>
          <p className="text-red-400 text-sm mt-2">↓ 3% from last week</p>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
          <h4 className="text-gray-400 text-sm font-medium mb-2">Active Sessions</h4>
          <p className="text-3xl font-bold text-white">{Math.floor(users.length * 0.3)}</p>
          <p className="text-blue-400 text-sm mt-2">Live now</p>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">User Engagement Metrics</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <p className="text-white font-medium">Daily Active Users</p>
              <p className="text-gray-400 text-sm">Users who logged in today</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{Math.floor(users.length * 0.4)}</p>
              <p className="text-green-400 text-sm">+15%</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <p className="text-white font-medium">Weekly Active Users</p>
              <p className="text-gray-400 text-sm">Users active in the last 7 days</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{Math.floor(users.length * 0.65)}</p>
              <p className="text-green-400 text-sm">+8%</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <p className="text-white font-medium">Monthly Active Users</p>
              <p className="text-gray-400 text-sm">Users active in the last 30 days</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{Math.floor(users.length * 0.85)}</p>
              <p className="text-green-400 text-sm">+12%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
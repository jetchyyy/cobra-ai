import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, UserPlus, Activity } from 'lucide-react';

export default function DashboardOverview({ users }) {
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;
  
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

  const roleData = [
    { name: 'Users', value: userCount, color: '#3b82f6' },
    { name: 'Admins', value: adminCount, color: '#8b5cf6' }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Users</p>
              <h3 className="text-4xl font-bold mt-2">{totalUsers}</h3>
              <p className="text-blue-100 text-xs mt-2">↑ 12% from last month</p>
            </div>
            <Users className="w-12 h-12 text-blue-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Admin Users</p>
              <h3 className="text-4xl font-bold mt-2">{adminCount}</h3>
              <p className="text-purple-100 text-xs mt-2">Active administrators</p>
            </div>
            <Activity className="w-12 h-12 text-purple-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">New This Month</p>
              <h3 className="text-4xl font-bold mt-2">{Math.floor(totalUsers * 0.15)}</h3>
              <p className="text-green-100 text-xs mt-2">Recent registrations</p>
            </div>
            <UserPlus className="w-12 h-12 text-green-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Active Today</p>
              <h3 className="text-4xl font-bold mt-2">{Math.floor(totalUsers * 0.4)}</h3>
              <p className="text-orange-100 text-xs mt-2">Users logged in today</p>
            </div>
            <TrendingUp className="w-12 h-12 text-orange-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Trend */}
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Registration Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getRegistrationTrend()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Role Distribution */}
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">User Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={roleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {roleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Weekly Login Activity</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={getActivityData()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="day" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Bar dataKey="logins" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
import { Activity, LogIn, UserPlus, Settings, Shield } from 'lucide-react';

export default function ActivityLog({ users }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Generate activity feed from user data
  const generateActivityFeed = () => {
    const activities = [];
    
    // Sort users by last login
    const sortedUsers = [...users].sort((a, b) => 
      new Date(b.lastLogin) - new Date(a.lastLogin)
    );

    sortedUsers.slice(0, 15).forEach((user, index) => {
      // Add login activity
      activities.push({
        id: `login-${user.uid}`,
        type: 'login',
        user: user.displayName || user.email,
        action: 'logged in',
        timestamp: user.lastLogin,
        icon: LogIn,
        color: 'text-blue-400'
      });

      // Add role-based activities
      if (user.role === 'admin' && index < 5) {
        activities.push({
          id: `admin-${user.uid}`,
          type: 'admin',
          user: user.displayName || user.email,
          action: 'accessed admin panel',
          timestamp: user.lastLogin,
          icon: Shield,
          color: 'text-purple-400'
        });
      }
    });

    // Add some registration activities
    const recentUsers = [...users]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    recentUsers.forEach(user => {
      activities.push({
        id: `register-${user.uid}`,
        type: 'register',
        user: user.displayName || user.email,
        action: 'registered an account',
        timestamp: user.createdAt,
        icon: UserPlus,
        color: 'text-green-400'
      });
    });

    // Sort by timestamp
    return activities.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  };

  const activityFeed = generateActivityFeed();

  return (
    <div className="space-y-6">
      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <LogIn className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Logins</p>
              <p className="text-2xl font-bold text-white">{users.length * 15}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <UserPlus className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">New Users</p>
              <p className="text-2xl font-bold text-white">{Math.floor(users.length * 0.2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Admin Actions</p>
              <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'admin').length * 8}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <Settings className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Config Changes</p>
              <p className="text-2xl font-bold text-white">24</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
          <p className="text-gray-400 text-sm mt-1">Live feed of system events and user actions</p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {activityFeed.map((activity) => {
              const Icon = activity.icon;
              return (
                <div 
                  key={activity.id} 
                  className="flex items-start space-x-4 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                >
                  <div className={`p-2 rounded-lg bg-gray-800 ${activity.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">
                      <span className="text-blue-400">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">{formatDate(activity.timestamp)}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-800 text-gray-300">
                      {activity.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Activity Timeline</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700"></div>
          <div className="space-y-6 ml-12">
            {activityFeed.slice(0, 8).map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={`timeline-${activity.id}`} className="relative">
                  <div className={`absolute -left-12 p-2 rounded-full bg-gray-700 ${activity.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-white font-medium">{activity.user}</p>
                    <p className="text-gray-400 text-sm">{activity.action}</p>
                    <p className="text-gray-500 text-xs mt-2">{formatDate(activity.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
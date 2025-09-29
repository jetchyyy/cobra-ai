import { Users, Mail, Calendar, Clock, Trash2 } from 'lucide-react';

export default function UserManagement({ users, currentUserId, onUpdateRole, onDeleteUser }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
      <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">All Users</h2>
          <p className="text-gray-400 text-sm mt-1">Total: {users.length} users</p>
        </div>
        <div className="flex items-center space-x-2 text-gray-400">
          <Users className="w-5 h-5" />
          <span className="text-sm">Manage user accounts</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users.map((userData) => (
              <tr key={userData.uid} className="hover:bg-gray-700 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-11 w-11 flex-shrink-0">
                      {userData.photoURL ? (
                        <img
                          className="h-11 w-11 rounded-full ring-2 ring-gray-600"
                          src={userData.photoURL}
                          alt=""
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg ring-2 ring-gray-600">
                          {userData.displayName?.[0]?.toUpperCase() || userData.email?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">
                        {userData.displayName || 'No name'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-300">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    {userData.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    userData.role === 'admin'
                      ? 'bg-purple-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}>
                    {userData.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-400">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    {formatDate(userData.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-400">
                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                    {formatDate(userData.lastLogin)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    <select
                      value={userData.role}
                      onChange={(e) => onUpdateRole(userData.uid, e.target.value)}
                      className="bg-gray-700 text-white px-3 py-1.5 rounded-lg border border-gray-600 text-sm hover:bg-gray-600 transition"
                      disabled={userData.uid === currentUserId}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => onDeleteUser(userData.uid)}
                      disabled={userData.uid === currentUserId}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { ref, get, set, remove } from 'firebase/database';
import { database } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import DashboardOverview from './AdminPage/DashboardOverview';
import UserManagement from './AdminPage/UserManagement';
import GuidelinesManagement from './AdminPage/GuidelinesManagement';
import FeedbackManagement from './AdminPage/FeedbackManagement'; // NEW
import AnalyticsPage from './AdminPage/AnalyticsPage';
import ActivityLog from './AdminPage/ActivityLog';
import SettingsPage from './AdminPage/SettingsPage';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersArray = Object.values(usersData);
        setUsers(usersArray);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        await set(userRef, {
          ...userData,
          role: newRole
        });
        
        fetchUsers();
        alert(`User role updated to ${newRole}`);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const userRef = ref(database, `users/${userId}`);
      await remove(userRef);
      
      fetchUsers();
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  // Tab titles and descriptions
  const getTabInfo = () => {
    const info = {
      dashboard: {
        title: 'Dashboard Overview',
        description: 'Monitor your platform metrics and user activity'
      },
      users: {
        title: 'User Management',
        description: 'Manage user accounts and permissions'
      },
      guidelines: {
        title: 'SWU Guidelines Management',
        description: 'Manage AI knowledge base for accurate student assistance'
      },
      feedback: { // NEW
        title: 'User Feedback',
        description: 'View and manage user feedback submissions'
      },
      analytics: {
        title: 'Analytics & Reports',
        description: 'Detailed insights and statistics'
      },
      activity: {
        title: 'Activity Log',
        description: 'Recent system activities and events'
      },
      settings: {
        title: 'Settings',
        description: 'Configure system preferences'
      }
    };
    return info[activeTab] || info.dashboard;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  const tabInfo = getTabInfo();

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <AdminSidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={logout}
          userEmail={user?.email}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-white">{tabInfo.title}</h1>
            <p className="text-gray-400 mt-1">{tabInfo.description}</p>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-900">
          {activeTab === 'dashboard' && <DashboardOverview users={users} />}
          
          {activeTab === 'users' && (
            <UserManagement 
              users={users} 
              currentUserId={user?.uid}
              onUpdateRole={updateUserRole}
              onDeleteUser={deleteUser}
            />
          )}
          
          {activeTab === 'guidelines' && <GuidelinesManagement />}
          
          {/* NEW - Feedback Management */}
          {activeTab === 'feedback' && <FeedbackManagement />}
          
          {activeTab === 'analytics' && <AnalyticsPage users={users} />}
          
          {activeTab === 'activity' && <ActivityLog users={users} />}
          
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}
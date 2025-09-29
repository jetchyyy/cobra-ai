import { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { database } from './firebase/firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getChatLimitData } from './components/utils/ChatLimitManager';
import Login from './pages/Login';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const [chatLimitData, setChatLimitData] = useState(null);

  // Check user role
  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        try {
          const userRef = ref(database, `users/${user.uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUserRole(userData.role);
          } else {
            setUserRole('user'); // Default role if not found
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('user'); // Default to user on error
        }
      }
      setCheckingRole(false);
    };

    if (!loading) {
      checkUserRole();
    }
  }, [user, loading]);

  // Track chat limits for non-admin users
  useEffect(() => {
    if (!user || userRole === 'admin') return;

    const updateChatLimit = async () => {
      try {
        const limitData = await getChatLimitData(user.uid);
        setChatLimitData(limitData);
      } catch (error) {
        console.error('Error fetching chat limit:', error);
      }
    };

    // Initial fetch
    updateChatLimit();

    // Update every minute to keep countdown fresh
    const interval = setInterval(updateChatLimit, 60000);

    return () => clearInterval(interval);
  }, [user, userRole]);

  if (loading || (user && checkingRole)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Login />;
  }

  // Logged in - route based on role
  // Pass chatLimitData to Home component for display
  return userRole === 'admin' ? (
    <AdminDashboard />
  ) : (
    <Home chatLimitData={chatLimitData} setChatLimitData={setChatLimitData} />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
import { useState } from 'react';
import { MessageSquare, Plus, LogOut, X, Sparkles, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DeleteChatHistory from './DeleteChatHistory';
import DeleteSingleChat from './DeleteSingleChat';
import LogoutConfirmationModal from './LogoutConfirmationModal';

const ChatSidebar = ({ chats, currentChatId, onSelectChat, onNewChat, isOpen, onToggle }) => {
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleHistoryDeleted = () => {
    // Reload the page to refresh the UI after deleting all chats
    window.location.reload();
  };

  const handleChatDeleted = (deletedChatId) => {
    // If the deleted chat was the current chat, reload to show a new chat
    if (deletedChatId === currentChatId) {
      window.location.reload();
    } else {
      // Otherwise just reload to refresh the chat list
      window.location.reload();
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Get the user's photo URL, prioritizing the auth photoURL
  const userPhotoURL = user?.photoURL;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 flex flex-col transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Sparkles className="w-6 h-6 text-yellow-400 mr-2" />
              <h1 className="text-xl font-bold text-white">Cobra</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Delete All Chats Icon */}
              <DeleteChatHistory 
                onHistoryDeleted={handleHistoryDeleted}
              />
              
              {/* Mobile close button */}
              <button
                onClick={onToggle}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <button
            onClick={onNewChat}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg flex items-center justify-center transition duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Chat
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-gray-400 text-sm font-semibold mb-3">Recent Chats</h2>
          <div className="space-y-2">
            {chats.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No chats yet. Start a new conversation!
              </p>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`relative group rounded-lg transition duration-200 ${
                    currentChatId === chat.id
                      ? 'bg-purple-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <button
                    onClick={() => onSelectChat(chat.id)}
                    className="w-full text-left p-3 flex items-start"
                  >
                    <MessageSquare className={`w-4 h-4 mr-2 mt-1 flex-shrink-0 ${
                      currentChatId === chat.id ? 'text-white' : 'text-gray-300'
                    }`} />
                    <span className={`text-sm truncate flex-1 ${
                      currentChatId === chat.id ? 'text-white' : 'text-gray-300'
                    }`}>
                      {chat.title}
                    </span>
                  </button>
                  
                  {/* Delete button - appears on hover */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DeleteSingleChat 
                      chatId={chat.id}
                      chatTitle={chat.title}
                      onChatDeleted={handleChatDeleted}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center overflow-hidden">
              {userPhotoURL && !imageError ? (
                <img
                  src={userPhotoURL}
                  alt="User profile"
                  className="w-8 h-8 rounded-full mr-2 object-cover"
                  onError={handleImageError}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full mr-2 bg-purple-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="text-white text-sm truncate">
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </span>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="text-gray-400 hover:text-white transition duration-200"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onConfirm={() => {
          setShowLogoutModal(false);
          logout();
        }}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
};

export default ChatSidebar;
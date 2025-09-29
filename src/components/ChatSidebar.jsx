import { MessageSquare, Plus, X, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTimeUntilReset } from './utils/ChatLimitManager';
import DeleteChatHistory from './DeleteChatHistory';
import DeleteSingleChat from './DeleteSingleChat';

const ChatSidebar = ({ chats, currentChatId, onSelectChat, onNewChat, onDeleteChat, isOpen, messageLimitData }) => {
  const { user, logout } = useAuth();

  const getLimitColor = () => {
    if (!messageLimitData) return 'text-gray-400';
    if (messageLimitData.remaining === 0) return 'text-red-400';
    if (messageLimitData.remaining <= 2) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getLimitBgColor = () => {
    if (!messageLimitData) return 'bg-gray-800';
    if (messageLimitData.remaining === 0) return 'bg-red-900/20 border-red-500/30';
    if (messageLimitData.remaining <= 2) return 'bg-yellow-900/20 border-yellow-500/30';
    return 'bg-green-900/20 border-green-500/30';
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => onSelectChat(null)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-80 bg-gray-800 border-r border-gray-700 flex flex-col transition-transform duration-300`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-6 h-6 text-purple-400" />
              <h1 className="text-xl font-bold text-white">Cobra AI</h1>
            </div>
            <div className="flex items-center space-x-2">
              <DeleteChatHistory onHistoryDeleted={() => onSelectChat(null)} />
              <button
                onClick={() => onSelectChat(null)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Message Limit Display */}
          {messageLimitData && (
            <div className={`p-3 rounded-lg border ${getLimitBgColor()} mb-3`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Clock className={`w-4 h-4 ${getLimitColor()}`} />
                  <span className={`text-sm font-medium ${getLimitColor()}`}>
                    Message Limit
                  </span>
                </div>
                <span className={`text-lg font-bold ${getLimitColor()}`}>
                  {messageLimitData.remaining}/5
                </span>
              </div>
              
              {messageLimitData.remaining <= 2 && (
                <div className="flex items-start space-x-2 mt-2 pt-2 border-t border-gray-700">
                  <AlertCircle className={`w-4 h-4 ${getLimitColor()} flex-shrink-0 mt-0.5`} />
                  <div>
                    {messageLimitData.remaining === 0 ? (
                      <p className="text-xs text-red-300">
                        Limit reached. Resets in{' '}
                        <span className="font-semibold">
                          {getTimeUntilReset(new Date(messageLimitData.resetTime))}
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-yellow-300">
                        {messageLimitData.remaining} {messageLimitData.remaining === 1 ? 'message' : 'messages'} remaining
                        <br />
                        Resets in{' '}
                        <span className="font-semibold">
                          {getTimeUntilReset(new Date(messageLimitData.resetTime))}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {messageLimitData.remaining > 2 && (
                <p className="text-xs text-gray-400 mt-1">
                  Resets in {getTimeUntilReset(new Date(messageLimitData.resetTime))}
                </p>
              )}
            </div>
          )}

          {/* New Chat Button - Always enabled, limit is on messages not chats */}
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg transition duration-200 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Chat</span>
          </button>

          {messageLimitData && !messageLimitData.canSend && (
            <p className="text-xs text-yellow-400 mt-2 text-center">
              You can create new chats, but can't send messages until reset.
            </p>
          )}
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chats.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chats yet</p>
              <p className="text-xs mt-1">Start a new conversation</p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition duration-200 ${
                  currentChatId === chat.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{chat.title}</h3>
                    <p className="text-sm opacity-75 truncate mt-1">
                      {chat.lastMessage}
                    </p>
                    <p className="text-xs opacity-50 mt-1">
                      {new Date(chat.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100">
                    <DeleteSingleChat
                      chatId={chat.id}
                      chatTitle={chat.title}
                      onChatDeleted={onDeleteChat}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                  {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-gray-400 text-sm truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-white text-sm transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatSidebar;
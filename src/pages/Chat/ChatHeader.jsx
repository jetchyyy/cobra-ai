import { Menu, Sparkles } from 'lucide-react';
import { getTimeUntilReset } from '../../components/utils/ChatLimitManager';

const ChatHeader = ({ onToggleSidebar, messageLimitData }) => {
  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden text-gray-400 hover:text-white mr-4"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Sparkles className="w-6 h-6 text-yellow-400 mr-2" />
        <h2 className="text-white font-semibold">Cobra AI Assistant</h2>
      </div>
      
      {/* Message Limit Indicator */}
      {messageLimitData && (
        <div className="flex items-center space-x-2">
          <div className={`text-sm ${messageLimitData.canSend ? 'text-gray-400' : 'text-red-400'}`}>
            {messageLimitData.remaining}/5 messages
          </div>
          {!messageLimitData.canSend && (
            <div className="text-xs text-gray-500">
              Resets in {getTimeUntilReset(new Date(messageLimitData.resetTime))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
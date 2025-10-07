import { Zap, AlertCircle } from 'lucide-react';
import { getTimeUntilReset } from '../../components/utils/ChatLimitManager';

const Banner = ({ type, messageLimitData, cacheHit }) => {
  if (type === 'cache' && cacheHit) {
    return (
      <div className="bg-green-900/20 border-b border-green-500/30 p-3">
        <div className="flex items-start space-x-3 max-w-4xl mx-auto">
          <Zap className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-300 text-sm font-medium">
              ⚡ Instant answer from cache ({(cacheHit.similarity * 100).toFixed(0)}% match)
            </p>
            <p className="text-green-400/70 text-xs mt-1">
              Similar to: "{cacheHit.originalQuery.substring(0, 60)}..."
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'warning' && messageLimitData && messageLimitData.remaining <= 2 && messageLimitData.remaining > 0) {
    return (
      <div className="bg-yellow-900/20 border-b border-yellow-500/30 p-3">
        <div className="flex items-start space-x-3 max-w-4xl mx-auto">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 text-sm">
              {messageLimitData.remaining} {messageLimitData.remaining === 1 ? 'message' : 'messages'} remaining. 
              Resets in {getTimeUntilReset(new Date(messageLimitData.resetTime))}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'limit' && messageLimitData && !messageLimitData.canSend) {
    return (
      <div className="bg-red-900/20 border-b border-red-500/30 p-3">
        <div className="flex items-start space-x-3 max-w-4xl mx-auto">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 text-sm font-medium">
              Message limit reached
            </p>
            <p className="text-red-400/80 text-xs mt-1">
              You've used all 5 messages. Your limit will reset in {getTimeUntilReset(new Date(messageLimitData.resetTime))}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Banner;
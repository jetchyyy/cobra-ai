import { useState } from 'react';
import { Sparkles, Zap, FileText, Copy, Check } from 'lucide-react';

const MessageBubble = ({ message, index, formatBotMessage, renderFormattedContent }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopyMessage = async (content, idx) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      className={`flex ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-3xl rounded-lg relative ${
          message.role === 'user'
            ? 'bg-purple-600 text-white p-4'
            : 'bg-gradient-to-br from-gray-800 to-gray-850 text-gray-100 border border-gray-700 shadow-lg'
        }`}
      >
        {message.cached && (
          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center shadow-lg z-10">
            <Zap className="w-3 h-3 mr-1" />
            Cached
          </div>
        )}
        
        {/* Bot message with enhanced UI */}
        {message.role === 'assistant' ? (
          <div className="group">
            {/* Bot header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700/50 px-4 pt-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-purple-300">Cobra AI</span>
              </div>
              <button
                onClick={() => handleCopyMessage(message.content, index)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 hover:bg-gray-700 rounded-lg flex items-center space-x-1 text-gray-400 hover:text-white"
                title="Copy response"
              >
                {copiedIndex === index ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-xs">Copy</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Bot message content */}
            <div className="px-4 pb-4">
              {renderFormattedContent(formatBotMessage(message.content))}
            </div>
          </div>
        ) : (
          // User message
          <>
            {message.file && (
              <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-purple-400/30">
                <FileText className="w-4 h-4" />
                <span className="text-sm opacity-90">
                  {message.file.name} ({message.file.size} MB)
                </span>
              </div>
            )}
            <p className="whitespace-pre-wrap">{message.content}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
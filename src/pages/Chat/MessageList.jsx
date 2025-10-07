import { useRef, useEffect } from 'react';
import { Sparkles, Loader } from 'lucide-react';
import MessageBubble from './MessageBubble';

const MessageList = ({ messages, isLoading, messageLimitData, formatBotMessage, renderFormattedContent }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Welcome to Cobra AI
            </h3>
            <p className="text-gray-400 mb-2">
              Your intelligent study assistant with smart caching!
            </p>
            {messageLimitData && (
              <p className="text-purple-400 text-sm mb-6">
                {messageLimitData.remaining} of 5 messages remaining
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-purple-500 transition cursor-pointer">
                <p className="text-purple-300 text-sm">
                  "Summarize the key concepts in photosynthesis"
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-purple-500 transition cursor-pointer">
                <p className="text-purple-300 text-sm">
                  "Upload a PDF and ask questions about it"
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-purple-500 transition cursor-pointer">
                <p className="text-purple-300 text-sm">
                  "Help me understand the water cycle"
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-purple-500 transition cursor-pointer">
                <p className="text-purple-300 text-sm">
                  "Create a study plan for my exams"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <MessageBubble
          key={index}
          message={message}
          index={index}
          formatBotMessage={formatBotMessage}
          renderFormattedContent={renderFormattedContent}
        />
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-800 text-gray-100 rounded-lg p-4 flex items-center">
            <Loader className="w-5 h-5 animate-spin mr-2" />
            <span>Cobra AI is Thinking...</span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
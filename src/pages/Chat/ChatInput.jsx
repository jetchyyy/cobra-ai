import { Send, FileText } from 'lucide-react';
import FileUpload from '../../components/FileUpload';
import { getTimeUntilReset } from '../../components/utils/ChatLimitManager';

const ChatInput = ({
  input,
  setInput,
  uploadedFile,
  setUploadedFile,
  showFileUpload,
  setShowFileUpload,
  isLoading,
  messageLimitData,
  onSendMessage,
  onFileProcessed,
  onRemoveFile
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="border-t border-gray-700 p-4 bg-gray-800">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* File Upload Area */}
        {showFileUpload && !uploadedFile && (
          <FileUpload
            onFileProcessed={onFileProcessed}
            onRemoveFile={onRemoveFile}
            currentFile={null}
            isProcessing={false}
          />
        )}

        {/* Uploaded File Display */}
        {uploadedFile && (
          <FileUpload
            onFileProcessed={onFileProcessed}
            onRemoveFile={onRemoveFile}
            currentFile={uploadedFile}
            isProcessing={isLoading}
          />
        )}

        {/* Input Row */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            className={`${
              uploadedFile
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } rounded-lg px-4 py-3 transition duration-200 flex items-center justify-center`}
            disabled={isLoading || (messageLimitData && !messageLimitData.canSend)}
          >
            <FileText className="w-5 h-5" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              messageLimitData && !messageLimitData.canSend 
                ? "Message limit reached. Please wait for reset..." 
                : uploadedFile 
                  ? "Ask about the document..." 
                  : "Ask me anything about your studies..."
            }
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            rows="1"
            disabled={isLoading || (messageLimitData && !messageLimitData.canSend)}
          />
          <button
            onClick={onSendMessage}
            disabled={(!input.trim() && !uploadedFile) || isLoading || (messageLimitData && !messageLimitData.canSend)}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg px-6 py-3 transition duration-200 flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Message limit indicator below input */}
        {messageLimitData && (
          <div className="text-center text-sm text-gray-400">
            {messageLimitData.canSend ? (
              <span>{messageLimitData.remaining} message{messageLimitData.remaining !== 1 ? 's' : ''} remaining</span>
            ) : (
              <span className="text-red-400">Limit reached • Resets in {getTimeUntilReset(new Date(messageLimitData.resetTime))}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
// ChatArea.jsx
import { useState, useRef, useEffect } from 'react';
import { Send, Menu, Sparkles, Loader, FileText } from 'lucide-react';
import { model } from '../firebase/firebase';
import FileUpload from '../components/FileUpload';

const ChatArea = ({ messages, setMessages, currentChatId, onCreateChat, onSaveMessage, onToggleSidebar }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileProcessed = (file) => {
    setUploadedFile(file);
    setShowFileUpload(false);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !uploadedFile) || isLoading) return;

    let userMessage = input.trim();
    const fileData = uploadedFile;
    
    // If there's a file, create a message that includes file context
    if (fileData) {
      userMessage = userMessage || "Please analyze this document and tell me what it's about.";
    }

    setInput('');
    setUploadedFile(null);

    // Add user message to UI
    const newUserMessage = { 
      role: 'user', 
      content: userMessage,
      file: fileData ? { name: fileData.name, size: fileData.size } : null
    };
    setMessages((prev) => [...prev, newUserMessage]);

    setIsLoading(true);

    try {
      // Create new chat if this is the first message
      let chatId = currentChatId;
      if (!chatId) {
        chatId = await onCreateChat(userMessage);
      }

      // Save user message to Database
      if (chatId) {
        await onSaveMessage(chatId, 'user', userMessage);
      }

      // Create prompt with file context if file exists
      let prompt = userMessage;
      if (fileData) {
        prompt = `I have uploaded a document titled "${fileData.name}". Here is the content:\n\n${fileData.content}\n\nBased on this document, ${userMessage}`;
      }

// Generate AI response (streaming)
const streamResult = await model.generateContentStream(prompt);

// Create an empty AI message first
let aiMessage = { role: "assistant", content: "" };
setMessages((prev) => [...prev, aiMessage]);

// Stream chunks into the last message
for await (const chunk of streamResult.stream) {
  const chunkText = chunk.text();
  if (chunkText) {
    aiMessage.content += chunkText; // keep aiMessage in sync
    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1].content = aiMessage.content;
      return updated;
    });
  }
}

// Save AI message once it’s complete
if (chatId) {
  await onSaveMessage(chatId, "assistant", aiMessage.content);
}


    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden text-gray-400 hover:text-white mr-4"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center">
          <Sparkles className="w-6 h-6 text-yellow-400 mr-2" />
          <h2 className="text-white font-semibold">Cobra AI Assistant</h2>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                Welcome to Cobra AI
              </h3>
              <p className="text-gray-400 mb-6">
                Your intelligent study assistant. Upload documents or ask me anything!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <p className="text-purple-300 text-sm">
                    "Summarize the key concepts in photosynthesis"
                  </p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <p className="text-purple-300 text-sm">
                    "Upload a PDF and ask questions about it"
                  </p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <p className="text-purple-300 text-sm">
                    "Help me understand the water cycle"
                  </p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <p className="text-purple-300 text-sm">
                    "Create a study plan for my exams"
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-3xl rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  {message.file && (
                    <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-purple-400/30">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm opacity-90">
                        {message.file.name} ({message.file.size} MB)
                      </span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-100 rounded-lg p-4 flex items-center">
                  <Loader className="w-5 h-5 animate-spin mr-2" />
                  <span>Analyzing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-700 p-4 bg-gray-800">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* File Upload Area */}
          {showFileUpload && !uploadedFile && (
            <FileUpload
              onFileProcessed={handleFileProcessed}
              onRemoveFile={handleRemoveFile}
              currentFile={null}
              isProcessing={false}
            />
          )}

          {/* Uploaded File Display */}
          {uploadedFile && (
            <FileUpload
              onFileProcessed={handleFileProcessed}
              onRemoveFile={handleRemoveFile}
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
              disabled={isLoading}
            >
              <FileText className="w-5 h-5" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={uploadedFile ? "Ask about the document..." : "Ask me anything about your studies..."}
              className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows="1"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={(!input.trim() && !uploadedFile) || isLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg px-6 py-3 transition duration-200 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
// ChatArea.jsx - Updated with embeddings for caching
import { useState, useRef, useEffect } from 'react';
import { Send, Menu, Sparkles, Loader, FileText, AlertCircle, Zap } from 'lucide-react';
import { model } from '../firebase/firebase';
import FileUpload from '../components/FileUpload';
import { getMessageLimitData, incrementMessageCount, getTimeUntilReset } from '../components/utils/ChatLimitManager';
import embeddingService from '../components/utils/EmbeddingService';

const ChatArea = ({ 
  messages, 
  setMessages, 
  currentChatId, 
  onCreateChat, 
  onSaveMessage, 
  onToggleSidebar, 
  userId,
  messageLimitData,
  setMessageLimitData 
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [cacheHit, setCacheHit] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clean old embeddings on component mount
  useEffect(() => {
    if (userId) {
      embeddingService.cleanOldEmbeddings(userId);
    }
  }, [userId]);

  const handleFileProcessed = (file) => {
    setUploadedFile(file);
    setShowFileUpload(false);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !uploadedFile) || isLoading) return;

    // Check message limit BEFORE processing anything
    if (userId) {
      const currentLimit = await getMessageLimitData(userId);
      if (!currentLimit.canSend) {
        const resetTime = currentLimit.resetTime ? new Date(currentLimit.resetTime) : new Date();
        const errorMessage = {
          role: 'assistant',
          content: `You've reached your limit of 5 messages. Your message limit will reset in ${getTimeUntilReset(resetTime)}. Please wait until then to continue chatting.`
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }
    }

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
      file: fileData ? { name: fileData.name, size: fileData.size } : null,
      fileContent: fileData ? fileData.content : null
    };
    setMessages((prev) => [...prev, newUserMessage]);

    setIsLoading(true);
    setCacheHit(null);

    try {
      // Create new chat if this is the first message
      let chatId = currentChatId;
      if (!chatId) {
        chatId = await onCreateChat(userMessage);
      }

      // Save user message to Database with file metadata
      if (chatId) {
        await onSaveMessage(chatId, 'user', userMessage, fileData ? { name: fileData.name, size: fileData.size } : null);
      }

      // STEP 1: Check for cached similar query
      let aiResponseText = null;
      let usedCache = false;

      if (userId) {
        console.log('Searching for similar cached queries...');
        const cachedResult = await embeddingService.searchSimilarQuery(
          userId, 
          userMessage, 
          fileData ? { name: fileData.name, size: fileData.size } : null
        );

        if (cachedResult) {
          console.log(`Cache hit! Similarity: ${(cachedResult.similarity * 100).toFixed(1)}%`);
          aiResponseText = cachedResult.response;
          usedCache = true;
          
          // Show cache hit indicator
          setCacheHit({
            similarity: cachedResult.similarity,
            originalQuery: cachedResult.originalQuery
          });

          // Clear cache hit indicator after 3 seconds
          setTimeout(() => setCacheHit(null), 3000);
        }
      }

      // STEP 2: If no cache hit, call the API
      if (!usedCache) {
        console.log('No cache hit. Calling AI API...');
        
        // Increment message count after user sends a message
        if (userId) {
          const newLimitData = await incrementMessageCount(userId);
          setMessageLimitData(newLimitData);
        }

        // Build conversation history for context
        const conversationHistory = [];
        
        // Add all previous messages to history
        for (const msg of messages) {
          let messageContent = msg.content;
          if (msg.file && msg.fileContent) {
            messageContent = `[Document: ${msg.file.name}]\n\n${msg.fileContent}\n\n${msg.content}`;
          }
          
          conversationHistory.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: messageContent }]
          });
        }
        
        // Add current user message with file context if exists
        let currentPrompt = userMessage;
        if (fileData) {
          currentPrompt = `[Document: ${fileData.name}]\n\n${fileData.content}\n\n${userMessage}`;
        }
        
        conversationHistory.push({
          role: 'user',
          parts: [{ text: currentPrompt }]
        });

        // Generate AI response with full conversation history (streaming)
        const chat = model.startChat({
          history: conversationHistory.slice(0, -1)
        });
        
        const streamResult = await chat.sendMessageStream(currentPrompt);

        // Create an empty AI message first
        let aiMessage = { role: "assistant", content: "" };
        setMessages((prev) => [...prev, aiMessage]);

        // Stream chunks into the last message
        for await (const chunk of streamResult.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            aiMessage.content += chunkText;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1].content = aiMessage.content;
              return updated;
            });
          }
        }

        aiResponseText = aiMessage.content;

        // STEP 3: Store the query-response pair in embeddings cache
        if (userId && aiResponseText) {
          console.log('Storing query-response in cache...');
          await embeddingService.storeQueryResponse(
            userId,
            userMessage,
            aiResponseText,
            fileData ? { name: fileData.name, size: fileData.size } : null
          );
        }
      } else {
        // If using cache, just add the cached response to messages
        const cachedMessage = { 
          role: "assistant", 
          content: aiResponseText,
          cached: true 
        };
        setMessages((prev) => [...prev, cachedMessage]);
      }

      // Save AI message to database
      if (chatId && aiResponseText) {
        await onSaveMessage(chatId, "assistant", aiResponseText);
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

      {/* Cache Hit Notification */}
      {cacheHit && (
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
      )}

      {/* Message Limit Warning Banner */}
      {messageLimitData && messageLimitData.remaining <= 2 && messageLimitData.remaining > 0 && (
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
      )}

      {messageLimitData && !messageLimitData.canSend && (
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
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
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
                  className={`max-w-3xl rounded-lg p-4 relative ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  {message.cached && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <Zap className="w-3 h-3 mr-1" />
                      Cached
                    </div>
                  )}
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
              onClick={handleSendMessage}
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
    </div>
  );
};

export default ChatArea;
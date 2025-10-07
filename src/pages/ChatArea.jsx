// ChatArea.jsx - Refactored with modular components
import { useState, useEffect } from 'react';
import { model } from '../firebase/firebase';
import { getMessageLimitData, incrementMessageCount, getTimeUntilReset } from '../components/utils/ChatLimitManager';
import embeddingService from '../components/utils/EmbeddingService';

import ChatHeader from './Chat/ChatHeader';
import Banner from './Chat/Banner';
import MessageList from './Chat/MessageList';
import ChatInput from './Chat/ChatInput';

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

  const formatBotMessage = (content) => {
    // Remove asterisks used for bold/italic markdown
    content = content.replace(/\*\*\*/g, ''); // Remove triple asterisks
    content = content.replace(/\*\*/g, '');   // Remove double asterisks (bold)
    content = content.replace(/\*/g, '');     // Remove single asterisks (italic)
    
    const lines = content.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      if (!line) {
        i++;
        continue;
      }

      if (line.endsWith(':') && line.length < 100 && !line.includes('http')) {
        elements.push({ type: 'header', content: line });
        i++;
        continue;
      }

      if (line.startsWith('##')) {
        elements.push({ type: 'header', content: line.replace(/^#+\s*/, '') });
        i++;
        continue;
      }

      if (line === line.toUpperCase() && line.length > 3 && line.length < 80) {
        elements.push({ type: 'subheader', content: line });
        i++;
        continue;
      }

      if (/^\d+\.\s/.test(line)) {
        const listItems = [];
        while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^\d+\.\s*/, ''));
          i++;
        }
        elements.push({ type: 'numbered-list', items: listItems });
        continue;
      }

      if (/^[-*•]\s/.test(line)) {
        const listItems = [];
        while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^[-*•]\s*/, ''));
          i++;
        }
        elements.push({ type: 'bullet-list', items: listItems });
        continue;
      }

      if (line.startsWith('```')) {
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++;
        elements.push({ type: 'code', content: codeLines.join('\n') });
        continue;
      }

      if (/^(Note|Important|Remember|Warning|Tip|Key Point):/i.test(line)) {
        elements.push({ type: 'callout', content: line });
        i++;
        continue;
      }

      if (line.includes(':') && line.split(':')[0].length < 50 && line.split(':')[0].length > 2) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        if (key.length > 0 && value.length > 0) {
          elements.push({ type: 'definition', key: key.trim(), value });
          i++;
          continue;
        }
      }

      if (/^(Example|e\.g\.|For example)/i.test(line)) {
        elements.push({ type: 'example', content: line });
        i++;
        continue;
      }

      const paragraphLines = [];
      while (i < lines.length && lines[i].trim() && 
             !/^\d+\.\s/.test(lines[i].trim()) && 
             !/^[-*•]\s/.test(lines[i].trim()) &&
             !lines[i].trim().endsWith(':') &&
             !/^(Note|Important|Remember|Warning|Tip|Key Point):/i.test(lines[i].trim()) &&
             !lines[i].trim().startsWith('```')) {
        paragraphLines.push(lines[i].trim());
        i++;
      }
      if (paragraphLines.length > 0) {
        elements.push({ type: 'paragraph', content: paragraphLines.join(' ') });
      }
    }

    return elements.length > 0 ? elements : [{ type: 'paragraph', content }];
  };

  const renderFormattedContent = (elements) => {
    return elements.map((element, idx) => {
      switch (element.type) {
        case 'header':
          return (
            <div key={idx} className="mb-5 mt-6 first:mt-0">
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full mr-3"></div>
                <h3 className="text-xl font-bold text-blue-300">
                  {element.content}
                </h3>
              </div>
              <div className="h-px bg-gradient-to-r from-blue-500/50 to-transparent ml-5"></div>
            </div>
          );

        case 'subheader':
          return (
            <div key={idx} className="mb-4 mt-4">
              <h4 className="text-base font-semibold text-purple-300 tracking-wide">
                {element.content}
              </h4>
            </div>
          );

        case 'numbered-list':
          return (
            <div key={idx} className="mb-5 ml-2">
              <ol className="space-y-3">
                {element.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start group">
                    <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold flex items-center justify-center mr-3 mt-0.5 shadow-md group-hover:scale-110 transition-transform">
                      {itemIdx + 1}
                    </span>
                    <span className="text-gray-100 leading-relaxed flex-1 pt-0.5 text-[15px]">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          );

        case 'bullet-list':
          return (
            <div key={idx} className="mb-5 ml-2">
              <ul className="space-y-3">
                {element.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start group">
                    <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 mr-3 mt-2 group-hover:scale-125 transition-transform"></span>
                    <span className="text-gray-100 leading-relaxed flex-1 text-[15px]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );

        case 'code':
          return (
            <div key={idx} className="mb-5 bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-gray-800 to-gray-750 px-4 py-2.5 border-b border-gray-700 flex items-center">
                <div className="flex space-x-1.5 mr-3">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <span className="text-xs text-gray-400 font-mono">Formula / Code</span>
              </div>
              <pre className="p-5 overflow-x-auto">
                <code className="text-sm text-emerald-300 font-mono leading-relaxed">{element.content}</code>
              </pre>
            </div>
          );

        case 'callout':
          const calloutType = element.content.split(':')[0].toLowerCase();
          const calloutColors = {
            note: { bg: 'bg-blue-900/20', border: 'border-blue-500', icon: '📌', text: 'text-blue-300' },
            important: { bg: 'bg-red-900/20', border: 'border-red-500', icon: '⚠️', text: 'text-red-300' },
            remember: { bg: 'bg-purple-900/20', border: 'border-purple-500', icon: '🧠', text: 'text-purple-300' },
            warning: { bg: 'bg-orange-900/20', border: 'border-orange-500', icon: '⚠️', text: 'text-orange-300' },
            tip: { bg: 'bg-green-900/20', border: 'border-green-500', icon: '💡', text: 'text-green-300' },
            'key point': { bg: 'bg-yellow-900/20', border: 'border-yellow-500', icon: '🔑', text: 'text-yellow-300' }
          };
          const colors = calloutColors[calloutType] || calloutColors.note;
          
          return (
            <div key={idx} className={`mb-5 ${colors.bg} rounded-xl p-4 border-l-4 ${colors.border} shadow-md`}>
              <div className="flex items-start">
                <span className="text-2xl mr-3 flex-shrink-0">{colors.icon}</span>
                <p className={`${colors.text} text-[15px] leading-relaxed font-medium`}>
                  {element.content}
                </p>
              </div>
            </div>
          );

        case 'definition':
          return (
            <div key={idx} className="mb-4 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 rounded-lg p-4 border-l-4 border-indigo-400 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-indigo-300 font-bold text-[15px] mb-1 sm:mb-0 sm:min-w-[120px]">
                  {element.key}:
                </span>
                <span className="text-gray-100 text-[15px] leading-relaxed sm:ml-3 flex-1">
                  {element.value}
                </span>
              </div>
            </div>
          );

        case 'example':
          return (
            <div key={idx} className="mb-5 bg-teal-900/20 rounded-xl p-4 border-l-4 border-teal-400 shadow-sm">
              <div className="flex items-start">
                <span className="text-2xl mr-3 flex-shrink-0">📚</span>
                <p className="text-teal-200 text-[15px] leading-relaxed">
                  {element.content}
                </p>
              </div>
            </div>
          );

        case 'paragraph':
        default:
          return (
            <p key={idx} className="text-gray-100 leading-[1.8] mb-4 last:mb-0 text-[15px]">
              {element.content}
            </p>
          );
      }
    });
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
    
    if (fileData) {
      userMessage = userMessage || "Please analyze this document and tell me what it's about.";
    }

    setInput('');
    setUploadedFile(null);

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
      let chatId = currentChatId;
      if (!chatId) {
        chatId = await onCreateChat(userMessage);
      }

      if (chatId) {
        await onSaveMessage(chatId, 'user', userMessage, fileData ? { name: fileData.name, size: fileData.size } : null);
      }

      // Check for cached similar query
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
          
          setCacheHit({
            similarity: cachedResult.similarity,
            originalQuery: cachedResult.originalQuery
          });

          setTimeout(() => setCacheHit(null), 3000);
        }
      }

      // If no cache hit, call the API
      if (!usedCache) {
        console.log('No cache hit. Calling AI API...');
        
        if (userId) {
          const newLimitData = await incrementMessageCount(userId);
          setMessageLimitData(newLimitData);
        }

        const conversationHistory = [];
        
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
        
        let currentPrompt = userMessage;
        if (fileData) {
          currentPrompt = `[Document: ${fileData.name}]\n\n${fileData.content}\n\n${userMessage}`;
        }
        
        conversationHistory.push({
          role: 'user',
          parts: [{ text: currentPrompt }]
        });

        const chat = model.startChat({
          history: conversationHistory.slice(0, -1)
        });
        
        const streamResult = await chat.sendMessageStream(currentPrompt);

        let aiMessage = { role: "assistant", content: "" };
        setMessages((prev) => [...prev, aiMessage]);

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
        const cachedMessage = { 
          role: "assistant", 
          content: aiResponseText,
          cached: true 
        };
        setMessages((prev) => [...prev, cachedMessage]);
      }

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

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      <ChatHeader 
        onToggleSidebar={onToggleSidebar}
        messageLimitData={messageLimitData}
      />

      <Banner type="cache" cacheHit={cacheHit} />
      <Banner type="warning" messageLimitData={messageLimitData} />
      <Banner type="limit" messageLimitData={messageLimitData} />

      <MessageList 
        messages={messages}
        isLoading={isLoading}
        messageLimitData={messageLimitData}
        formatBotMessage={formatBotMessage}
        renderFormattedContent={renderFormattedContent}
      />

      <ChatInput 
        input={input}
        setInput={setInput}
        uploadedFile={uploadedFile}
        setUploadedFile={setUploadedFile}
        showFileUpload={showFileUpload}
        setShowFileUpload={setShowFileUpload}
        isLoading={isLoading}
        messageLimitData={messageLimitData}
        onSendMessage={handleSendMessage}
        onFileProcessed={handleFileProcessed}
        onRemoveFile={handleRemoveFile}
      />
    </div>
  );
};

export default ChatArea;
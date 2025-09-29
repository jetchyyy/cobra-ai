// Home.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ChatSidebar from '../components/ChatSidebar';
import ChatArea from './ChatArea';
import { ref, push, set, get, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from '../firebase/firebase';

const Home = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  const loadChats = async () => {
    try {
      const chatsRef = ref(database, `chats/${user.uid}`);
      const snapshot = await get(chatsRef);
      
      if (snapshot.exists()) {
        const chatsData = snapshot.val();
        const loadedChats = Object.keys(chatsData)
          .map(key => ({
            id: key,
            ...chatsData[key]
          }))
          .sort((a, b) => b.createdAt - a.createdAt);
        
        setChats(loadedChats);
      } else {
        setChats([]);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const createNewChat = async (firstMessage) => {
    try {
      const chatRef = push(ref(database, `chats/${user.uid}`));
      const chatId = chatRef.key;
      
      const chatData = {
        title: firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : ''),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      await set(chatRef, chatData);
      
      const newChat = { id: chatId, ...chatData };
      setChats([newChat, ...chats]);
      setCurrentChatId(chatId);
      
      return chatId;
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  };

  const saveMessage = async (chatId, role, content) => {
    try {
      const messageRef = push(ref(database, `messages/${chatId}`));
      await set(messageRef, {
        role,
        content,
        timestamp: Date.now()
      });

      // Update chat's updatedAt timestamp
      const chatRef = ref(database, `chats/${user.uid}/${chatId}/updatedAt`);
      await set(chatRef, Date.now());
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const loadChatMessages = async (chatId) => {
    try {
      const messagesRef = ref(database, `messages/${chatId}`);
      const snapshot = await get(messagesRef);
      
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const loadedMessages = Object.keys(messagesData)
          .map(key => ({
            id: key,
            ...messagesData[key]
          }))
          .sort((a, b) => a.timestamp - b.timestamp);
        
        setMessages(loadedMessages);
      } else {
        setMessages([]);
      }
      
      setCurrentChatId(chatId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setIsSidebarOpen(false);
  };

  const handleSelectChat = (chatId) => {
    loadChatMessages(chatId);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <ChatArea
        messages={messages}
        setMessages={setMessages}
        currentChatId={currentChatId}
        onCreateChat={createNewChat}
        onSaveMessage={saveMessage}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
    </div>
  );
};

export default Home;
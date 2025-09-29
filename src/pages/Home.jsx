import { useState, useEffect } from 'react';
import { ref, push, set, get, onValue } from 'firebase/database';
import { database } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/ChatSidebar';
import ChatArea from './ChatArea';
import { getMessageLimitData } from '../components/utils/ChatLimitManager';

const Home = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messageLimitData, setMessageLimitData] = useState(null);

  // Load message limit data on mount and when user changes
  useEffect(() => {
    const loadMessageLimit = async () => {
      if (user?.uid) {
        try {
          const limitData = await getMessageLimitData(user.uid);
          setMessageLimitData(limitData);
        } catch (error) {
          console.error('Error loading message limit:', error);
        }
      }
    };

    loadMessageLimit();
  }, [user]);

  // Load user's chats from Firebase
  useEffect(() => {
    if (!user) return;

    const chatsRef = ref(database, `chats/${user.uid}`);
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const chatsList = Object.entries(data).map(([id, chat]) => ({
          id,
          ...chat
        }));
        // Sort by timestamp, newest first
        chatsList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setChats(chatsList);
      } else {
        setChats([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Load messages for current chat
  useEffect(() => {
    if (!currentChatId || !user) {
      setMessages([]);
      return;
    }

    const messagesRef = ref(database, `messages/${user.uid}/${currentChatId}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.values(data);
        messagesList.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [currentChatId, user]);

  const handleCreateChat = async (firstMessage) => {
    if (!user) return;

    try {
      const chatsRef = ref(database, `chats/${user.uid}`);
      const newChatRef = push(chatsRef);
      
      const chatData = {
        title: firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : ''),
        timestamp: new Date().toISOString(),
        lastMessage: firstMessage
      };

      await set(newChatRef, chatData);
      setCurrentChatId(newChatRef.key);
      return newChatRef.key;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  };

 const handleSaveMessage = async (chatId, role, content, fileMetadata = null) => {
  if (!user) return;

  try {
    const messagesRef = ref(database, `messages/${user.uid}/${chatId}`);
    const newMessageRef = push(messagesRef);
    
    const messageData = {
      role,
      content,
      timestamp: new Date().toISOString()
    };

    // Add file metadata if it exists
    if (fileMetadata) {
      messageData.file = fileMetadata;
    }

    await set(newMessageRef, messageData);

    // Update chat's last message
    const chatRef = ref(database, `chats/${user.uid}/${chatId}`);
    const chatSnapshot = await get(chatRef);
    if (chatSnapshot.exists()) {
      await set(chatRef, {
        ...chatSnapshot.val(),
        lastMessage: content.substring(0, 100),
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error saving message:', error);
  }
};

  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId);
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
  };

  const handleDeleteChat = async (chatId) => {
    if (!user) return;

    try {
      // Delete chat
      const chatRef = ref(database, `chats/${user.uid}/${chatId}`);
      await set(chatRef, null);

      // Delete messages
      const messagesRef = ref(database, `messages/${user.uid}/${chatId}`);
      await set(messagesRef, null);

      // If deleted chat was current, clear it
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        isOpen={sidebarOpen}
        messageLimitData={messageLimitData}
      />
      <ChatArea
        messages={messages}
        setMessages={setMessages}
        currentChatId={currentChatId}
        onCreateChat={handleCreateChat}
        onSaveMessage={handleSaveMessage}
        onToggleSidebar={toggleSidebar}
        userId={user?.uid}
        messageLimitData={messageLimitData}
        setMessageLimitData={setMessageLimitData}
      />
    </div>
  );
};

export default Home;
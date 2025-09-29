import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle } from 'lucide-react';
import { ref, remove, get } from 'firebase/database';
import { database } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';

const DeleteChatHistory = ({ onHistoryDeleted }) => {
  const { user } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDeleteAllChats = async () => {
    console.log('Delete button clicked');
    console.log('User:', user);
    
    if (!user) {
      console.error('No user found');
      setError('User not authenticated');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      console.log('Starting deletion process...');
      
      // Get all chat IDs for the current user
      const chatsRef = ref(database, `chats/${user.uid}`);
      console.log('Fetching chats from:', `chats/${user.uid}`);
      
      const chatsSnapshot = await get(chatsRef);
      console.log('Chats snapshot exists:', chatsSnapshot.exists());
      
      if (chatsSnapshot.exists()) {
        const userChats = chatsSnapshot.val();
        const chatIds = Object.keys(userChats);
        console.log('Found chat IDs:', chatIds);

        // Delete all messages for each chat
        const deletePromises = chatIds.map(chatId => {
          console.log('Deleting messages for chat:', chatId);
          const messagesRef = ref(database, `messages/${chatId}`);
          return remove(messagesRef);
        });

        // Wait for all message deletions to complete
        await Promise.all(deletePromises);
        console.log('All messages deleted');
      }

      // Delete all chats for the user
      console.log('Deleting all chats...');
      await remove(chatsRef);
      console.log('All chats deleted successfully');

      setShowConfirmModal(false);
      
      // Callback to parent component to refresh UI
      if (onHistoryDeleted) {
        console.log('Calling onHistoryDeleted callback');
        onHistoryDeleted();
      }
    } catch (err) {
      console.error('Error deleting chat history:', err);
      console.error('Error details:', err.message, err.code);
      setError(`Failed to delete: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Modal content
  const modalContent = showConfirmModal ? (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[10000]"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDeleting) {
          setShowConfirmModal(false);
          setError(null);
        }
      }}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-white mb-2">
              Delete All Chat History?
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              This action cannot be undone. All of your chats and messages will be permanently deleted from the database.
            </p>
            {error && (
              <p className="text-red-400 text-sm mb-4 bg-red-900/20 p-2 rounded border border-red-700">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Cancel clicked');
              setShowConfirmModal(false);
              setError(null);
            }}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Delete All clicked');
              handleDeleteAllChats();
            }}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-500 disabled:cursor-not-allowed text-white rounded-lg transition duration-200 flex items-center justify-center"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Delete All Icon Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Trash icon clicked');
          setShowConfirmModal(true);
        }}
        className="text-gray-400 hover:text-red-400 transition duration-200 p-1"
        title="Delete all chat history"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Render modal using Portal to escape sidebar container */}
      {modalContent && createPortal(modalContent, document.body)}
    </>
  );
};

export default DeleteChatHistory;
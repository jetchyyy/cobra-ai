import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle } from 'lucide-react';
import { ref, remove } from 'firebase/database';
import { database } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';

const DeleteSingleChat = ({ chatId, chatTitle, onChatDeleted }) => {
  const { user } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDeleteChat = async () => {
    console.log('Deleting chat:', chatId);
    
    if (!chatId || !user) {
      console.error('No chat ID or user provided');
      setError('Invalid chat ID or user not authenticated');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      // Delete messages for this chat
      const messagesRef = ref(database, `messages/${chatId}`);
      await remove(messagesRef);
      console.log('Messages deleted for chat:', chatId);

      // Delete the chat itself (must include user.uid in the path)
      const chatRef = ref(database, `chats/${user.uid}/${chatId}`);
      await remove(chatRef);
      console.log('Chat deleted:', chatId);

      setShowConfirmModal(false);
      
      // Callback to parent component to refresh UI
      if (onChatDeleted) {
        onChatDeleted(chatId);
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
      setError(`Failed to delete: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleIconClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Trash icon clicked for chat:', chatId);
    setShowConfirmModal(true);
  };

  const handleModalBackgroundClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDeleting) {
      setShowConfirmModal(false);
      setError(null);
    }
  };

  // Modal content
  const modalContent = showConfirmModal ? (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[10000]"
      onClick={handleModalBackgroundClick}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              Delete Chat?
            </h3>
            <p className="text-gray-400 text-sm mb-2">
              Are you sure you want to delete this chat?
            </p>
            <div className="bg-gray-900/50 p-2 rounded mb-3 border border-gray-700">
              <p className="text-gray-300 text-sm italic truncate">
                "{chatTitle}"
              </p>
            </div>
            <p className="text-gray-400 text-sm">
              This action cannot be undone. All messages in this chat will be permanently deleted.
            </p>
            {error && (
              <p className="text-red-400 text-sm mt-3 bg-red-900/20 p-2 rounded border border-red-700">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
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
              console.log('Delete clicked');
              handleDeleteChat();
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
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Delete Icon Button */}
      <button
        onClick={handleIconClick}
        className="p-1.5 rounded transition-opacity text-gray-400 hover:text-red-400 hover:bg-gray-600"
        title="Delete chat"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Render modal using Portal to escape sidebar container */}
      {modalContent && createPortal(modalContent, document.body)}
    </>
  );
};

export default DeleteSingleChat;
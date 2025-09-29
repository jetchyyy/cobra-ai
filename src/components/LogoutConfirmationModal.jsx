import { useEffect, useState } from 'react';
import { LogOut, X } from 'lucide-react';

const LogoutConfirmationModal = ({ isOpen, onConfirm, onCancel }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onConfirm();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
            <LogOut className="w-6 h-6 text-purple-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white text-center mb-2">
          Logout Confirmation
        </h2>

        {/* Message */}
        <p className="text-gray-300 text-center mb-6">
          Are you sure you want to log out? You will be automatically logged out in{' '}
          <span className="text-purple-400 font-bold">{countdown}</span> second{countdown !== 1 ? 's' : ''}.
        </p>

        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-6 overflow-hidden">
          <div 
            className="bg-purple-600 h-full transition-all duration-1000 ease-linear"
            style={{ width: `${(countdown / 5) * 100}%` }}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 px-4 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-4 rounded-lg transition-colors font-medium"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmationModal;
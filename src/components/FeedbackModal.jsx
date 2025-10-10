import { useState } from 'react';
import { X, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';

export default function FeedbackModal({ isOpen, onClose, onSubmit }) {
  const [rating, setRating] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    await onSubmit({ rating, feedback });
    setIsSubmitting(false);
    handleClose();
  };

  const handleClose = () => {
    setRating(null);
    setFeedback('');
    onClose();
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">How are we doing?</h2>
              <p className="text-sm text-gray-400">Your feedback helps us improve</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Rate your experience
            </label>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => setRating('positive')}
                className={`flex-1 flex flex-col items-center space-y-2 p-4 rounded-xl border-2 transition-all ${
                  rating === 'positive'
                    ? 'border-green-500 bg-green-500 bg-opacity-10'
                    : 'border-gray-600 hover:border-green-500 hover:bg-gray-700'
                }`}
              >
                <ThumbsUp
                  className={`w-8 h-8 ${
                    rating === 'positive' ? 'text-green-500' : 'text-gray-400'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    rating === 'positive' ? 'text-green-500' : 'text-gray-400'
                  }`}
                >
                  Good
                </span>
              </button>

              <button
                onClick={() => setRating('negative')}
                className={`flex-1 flex flex-col items-center space-y-2 p-4 rounded-xl border-2 transition-all ${
                  rating === 'negative'
                    ? 'border-red-500 bg-red-500 bg-opacity-10'
                    : 'border-gray-600 hover:border-red-500 hover:bg-gray-700'
                }`}
              >
                <ThumbsDown
                  className={`w-8 h-8 ${
                    rating === 'negative' ? 'text-red-500' : 'text-gray-400'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    rating === 'negative' ? 'text-red-500' : 'text-gray-400'
                  }`}
                >
                  Bad
                </span>
              </button>
            </div>
          </div>

          {/* Feedback Text */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional feedback (optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us more about your experience..."
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="4"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !rating}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
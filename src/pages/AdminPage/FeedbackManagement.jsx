import { useState, useEffect } from 'react';
import { ref, get, remove } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { MessageSquare, ThumbsUp, ThumbsDown, Trash2, User, Calendar, Search } from 'lucide-react';

export default function FeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const feedbacksRef = ref(database, 'userFeedbacks');
      const snapshot = await get(feedbacksRef);
      
      if (snapshot.exists()) {
        const feedbackData = snapshot.val();
        const feedbackArray = Object.entries(feedbackData).map(([id, data]) => ({
          id,
          ...data
        }));
        // Sort by timestamp, newest first
        feedbackArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setFeedbacks(feedbackArray);
      } else {
        setFeedbacks([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setLoading(false);
    }
  };

  const deleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      const feedbackRef = ref(database, `userFeedbacks/${feedbackId}`);
      await remove(feedbackRef);
      
      setFeedbacks(feedbacks.filter(f => f.id !== feedbackId));
      alert('Feedback deleted successfully');
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Failed to delete feedback');
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = 
      feedback.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.feedback?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = 
      filterRating === 'all' || feedback.rating === filterRating;
    
    return matchesSearch && matchesRating;
  });

  const stats = {
    total: feedbacks.length,
    positive: feedbacks.filter(f => f.rating === 'positive').length,
    negative: feedbacks.filter(f => f.rating === 'negative').length,
    withComments: feedbacks.filter(f => f.feedback && f.feedback.trim() !== '').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading feedbacks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm font-medium">Total Feedback</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <MessageSquare className="w-12 h-12 text-blue-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm font-medium">Positive</p>
              <p className="text-3xl font-bold mt-2">{stats.positive}</p>
            </div>
            <ThumbsUp className="w-12 h-12 text-green-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-200 text-sm font-medium">Negative</p>
              <p className="text-3xl font-bold mt-2">{stats.negative}</p>
            </div>
            <ThumbsDown className="w-12 h-12 text-red-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm font-medium">With Comments</p>
              <p className="text-3xl font-bold mt-2">{stats.withComments}</p>
            </div>
            <MessageSquare className="w-12 h-12 text-purple-200 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by email or feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Ratings</option>
            <option value="positive">Positive Only</option>
            <option value="negative">Negative Only</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedbacks.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
            <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No feedback found</p>
          </div>
        ) : (
          filteredFeedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                      feedback.rating === 'positive'
                        ? 'bg-green-500 bg-opacity-20 text-green-400'
                        : 'bg-red-500 bg-opacity-20 text-red-400'
                    }`}>
                      {feedback.rating === 'positive' ? (
                        <ThumbsUp className="w-4 h-4" />
                      ) : (
                        <ThumbsDown className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium capitalize">
                        {feedback.rating}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {new Date(feedback.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center space-x-2 mb-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300 font-medium">
                      {feedback.userEmail || 'Anonymous'}
                    </span>
                    <span className="text-gray-500 text-sm">
                      • {feedback.messageCount} messages
                    </span>
                  </div>

                  {/* Feedback Text */}
                  {feedback.feedback && feedback.feedback.trim() !== '' && (
                    <div className="bg-gray-700 rounded-lg p-4 mt-3">
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {feedback.feedback}
                      </p>
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => deleteFeedback(feedback.id)}
                  className="ml-4 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500 hover:bg-opacity-10 rounded-lg transition-colors"
                  title="Delete feedback"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
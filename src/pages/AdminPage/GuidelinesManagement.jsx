import { useState, useEffect } from 'react';
import { ref, get, set, push, remove } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { Plus, Edit2, Trash2, Search, Book, AlertCircle, Check } from 'lucide-react';

export default function GuidelinesManagement() {
  const [guidelines, setGuidelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGuideline, setEditingGuideline] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [notification, setNotification] = useState(null);

  const categories = [
    'Scholarship',
    'Enrollment',
    'Campus Life',
    'Academic Programs',
    'Student Services',
    'Fees & Payments',
    'Campus Facilities',
    'Policies & Regulations',
    'Other'
  ];

  useEffect(() => {
    fetchGuidelines();
  }, []);

  const fetchGuidelines = async () => {
    try {
      const guidelinesRef = ref(database, 'guidelines');
      const snapshot = await get(guidelinesRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const guidelinesArray = Object.entries(data).map(([id, guideline]) => ({
          id,
          ...guideline
        }));
        setGuidelines(guidelinesArray);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching guidelines:', error);
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveGuideline = async (guidelineData) => {
    try {
      if (editingGuideline) {
        const guidelineRef = ref(database, `guidelines/${editingGuideline.id}`);
        await set(guidelineRef, {
          ...guidelineData,
          updatedAt: Date.now()
        });
        showNotification('Guideline updated successfully!');
      } else {
        const guidelinesRef = ref(database, 'guidelines');
        await push(guidelinesRef, {
          ...guidelineData,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        showNotification('Guideline created successfully!');
      }
      
      fetchGuidelines();
      setShowAddModal(false);
      setEditingGuideline(null);
    } catch (error) {
      console.error('Error saving guideline:', error);
      showNotification('Failed to save guideline', 'error');
    }
  };

  const handleDeleteGuideline = async (id) => {
    if (!window.confirm('Are you sure you want to delete this guideline?')) {
      return;
    }

    try {
      const guidelineRef = ref(database, `guidelines/${id}`);
      await remove(guidelineRef);
      showNotification('Guideline deleted successfully!');
      fetchGuidelines();
    } catch (error) {
      console.error('Error deleting guideline:', error);
      showNotification('Failed to delete guideline', 'error');
    }
  };

  const filteredGuidelines = guidelines.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         g.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         g.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || g.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading guidelines...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <span className="text-white font-medium">{notification.message}</span>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Book size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">SWU Guidelines</h2>
              <p className="text-gray-400">Manage AI knowledge base for student queries</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingGuideline(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Add Guideline
          </button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search guidelines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredGuidelines.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
            <Book size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No guidelines found. Add your first guideline to get started!</p>
          </div>
        ) : (
          filteredGuidelines.map((guideline) => (
            <div key={guideline.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{guideline.title}</h3>
                    <span className="px-3 py-1 bg-blue-600 text-blue-100 text-xs font-medium rounded-full">
                      {guideline.category}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-3 line-clamp-2">{guideline.content}</p>
                  <div className="flex flex-wrap gap-2">
                    {guideline.keywords.map((keyword, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingGuideline(guideline);
                      setShowAddModal(true);
                    }}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-blue-400 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteGuideline(guideline.id)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <GuidelineModal
          guideline={editingGuideline}
          categories={categories}
          onSave={handleSaveGuideline}
          onClose={() => {
            setShowAddModal(false);
            setEditingGuideline(null);
          }}
        />
      )}
    </div>
  );
}

function GuidelineModal({ guideline, categories, onSave, onClose }) {
  const [formData, setFormData] = useState({
    title: guideline?.title || '',
    category: guideline?.category || 'Scholarship',
    content: guideline?.content || '',
    keywords: guideline?.keywords?.join(', ') || ''
  });

  const handleSubmit = () => {
    const keywords = formData.keywords.split(',').map(k => k.trim()).filter(k => k);
    onSave({
      title: formData.title,
      category: formData.category,
      content: formData.content,
      keywords
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-white mb-6">
          {guideline ? 'Edit Guideline' : 'Add New Guideline'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="scholarship, renewal, requirements"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {guideline ? 'Update' : 'Create'} Guideline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
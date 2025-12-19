// ============================================
// FILE: frontend/src/components/exchange/ExchangeRequestModal.jsx
// CREATE NEW FILE
// ============================================
import { useState, useEffect } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { exchangeService } from '../../services/exchangeService';
import toast from 'react-hot-toast';

const ExchangeRequestModal = ({ isOpen, onClose, targetUser }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    skillOfferedId: '',
    skillWantedId: '',
    message: '',
    duration: 1
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        skillOfferedId: '',
        skillWantedId: '',
        message: '',
        duration: 1
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.skillOfferedId || !formData.skillWantedId) {
      toast.error('Please select both skills');
      return;
    }

    try {
      setLoading(true);

      const exchangeData = {
        receiverId: targetUser._id,
        skillOfferedId: formData.skillOfferedId,
        skillWantedId: formData.skillWantedId,
        message: formData.message,
        duration: formData.duration
      };

      await exchangeService.createExchange(exchangeData);
      
      toast.success('Exchange request sent successfully! 🎉');
      onClose();
      
    } catch (error) {
      console.error('Create exchange error:', error);
      toast.error(error.response?.data?.error || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Request Skill Exchange</h2>
            <p className="text-sm text-gray-600">
              Exchange skills with {targetUser?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Target User Info */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
            <img
              src={targetUser?.avatar}
              alt={targetUser?.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{targetUser?.name}</h3>
              <p className="text-sm text-gray-600">
                ⭐ {targetUser?.rating?.toFixed(1)} ({targetUser?.totalReviews} reviews)
              </p>
            </div>
          </div>

          {/* Skill I Offer */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Skill I'll Teach 📚
            </label>
            <select
              value={formData.skillOfferedId}
              onChange={(e) => setFormData({ ...formData, skillOfferedId: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none"
              required
            >
              <option value="">Select a skill you can teach</option>
              {user?.skillsOffered?.map((skill) => (
                <option key={skill._id} value={skill._id}>
                  {skill.name} ({skill.level}) - {skill.category}
                </option>
              ))}
            </select>
            {user?.skillsOffered?.length === 0 && (
              <p className="mt-2 text-sm text-amber-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                You need to add skills you can offer first
              </p>
            )}
          </div>

          {/* Skill I Want */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Skill I Want to Learn 🎯
            </label>
            <select
              value={formData.skillWantedId}
              onChange={(e) => setFormData({ ...formData, skillWantedId: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none"
              required
            >
              <option value="">Select a skill they can teach</option>
              {targetUser?.skillsOffered?.map((skill) => (
                <option key={skill._id} value={skill._id}>
                  {skill.name} ({skill.level}) - {skill.category}
                </option>
              ))}
            </select>
          </div>

          {/* Exchange Arrow Visual */}
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent"></div>
            <div className="text-2xl">🔄</div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Estimated Duration (hours)
            </label>
            <input
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none"
            />
            <p className="mt-1 text-sm text-gray-500">
              How many hours per session? (0.5 - 10 hours)
            </p>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Message (Optional) 💬
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows="4"
              maxLength="500"
              placeholder="Introduce yourself and explain why you'd like to exchange skills..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none resize-none"
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.message.length}/500 characters
            </p>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">What happens next?</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>{targetUser?.name} will receive your request</li>
                  <li>They can accept or decline</li>
                  <li>If accepted, you can schedule a session</li>
                  <li>You'll get notified of any updates</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.skillOfferedId || !formData.skillWantedId}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExchangeRequestModal;
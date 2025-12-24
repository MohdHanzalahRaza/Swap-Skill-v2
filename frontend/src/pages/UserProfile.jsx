// ============================================
// FILE: frontend/src/pages/UserProfile.jsx
// REPLACE ENTIRE FILE - With Exchange Request Feature
// ============================================
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { userService } from '../services/userService';
import { useAuth } from '../hooks/useAuth';
import ExchangeRequestModal from '../components/exchange/ExchangeRequestModal';
import Loader from '../components/common/Loader';
import { Star, MapPin, Calendar, Award, Send } from 'lucide-react';
import { getAvatarUrl } from '../utils/imageUtils';

const UserProfile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExchangeModal, setShowExchangeModal] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await userService.getUserById(id);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (!user) return <div className="min-h-screen flex items-center justify-center">User not found</div>;

  const isOwnProfile = currentUser && currentUser._id === user._id;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
          {/* Cover */}
          <div className="h-40 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500"></div>

          <div className="px-8 pb-8">
            <div className="flex items-end justify-between -mt-20 mb-6">
              {user.avatar ? (
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt={user.name}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-xl">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}

              {/* Action Buttons */}
              {!isOwnProfile && currentUser && (
                <button
                  onClick={() => setShowExchangeModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  <Send className="w-5 h-5" />
                  Request Exchange
                </button>
              )}
            </div>

            {/* User Info */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>

            <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
              {user.location?.city && user.location?.country && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{user.location.city}, {user.location.country}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{user.rating?.toFixed(1) || '0.0'}</span>
                <span>({user.totalReviews || 0} reviews)</span>
              </div>

              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                <span>{user.totalExchanges || 0} exchanges</span>
              </div>
            </div>

            {user.bio && (
              <p className="text-gray-700 leading-relaxed">{user.bio}</p>
            )}
          </div>
        </div>

        {/* Skills Section */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* Skills Offered */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills Offered</h2>
            <div className="space-y-3">
              {!user.skillsOffered || user.skillsOffered.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No skills offered yet</p>
              ) : (
                user.skillsOffered.map((skill) => (
                  <div
                    key={skill._id}
                    className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100"
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">{skill.name}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">{skill.category}</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                        {skill.level}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Skills Wanted */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills Wanted</h2>
            <div className="space-y-3">
              {!user.skillsWanted || user.skillsWanted.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No skills wanted yet</p>
              ) : (
                user.skillsWanted.map((skill) => (
                  <div
                    key={skill._id}
                    className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100"
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">{skill.name}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">{skill.category}</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                        {skill.level}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Request Modal */}
      <ExchangeRequestModal
        isOpen={showExchangeModal}
        onClose={() => setShowExchangeModal(false)}
        targetUser={user}
      />
    </div>
  );
};

export default UserProfile;
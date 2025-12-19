// ============================================
// FILE: frontend/src/pages/Profile.jsx
// REPLACE ENTIRE FILE WITH THIS FIXED VERSION
// ============================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit2, Save, X, Camera, MapPin, Mail, Calendar, Star,
  Plus, Trash2, Award, BookOpen, Sparkles, Check
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import { skillService } from '../services/skillService';
import toast from 'react-hot-toast';
import { SKILL_CATEGORIES, SKILL_LEVELS } from '../utils/constants';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: {
      city: user?.location?.city || '',
      country: user?.location?.country || ''
    },
  });

  const [showAddSkill, setShowAddSkill] = useState(false);
  const [skillType, setSkillType] = useState('offer');
  const [newSkill, setNewSkill] = useState({
    name: '',
    category: SKILL_CATEGORIES[0] || 'Programming',
    level: SKILL_LEVELS[1] || 'Intermediate',
    description: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: {
          city: user.location?.city || '',
          country: user.location?.country || ''
        }
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      const updatePayload = {
        name: profileData.name,
        bio: profileData.bio,
        location: profileData.location
      };
      
      const response = await userService.updateProfile(updatePayload);
      updateUser(response.data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Save Profile Error:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // FIX #1: Avatar Upload Handler
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setLoading(true);
      const response = await userService.uploadAvatar(file);
      
      // Update user context with new avatar
      const updatedUser = { ...user, avatar: response.data.avatar };
      updateUser(updatedUser);
      
      toast.success('Avatar updated successfully!');
    } catch (error) {
      console.error('Avatar Upload Error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  // FIX #2: Add Skill Handler
  const handleAddSkill = async () => {
    if (!newSkill.name || !newSkill.category) {
      toast.error('Skill name and category are required.');
      return;
    }

    try {
      setLoading(true);
      const payload = { 
        ...newSkill, 
        type: skillType
      };
      
      await skillService.createSkill(payload);
      
      toast.success('Skill added successfully!');
      
      // Reset form
      setShowAddSkill(false);
      setNewSkill({ 
        name: '', 
        category: SKILL_CATEGORIES[0] || 'Programming', 
        level: SKILL_LEVELS[1] || 'Intermediate', 
        description: '' 
      });
      
      // FIX: Fetch updated user data using the correct endpoint
      try {
        const updatedUserResponse = await userService.getUserById(user._id);
        updateUser(updatedUserResponse.data);
      } catch (fetchError) {
        console.error('Error fetching updated user:', fetchError);
        // Fallback: reload page to get updated data
        window.location.reload();
      }
      
    } catch (error) {
      console.error('Add Skill Error:', error);
      toast.error(error.response?.data?.error || 'Failed to add skill');
    } finally {
      setLoading(false);
    }
  };

  // FIX #3: Remove Skill Handler
  const handleRemoveSkill = async (skillId, type) => {
    if (!window.confirm(`Are you sure you want to remove this skill?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await skillService.deleteSkill(skillId);
      
      toast.success('Skill removed successfully!');

      // Fetch updated user data
      try {
        const updatedUserResponse = await userService.getUserById(user._id);
        updateUser(updatedUserResponse.data);
      } catch (fetchError) {
        console.error('Error fetching updated user:', fetchError);
        window.location.reload();
      }

    } catch (error) {
      console.error('Remove Skill Error:', error);
      toast.error(error.response?.data?.error || 'Failed to remove skill');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    const lowerLevel = level?.toLowerCase() || 'intermediate';
    const colors = {
      beginner: 'bg-green-100 text-green-700',
      intermediate: 'bg-blue-100 text-blue-700',
      advanced: 'bg-purple-100 text-purple-700',
      expert: 'bg-orange-100 text-orange-700'
    };
    return colors[lowerLevel] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
          {/* Cover Image */}
          <div className="h-40 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
          </div>

          <div className="px-8 pb-8">
            {/* Avatar and Edit Button */}
            <div className="flex items-end justify-between -mt-20 mb-6">
              <div className="relative group">
                {/* Avatar Display */}
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-32 h-32 rounded-2xl object-cover ring-4 ring-white shadow-xl"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-4xl font-bold ring-4 ring-white shadow-xl">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                
                {/* FIX: Avatar Upload Overlay - Always visible when editing */}
                {isEditing && (
                  <label className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 rounded-2xl flex items-center justify-center transition-all cursor-pointer group">
                    <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                )}
              </div>

              {/* Edit/Save/Cancel Buttons */}
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setProfileData({
                          name: user?.name || '',
                          email: user?.email || '',
                          bio: user?.bio || '',
                          location: {
                            city: user?.location?.city || '',
                            country: user?.location?.country || ''
                          }
                        });
                      }}
                      disabled={loading}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg"
                  >
                    <Edit2 className="w-5 h-5" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Profile Info Fields */}
            <div className="space-y-4">
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className="text-3xl font-bold text-gray-900 w-full border-2 border-gray-300 rounded-xl px-4 py-2 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none"
                  placeholder="Your Name"
                />
              ) : (
                <h1 className="text-3xl font-bold text-gray-900">{user?.name || 'Anonymous User'}</h1>
              )}

              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  <span>{user?.email}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="location.city"
                        value={profileData.location.city}
                        onChange={handleProfileChange}
                        className="border-2 border-gray-300 rounded-lg px-3 py-1 w-32 focus:border-indigo-500 outline-none"
                        placeholder="City"
                      />
                      <input
                        type="text"
                        name="location.country"
                        value={profileData.location.country}
                        onChange={handleProfileChange}
                        className="border-2 border-gray-300 rounded-lg px-3 py-1 w-32 focus:border-indigo-500 outline-none"
                        placeholder="Country"
                      />
                    </div>
                  ) : (
                    <span>
                      {user?.location?.city && user?.location?.country
                        ? `${user.location.city}, ${user.location.country}`
                        : 'Location not set'}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{user?.rating?.toFixed(1) || '0.0'}</span>
                  <span>({user?.totalReviews || 0} reviews)</span>
                </div>
              </div>

              {isEditing ? (
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleProfileChange}
                  rows="3"
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none resize-none"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">
                  {user?.bio || 'No bio yet. Click "Edit Profile" to add one!'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Skills Offered */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Skills I Offer</h2>
              </div>
              <button
                onClick={() => {
                  setSkillType('offer');
                  setShowAddSkill(true);
                }}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                title="Add skill"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {!user?.skillsOffered || user.skillsOffered.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No skills added yet. Add a skill you can teach!</p>
                </div>
              ) : (
                user.skillsOffered.map((skill) => (
                  <div
                    key={skill._id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 group hover:shadow-md transition-all"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{skill.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{skill.category}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getLevelColor(skill.level)}`}>
                          {skill.level}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSkill(skill._id, 'offer')}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Remove skill"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Skills Wanted */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Skills I Want to Learn</h2>
              </div>
              <button
                onClick={() => {
                  setSkillType('want');
                  setShowAddSkill(true);
                }}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                title="Add skill"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {!user?.skillsWanted || user.skillsWanted.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No skills added yet. What do you want to learn?</p>
                </div>
              ) : (
                user.skillsWanted.map((skill) => (
                  <div
                    key={skill._id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 group hover:shadow-md transition-all"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{skill.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{skill.category}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getLevelColor(skill.level)}`}>
                          {skill.level}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSkill(skill._id, 'want')}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Remove skill"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Add Skill Modal */}
        {showAddSkill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Add Skill to {skillType === 'offer' ? 'Offer' : 'Learn'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Skill Name *</label>
                  <input
                    type="text"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none"
                    placeholder="e.g., React Development"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select
                    value={newSkill.category}
                    onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none bg-white"
                    disabled={loading}
                  >
                    {SKILL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Level</label>
                  <select
                    value={newSkill.level}
                    onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none bg-white"
                    disabled={loading}
                  >
                    {SKILL_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                  <textarea
                    placeholder="Brief description of the skill"
                    value={newSkill.description}
                    onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none resize-none"
                    rows="2"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    setShowAddSkill(false);
                    setNewSkill({ 
                      name: '', 
                      category: SKILL_CATEGORIES[0] || 'Programming', 
                      level: SKILL_LEVELS[1] || 'Intermediate', 
                      description: '' 
                    });
                  }}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSkill}
                  disabled={!newSkill.name || loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Add Skill
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
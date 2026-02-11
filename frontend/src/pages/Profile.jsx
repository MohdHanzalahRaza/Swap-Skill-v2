// src/pages/Profile.jsx - Premium My Profile Dashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit2, Save, X, Camera, MapPin, Mail, Calendar, Star,
  Plus, Trash2, Award, BookOpen, Sparkles, Check, User
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import { skillService } from '../services/skillService';
import toast from 'react-hot-toast';
import { SKILL_CATEGORIES, SKILL_LEVELS } from '../utils/constants';
import { getAvatarUrl } from '../utils/imageUtils';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    location: { city: '', country: '' }
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
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setProfileData(prev => ({ ...prev, [name]: value }));
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
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);

    try {
      setLoading(true);
      const response = await userService.uploadAvatar(file);
      const updatedUser = { ...user, avatar: response.data.avatar };
      updateUser(updatedUser);
      setPreviewUrl(null);
      toast.success('Avatar updated!');
    } catch (error) {
      setPreviewUrl(null);
      toast.error('Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.name || !newSkill.category) {
      toast.error('Name and Category are required');
      return;
    }

    try {
      setLoading(true);
      await skillService.createSkill({ ...newSkill, type: skillType });
      toast.success('Skill added!');

      // Refresh user data
      const { data } = await userService.getUserById(user._id);
      updateUser(data);

      setShowAddSkill(false);
      setNewSkill({
        name: '',
        category: SKILL_CATEGORIES[0],
        level: SKILL_LEVELS[1],
        description: ''
      });
    } catch (error) {
      toast.error('Failed to add skill');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSkill = async (skillId) => {
    if (!window.confirm('Remove this skill?')) return;
    try {
      setLoading(true);
      await skillService.deleteSkill(skillId);
      const { data } = await userService.getUserById(user._id);
      updateUser(data);
      toast.success('Skill removed');
    } catch (error) {
      toast.error('Failed to remove skill');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    const map = {
      'Beginner': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'Intermediate': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'Advanced': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      'Expert': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    };
    return map[level] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Cover & Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden mb-8 border border-gray-100 dark:border-gray-700">
          {/* Dynamic Cover */}
          <div className="h-48 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            {isEditing && (
              <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold">
                Editing Profile
              </div>
            )}
          </div>

          <div className="px-8 pb-8 relative">
            {/* Avatar Section */}
            <div className="flex justify-between items-end -mt-20 mb-6">
              <div className="relative group">
                <div className="w-40 h-40 rounded-3xl p-1 bg-white dark:bg-gray-800 shadow-2xl">
                  {previewUrl || user?.avatar ? (
                    <img src={previewUrl || getAvatarUrl(user.avatar)} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-5xl font-bold">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                  )}

                  {/* Upload Overlay */}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-10 h-10 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={loading} />
                  </label>
                </div>
              </div>

              {/* Edit Actions */}
              <div className="flex gap-3 mb-4">
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">Cancel</button>
                    <button onClick={handleSaveProfile} disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2 transition-all">
                      {loading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span> : <Save className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm flex items-center gap-2 transition-all">
                    <Edit2 className="w-4 h-4" /> Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Personal Info */}
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  {isEditing ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                        className="text-3xl font-bold bg-gray-50 dark:bg-gray-700 border-none rounded-lg px-3 py-1 w-full focus:ring-2 focus:ring-indigo-500"
                        placeholder="Your Name"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="location.city"
                          value={profileData.location.city}
                          onChange={handleProfileChange}
                          className="bg-gray-50 dark:bg-gray-700 border-none rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-indigo-500"
                          placeholder="City"
                        />
                        <input
                          type="text"
                          name="location.country"
                          value={profileData.location.country}
                          onChange={handleProfileChange}
                          className="bg-gray-50 dark:bg-gray-700 border-none rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-indigo-500"
                          placeholder="Country"
                        />
                      </div>
                      <textarea
                        name="bio"
                        value={profileData.bio}
                        onChange={handleProfileChange}
                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-lg p-3 h-24 focus:ring-2 focus:ring-indigo-500 resize-none"
                        placeholder="Write a short bio..."
                      />
                    </div>
                  ) : (
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{user?.name}</h1>
                      <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 mb-4 text-sm">
                        {user?.location?.city && (
                          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {user.location.city}, {user.location.country}</span>
                        )}
                        <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {user?.email}</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                        {user?.bio || "No bio added yet."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="flex flex-col justify-center">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-bold text-sm">Rating</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{user?.rating?.toFixed(1) || '0.0'}</p>
                      <p className="text-xs text-gray-500">{user?.totalReviews || 0} reviews</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800">
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                        <Award className="w-4 h-4" />
                        <span className="font-bold text-sm">Exchanges</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{user?.totalExchanges || 0}</p>
                      <p className="text-xs text-gray-500">Total sessions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Offered Skills */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                  <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Skills I Offer</h2>
              </div>
              <button
                onClick={() => { setSkillType('offer'); setShowAddSkill(true); }}
                className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {user?.skillsOffered?.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Start teaching by adding a skill!</p>
                </div>
              ) : (
                user?.skillsOffered?.map(skill => (
                  <div key={skill._id} className="group p-4 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all bg-white dark:bg-gray-800">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{skill.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-gray-500">{skill.category}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getLevelColor(skill.level)}`}>{skill.level}</span>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveSkill(skill._id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {skill.description && <p className="text-sm text-gray-500 line-clamp-2">{skill.description}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Wanted Skills */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Skills I Want</h2>
              </div>
              <button
                onClick={() => { setSkillType('want'); setShowAddSkill(true); }}
                className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {user?.skillsWanted?.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Add skills you want to learn!</p>
                </div>
              ) : (
                user?.skillsWanted?.map(skill => (
                  <div key={skill._id} className="group p-4 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800 hover:shadow-md transition-all bg-white dark:bg-gray-800">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{skill.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-gray-500">{skill.category}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getLevelColor(skill.level)}`}>{skill.level}</span>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveSkill(skill._id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {skill.description && <p className="text-sm text-gray-500 line-clamp-2">{skill.description}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Add Skill Modal */}
        {showAddSkill && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Add Skill</h3>
                <button onClick={() => setShowAddSkill(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Skill Name</label>
                  <input
                    type="text"
                    value={newSkill.name}
                    onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Graphic Design"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Category</label>
                    <select
                      value={newSkill.category}
                      onChange={e => setNewSkill({ ...newSkill, category: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                    >
                      {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Level</label>
                    <select
                      value={newSkill.level}
                      onChange={e => setNewSkill({ ...newSkill, level: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                    >
                      {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Description</label>
                  <textarea
                    value={newSkill.description}
                    onChange={e => setNewSkill({ ...newSkill, description: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                    placeholder="Briefly describe your experience..."
                  />
                </div>

                <button
                  onClick={handleAddSkill}
                  disabled={loading || !newSkill.name}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Skill'}
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
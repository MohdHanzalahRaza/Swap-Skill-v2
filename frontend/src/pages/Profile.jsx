import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import { skillService } from '../services/skillService';
import toast from 'react-hot-toast';
import { 
  FaEdit, 
  FaPlus, 
  FaTrash, 
  FaSave, 
  FaTimes,
  FaCamera 
} from 'react-icons/fa';
import { SKILL_CATEGORIES, SKILL_LEVELS } from '../utils/constants';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: {
      city: user?.location?.city || '',
      country: user?.location?.country || ''
    }
  });

  const [showAddSkill, setShowAddSkill] = useState(false);
  const [skillType, setSkillType] = useState('offer');
  const [newSkill, setNewSkill] = useState({
    name: '',
    category: 'Programming',
    level: 'Beginner',
    description: '',
    tags: []
  });

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
      const response = await userService.updateProfile(profileData);
      updateUser(response.data);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const response = await userService.uploadAvatar(file);
      updateUser({ ...user, avatar: response.data.avatar });
      toast.success('Avatar updated successfully!');
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    try {
      setLoading(true);
      await skillService.createSkill({ ...newSkill, type: skillType });
      toast.success('Skill added successfully!');
      setShowAddSkill(false);
      setNewSkill({
        name: '',
        category: 'Programming',
        level: 'Beginner',
        description: '',
        tags: []
      });
      // Refresh user data
      window.location.reload();
    } catch (error) {
      toast.error('Failed to add skill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Profile Header */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={user?.avatar || 'https://via.placeholder.com/150'}
                alt={user?.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary-500"
              />
              <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 transition">
                <FaCamera />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              {editing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    className="input"
                    placeholder="Your name"
                  />
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    className="input"
                    rows="3"
                    placeholder="Tell us about yourself..."
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      name="location.city"
                      value={profileData.location.city}
                      onChange={handleProfileChange}
                      className="input"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      name="location.country"
                      value={profileData.location.country}
                      onChange={handleProfileChange}
                      className="input"
                      placeholder="Country"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {user?.name}
                  </h1>
                  <p className="text-gray-600 mb-2">
                    {user?.bio || 'No bio yet'}
                  </p>
                  <p className="text-gray-500">
                    📍 {user?.location?.city && user?.location?.country 
                      ? `${user.location.city}, ${user.location.country}`
                      : 'Location not set'}
                  </p>
                  <div className="flex items-center gap-4 mt-4 justify-center md:justify-start">
                    <span className="badge badge-primary">
                      ⭐ {user?.rating.toFixed(1)} ({user?.totalReviews} reviews)
                    </span>
                    <span className="badge badge-success">
                      {user?.totalExchanges || 0} exchanges
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Edit Button */}
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <FaSave /> Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <FaTimes /> Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="btn btn-outline flex items-center gap-2"
                >
                  <FaEdit /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Skills Offered */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Skills I Offer
              </h2>
              <button
                onClick={() => {
                  setSkillType('offer');
                  setShowAddSkill(true);
                }}
                className="btn btn-primary btn-sm flex items-center gap-2"
              >
                <FaPlus /> Add
              </button>
            </div>
            <div className="space-y-2">
              {user?.skillsOffered?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No skills added yet
                </p>
              ) : (
                user?.skillsOffered?.map((skill) => (
                  <div
                    key={skill._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{skill.name}</p>
                      <p className="text-sm text-gray-500">{skill.category}</p>
                    </div>
                    <span className="badge badge-primary">{skill.level}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Skills Wanted */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Skills I Want to Learn
              </h2>
              <button
                onClick={() => {
                  setSkillType('want');
                  setShowAddSkill(true);
                }}
                className="btn btn-primary btn-sm flex items-center gap-2"
              >
                <FaPlus /> Add
              </button>
            </div>
            <div className="space-y-2">
              {user?.skillsWanted?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No skills added yet
                </p>
              ) : (
                user?.skillsWanted?.map((skill) => (
                  <div
                    key={skill._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{skill.name}</p>
                      <p className="text-sm text-gray-500">{skill.category}</p>
                    </div>
                    <span className="badge badge-warning">{skill.level}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Add Skill Modal */}
        {showAddSkill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-2xl font-bold mb-4">
                Add Skill to {skillType === 'offer' ? 'Offer' : 'Learn'}
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Skill name"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  className="input"
                />
                <select
                  value={newSkill.category}
                  onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                  className="input"
                >
                  {SKILL_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={newSkill.level}
                  onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                  className="input"
                >
                  {SKILL_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <textarea
                  placeholder="Description (optional)"
                  value={newSkill.description}
                  onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                  className="input"
                  rows="3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddSkill}
                    disabled={!newSkill.name || loading}
                    className="btn btn-primary flex-1"
                  >
                    Add Skill
                  </button>
                  <button
                    onClick={() => setShowAddSkill(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
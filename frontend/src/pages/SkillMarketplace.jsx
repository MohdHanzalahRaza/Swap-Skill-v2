import { useState, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Star, MapPin, BookOpen, ArrowRight,
  Users, X, ChevronDown, Sparkles
} from 'lucide-react';
import api from '../services/api';
import { getAvatarUrl } from '../utils/imageUtils';

const levelColors = {
  Beginner: 'bg-green-50 text-green-700 border-green-200',
  Intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
  Advanced: 'bg-orange-50 text-orange-700 border-orange-200'
};

const MarketplaceSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-5/6 mb-4"></div>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-2/3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const UserCard = memo(({ user }) => {
  const navigate = useNavigate();
  const primarySkill = user.skillsOffered?.[0];
  const primaryWanted = user.skillsWanted?.[0];
  const skillCategory = primarySkill?.category || 'General';
  const skillLevel = primarySkill?.level || 'Beginner';

  return (
    <div
      onClick={() => navigate(`/user/${user._id}`)}
      className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600">
          {skillCategory}
        </span>
        <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${levelColors[skillLevel] || levelColors.Beginner}`}>
          {skillLevel}
        </span>
      </div>

      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
          {primarySkill?.name || user.skillsOffered?.[0]?.name || 'Skill Exchange'}
        </h3>

        {primaryWanted && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-medium">Wants:</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">{primaryWanted.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="relative flex-shrink-0">
          {user.avatar ? (
            <img
              src={getAvatarUrl(user.avatar)}
              alt={user.name}
              loading="lazy"
              decoding="async"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-base font-bold ring-2 ring-gray-100 dark:ring-gray-700">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
            {user.name || 'Anonymous User'}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {user.rating?.toFixed(1) || '0.0'}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {user.totalReviews || 0} reviews
            </span>
          </div>
        </div>

        {user.skillsOffered && user.skillsOffered.length > 1 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {user.skillsOffered.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

const Marketplace = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'all', name: 'All Skills', icon: '🎯' },
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'design', name: 'Design', icon: '🎨' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'language', name: 'Languages', icon: '🌍' },
    { id: 'music', name: 'Music', icon: '🎵' },
    { id: 'fitness', name: 'Fitness', icon: '💪' },
    { id: 'cooking', name: 'Cooking', icon: '🍳' },
    { id: 'photography', name: 'Photography', icon: '📸' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      // Assuming 'res.data.data' contains the array of users
      const usersArray = res.data?.data || [];
      setUsers(usersArray);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Performance Improvement: Use useMemo to filter users.
   * This prevents the filtering logic from running on every render
   * unless one of the dependencies changes.
   */
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // 1. Search Term Filtering
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(lowerSearchTerm) ||
        user.bio?.toLowerCase().includes(lowerSearchTerm) || // Added check for bio search
        user.skillsOffered?.some(skill =>
          skill.name?.toLowerCase().includes(lowerSearchTerm)
        ) ||
        user.skillsWanted?.some(skill =>
          skill.name?.toLowerCase().includes(lowerSearchTerm)
        )
      );
    }

    // 2. Category Filtering
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(user =>
        user.skillsOffered?.some(skill =>
          // Uses startsWith check for better matching than includes
          skill.category
            ?.toLowerCase()
            .startsWith(selectedCategory.toLowerCase())
        )
      );
    }

    return filtered;
  }, [searchTerm, selectedCategory, users]);


  const UserCard = ({ user }) => {
    // Get primary skill and category
    const primarySkill = user.skillsOffered?.[0];
    const primaryWanted = user.skillsWanted?.[0];
    const skillCategory = primarySkill?.category || 'General';
    const skillLevel = primarySkill?.level || 'Beginner';

    // Level badge colors
    const levelColors = {
      'Beginner': 'bg-green-50 text-green-700 border-green-200',
      'Intermediate': 'bg-blue-50 text-blue-700 border-blue-200',
      'Advanced': 'bg-orange-50 text-orange-700 border-orange-200'
    };

    return (
      <div
        onClick={() => navigate(`/user/${user._id}`)}
        className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-xl transition-all duration-300 cursor-pointer"
      >
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600">
            {skillCategory}
          </span>
          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${levelColors[skillLevel] || levelColors['Beginner']}`}>
            {skillLevel}
          </span>
        </div>

        {/* Primary Skill - Main Focus */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
            {primarySkill?.name || user.skillsOffered?.[0]?.name || 'Skill Exchange'}
          </h3>

          {/* Wants to Learn */}
          {primaryWanted && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-medium">Wants:</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{primaryWanted.name}</span>
            </div>
          )}
        </div>

        {/* User Info Footer */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="relative flex-shrink-0">
            {user.avatar ? (
              <img
                src={getAvatarUrl(user.avatar)}
                alt={user.name}
                loading="lazy"
                decoding="async"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-base font-bold ring-2 ring-gray-100 dark:ring-gray-700">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {user.name || 'Anonymous User'}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {user.rating?.toFixed(1) || '0.0'}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {user.totalReviews || 0} reviews
              </span>
            </div>
          </div>

          {/* Swap Count Badge */}
          {user.skillsOffered && user.skillsOffered.length > 1 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {user.skillsOffered.length}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Skill Marketplace
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Discover talented people ready to exchange skills with you
          </p>

        </div>

        {/* Search + Filters - Simplified Layout */}
        <div className="mb-8">
          {/* Search Bar */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search skills, topics, or swap interests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/30 outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <button className="p-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Category Pills - Always Visible */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === category.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                <span className="mr-1.5">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* User Grid and Status */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading amazing people...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No users found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredUsers.map(user => (
              <UserCard key={user._id} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
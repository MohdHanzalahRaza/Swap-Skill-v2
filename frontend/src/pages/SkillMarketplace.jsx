import { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Star, MapPin, BookOpen, ArrowRight,
  Users, X, ChevronDown, Sparkles
} from 'lucide-react';
import api from '../services/api';

const Marketplace = () => {
  const navigate = useNavigate();
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


  const UserCard = ({ user }) => (
    <div
      onClick={() => navigate(`/user/${user._id}`)}
      className="group bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-indigo-300 hover:shadow-2xl transition-all duration-300 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-gray-100 group-hover:ring-indigo-100 transition-all"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold ring-4 ring-gray-100 group-hover:ring-indigo-100 transition-all">
              {user.name?.[0] || 'U'}
            </div>
          )}
          {/* Online/Status Indicator */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-gray-900 mb-1 truncate group-hover:text-indigo-600 transition-colors">
            {user.name || 'Anonymous User'}
          </h3>

          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-gray-700">
                {user.rating?.toFixed(1) || '0.0'}
              </span>
              <span className="text-sm text-gray-500">
                ({user.totalReviews || 0})
              </span>
            </div>

            {/* Added defensive check for user.location */}
            {user.location && user.location.city && (
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm truncate">
                  {user.location.city}, {user.location.country || ''}
                </span>
              </div>
            )}
          </div>

          {user.bio && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      {/* Skills Offered */}
      {user.skillsOffered?.length > 0 && (
        <div className="mb-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-gray-700">Can Teach</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.skillsOffered.slice(0, 3).map((skill, index) => (
              <span
                key={skill._id || index}
                className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100"
              >
                {skill.name}
              </span>
            ))}
            {user.skillsOffered.length > 3 && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                +{user.skillsOffered.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Skills Wanted */}
      {user.skillsWanted?.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-700">Wants to Learn</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.skillsWanted.slice(0, 3).map((skill, index) => (
              <span
                key={skill._id || index}
                className="px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-lg text-sm font-medium border border-green-100"
              >
                {skill.name}
              </span>
            ))}
            {user.skillsWanted.length > 3 && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                +{user.skillsWanted.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      <button className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 group-hover:from-indigo-700 group-hover:to-purple-700 transition-all duration-300 shadow-lg group-hover:shadow-xl">
        View Profile
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Skill Marketplace
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Discover talented people ready to exchange skills with you
          </p>
          
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700"
            >
              <Filter className="w-5 h-5" />
              Filters
              <ChevronDown className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-xl font-medium ${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.icon} {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Grid and Status */}
        {loading ? (
          <div className="text-center py-20">
             <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
             <p className="text-gray-600">Loading amazing people...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No users found</h3>
            <p className="text-gray-600">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FaSearch, FaFilter } from 'react-icons/fa';
import { SKILL_CATEGORIES } from '../utils/constants';
import Loader from '../components/common/Loader';

const SkillMarketplace = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [category]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      
      const response = await api.get('/users', { params });
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.bio?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Skill Marketplace 🎯
          </h1>
          <p className="text-gray-600">
            Find people to exchange skills with
          </p>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
            >
              <option value="">All Categories</option>
              {SKILL_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Users Grid */}
        {loading ? (
          <Loader />
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No users found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(user => (
              <Link
                key={user._id}
                to={`/user/${user._id}`}
                className="card hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 truncate">
                      {user.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      ⭐ {user.rating.toFixed(1)} ({user.totalReviews})
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {user.bio || 'No bio'}
                    </p>
                  </div>
                </div>
                
                {user.skillsOffered?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {user.skillsOffered.slice(0, 3).map(skill => (
                      <span key={skill._id} className="badge badge-primary text-xs">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillMarketplace;
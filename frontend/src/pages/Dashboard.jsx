// src/pages/Dashboard.jsx - Perfected Version
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api'; // Assuming this is your configured API client
import {
  Repeat, Users, Trophy, Star, ArrowRight, MessageCircle,
  Search, Edit, TrendingUp, Sparkles, User
} from 'lucide-react';
import Loader from '../components/common/Loader'; // Assuming this component exists

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExchanges: 0,
    pendingRequests: 0,
    completedExchanges: 0,
    rating: 0
  });
  const [recentExchanges, setRecentExchanges] = useState([]);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user?._id]); // Depend on user ID to refetch if user changes

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch exchanges/stats (from first code's logic)
      const exchangesRes = await api.get('/exchanges');
      const exchanges = exchangesRes.data.data || []; // Adjust based on your actual API response structure
      
      const pending = exchanges.filter(e => e.status === 'pending').length;
      const completed = exchanges.filter(e => e.status === 'completed').length;

      // 2. Fetch potential matches (from first code's logic, using a modern icon)
      // Limiting to 6 users for 'People You May Like' section
      const usersRes = await api.get('/users', { params: { limit: 6 } });
      const allUsers = usersRes.data.data || [];
      
      // Filter out the current user and take the first 3 or 6 matches
      const potentialMatches = allUsers
        .filter(u => u._id !== user?._id)
        .slice(0, 3);


      setStats({
        totalExchanges: exchanges.length,
        pendingRequests: pending,
        completedExchanges: completed,
        rating: user?.rating || 0 // Use user rating if available
      });

      // Filter and limit recent exchanges (limit 5 for recent list)
      setRecentExchanges(exchanges.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
      setMatches(potentialMatches);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Handle error display if necessary
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  // --- STAT CARD DATA (Using second code's structure and design classes) ---
  const statCards = [
    {
      title: 'Total Exchanges',
      value: stats.totalExchanges,
      icon: <Repeat className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      textColor: 'text-blue-600',
      link: '/exchanges' // Link from the first code
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      icon: <Users className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-50 to-orange-50',
      textColor: 'text-yellow-600',
      link: '/exchanges?status=pending' // Link from the first code
    },
    {
      title: 'Completed',
      value: stats.completedExchanges,
      icon: <Trophy className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      textColor: 'text-green-600',
      link: '/exchanges?status=completed' // Link from the first code
    },
    {
      title: 'Your Rating',
      value: stats.rating.toFixed(1),
      icon: <Star className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      textColor: 'text-purple-600',
      link: '/profile' // Link from the first code
    }
  ];

  // --- QUICK ACTION DATA (Using second code's structure and design classes) ---
  const quickActions = [
    {
      title: 'Browse Skills',
      description: 'Find people to exchange skills with',
      icon: <Search className="w-6 h-6" />,
      color: 'bg-indigo-600',
      hoverColor: 'hover:bg-indigo-700',
      link: '/marketplace'
    },
    {
      title: 'Edit Profile',
      description: 'Update your skills and preferences',
      icon: <Edit className="w-6 h-6" />,
      color: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
      link: '/profile'
    },
    {
      title: 'My Messages',
      description: 'Check your conversations',
      icon: <MessageCircle className="w-6 h-6" />,
      color: 'bg-pink-600',
      hoverColor: 'hover:bg-pink-700',
      link: '/messages'
    }
  ];


  // Helper function for status badges
  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'accepted':
      case 'in-progress': // Assuming 'accepted' might be a separate status or rename to 'in-progress'
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Header (Second code's design) */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Welcome back, {user?.name || 'Skill Exchanger'}!
            </h1>
            <span className="text-3xl">👋</span>
          </div>
          <p className="text-lg text-gray-600">
            Here's what's happening with your skill exchanges
          </p>
        </div>

        {/* Stats Grid (Second code's design, using Link from first code) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Link
              key={index}
              to={stat.link}
              className={`relative bg-gradient-to-br ${stat.bgColor} rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group block`}
            >
              {/* Background gradient effect */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
              
              <div className="relative">
                {/* Icon Circle */}
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl mb-4 text-white shadow-lg`}>
                  {stat.icon}
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">{stat.title}</div>
                {/* Value display */}
                <div className={`text-3xl font-bold ${stat.textColor} flex items-baseline gap-2`}>
                  {stat.value}
                  {stat.title === 'Your Rating' && (
                    <Star className="w-5 h-5 fill-current" />
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Exchanges (Second code's design, first code's logic) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Exchanges</h2>
                </div>
                <Link
                  to="/exchanges"
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1 group"
                >
                  View All
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="p-6">
                {recentExchanges.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                      <Repeat className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No exchanges yet</h3>
                    <p className="text-gray-600 mb-6">Start connecting with people to exchange skills!</p>
                    <Link
                      to="/marketplace"
                      className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-300 shadow-md"
                    >
                      Find Skills to Exchange
                      <Search className="w-5 h-5" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentExchanges.map((exchange) => {
                      // Logic from the first code to determine the partner and their avatar
                      const isRequester = exchange.requester?._id === user?._id;
                      const partner = isRequester ? exchange.receiver : exchange.requester;
                      const partnerName = partner?.name || 'Unknown User';
                      const partnerAvatar = partner?.avatar;
                      const initials = partnerName?.[0] || 'U';

                      return (
                        <div
                          key={exchange._id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200/50"
                        >
                          <div className="flex items-center gap-4">
                            {partnerAvatar ? (
                              <img
                                src={partnerAvatar}
                                alt={partnerName}
                                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-lg">
                                {initials}
                              </div>
                            )}
                            
                            <div>
                              <h3 className="font-semibold text-gray-900">{partnerName}</h3>
                              <p className="text-sm text-gray-600 truncate max-w-xs">
                                {exchange.skillOffered?.name || 'Skill Offered'} ↔ {exchange.skillWanted?.name || 'Skill Wanted'}
                              </p>
                            </div>
                          </div>
                          
                          <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getStatusBadgeClasses(exchange.status)}`}>
                            {exchange.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & People You May Like Container */}
          <div className="space-y-8">
            {/* Quick Actions (Second code's design, using Link) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.link}
                    className={`block w-full ${action.color} ${action.hoverColor} text-white p-4 rounded-xl transition-all duration-300 hover:shadow-lg group`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                        {action.icon}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{action.title}</div>
                        <div className="text-sm opacity-90">{action.description}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* People You May Like (Second code's design, first code's data source) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <User className="w-5 h-5 text-pink-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">People You May Like</h2>
              </div>
              <div className="p-6">
                {matches.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm">No new potential matches found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matches.map((match) => (
                      <Link
                        key={match._id}
                        to={`/user/${match._id}`}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                            {match.avatar ? (
                                <img
                                    src={match.avatar}
                                    alt={match.name}
                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                                    {match.name?.[0] || 'U'}
                                </div>
                            )}

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                              {match.name || 'Test User'}
                            </h3>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span>{match.rating?.toFixed(1) || '0.0'}</span>
                              <span className="text-gray-400">({match.totalReviews || match.reviewCount || 0} reviews)</span>
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
                {/* See More link */}
                <Link 
                  to="/marketplace" 
                  className="block text-center text-indigo-600 hover:text-indigo-700 font-medium mt-4"
                >
                  See More Profiles
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
// src/pages/Dashboard.jsx - Premium Card-Based UI
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { exchangeService } from '../services/exchangeService';
import toast from 'react-hot-toast';
import {
  Repeat, Users, Trophy, Star, ArrowRight, MessageCircle,
  Search, Edit, TrendingUp, Sparkles, User, LayoutDashboard,
  Clock, CheckCircle, XCircle, AlertCircle, Calendar,
  RefreshCw, Check, X, Settings, MapPin, Mail, Phone
} from 'lucide-react';
import Loader from '../components/common/Loader';
import { formatDate, timeAgo } from '../utils/helpers';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Overview data
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExchanges: 0,
    pendingRequests: 0,
    completedExchanges: 0,
    rating: 0
  });
  const [recentExchanges, setRecentExchanges] = useState([]);
  const [matches, setMatches] = useState([]);

  // Exchanges tab data
  const [exchanges, setExchanges] = useState([]);
  const [exchangesLoading, setExchangesLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Read URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['overview', 'exchanges', 'messages', 'profile'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  // Fetch overview data
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchDashboardData();
    }
  }, [user?._id, activeTab]);

  // Fetch exchanges data when tab is active
  useEffect(() => {
    if (activeTab === 'exchanges') {
      fetchExchanges();
    }
  }, [activeTab, filter, statusFilter]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [exchangesRes, usersRes] = await Promise.all([
        api.get('/exchanges'),
        api.get('/users', { params: { limit: 6 } })
      ]);

      const exchanges = exchangesRes.data.data || [];
      const pending = exchanges.filter(e => e.status === 'pending').length;
      const completed = exchanges.filter(e => e.status === 'completed').length;

      const allUsers = usersRes.data.data || [];
      const potentialMatches = allUsers
        .filter(u => u._id !== user?._id)
        .slice(0, 3);

      setStats({
        totalExchanges: exchanges.length,
        pendingRequests: pending,
        completedExchanges: completed,
        rating: user?.rating || 0
      });

      setRecentExchanges(exchanges.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
      setMatches(potentialMatches);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExchanges = async () => {
    try {
      setExchangesLoading(true);
      const params = { type: filter };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await exchangeService.getMyExchanges(params);
      setExchanges(response.data || []);
    } catch (error) {
      console.error('Fetch exchanges error:', error);
      toast.error('Failed to load exchanges');
    } finally {
      setExchangesLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  // Exchange action handlers
  const handleAccept = async (exchangeId) => {
    try {
      await exchangeService.updateExchangeStatus(exchangeId, 'accepted');
      toast.success('Exchange accepted! 🎉');
      fetchExchanges();
    } catch (error) {
      toast.error('Failed to accept exchange');
    }
  };

  const handleReject = async (exchangeId) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    try {
      await exchangeService.updateExchangeStatus(exchangeId, 'rejected');
      toast.success('Exchange rejected');
      fetchExchanges();
    } catch (error) {
      toast.error('Failed to reject exchange');
    }
  };

  const handleComplete = async (exchangeId) => {
    if (!window.confirm('Mark this exchange as completed?')) return;
    try {
      await exchangeService.updateExchangeStatus(exchangeId, 'completed');
      toast.success('Exchange completed! 🎊');
      fetchExchanges();
    } catch (error) {
      toast.error('Failed to complete exchange');
    }
  };

  const handleCancel = async (exchangeId) => {
    if (!window.confirm('Cancel this exchange request?')) return;
    try {
      await exchangeService.cancelExchange(exchangeId);
      toast.success('Exchange cancelled');
      fetchExchanges();
    } catch (error) {
      toast.error('Failed to cancel exchange');
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate || !scheduleTime) {
      toast.error('Please select date and time');
      return;
    }

    try {
      await exchangeService.updateExchangeStatus(selectedExchange._id, 'scheduled');
      toast.success('Session scheduled! 📅');
      setShowScheduleModal(false);
      setScheduleDate('');
      setScheduleTime('');
      fetchExchanges();
    } catch (error) {
      toast.error('Failed to schedule session');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="w-4 h-4" />, label: 'Pending' },
      accepted: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <Check className="w-4 h-4" />, label: 'Accepted' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="w-4 h-4" />, label: 'Rejected' },
      scheduled: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: <Calendar className="w-4 h-4" />, label: 'Scheduled' },
      completed: { color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle className="w-4 h-4" />, label: 'Completed' },
      cancelled: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <X className="w-4 h-4" />, label: 'Cancelled' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${badge.color}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'accepted':
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'exchanges', label: 'My Exchanges', icon: <Repeat className="w-5 h-5" /> },
    { id: 'messages', label: 'Messages', icon: <MessageCircle className="w-5 h-5" /> },
    { id: 'profile', label: 'Settings', icon: <Settings className="w-5 h-5" /> }
  ];

  if (loading && activeTab === 'overview') {
    return <Loader />;
  }

  // Filtered exchanges for Exchanges tab
  const filteredExchanges = exchanges.filter((exchange) => {
    const otherUser = exchange.requester._id === user._id ? exchange.receiver : exchange.requester;
    const matchesSearch =
      otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exchange.skillOffered.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exchange.skillWanted.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const exchangeStats = {
    total: exchanges.length,
    pending: exchanges.filter((e) => e.status === 'pending').length,
    accepted: exchanges.filter((e) => e.status === 'accepted' || e.status === 'scheduled').length,
    completed: exchanges.filter((e) => e.status === 'completed').length
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.name || 'Skill Exchanger'}!
            </h1>
            <span className="text-3xl">👋</span>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Here's what's happening with your skill exchanges
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-200 border-b-2 whitespace-nowrap ${activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-opacity duration-300">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Total Exchanges', value: stats.totalExchanges, icon: <Repeat className="w-6 h-6" />, color: 'from-blue-500 to-cyan-500', bgColor: 'from-blue-50 to-cyan-50', textColor: 'text-blue-600', link: '#exchanges' },
                  { title: 'Pending Requests', value: stats.pendingRequests, icon: <Users className="w-6 h-6" />, color: 'from-yellow-500 to-orange-500', bgColor: 'from-yellow-50 to-orange-50', textColor: 'text-yellow-600', link: '#exchanges' },
                  { title: 'Completed', value: stats.completedExchanges, icon: <Trophy className="w-6 h-6" />, color: 'from-green-500 to-emerald-500', bgColor: 'from-green-50 to-emerald-50', textColor: 'text-green-600', link: '#exchanges' },
                  { title: 'Your Rating', value: stats.rating.toFixed(1), icon: <Star className="w-6 h-6" />, color: 'from-purple-500 to-pink-500', bgColor: 'from-purple-50 to-pink-50', textColor: 'text-purple-600', link: '/profile' }
                ].map((stat, index) => (
                  <button
                    key={index}
                    onClick={() => stat.link.startsWith('#') ? handleTabChange(stat.link.replace('#', '')) : navigate(stat.link)}
                    className={`relative bg-gradient-to-br ${stat.bgColor} dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group text-left`}
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
                    <div className="relative">
                      <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl mb-4 text-white shadow-lg`}>
                        {stat.icon}
                      </div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</div>
                      <div className={`text-3xl font-bold ${stat.textColor} dark:text-white flex items-baseline gap-2`}>
                        {stat.value}
                        {stat.title === 'Your Rating' && <Star className="w-5 h-5 fill-current" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Exchanges */}
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Exchanges</h2>
                      </div>
                      <button
                        onClick={() => handleTabChange('exchanges')}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium text-sm flex items-center gap-1 group"
                      >
                        View All
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>

                    <div className="p-6">
                      {recentExchanges.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                            <Repeat className="w-10 h-10 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No exchanges yet</h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-6">Start connecting with people to exchange skills!</p>
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
                            const isRequester = exchange.requester?._id === user?._id;
                            const partner = isRequester ? exchange.receiver : exchange.requester;
                            const partnerName = partner?.name || 'Unknown User';
                            const partnerAvatar = partner?.avatar;
                            const initials = partnerName?.[0] || 'U';

                            return (
                              <div
                                key={exchange._id}
                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200/50 dark:border-gray-600"
                              >
                                <div className="flex items-center gap-4">
                                  {partnerAvatar ? (
                                    <img src={partnerAvatar} alt={partnerName} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                                  ) : (
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-lg">
                                      {initials}
                                    </div>
                                  )}
                                  <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{partnerName}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
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

                {/* Sidebar */}
                <div className="space-y-8">
                  {/* Quick Actions */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
                    </div>
                    <div className="p-6 space-y-3">
                      {[
                        { title: 'Browse Skills', description: 'Find people to exchange skills with', icon: <Search className="w-6 h-6" />, color: 'bg-indigo-600', hoverColor: 'hover:bg-indigo-700', link: '/marketplace' },
                        { title: 'Edit Profile', description: 'Update your skills and preferences', icon: <Edit className="w-6 h-6" />, color: 'bg-purple-600', hoverColor: 'hover:bg-purple-700', link: '/profile' },
                        { title: 'My Messages', description: 'Check your conversations', icon: <MessageCircle className="w-6 h-6" />, color: 'bg-pink-600', hoverColor: 'hover:bg-pink-700', link: '/messages' }
                      ].map((action, index) => (
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

                  {/* People You May Like */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                      <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                        <User className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">People You May Like</h2>
                    </div>
                    <div className="p-6">
                      {matches.length === 0 ? (
                        <div className="text-center py-8">
                          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-600 dark:text-gray-400 text-sm">No new potential matches found</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {matches.map((match) => (
                            <Link
                              key={match._id}
                              to={`/user/${match._id}`}
                              className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                {match.avatar ? (
                                  <img src={match.avatar} alt={match.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                                    {match.name?.[0] || 'U'}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {match.name || 'Test User'}
                                  </h3>
                                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
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
                      <Link
                        to="/marketplace"
                        className="block text-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium mt-4"
                      >
                        See More Profiles
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EXCHANGES TAB - PREMIUM CARD UI */}
          {activeTab === 'exchanges' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Stats Grid - Same style as Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total', value: exchangeStats.total, color: 'from-blue-500 to-cyan-500', bgColor: 'from-blue-50 to-cyan-50', textColor: 'text-blue-600', icon: <Repeat className="w-6 h-6" /> },
                  { label: 'Pending', value: exchangeStats.pending, color: 'from-yellow-500 to-orange-500', bgColor: 'from-yellow-50 to-orange-50', textColor: 'text-yellow-600', icon: <Clock className="w-6 h-6" /> },
                  { label: 'Active', value: exchangeStats.accepted, color: 'from-green-500 to-emerald-500', bgColor: 'from-green-50 to-emerald-50', textColor: 'text-green-600', icon: <CheckCircle className="w-6 h-6" /> },
                  { label: 'Completed', value: exchangeStats.completed, color: 'from-purple-500 to-pink-500', bgColor: 'from-purple-50 to-pink-50', textColor: 'text-purple-600', icon: <Trophy className="w-6 h-6" /> }
                ].map((stat, index) => (
                  <div
                    key={index}
                    className={`relative bg-gradient-to-br ${stat.bgColor} dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 overflow-hidden group`}
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
                    <div className="relative">
                      <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl mb-4 text-white shadow-lg`}>
                        {stat.icon}
                      </div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.label}</div>
                      <div className={`text-3xl font-bold ${stat.textColor} dark:text-white`}>{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filters - Compact and Modern */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search exchanges..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Exchanges</option>
                    <option value="sent">Sent Requests</option>
                    <option value="received">Received Requests</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Exchanges Grid - Premium Card Layout */}
              {exchangesLoading ? (
                <Loader />
              ) : filteredExchanges.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <AlertCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No exchanges found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Start by browsing skills and sending exchange requests</p>
                  <Link
                    to="/marketplace"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow-lg"
                  >
                    Browse Skills
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredExchanges.map((exchange) => {
                    const otherUser = exchange.requester._id === user._id ? exchange.receiver : exchange.requester;
                    const isSender = exchange.requester._id === user._id;
                    const isReceiver = !isSender;

                    return (
                      <div
                        key={exchange._id}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-xl transition-all duration-300 overflow-hidden group"
                      >
                        {/* Card Header with User Info */}
                        <div className="p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              {otherUser.avatar ? (
                                <img
                                  src={otherUser.avatar}
                                  alt={otherUser.name}
                                  className="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white dark:border-gray-700 shadow-lg">
                                  {otherUser.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                              )}
                              <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-xl group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {otherUser.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5" />
                                  {timeAgo(exchange.createdAt)}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {isSender ? '📤 You sent this request' : '📥 Received request'}
                                </p>
                              </div>
                            </div>
                            {getStatusBadge(exchange.status)}
                          </div>
                        </div>

                        {/* Skills Exchange */}
                        <div className="p-6">
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-2 border-indigo-100 dark:border-indigo-800">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">
                                {isSender ? '📚 You Teach' : '🎯 They Teach'}
                              </p>
                              <p className="font-bold text-gray-900 dark:text-white text-sm">{exchange.skillOffered.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{exchange.skillOffered.category}</p>
                            </div>

                            <div className="flex items-center justify-center">
                              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full shadow-lg">
                                <ArrowRight className="w-5 h-5 text-white" />
                              </div>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-100 dark:border-green-800">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">
                                {isSender ? '🎯 You Learn' : '📚 They Learn'}
                              </p>
                              <p className="font-bold text-gray-900 dark:text-white text-sm">{exchange.skillWanted.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{exchange.skillWanted.category}</p>
                            </div>
                          </div>

                          {/* Message */}
                          {exchange.message && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-4 border border-blue-100 dark:border-blue-800">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <MessageCircle className="w-4 h-4 inline mr-2 text-blue-600" />
                                <strong>Message:</strong> {exchange.message}
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            {isReceiver && exchange.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleAccept(exchange._id)}
                                  className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-md"
                                >
                                  <Check className="w-4 h-4" />
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleReject(exchange._id)}
                                  className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all font-semibold shadow-md"
                                >
                                  <X className="w-4 h-4" />
                                  Reject
                                </button>
                              </>
                            )}

                            {exchange.status === 'accepted' && (
                              <button
                                onClick={() => {
                                  setSelectedExchange(exchange);
                                  setShowScheduleModal(true);
                                }}
                                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-md"
                              >
                                <Calendar className="w-4 h-4" />
                                Schedule Session
                              </button>
                            )}

                            {exchange.status === 'scheduled' && (
                              <button
                                onClick={() => handleComplete(exchange._id)}
                                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-md"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Mark Complete
                              </button>
                            )}

                            <button
                              onClick={() => navigate(`/messages?userId=${otherUser._id}`)}
                              className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-semibold shadow-md"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Message
                            </button>

                            {isSender && exchange.status === 'pending' && (
                              <button
                                onClick={() => handleCancel(exchange._id)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-semibold"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MESSAGES TAB */}
          {activeTab === 'messages' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center animate-fadeIn">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full mb-6">
                <MessageCircle className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Messages</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Your messaging feature will appear here</p>
              <Link
                to="/messages"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg"
              >
                Go to Messages Page
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center animate-fadeIn">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full mb-6">
                <Settings className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Settings</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Manage your profile and preferences</p>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg"
              >
                Go to Profile Page
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && selectedExchange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              Schedule Session
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleDate('');
                  setScheduleTime('');
                }}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
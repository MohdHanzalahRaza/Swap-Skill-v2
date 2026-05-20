// src/pages/Notifications.jsx - Premium Layout & Logic
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, Trash2, Filter, MessageCircle,
  UserPlus, Calendar, Star, Award, TrendingUp, X, Settings,
  AlertCircle, Gift, Sparkles, Clock
} from 'lucide-react';
import socketService from '../socket';
import api from '../services/api';
import { timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showActions, setShowActions] = useState(false);

  // Premium Icon Map with Gradients
  const getNotificationIcon = (type) => {
    const iconMap = {
      message: { icon: <MessageCircle className="w-5 h-5" />, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
      exchange: { icon: <TrendingUp className="w-5 h-5" />, color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
      booking: { icon: <Calendar className="w-5 h-5" />, color: 'from-green-500 to-emerald-500', bg: 'bg-green-50 dark:bg-green-900/20' },
      review: { icon: <Star className="w-5 h-5" />, color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
      achievement: { icon: <Award className="w-5 h-5" />, color: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
      connection: { icon: <UserPlus className="w-5 h-5" />, color: 'from-pink-500 to-rose-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
      system: { icon: <AlertCircle className="w-5 h-5" />, color: 'from-gray-500 to-slate-500', bg: 'bg-gray-50 dark:bg-gray-800' },
      reward: { icon: <Gift className="w-5 h-5" />, color: 'from-orange-500 to-red-500', bg: 'bg-orange-50 dark:bg-orange-900/20' }
    };
    return iconMap[type] || iconMap.system;
  };

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications', { cache: false });
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n =>
        n._id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to mark all read');
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification removed');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete notification');
    }
  }, []);

  const deleteSelected = useCallback(async () => {
    if (!window.confirm(`Delete ${selectedIds.length} notifications?`)) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/notifications/${id}`)));
      setNotifications(prev => prev.filter(n => !selectedIds.includes(n._id)));
      setSelectedIds([]);
      setShowActions(false);
      toast.success('Selected notifications deleted');
    } catch (error) {
      toast.error('Failed to delete selected');
    }
  }, [selectedIds]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time listener
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      // Optional: Sound effect could go here
    };

    socket.on('new_notification', handleNewNotification);
    return () => socket.off('new_notification', handleNewNotification);
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Group notifications by date
  const groupNotifications = (notifs) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
      Today: [],
      Yesterday: [],
      Earlier: []
    };

    notifs.forEach(n => {
      const date = new Date(n.createdAt);
      if (date.toDateString() === today.toDateString()) {
        groups.Today.push(n);
      } else if (date.toDateString() === yesterday.toDateString()) {
        groups.Yesterday.push(n);
      } else {
        groups.Earlier.push(n);
      }
    });

    return groups;
  };

  const groupedNotifications = groupNotifications(filteredNotifications);

  const NotificationCard = ({ notification }) => {
    const { _id, read, message, createdAt, type, relatedData } = notification;
    const { icon, color, bg } = getNotificationIcon(type);
    const isSelected = selectedIds.includes(_id);

    const handleCardClick = () => {
      if (!read) markAsRead(_id);
      if (selectedIds.length > 0) {
        toggleSelect(_id);
        return;
      }

      if (type === 'exchange') navigate('/exchanges');
      else if (type === 'message') navigate(`/messages?userId=${relatedData?.userId || ''}`);
      else if (type === 'review') navigate('/profile');
    };

    return (
      <div
        onClick={handleCardClick}
        className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 cursor-pointer 
          ${read
            ? 'bg-white dark:bg-gray-800 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
            : 'bg-white dark:bg-gray-800 border-2 border-indigo-100 dark:border-indigo-900/50 shadow-md'
          } 
          ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : ''}
        `}
      >
        {/* Unread Indicator Bar */}
        {!read && (
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-500"></div>
        )}

        <div className="flex gap-4 relative z-10">
          {showActions && (
            <div className="flex items-center justify-center mr-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => { e.stopPropagation(); toggleSelect(_id); }}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          )}

          {/* Icon Box */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <div className="flex justify-between items-start gap-4">
              <p className={`text-sm md:text-base leading-snug ${read ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 dark:text-white font-semibold'}`}>
                {message}
              </p>

              {/* Delete Button (Visible on Hover) */}
              <button
                onClick={(e) => { e.stopPropagation(); deleteNotification(_id); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {timeAgo(createdAt)}
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${bg} text-gray-600 dark:text-gray-300`}>
                {type}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-8 sticky top-4 z-20 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your alerts and updates</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowActions(!showActions)}
                className={`p-2.5 rounded-xl transition-all ${showActions ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
              {['all', 'unread', 'read'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${filter === tab
                    ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {showActions ? (
              <div className="flex gap-2">
                <button onClick={() => setSelectedIds(notifications.map(n => n._id))} className="text-sm text-indigo-600 font-medium px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors">Select All</button>
                <button onClick={deleteSelected} disabled={selectedIds.length === 0} className="text-sm bg-red-600 text-white px-4 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">Delete Selected</button>
              </div>
            ) : (
              unreadCount > 0 && (
                <button onClick={markAllAsRead} className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  <CheckCheck className="w-4 h-4" /> Mark all read
                </button>
              )
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium animate-pulse">Loading updates...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Bell className="w-10 h-10 text-indigo-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No notifications found</h3>
            <p className="text-gray-500 max-w-sm">
              {filter === 'unread' ? "You're all caught up! Check back later for new updates." : "Your notification history is empty."}
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            {Object.entries(groupedNotifications).map(([group, notifs]) => (
              notifs.length > 0 && (
                <div key={group} className="space-y-4">
                  <h2 className="px-2 text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-3">
                    {group}
                    <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></span>
                  </h2>
                  <div className="space-y-3">
                    {notifs.map(notification => (
                      <NotificationCard key={notification._id} notification={notification} />
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
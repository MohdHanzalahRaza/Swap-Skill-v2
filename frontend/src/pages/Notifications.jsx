// src/pages/Notifications.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, Trash2, Filter, MessageCircle,
  UserPlus, Calendar, Star, Award, TrendingUp, X, Settings,
  AlertCircle, Gift, Sparkles
} from 'lucide-react';

const Notifications = () => {
  const navigate = useNavigate();
  // Notification structure expected: 
  // { _id: string, title: string, message: string, type: string, createdAt: Date, read: boolean, link?: string, actionLabel?: string }
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedIds, setSelectedIds] = useState([]);
  const [showActions, setShowActions] = useState(false);

  // --- Utility Functions (Time and Icon mapping remain the same) ---

  const getNotificationIcon = (type) => {
    const iconMap = {
      message: { icon: <MessageCircle className="w-5 h-5" />, color: 'from-blue-500 to-cyan-500' },
      exchange: { icon: <TrendingUp className="w-5 h-5" />, color: 'from-purple-500 to-pink-500' },
      booking: { icon: <Calendar className="w-5 h-5" />, color: 'from-green-500 to-emerald-500' },
      review: { icon: <Star className="w-5 h-5" />, color: 'from-yellow-500 to-orange-500' },
      achievement: { icon: <Award className="w-5 h-5" />, color: 'from-indigo-500 to-purple-500' },
      connection: { icon: <UserPlus className="w-5 h-5" />, color: 'from-pink-500 to-rose-500' },
      system: { icon: <AlertCircle className="w-5 h-5" />, color: 'from-gray-500 to-slate-500' },
      reward: { icon: <Gift className="w-5 h-5" />, color: 'from-orange-500 to-red-500' }
    };
    return iconMap[type] || iconMap.system;
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    if (isNaN(notifDate)) return 'Unknown time';

    const diffInSeconds = Math.floor((now - notifDate) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return notifDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // --- API / Action Functions (Wrapped in useCallback for stability) ---

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        console.error('Failed to fetch notifications:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array means this function is created once

  const markAsRead = useCallback(async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prevNotifications => prevNotifications.map(n =>
        n._id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prevNotifications => prevNotifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(prevNotifications => prevNotifications.filter(n => n._id !== id));
      } else {
         console.error('Failed to delete notification:', response.statusText);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  const deleteSelected = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      // Use Promise.allSettled for robust batch deletion
      const results = await Promise.allSettled(
        selectedIds.map(id =>
          fetch(`http://localhost:5000/api/notifications/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );

      // Filter out successfully deleted IDs
      const successfulDeletions = selectedIds.filter((_, index) => results[index].status === 'fulfilled');
      
      setNotifications(prevNotifications => prevNotifications.filter(n => !successfulDeletions.includes(n._id)));
      setSelectedIds([]);
      setShowActions(false);

      results.forEach(result => {
        if (result.status === 'rejected') {
          console.error('One or more deletions failed:', result.reason);
        }
      });
      
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  }, [selectedIds]); // Depends on selectedIds

  // --- State Logic ---

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]); // Dependency added for useCallback

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // --- Sub-Component ---

  const NotificationCard = ({ notification }) => {
    // Destructuring for cleaner code
    const { _id, read, link, actionLabel, title, message, createdAt, type } = notification;
    const { icon, color } = getNotificationIcon(type);
    const isSelected = selectedIds.includes(_id);

    // Primary action on card click
    const handleCardClick = () => {
      if (!read) markAsRead(_id);
      if (link) navigate(link);
    }
    
    // Checkbox toggle handler
    const handleCheckboxClick = (e) => {
      e.stopPropagation(); // Prevent the parent card click handler from firing
      toggleSelect(_id);
    }

    // Action button handler
    const handleActionButtonClick = (e) => {
      e.stopPropagation();
      if (link) navigate(link);
    }

    // Delete button handler
    const handleDeleteClick = (e) => {
      e.stopPropagation();
      deleteNotification(_id);
    }

    return (
      <div
        onClick={handleCardClick}
        className={`group relative bg-white border-2 rounded-2xl p-4 transition-all duration-300 cursor-pointer ${
          read
            ? 'border-gray-100 hover:border-gray-200'
            : 'border-indigo-200 bg-indigo-50/50 hover:border-indigo-300'
        } ${isSelected ? 'ring-4 ring-indigo-200' : ''} hover:shadow-lg`}
      >
        {/* Selection Checkbox */}
        {showActions && (
          <div className="absolute top-4 left-4 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxClick}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        )}

        <div className={`flex gap-4 ${showActions ? 'ml-8' : ''}`}>
          {/* Icon */}
          <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className={`font-semibold ${read ? 'text-gray-900' : 'text-indigo-900'}`}>
                {title}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-500">{getTimeAgo(createdAt)}</span>
                {!read && (
                  <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                )}
              </div>
            </div>

            <p className={`text-sm ${read ? 'text-gray-600' : 'text-gray-700'} line-clamp-2 mb-2`}>
              {message}
            </p>

            {/* Action Buttons */}
            {actionLabel && (
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleActionButtonClick}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {actionLabel} &rarr;
                </button>
              </div>
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={handleDeleteClick}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Delete Notification"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // --- Main Component Render ---

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center ring-4 ring-gray-50">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/settings/notifications')}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
              title="Notification Settings"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All', count: notifications.length },
                { id: 'unread', label: 'Unread', count: unreadCount },
                { id: 'read', label: 'Read', count: notifications.length - unreadCount }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all flex-shrink-0 ${
                    filter === tab.id
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      filter === tab.id ? 'bg-white/20' : 'bg-gray-200 text-gray-800'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {!showActions ? (
                <>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-all text-sm"
                      title="Mark All as Read"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowActions(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-all text-sm"
                    title="Select Notifications"
                  >
                    <Filter className="w-4 h-4" />
                    Select
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowActions(false);
                      setSelectedIds([]);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all text-sm"
                    title="Cancel Selection"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  {selectedIds.length > 0 && (
                    <button
                      onClick={deleteSelected}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all text-sm"
                      title={`Delete ${selectedIds.length} item(s)`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete ({selectedIds.length})
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mb-6">
              {filter === 'unread' ? (
                <CheckCheck className="w-12 h-12 text-indigo-600" />
              ) : (
                <Bell className="w-12 h-12 text-indigo-600" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {filter === 'unread' ? "You're all caught up!" : 'No notifications yet'}
            </h3>
            <p className="text-gray-600 mb-8">
              {filter === 'unread'
                ? 'All your notifications have been read.'
                : "When you get notifications, they'll show up here."}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md"
              >
                View All Notifications
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <NotificationCard key={notification._id} notification={notification} />
            ))}
          </div>
        )}

        {/* Tips Card */}
        {!loading && notifications.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-2xl p-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Pro Tip</h3>
                <p className="text-sm text-gray-700">
                  Click on any notification to view details or take action. Use the **Select** button above to manage multiple notifications at once.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
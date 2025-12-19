// src/pages/Bookings.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Video, Users, CheckCircle,
  XCircle, AlertCircle, Plus, Edit, Trash2, ExternalLink, Filter
} from 'lucide-react';

const Bookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      scheduled: {
        label: 'Scheduled',
        icon: <Clock className="w-5 h-5" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200'
      },
      completed: {
        label: 'Completed',
        icon: <CheckCircle className="w-5 h-5" />,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200'
      },
      cancelled: {
        label: 'Cancelled',
        icon: <XCircle className="w-5 h-5" />,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200'
      },
      pending: {
        label: 'Pending',
        icon: <AlertCircle className="w-5 h-5" />,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-200'
      }
    };
    return statusMap[status] || statusMap.pending;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return booking.status === 'scheduled' || booking.status === 'pending';
    return booking.status === filter;
  });

  const BookingCard = ({ booking }) => {
    const statusInfo = getStatusInfo(booking.status);

    return (
      <div className={`bg-white rounded-2xl border-2 ${statusInfo.borderColor} shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group`}>
        {/* Header */}
        <div className={`${statusInfo.bgColor} p-4 border-b-2 ${statusInfo.borderColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {booking.partnerAvatar ? (
                <img
                  src={booking.partnerAvatar}
                  alt={booking.partnerName}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg ring-2 ring-white">
                  {booking.partnerName?.[0] || 'U'}
                </div>
              )}
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{booking.partnerName || 'Unknown User'}</h3>
                <p className="text-sm text-gray-600">{booking.skill}</p>
              </div>
            </div>

            <div className={`flex items-center gap-2 px-3 py-1.5 ${statusInfo.bgColor} ${statusInfo.color} rounded-full font-semibold`}>
              {statusInfo.icon}
              <span>{statusInfo.label}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Date</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(booking.date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Time</p>
                <p className="text-sm font-semibold text-gray-900">{formatTime(booking.date)}</p>
              </div>
            </div>
          </div>

          {/* Location/Link */}
          {booking.location && (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="p-2 bg-green-100 rounded-lg">
                {booking.isVirtual ? (
                  <Video className="w-5 h-5 text-green-600" />
                ) : (
                  <MapPin className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 font-medium mb-1">
                  {booking.isVirtual ? 'Virtual Meeting' : 'Location'}
                </p>
                <p className="text-sm font-semibold text-gray-900 truncate">{booking.location}</p>
              </div>
              {booking.isVirtual && booking.meetingLink && (
                <a
                  href={booking.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-600 font-medium mb-2">Notes</p>
              <p className="text-sm text-gray-700">{booking.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {booking.status === 'scheduled' && (
              <>
                <button className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group">
                  <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Join Session
                </button>
                <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                  <Edit className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-3 bg-red-100 hover:bg-red-200 rounded-xl transition-all">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </>
            )}
            {booking.status === 'completed' && (
              <button className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all">
                Rate & Review
              </button>
            )}
            {booking.status === 'pending' && (
              <>
                <button className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Accept
                </button>
                <button className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Decline
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Bookings</h1>
                <p className="text-gray-600">Manage your scheduled skill exchange sessions</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/marketplace')}
              className="hidden md:flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              New Booking
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All', icon: <Calendar className="w-4 h-4" /> },
              { id: 'upcoming', label: 'Upcoming', icon: <Clock className="w-4 h-4" /> },
              { id: 'completed', label: 'Completed', icon: <CheckCircle className="w-4 h-4" /> },
              { id: 'cancelled', label: 'Cancelled', icon: <XCircle className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  filter === tab.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your bookings...</p>
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
              <Calendar className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No bookings found</h3>
            <p className="text-gray-600 mb-8">
              {filter === 'all'
                ? "You don't have any bookings yet. Start connecting with people!"
                : `No ${filter} bookings at the moment.`}
            </p>
            <button
              onClick={() => navigate('/marketplace')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Find People to Meet
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredBookings.length}</span>{' '}
                {filter !== 'all' && filter} booking{filteredBookings.length !== 1 && 's'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredBookings.map((booking) => (
                <BookingCard key={booking._id} booking={booking} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Bookings;
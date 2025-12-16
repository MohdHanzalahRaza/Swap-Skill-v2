import { useState, useEffect } from 'react';
import api from '../services/api';
import { FaCalendar } from 'react-icons/fa';
import { formatDate } from '../utils/helpers';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings');
      setBookings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          My Bookings 📅
        </h1>

        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-600">Loading bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <FaCalendar className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No bookings yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map(booking => (
                <div
                  key={booking._id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 mb-2">
                        Session with {booking.teacher?.name || booking.student?.name}
                      </h3>
                      <p className="text-gray-600 mb-1">
                        📅 {formatDate(booking.startTime)}
                      </p>
                      <p className="text-gray-600">
                        ⏰ {booking.duration} minutes
                      </p>
                    </div>
                    <span className={`badge ${
                      booking.status === 'completed' ? 'badge-success' :
                      booking.status === 'scheduled' ? 'badge-primary' :
                      'badge-error'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookings;
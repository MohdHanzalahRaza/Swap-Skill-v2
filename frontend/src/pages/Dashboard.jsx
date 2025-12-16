import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { 
  FaExchangeAlt, 
  FaStar, 
  FaUsers, 
  FaChartLine,
  FaArrowRight,
  FaTrophy
} from 'react-icons/fa';
import Loader from '../components/common/Loader';

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
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch exchanges
      const exchangesRes = await api.get('/exchanges');
      const exchanges = exchangesRes.data.data || [];
      
      const pending = exchanges.filter(e => e.status === 'pending').length;
      const completed = exchanges.filter(e => e.status === 'completed').length;

      setStats({
        totalExchanges: exchanges.length,
        pendingRequests: pending,
        completedExchanges: completed,
        rating: user?.rating || 0
      });

      setRecentExchanges(exchanges.slice(0, 5));

      // Fetch potential matches
      const usersRes = await api.get('/users', { params: { limit: 6 } });
      setMatches(usersRes.data.data || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  const statCards = [
    {
      title: 'Total Exchanges',
      value: stats.totalExchanges,
      icon: <FaExchangeAlt className="text-3xl" />,
      color: 'bg-blue-500',
      link: '/exchanges'
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      icon: <FaUsers className="text-3xl" />,
      color: 'bg-yellow-500',
      link: '/exchanges?status=pending'
    },
    {
      title: 'Completed',
      value: stats.completedExchanges,
      icon: <FaTrophy className="text-3xl" />,
      color: 'bg-green-500',
      link: '/exchanges?status=completed'
    },
    {
      title: 'Your Rating',
      value: `${stats.rating.toFixed(1)} ⭐`,
      icon: <FaStar className="text-3xl" />,
      color: 'bg-purple-500',
      link: '/profile'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your skill exchanges
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Link
              key={index}
              to={stat.link}
              className="card hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-800">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} text-white p-4 rounded-lg`}>
                  {stat.icon}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Exchanges */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Recent Exchanges
                </h2>
                <Link 
                  to="/exchanges" 
                  className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
                >
                  View All
                  <FaArrowRight />
                </Link>
              </div>

              {recentExchanges.length === 0 ? (
                <div className="text-center py-12">
                  <FaExchangeAlt className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No exchanges yet</p>
                  <Link to="/marketplace" className="btn btn-primary">
                    Find Skills to Exchange
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentExchanges.map((exchange) => (
                    <div 
                      key={exchange._id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <img
                            src={exchange.requester?.avatar || exchange.receiver?.avatar}
                            alt="User"
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-semibold text-gray-800">
                              {exchange.requester?._id === user?._id 
                                ? exchange.receiver?.name 
                                : exchange.requester?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {exchange.skillOffered?.name} ↔️ {exchange.skillWanted?.name}
                            </p>
                          </div>
                        </div>
                        <span className={`badge ${
                          exchange.status === 'completed' ? 'badge-success' :
                          exchange.status === 'pending' ? 'badge-warning' :
                          exchange.status === 'accepted' ? 'badge-primary' :
                          'badge-error'
                        }`}>
                          {exchange.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Matches */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link 
                  to="/marketplace" 
                  className="block w-full btn btn-primary text-center"
                >
                  Browse Skills
                </Link>
                <Link 
                  to="/profile" 
                  className="block w-full btn btn-outline text-center"
                >
                  Edit Profile
                </Link>
                <Link 
                  to="/messages" 
                  className="block w-full btn btn-secondary text-center"
                >
                  My Messages
                </Link>
              </div>
            </div>

            {/* Potential Matches */}
            <div className="card">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                People You May Like
              </h3>
              <div className="space-y-3">
                {matches.slice(0, 3).map((match) => (
                  <Link
                    key={match._id}
                    to={`/user/${match._id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition"
                  >
                    <img
                      src={match.avatar}
                      alt={match.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">
                        {match.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {match.rating.toFixed(1)} ⭐ ({match.totalReviews} reviews)
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link 
                to="/marketplace" 
                className="block text-center text-primary-600 hover:text-primary-700 mt-4"
              >
                See More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
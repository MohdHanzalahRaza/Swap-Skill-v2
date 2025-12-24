import { useEffect, useState } from "react";
import socket from "../../socket";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { FaBell, FaEnvelope, FaUser, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";

import api from "../../services/api";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Fetch unread counts
  const fetchUnreadCounts = async () => {
    try {
      // Fetch unread messages count
      const messagesRes = await api.get('/messages/conversations');
      if (messagesRes.data) {
        const totalUnread = messagesRes.data.data?.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0) || 0;
        setUnreadMessages(totalUnread);
      }

      // Fetch unread notifications count
      const notifRes = await api.get('/notifications');
      if (notifRes.data) {
        const unreadCount = notifRes.data.data?.filter(n => !n.read).length || 0;
        setUnreadNotifications(unreadCount);
      }
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    }
  };

  useEffect(() => {
    if (user && isAuthenticated) {
      socket.connect();
      socket.emit("join", user._id);
      fetchUnreadCounts(); // Fetch initial counts
    }

    return () => {
      socket.disconnect();
    };
  }, [user, isAuthenticated]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setShowMenu(false);
  }, [location]);

  // Listen for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewMessage = () => {
      fetchUnreadCounts();
    };

    const handleNewNotification = () => {
      fetchUnreadCounts();
    };

    socket.on('receive_message', handleNewMessage);
    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('receive_message', handleNewMessage);
      socket.off('new_notification', handleNewNotification);
    };
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    setShowMenu(false);
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-white shadow-lg"
          : "bg-white shadow-md"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">

            {/* Logo with Gradient Swap Icon */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-sm opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  SwapSkillz
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/marketplace"
                className={`text-base font-medium transition-all duration-200 relative group ${isActive("/marketplace")
                  ? "text-purple-600"
                  : "text-gray-700 hover:text-purple-600"
                  }`}
              >
                Marketplace
                <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transform origin-left transition-transform duration-300 ${isActive("/marketplace") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}></span>
              </Link>

              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className={`text-base font-medium transition-all duration-200 relative group ${isActive("/dashboard")
                    ? "text-purple-600"
                    : "text-gray-700 hover:text-purple-600"
                    }`}
                >
                  Dashboard
                  <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transform origin-left transition-transform duration-300 ${isActive("/dashboard") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}></span>
                </Link>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center space-x-3">
              {isAuthenticated ? (
                <>
                  {/* Messages with Badge */}
                  <Link
                    to="/messages"
                    className="relative p-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200 group"
                  >
                    <FaEnvelope className="text-xl" />
                    {unreadMessages > 0 && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
                    )}
                  </Link>

                  {/* Notifications with Badge */}
                  <Link
                    to="/notifications"
                    className="relative p-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200 group"
                  >
                    <FaBell className="text-xl" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
                    )}
                  </Link>

                  {/* User Avatar Dropdown */}
                  <div className="relative ml-2">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="flex items-center focus:outline-none group"
                    >
                      <div className="relative">
                        <img
                          src={user?.avatar || "https://via.placeholder.com/40"}
                          alt={user?.name}
                          className="w-11 h-11 rounded-xl object-cover border-2 border-transparent group-hover:border-purple-500 transition-all duration-200 shadow-md"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                    </button>

                    {showMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowMenu(false)}
                        ></div>
                        <div className="absolute right-0 mt-4 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-slideDown">
                          {/* User Info Header */}
                          <div className="bg-gradient-to-br from-blue-50 to-purple-50 px-5 py-4 border-b border-gray-100">
                            <div className="flex items-center space-x-3">
                              <img
                                src={user?.avatar || "https://via.placeholder.com/40"}
                                alt={user?.name}
                                className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                                <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                              </div>
                            </div>
                          </div>

                          {/* Menu Items */}
                          <div className="py-2">
                            <Link
                              to="/profile"
                              className="flex items-center px-5 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-all duration-200"
                              onClick={() => setShowMenu(false)}
                            >
                              <FaUser className="w-4 h-4 mr-3" />
                              <span className="font-medium">My Profile</span>
                            </Link>

                            <div className="border-t border-gray-100 my-1"></div>

                            <button
                              onClick={handleLogout}
                              className="flex items-center w-full px-5 py-3 text-red-600 hover:bg-red-50 transition-all duration-200"
                            >
                              <FaSignOutAlt className="w-4 h-4 mr-3" />
                              <span className="font-medium">Logout</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-6 py-2.5 text-base font-semibold text-gray-700 hover:text-gray-900 transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-6 py-2.5 text-base font-semibold text-white bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 focus:outline-none"
            >
              {mobileMenuOpen ? (
                <FaTimes className="text-2xl" />
              ) : (
                <FaBars className="text-2xl" />
              )}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? "max-h-screen opacity-100 pb-6" : "max-h-0 opacity-0"
              }`}
          >
            <div className="pt-4 space-y-2">

              {/* User Info Card (Mobile) */}
              {isAuthenticated && user && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 mb-4 border border-purple-100">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={user?.avatar || "https://via.placeholder.com/40"}
                        alt={user?.name}
                        className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-md"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-sm text-gray-600 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Navigation Links */}
              <Link
                to="/marketplace"
                className={`block px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive("/marketplace")
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                Marketplace
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/dashboard"
                    className={`block px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive("/dashboard")
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    Dashboard
                  </Link>

                  <Link
                    to="/messages"
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 font-medium transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <FaEnvelope className="w-5 h-5 mr-3 text-gray-500" />
                      <span>Messages</span>
                    </div>
                    {unreadMessages > 0 && (
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                    )}
                  </Link>

                  <Link
                    to="/notifications"
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 font-medium transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <FaBell className="w-5 h-5 mr-3 text-gray-500" />
                      <span>Notifications</span>
                    </div>
                    {unreadNotifications > 0 && (
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                    )}
                  </Link>

                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 font-medium transition-all duration-200"
                  >
                    <FaUser className="w-5 h-5 mr-3 text-gray-500" />
                    <span>My Profile</span>
                  </Link>

                  <div className="border-t border-gray-200 my-2"></div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-medium transition-all duration-200"
                  >
                    <FaSignOutAlt className="w-5 h-5 mr-3" />
                    <span>Logout</span>
                  </button>
                </>
              )}

              {/* Login/Register for Mobile when not authenticated */}
              {!isAuthenticated && (
                <div className="space-y-2 pt-2">
                  <Link
                    to="/login"
                    className="block px-4 py-3 text-center rounded-xl font-semibold text-gray-700 border-2 border-gray-200 hover:bg-gray-50 transition-all duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-3 text-center rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Fixed Spacer - Prevents Layout Shift */}
      <div className="h-20"></div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default Navbar;
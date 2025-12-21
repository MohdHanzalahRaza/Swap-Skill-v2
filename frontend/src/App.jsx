import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import socketService from './socket';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Loader from './components/common/Loader';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import SkillMarketplace from './pages/SkillMarketplace';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Bookings from './pages/Bookings';
import Exchanges from './pages/Exchanges';
import NotFound from './pages/NotFound';

function App() {
  const { loading, user } = useAuth();

  // SINGLE SOCKET CONNECTION - Initialize when user logs in
  useEffect(() => {
    if (user && user._id) {
      console.log('🚀 App: Initializing socket for user:', user._id);
      socketService.connect(user._id);

      // Cleanup on unmount or user logout
      return () => {
        console.log('🛑 App: Cleaning up socket connection');
        socketService.disconnect();
      };
    } else {
      // Disconnect if user logs out
      console.log('👤 App: No user, disconnecting socket');
      socketService.disconnect();
    }
  }, [user]);

  if (loading) {
    return <Loader />;
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/marketplace" element={<SkillMarketplace />} />
            <Route path="/user/:id" element={<UserProfile />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="/bookings" element={
              <ProtectedRoute>
                <Bookings />
              </ProtectedRoute>
            } />
            <Route path="/exchanges" element={
              <ProtectedRoute>
                <Exchanges />
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
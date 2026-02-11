import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useAuth } from './hooks/useAuth';
import socketService from './socket';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Loader from './components/common/Loader';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';

// Lazy load Pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const SkillMarketplace = lazy(() => import('./pages/SkillMarketplace'));
const Messages = lazy(() => import('./pages/Messages'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Exchanges = lazy(() => import('./pages/Exchanges'));
const NotFound = lazy(() => import('./pages/NotFound'));

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
    <ThemeProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader /></div>}>
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
            </Suspense>
          </main>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
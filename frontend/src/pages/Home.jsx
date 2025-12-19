// ============================================
// FILE: frontend/src/pages/Home.jsx
// COMPLETE Enhanced Home Page with Premium Sections
// ============================================
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users, BookOpen, TrendingUp, ArrowRight, Sparkles,
  Target, Zap, Award, MessageCircle, Calendar, Star, Sun, Moon,
  CheckCircle, Globe, Shield, Clock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import Loader from '../components/common/Loader';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');

  // Animated stats from backend
  const [stats, setStats] = useState({
    users: 0,
    skills: 0,
    exchanges: 0
  });

  const [finalStats, setFinalStats] = useState({
    users: 0,
    skills: 0,
    exchanges: 0
  });

  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    fetchHomeData();
  }, []);

  useEffect(() => {
    // Handle scroll
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      const sections = ['hero', 'how-it-works', 'skills', 'about', 'testimonials'];
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 150 && rect.bottom >= 150;
        }
        return false;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animate stats when finalStats change
  useEffect(() => {
    if (finalStats.users === 0) return;

    const duration = 2000;
    const steps = 60;
    const increment = {
      users: finalStats.users / steps,
      skills: finalStats.skills / steps,
      exchanges: finalStats.exchanges / steps
    };

    let currentStep = 0;
    const timer = setInterval(() => {
      if (currentStep < steps) {
        setStats({
          users: Math.floor(increment.users * currentStep),
          skills: Math.floor(increment.skills * currentStep),
          exchanges: Math.floor(increment.exchanges * currentStep)
        });
        currentStep++;
      } else {
        setStats(finalStats);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [finalStats]);

  const fetchHomeData = async () => {
    try {
      setLoading(true);

      // Fetch data from backend
      const [usersRes, skillsRes] = await Promise.all([
        api.get('/users', { params: { limit: 100 } }),
        api.get('/skills', { params: { limit: 6 } })
      ]);

      const totalUsers = usersRes.data.pagination?.totalUsers || usersRes.data.data?.length || 100;
      const totalSkills = skillsRes.data.total || skillsRes.data.data?.length || 150;
      const skillsData = skillsRes.data.data || [];

      setSkills(skillsData);

      // Set final stats for animation
      setFinalStats({
        users: totalUsers,
        skills: totalSkills,
        exchanges: totalUsers * 12
      });

    } catch (error) {
      console.error('Home fetch error:', error);
      setFinalStats({ users: 100, skills: 150, exchanges: 1200 });
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setNewsletterStatus('Thanks for subscribing! 🎉');
      setEmail('');
      setTimeout(() => setNewsletterStatus(''), 3000);
    }
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const howItWorks = [
    {
      step: '01',
      title: 'Create Profile',
      description: 'Sign up and showcase your skills. Tell us what you can teach and what you want to learn.',
      icon: <Target className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      step: '02',
      title: 'Find Match',
      description: 'Browse our community and find the perfect skill exchange partner using our smart matching system.',
      icon: <Users className="w-8 h-8" />,
      color: 'from-purple-500 to-pink-500'
    },
    {
      step: '03',
      title: 'Start Learning',
      description: 'Connect, schedule sessions, and begin your learning journey. Track progress and leave reviews.',
      icon: <Zap className="w-8 h-8" />,
      color: 'from-orange-500 to-red-500'
    }
  ];

  const benefits = [
    { 
      icon: <Award className="w-7 h-7" />, 
      title: '100% Free Forever', 
      description: 'No hidden costs, no subscription fees. Learning and teaching should be accessible to everyone.',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    { 
      icon: <Globe className="w-7 h-7" />, 
      title: 'Global Community', 
      description: 'Connect with learners and teachers from around the world. Expand your network while learning.',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    { 
      icon: <Shield className="w-7 h-7" />, 
      title: 'Verified Profiles', 
      description: 'All our users go through verification. Learn from trusted community members safely.',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    { 
      icon: <Clock className="w-7 h-7" />, 
      title: 'Flexible Scheduling', 
      description: 'Learn at your own pace with flexible scheduling options that fit your lifestyle.',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Graphic Designer',
      image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
      text: 'I learned Python while teaching design. Best decision ever!',
      rating: 5
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Software Developer',
      image: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150',
      text: 'Amazing community! I learned Spanish from a native speaker.',
      rating: 5
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      role: 'Marketing Specialist',
      image: 'https://images.pexels.com/photos/1181391/pexels-photo-1181391.jpeg?auto=compress&cs=tinysrgb&w=150',
      text: 'SwapSkillz transformed my career path completely!',
      rating: 5
    }
  ];

  if (loading) return <Loader />;

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`}>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className={`fixed top-24 right-8 z-40 w-14 h-14 rounded-full shadow-2xl transform hover:scale-110 transition-all flex items-center justify-center ${
          isDarkMode ? 'bg-yellow-500 text-yellow-900' : 'bg-gray-800 text-yellow-400'
        }`}
        aria-label="Toggle theme"
      >
        {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>

      {/* Hero Section */}
      <section id="hero" className={`relative min-h-screen flex items-center justify-center overflow-hidden ${
        isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
      }`}>

        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className={`absolute top-20 left-20 w-64 h-64 rounded-full opacity-20 animate-pulse ${
            isDarkMode ? 'bg-blue-400' : 'bg-blue-200'
          }`}></div>
          <div className={`absolute bottom-20 right-20 w-80 h-80 rounded-full opacity-20 animate-pulse ${
            isDarkMode ? 'bg-purple-400' : 'bg-purple-200'
          }`} style={{ animationDelay: '1s' }}></div>
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 animate-pulse ${
            isDarkMode ? 'bg-pink-400' : 'bg-pink-200'
          }`} style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <div className="max-w-4xl mx-auto">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full mb-8 shadow-lg animate-bounce-slow">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Join {stats.users > 0 ? `${stats.users.toLocaleString()}+` : '100+'} Learners Worldwide</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                Exchange Skills,
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Not Money
              </span>
            </h1>

            <p className={`text-xl md:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Learn new skills by teaching what you already know. Join the world's largest skill-swapping community.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/marketplace"
                    className={`inline-flex items-center justify-center px-8 py-4 border-2 font-bold rounded-full transition-all ${
                      isDarkMode
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    Browse Skills
                  </Link>
                </>
              )}
            </div>

            {/* Animated Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Active Learners', value: stats.users, icon: <Users className="w-6 h-6" /> },
                { label: 'Skills Available', value: stats.skills, icon: <BookOpen className="w-6 h-6" /> },
                { label: 'Successful Exchanges', value: stats.exchanges, icon: <TrendingUp className="w-6 h-6" /> }
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-2xl backdrop-blur-sm transition-all hover:scale-105 ${
                    isDarkMode
                      ? 'bg-gray-800/50 border border-gray-700'
                      : 'bg-white/70 border border-white'
                  } shadow-xl`}
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 ${
                    index === 0 ? 'bg-blue-100 text-blue-600' :
                    index === 1 ? 'bg-purple-100 text-purple-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {stat.icon}
                  </div>
                  <div className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stat.value.toLocaleString()}+
                  </div>
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className={`py-20 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              How <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">SwapSkillz</span> Works
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <div
                key={index}
                className={`group relative p-8 rounded-3xl transition-all hover:scale-105 ${
                  isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'
                } shadow-xl hover:shadow-2xl`}
              >
                <div className={`absolute -top-6 -left-6 w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg transform group-hover:rotate-12 transition-transform`}>
                  {step.step}
                </div>

                <div className="flex justify-center mb-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    index === 0 ? 'bg-blue-100 text-blue-600' :
                    index === 1 ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {step.icon}
                  </div>
                </div>

                <h3 className={`text-2xl font-bold mb-4 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {step.title}
                </h3>
                <p className={`text-center leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className={`py-20 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
            <div>
              <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Popular <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Skills</span>
              </h2>
              <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Explore the most in-demand skills
              </p>
            </div>
            <Link
              to="/marketplace"
              className={`inline-flex items-center gap-2 font-semibold transition-colors ${
                isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-indigo-600 hover:text-indigo-700'
              }`}
            >
              View all
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.length > 0 ? (
              skills.map((skill) => (
                <div
                  key={skill._id}
                  className={`group p-6 rounded-2xl transition-all hover:scale-105 cursor-pointer ${
                    isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                  } shadow-lg hover:shadow-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl">
                      <BookOpen className="w-6 h-6 text-indigo-600" />
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                      {skill.level || 'All Levels'}
                    </span>
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {skill.name}
                  </h3>
                  <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {skill.category}
                  </p>
                  <p className={`text-sm line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {skill.description || 'Learn this valuable skill through peer exchange'}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No skills available yet</p>
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              View All Skills
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ENHANCED Benefits Section */}
      <section id="about" className={`py-24 ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Why Choose SwapSkillz?
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              More than just a learning platform - a global community
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className={`group p-6 lg:p-8 rounded-3xl text-center transition-all hover:scale-105 hover:-translate-y-2 ${
                  isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:shadow-2xl'
                } shadow-xl border ${isDarkMode ? 'border-gray-600' : 'border-gray-100'}`}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 ${benefit.iconBg} rounded-2xl mb-4 lg:mb-6 shadow-md`}>
                  <div className={benefit.iconColor}>
                    {benefit.icon}
                  </div>
                </div>
                <h3 className={`text-lg lg:text-xl font-bold mb-2 lg:mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {benefit.title}
                </h3>
                <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className={`py-20 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              What Our <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Community</span> Says
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className={`p-8 rounded-2xl transition-all hover:scale-105 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                } shadow-xl hover:shadow-2xl`}
              >
                <div className="flex items-center mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className={`mb-6 italic leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  "{testimonial.text}"
                </p>
                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-full object-cover mr-4 border-4 border-white shadow-lg"
                  />
                  <div>
                    <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {testimonial.name}
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Simple & Clean from First Code with Enhanced Background */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-xl mb-10 text-blue-100">
            Join thousands who are already transforming their lives
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated && (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-10 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-gray-100 transition-all shadow-2xl hover:scale-105"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-10 py-4 border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-all"
                >
                  Log In
                </Link>
              </>
            )}
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-10 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-gray-100 transition-all shadow-2xl hover:scale-105"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Scroll to Top */}
      {isScrolled && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all z-30 flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

    </div>
  );
};

export default Home;
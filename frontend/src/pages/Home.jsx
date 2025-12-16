import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/common/Loader';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [usersCount, setUsersCount] = useState(0);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);

      const [usersRes, skillsRes] = await Promise.all([
        api.get('/users', { params: { limit: 1 } }),
        api.get('/skills', { params: { limit: 6 } })
      ]);

      setUsersCount(usersRes.data.total || 0);
      setSkills(skillsRes.data.data || []);
    } catch (error) {
      console.error('Home fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="bg-gray-50">
      {/* HERO */}
      <section className="bg-gradient-to-br from-primary-50 to-purple-50 py-20">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Exchange Skills, <span className="gradient-text">Not Money</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            Learn new skills by teaching what you already know. Join {usersCount}+ learners worldwide.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn btn-primary px-8 py-4 text-lg">
              Get Started Free
            </Link>
            <Link to="/marketplace" className="btn btn-outline px-8 py-4 text-lg">
              Browse Skills
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Create Profile',
                desc: 'Add skills you can teach and skills you want to learn.'
              },
              {
                title: 'Find Match',
                desc: 'Discover people with complementary skills.'
              },
              {
                title: 'Start Exchanging',
                desc: 'Chat, schedule sessions, and grow together.'
              }
            ].map((step, i) => (
              <div key={i} className="card text-center">
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED SKILLS */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-bold text-gray-800">
              Popular Skills
            </h2>
            <Link to="/marketplace" className="text-primary-600 hover:underline">
              View all →
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map(skill => (
              <div key={skill._id} className="card">
                <h3 className="font-bold text-lg text-gray-800 mb-1">
                  {skill.name}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  {skill.category} • {skill.level}
                </p>
                <p className="text-gray-600 line-clamp-2">
                  {skill.description || 'No description available'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-4xl font-bold mb-6">
            Ready to start exchanging skills?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            It’s free, simple, and community-driven.
          </p>
          <Link to="/register" className="btn bg-white text-primary-600 px-8 py-4 text-lg">
            Join Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;

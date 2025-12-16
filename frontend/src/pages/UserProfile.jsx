import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { userService } from '../services/userService';
import Loader from '../components/common/Loader';

const UserProfile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await userService.getUserById(id);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (!user) return <div>User not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="card mb-8">
          <div className="flex items-start gap-6">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-32 h-32 rounded-full object-cover"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {user.name}
              </h1>
              <p className="text-gray-600 mb-4">{user.bio}</p>
              <div className="flex gap-4">
                <span className="badge badge-primary">
                  ⭐ {user.rating.toFixed(1)} ({user.totalReviews} reviews)
                </span>
                <span className="badge badge-success">
                  {user.totalExchanges || 0} exchanges
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Skills Offered
            </h2>
            <div className="space-y-2">
              {user.skillsOffered?.map(skill => (
                <div key={skill._id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold">{skill.name}</p>
                  <p className="text-sm text-gray-500">{skill.category}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Skills Wanted
            </h2>
            <div className="space-y-2">
              {user.skillsWanted?.map(skill => (
                <div key={skill._id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold">{skill.name}</p>
                  <p className="text-sm text-gray-500">{skill.category}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
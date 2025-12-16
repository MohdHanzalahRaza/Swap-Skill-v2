import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { FaEnvelope } from 'react-icons/fa';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          Messages 💬
        </h1>

        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-600">Loading messages...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <FaEnvelope className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No messages yet</p>
              <p className="text-gray-400 mt-2">
                Start exchanging skills to begin conversations
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {conversations.map(conv => {
                const otherUser = conv._id;
                return (
                  <div
                    key={conv._id._id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={otherUser.avatar}
                        alt={otherUser.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          {otherUser.name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {conv.lastMessage?.content}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="badge badge-primary">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
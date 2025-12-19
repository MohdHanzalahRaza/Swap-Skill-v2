import api from './api';

/**
 * Send a message to a user
 * @param {string} receiverId
 * @param {string} content
 */
export const sendMessage = (receiverId, content) => {
  return api.post('/messages', {
    receiverId,
    content
  });
};

/**
 * Get messages between logged-in user and another user
 * @param {string} userId
 */
export const getMessages = (userId) => {
  return api.get(`/messages/${userId}`);
};

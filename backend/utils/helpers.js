/**
 * Generate random alphanumeric string
 */
exports.generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

/**
 * Format date in readable form
 */
exports.formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Calculate days between two dates
 */
exports.daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((new Date(date1) - new Date(date2)) / oneDay));
};

/**
 * Pagination helper
 */
exports.paginate = (page = 1, limit = 10) => {
  const currentPage = Math.max(1, parseInt(page));
  const perPage = Math.max(1, parseInt(limit));
  const skip = (currentPage - 1) * perPage;

  return { skip, limit: perPage };
};

/**
 * Standard success response
 */
exports.successResponse = (data, message = 'Success') => ({
  success: true,
  message,
  data,
});

/**
 * Standard error response
 */
exports.errorResponse = (message = 'Something went wrong') => ({
  success: false,
  error: message,
});

/**
 * Email validation
 */
exports.isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Generate URL-friendly slug
 */
exports.generateSlug = (str = '') =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Calculate average rating
 */
exports.calculateAverageRating = (reviews = []) => {
  if (!reviews.length) return 0;
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return Number((total / reviews.length).toFixed(1));
};

/**
 * Remove sensitive fields from user object
 */
exports.sanitizeUser = (user) => {
  if (!user) return null;
  const data = user.toObject ? user.toObject() : { ...user };
  delete data.password;
  delete data.__v;
  return data;
};

/**
 * Generate numeric OTP
 */
exports.generateOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

/**
 * Mask email address
 */
exports.maskEmail = (email) => {
  if (!email) return '';
  const [name, domain] = email.split('@');
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
};

/**
 * Time ago helper
 */
exports.timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  for (const [unit, value] of Object.entries(intervals)) {
    const count = Math.floor(seconds / value);
    if (count >= 1) {
      return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
};

/**
 * Generate video meeting link
 */
exports.generateMeetingLink = (exchangeId) => {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return `${baseUrl}/video-call/${exchangeId}`;
};

/**
 * Check if user is recently active
 */
exports.isUserOnline = (lastActive) => {
  if (!lastActive) return false;
  return new Date(lastActive) > new Date(Date.now() - 5 * 60 * 1000);
};
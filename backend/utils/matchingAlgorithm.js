// ============================================
// FILE: backend/utils/matchingAlgorithm.js
// COPY THIS ENTIRE CODE
// ============================================
const User = require('../models/User');
const Skill = require('../models/Skill');

/**
 * Find matching users based on complementary skills
 * @param {String} userId - Current user ID
 * @param {Object} filters - Optional filters (category, level, location)
 * @returns {Array} Array of matched users with scores
 */
exports.findMatches = async (userId, filters = {}) => {
  try {
    // Get current user with their skills
    const currentUser = await User.findById(userId)
      .populate('skillsOffered')
      .populate('skillsWanted');

    if (!currentUser) {
      throw new Error('User not found');
    }

    // Get all other active users
    const allUsers = await User.find({
      _id: { $ne: userId },
      isActive: true
    })
      .populate('skillsOffered')
      .populate('skillsWanted');

    // Calculate match scores
    const matches = [];

    for (const user of allUsers) {
      const matchScore = calculateMatchScore(currentUser, user);
      
      if (matchScore.score > 0) {
        matches.push({
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            location: user.location,
            rating: user.rating,
            totalReviews: user.totalReviews,
            lastActive: user.lastActive
          },
          matchScore: matchScore.score,
          matchReason: matchScore.reason,
          commonInterests: matchScore.commonInterests,
          complementarySkills: matchScore.complementarySkills
        });
      }
    }

    // Sort by match score (highest first)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Apply filters if provided
    let filteredMatches = matches;

    if (filters.category) {
      filteredMatches = filteredMatches.filter(match => 
        match.complementarySkills.some(skill => 
          skill.category === filters.category
        )
      );
    }

    if (filters.minRating) {
      filteredMatches = filteredMatches.filter(match => 
        match.user.rating >= filters.minRating
      );
    }

    if (filters.location) {
      filteredMatches = filteredMatches.filter(match => 
        match.user.location?.city?.toLowerCase() === filters.location.toLowerCase() ||
        match.user.location?.country?.toLowerCase() === filters.location.toLowerCase()
      );
    }

    return filteredMatches;
  } catch (error) {
    console.error('Error in findMatches:', error);
    throw error;
  }
};

/**
 * Calculate match score between two users
 * @param {Object} user1 - First user
 * @param {Object} user2 - Second user
 * @returns {Object} Match score and details
 */
function calculateMatchScore(user1, user2) {
  let score = 0;
  const reason = [];
  const commonInterests = [];
  const complementarySkills = [];

  // Perfect Match: User1 wants what User2 offers AND User2 wants what User1 offers
  const user1WantedSkills = user1.skillsWanted.map(s => s.name.toLowerCase());
  const user2OfferedSkills = user2.skillsOffered.map(s => s.name.toLowerCase());
  const user2WantedSkills = user2.skillsWanted.map(s => s.name.toLowerCase());
  const user1OfferedSkills = user1.skillsOffered.map(s => s.name.toLowerCase());

  // Check complementary skills (what I want, they offer)
  const matchingOffersForUser1 = user2.skillsOffered.filter(skill =>
    user1WantedSkills.includes(skill.name.toLowerCase())
  );

  // Check complementary skills (what they want, I offer)
  const matchingOffersForUser2 = user1.skillsOffered.filter(skill =>
    user2WantedSkills.includes(skill.name.toLowerCase())
  );

  // Perfect bidirectional match (highest score)
  if (matchingOffersForUser1.length > 0 && matchingOffersForUser2.length > 0) {
    score += 100 * Math.min(matchingOffersForUser1.length, matchingOffersForUser2.length);
    reason.push('Perfect bidirectional skill match! 🎯');
    
    matchingOffersForUser1.forEach(skill => {
      complementarySkills.push({
        name: skill.name,
        category: skill.category,
        direction: 'they_offer'
      });
    });

    matchingOffersForUser2.forEach(skill => {
      complementarySkills.push({
        name: skill.name,
        category: skill.category,
        direction: 'you_offer'
      });
    });
  } 
  // One-way match (they have what I want)
  else if (matchingOffersForUser1.length > 0) {
    score += 50 * matchingOffersForUser1.length;
    reason.push('They can teach you skills you want to learn! 📚');
    
    matchingOffersForUser1.forEach(skill => {
      complementarySkills.push({
        name: skill.name,
        category: skill.category,
        direction: 'they_offer'
      });
    });
  }
  // One-way match (I have what they want)
  else if (matchingOffersForUser2.length > 0) {
    score += 50 * matchingOffersForUser2.length;
    reason.push('You can teach them skills they want to learn! 🎓');
    
    matchingOffersForUser2.forEach(skill => {
      complementarySkills.push({
        name: skill.name,
        category: skill.category,
        direction: 'you_offer'
      });
    });
  }

  // Common interests (same skills offered or wanted)
  const commonOffered = user1.skillsOffered.filter(skill1 =>
    user2.skillsOffered.some(skill2 => 
      skill1.name.toLowerCase() === skill2.name.toLowerCase()
    )
  );

  const commonWanted = user1.skillsWanted.filter(skill1 =>
    user2.skillsWanted.some(skill2 => 
      skill1.name.toLowerCase() === skill2.name.toLowerCase()
    )
  );

  if (commonOffered.length > 0) {
    score += 10 * commonOffered.length;
    reason.push(`${commonOffered.length} common skill(s) you both offer`);
    commonOffered.forEach(skill => {
      commonInterests.push({ name: skill.name, type: 'offer' });
    });
  }

  if (commonWanted.length > 0) {
    score += 10 * commonWanted.length;
    reason.push(`${commonWanted.length} common skill(s) you both want to learn`);
    commonWanted.forEach(skill => {
      commonInterests.push({ name: skill.name, type: 'want' });
    });
  }

  // Location bonus (same city)
  if (user1.location?.city && user2.location?.city &&
      user1.location.city.toLowerCase() === user2.location.city.toLowerCase()) {
    score += 15;
    reason.push('Same location! 📍');
  }

  // Rating bonus (highly rated users)
  if (user2.rating >= 4.5) {
    score += 10;
    reason.push('Highly rated user! ⭐');
  }

  // Active user bonus (active in last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (new Date(user2.lastActive) > oneDayAgo) {
    score += 5;
    reason.push('Recently active');
  }

  return {
    score,
    reason: reason.join(' • '),
    commonInterests,
    complementarySkills
  };
}

/**
 * Find similar users based on skills offered
 * @param {String} userId - Current user ID
 * @param {Number} limit - Number of results to return
 * @returns {Array} Array of similar users
 */
exports.findSimilarUsers = async (userId, limit = 10) => {
  try {
    const currentUser = await User.findById(userId).populate('skillsOffered');
    
    if (!currentUser || currentUser.skillsOffered.length === 0) {
      return [];
    }

    // Get categories of user's offered skills
    const userCategories = currentUser.skillsOffered.map(s => s.category);

    // Find users with skills in same categories
    const similarUsers = await User.find({
      _id: { $ne: userId },
      isActive: true
    })
      .populate('skillsOffered')
      .limit(limit * 2); // Get more to filter

    // Calculate similarity scores
    const results = similarUsers
      .map(user => {
        const userSkillCategories = user.skillsOffered.map(s => s.category);
        const commonCategories = userCategories.filter(cat => 
          userSkillCategories.includes(cat)
        );
        
        return {
          user: {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
            rating: user.rating,
            totalReviews: user.totalReviews
          },
          similarityScore: commonCategories.length,
          commonCategories
        };
      })
      .filter(result => result.similarityScore > 0)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error('Error in findSimilarUsers:', error);
    throw error;
  }
};

/**
 * Get skill recommendations based on user's current skills
 * @param {String} userId - Current user ID
 * @returns {Array} Array of recommended skills
 */
exports.getSkillRecommendations = async (userId) => {
  try {
    const currentUser = await User.findById(userId).populate('skillsOffered skillsWanted');
    
    if (!currentUser) {
      return [];
    }

    // Get all skills from other users
    const allSkills = await Skill.find({
      user: { $ne: userId },
      type: 'offer'
    }).populate('user', 'name rating');

    // Filter out skills user already has or wants
    const currentSkillNames = [
      ...currentUser.skillsOffered.map(s => s.name.toLowerCase()),
      ...currentUser.skillsWanted.map(s => s.name.toLowerCase())
    ];

    const recommendations = allSkills
      .filter(skill => !currentSkillNames.includes(skill.name.toLowerCase()))
      .map(skill => ({
        skill: {
          _id: skill._id,
          name: skill.name,
          category: skill.category,
          level: skill.level
        },
        user: skill.user,
        popularity: skill.popularity
      }))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10);

    return recommendations;
  } catch (error) {
    console.error('Error in getSkillRecommendations:', error);
    throw error;
  }
};

module.exports = exports;
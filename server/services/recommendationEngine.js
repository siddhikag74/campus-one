const Event = require('../models/Event');
const Registration = require('../models/Registration');
const SavedEvent = require('../models/SavedEvent');
const User = require('../models/User');

/**
 * AI/ML Recommendation Engine
 * Analyzes behavioral signals from user activity:
 * 1. Followed Clubs (High affinity)
 * 2. Saved Events & Interaction history
 * 3. Registered Event Categories (Historical interest profile)
 * 4. Upcoming Deadlines (Time-decay urgency)
 * 5. Overall Campus Popularity (Global engagement score)
 *
 * Pluggable architecture:
 * To connect a real ML model (e.g. Scikit-learn, TensorFlow, or Vertex AI),
 * replace this logic with an inference API call while preserving the return contract.
 */
const generateRecommendations = async (userId) => {
  // 1. Fetch user's profile and active signals
  const user = await User.findById(userId).populate('followedClubs');
  const followedClubIds = (user?.followedClubs || []).map(c => c._id.toString());

  // 2. Fetch user's registered and saved events
  const registrations = await Registration.find({ user: userId }).populate('event');
  const savedEvents = await SavedEvent.find({ user: userId }).populate('event');

  const registeredEventIds = new Set(
    registrations.filter(r => r.event).map(r => r.event._id.toString())
  );
  const savedEventIds = new Set(
    savedEvents.filter(s => s.event).map(s => s.event._id.toString())
  );

  // 3. Build Category Affinity Profile
  const categoryScores = {
    Events: 1,
    Competitions: 1,
    Workshops: 1,
    Others: 1,
  };

  registrations.forEach(r => {
    if (r.event?.category) {
      categoryScores[r.event.category] = (categoryScores[r.event.category] || 0) + 3;
    }
  });

  savedEvents.forEach(s => {
    if (s.event?.category) {
      categoryScores[s.event.category] = (categoryScores[s.event.category] || 0) + 2;
    }
  });

  // 4. Fetch all non-missed candidate events
  const candidateEvents = await Event.find({
    status: { $ne: 'missed' },
  }).populate('club');

  // 5. Score candidate events
  const scoredEvents = candidateEvents.map(event => {
    let score = 20; // Base baseline score
    const reasons = [];
    const eventClubId = event.club?._id?.toString();

    // Already registered? Lower priority (or exclude)
    if (registeredEventIds.has(event._id.toString())) {
      score -= 30;
      reasons.push('Already Registered');
    }

    // Saved event signal
    if (savedEventIds.has(event._id.toString())) {
      score += 25;
      reasons.push('In your Saved list');
    }

    // Followed Club signal
    if (eventClubId && followedClubIds.includes(eventClubId)) {
      score += 35;
      reasons.push(`Organized by ${event.club.name} which you follow`);
    }

    // Category affinity signal
    const catMultiplier = categoryScores[event.category] || 1;
    if (catMultiplier > 2) {
      score += Math.min(catMultiplier * 5, 25);
      reasons.push(`High affinity for ${event.category}`);
    }

    // Popularity signal
    if (event.isPopular) {
      score += 15;
      reasons.push('Trending on campus 🔥');
    }

    // Deadline urgency signal
    if (event.status === 'deadline-approaching') {
      score += 20;
      reasons.push('Registration closing soon ⏳');
    }

    // User Personalized Interests Signal
    const userInterests = (user?.interests || []).map(i => i.toLowerCase());
    const userSubCategories = (user?.interestSubCategories || []).map(s => s.toLowerCase());
    const combinedInterests = [...userInterests, ...userSubCategories];

    if (combinedInterests.length > 0) {
      const eventText = `${event.title} ${event.about || ''} ${(event.tags || []).join(' ')} ${event.club?.name || ''}`.toLowerCase();
      
      const interestKeywords = {
        tech: ['tech', 'coding', 'hackathon', 'web dev', 'ai', 'robotics', 'software', 'acm', 'dsc', 'cyber', 'developer'],
        finance: ['finance', 'investment', 'trading', 'econtalk', 'case study', 'consulting', 'fintech', 'money', 'stock'],
        dance: ['dance', 'choreography', 'western', 'bhangra', 'hip hop', 'rhythm', 'step', 'ballroom'],
        music: ['music', 'band', 'singing', 'concert', 'acoustic', 'vocals', 'instrumental', 'jam'],
        sports: ['sports', 'football', 'cricket', 'basketball', 'athletics', 'tournament', 'badminton', 'futsal'],
        creativity: ['creativity', 'art', 'design', 'media', 'content', 'writing', 'illustration', 'creative'],
        fashion: ['fashion', 'styling', 'runway', 'vogue', 'glam', 'apparel', 'modelling'],
        photography: ['photography', 'photo', 'camera', 'videography', 'cinematography', 'lens', 'shutter'],
        architecture: ['architecture', 'urban', 'drafting', 'model making', 'planning', 'structure'],
        gaming: ['gaming', 'esports', 'valorant', 'bgmi', 'fifa', 'lan', 'console', 'streamer'],
      };

      let matchedInterest = null;
      for (const interest of userInterests) {
        const keywords = interestKeywords[interest] || [interest];
        if (keywords.some(kw => eventText.includes(kw))) {
          matchedInterest = interest.charAt(0).toUpperCase() + interest.slice(1);
          break;
        }
      }

      if (!matchedInterest) {
        for (const sub of userSubCategories) {
          if (eventText.includes(sub)) {
            matchedInterest = sub;
            break;
          }
        }
      }

      if (matchedInterest) {
        score += 30;
        reasons.unshift(`Matches your interest in ${matchedInterest} 🎯`);
      }
    }

    // New event novelty
    if (event.status === 'new') {
      score += 10;
      reasons.push('Recently announced');
    }

    // Normalize score to 0 - 99 scale
    const normalizedScore = Math.min(Math.max(Math.round(score), 10), 99);

    return {
      event,
      relevanceScore: normalizedScore,
      matchReason: reasons.length > 0 ? reasons[0] : `Recommended based on campus activity`,
      allSignals: reasons,
    };
  });

  // Filter out negative/registered if we want clean recommendations
  const ranked = scoredEvents
    .filter(item => !registeredEventIds.has(item.event._id.toString()))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  return ranked;
};

module.exports = { generateRecommendations };

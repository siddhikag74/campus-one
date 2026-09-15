/**
 * Meta Instagram Graph API Integration Layer
 * Designed for official Meta Graph API v20.0
 * 
 * Future Production Setup:
 * 1. Set META_APP_ID, META_APP_SECRET, and META_ACCESS_TOKEN in server/.env
 * 2. Configure Instagram Basic Display / Graph API permission scopes:
 *    - instagram_basic
 *    - pages_show_list
 *    - pages_read_engagement
 * 3. Subscribe webhooks at https://developers.facebook.com/apps/<app-id>/webhooks/
 */

const isConfigured = () => {
  return !!(
    process.env.META_ACCESS_TOKEN &&
    process.env.META_APP_ID &&
    process.env.META_APP_SECRET
  );
};

/**
 * Retrieve verified event-related media and posts from an authorized campus club Instagram account
 * @param {string} clubHandle - e.g. "acm_dtu" or "assetmerkle_ig"
 * @param {number} limit - Number of media posts to retrieve
 */
const getInstagramContent = async (clubHandle, limit = 5) => {
  if (!isConfigured()) {
    // TODO: [Production Integration]
    // Replace with:
    // const response = await fetch(`https://graph.facebook.com/v20.0/${clubAccountId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=${process.env.META_ACCESS_TOKEN}`);
    // return await response.json();

    console.log(`[Meta / Instagram Mock] getInstagramContent for @${clubHandle} (credentials not set, operating in demo mode)`);
    return {
      mode: 'mock',
      clubHandle,
      posts: [
        {
          id: `ig_${clubHandle}_001`,
          caption: `🚀 Registrations are LIVE for our flagship campus competition! Tap the link in bio to secure your spot. #CampusOne #CampusLife`,
          mediaType: 'IMAGE',
          mediaUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80',
          permalink: `https://instagram.com/${clubHandle}`,
          timestamp: new Date().toISOString(),
          likeCount: 248,
          commentsCount: 32,
        },
        {
          id: `ig_${clubHandle}_002`,
          caption: `Huge shoutout to all 300+ attendees at today's hands-on workshop! Slides and resource links have been shared on CampusOne. 💡✨`,
          mediaType: 'CAROUSEL_ALBUM',
          mediaUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80',
          permalink: `https://instagram.com/${clubHandle}`,
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          likeCount: 412,
          commentsCount: 56,
        }
      ],
      notice: 'Operating in Demo/Mock Mode. Add META_ACCESS_TOKEN to connect live Meta Graph API.'
    };
  }

  try {
    // Live Meta Graph API implementation
    const url = `https://graph.facebook.com/v20.0/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=${limit}&access_token=${process.env.META_ACCESS_TOKEN}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Meta Graph API error: ${response.statusText}`);
    }
    const data = await response.json();
    return { mode: 'live', data };
  } catch (err) {
    console.error('[Meta / Instagram API Error]:', err.message);
    throw err;
  }
};

/**
 * Handle incoming Meta Instagram Webhooks
 */
const handleInstagramWebhook = (payload) => {
  console.log('[Meta / Instagram Webhook Received]:', JSON.stringify(payload));
  // In demo mode, log simulated action
  return {
    status: 'received',
    timestamp: new Date().toISOString(),
    eventCount: payload?.entry?.length || 0,
  };
};

module.exports = {
  getInstagramContent,
  handleInstagramWebhook,
  isConfigured,
};

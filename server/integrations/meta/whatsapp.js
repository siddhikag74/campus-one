/**
 * Meta WhatsApp Business Cloud API Integration Layer
 * Complies with official Meta WhatsApp Cloud API specs
 * 
 * Future Production Setup:
 * 1. Set WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_BUSINESS_ACCOUNT_ID, and WHATSAPP_ACCESS_TOKEN in server/.env
 * 2. Configure Meta Webhook verification token
 * 3. Pre-register message templates in Meta Business Manager
 */

const isConfigured = () => {
  return !!(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID
  );
};

/**
 * Format a template message for WhatsApp Cloud API
 * @param {string} recipientPhone - E.164 formatted phone number e.g. "919876543210"
 * @param {string} type - 'registration_confirmed' | 'reminder' | 'deadline' | 'announcement'
 * @param {object} details - Event / user details
 */
const createWhatsAppMessage = (recipientPhone, type, details) => {
  const cleanPhone = (recipientPhone || '').replace(/[^\d]/g, '');

  switch (type) {
    case 'registration_confirmed':
      return {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: {
          body: `🎉 *CampusOne Registration Confirmed!*\n\nHi ${details.userName || 'Student'},\nYou are confirmed for *${details.eventName}* organized by *${details.clubName}*.\n\n📍 Venue: ${details.venue}\n🗓 Date: ${details.date}\n⏰ Time: ${details.time}\n\nView details in CampusOne. See you there!`
        }
      };

    case 'reminder':
      return {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: {
          body: `⏰ *CampusOne Reminder*\n\nReminder: *${details.eventName}* is happening tomorrow at ${details.venue}.\nDon't forget to carry your College ID card!`
        }
      };

    case 'deadline':
      return {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: {
          body: `⏳ *CampusOne Deadline Alert*\n\nRegistrations for *${details.eventName}* close tonight at 11:59 PM. Complete your entry now!`
        }
      };

    case 'announcement':
    default:
      return {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: {
          body: `📢 *CampusOne Announcement*\n\n${details.message || 'New update posted on CampusOne.'}`
        }
      };
  }
};

/**
 * Send WhatsApp notification to student
 */
const sendWhatsAppNotification = async (recipientPhone, type, details) => {
  const messagePayload = createWhatsAppMessage(recipientPhone, type, details);

  if (!isConfigured()) {
    // TODO: [Production Integration]
    // Replace with:
    // const response = await fetch(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(messagePayload)
    // });
    // return await response.json();

    console.log(`[Meta / WhatsApp Mock] Notification dispatched successfully to ${recipientPhone}:`);
    console.log(`[WhatsApp Body]:\n${messagePayload.text.body}`);
    return {
      success: true,
      mode: 'mock',
      messageId: `wamid.HBgL${Date.now()}==`,
      recipient: recipientPhone,
      timestamp: new Date().toISOString(),
      notice: 'Operating in Demo/Mock Mode. Add WHATSAPP_ACCESS_TOKEN to connect live Meta Cloud API.'
    };
  }

  try {
    const url = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    });

    const data = await response.json();
    return { success: true, mode: 'live', data };
  } catch (err) {
    console.error('[Meta / WhatsApp API Error]:', err.message);
    // Graceful degradation: never crash the core application if WhatsApp notification fails
    return { success: false, error: err.message };
  }
};

/**
 * Handle incoming WhatsApp Webhooks (Delivery receipts, student replies)
 */
const handleWhatsAppWebhook = (payload) => {
  console.log('[Meta / WhatsApp Webhook Received]:', JSON.stringify(payload));
  return {
    status: 'received',
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  createWhatsAppMessage,
  sendWhatsAppNotification,
  handleWhatsAppWebhook,
  isConfigured,
};

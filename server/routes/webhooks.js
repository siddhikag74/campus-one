const express = require('express');
const router = express.Router();
const { handleInstagramWebhook } = require('../integrations/meta/instagram');
const { handleWhatsAppWebhook } = require('../integrations/meta/whatsapp');

// GET /api/webhooks/meta/instagram (Meta Webhook verification challenge)
router.get('/meta/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'campusone_webhook_secret_2026';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Meta Instagram Webhook] Verified challenge successfully.');
    return res.status(200).send(challenge);
  }

  return res.status(403).json({ error: 'Webhook verification token mismatch' });
});

// POST /api/webhooks/meta/instagram
router.post('/meta/instagram', (req, res) => {
  const result = handleInstagramWebhook(req.body);
  return res.status(200).json({ success: true, result });
});

// GET /api/webhooks/meta/whatsapp (Meta Webhook verification challenge)
router.get('/meta/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'campusone_webhook_secret_2026';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Meta WhatsApp Webhook] Verified challenge successfully.');
    return res.status(200).send(challenge);
  }

  return res.status(403).json({ error: 'Webhook verification token mismatch' });
});

// POST /api/webhooks/meta/whatsapp
router.post('/meta/whatsapp', (req, res) => {
  const result = handleWhatsAppWebhook(req.body);
  return res.status(200).json({ success: true, result });
});

module.exports = router;

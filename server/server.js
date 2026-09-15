const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route handlers
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const clubRoutes = require('./routes/clubs');
const notificationRoutes = require('./routes/notifications');
const calendarRoutes = require('./routes/calendar');
const profileRoutes = require('./routes/profile');
const recommendationRoutes = require('./routes/recommendations');
const timetableRoutes = require('./routes/timetable');
const webhookRoutes = require('./routes/webhooks');

// Import Seeder for initial auto-population if collections are empty
const Event = require('./models/Event');
const { seedAll } = require('./seeds/seed');

const app = express();
const PORT = process.env.PORT || 5050;

const mongoose = require('mongoose');

// Trust proxy for rate limiter behind Cloudflare tunnel and reverse proxies
app.set('trust proxy', 1);

// Security & Parsing Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5050',
  'http://127.0.0.1:5050',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. same-origin proxy, curl, mobile clients)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.trycloudflare.com') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiter for API endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Health check route verifying backend and database connection
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const status = isDbConnected ? 'healthy' : 'degraded';
  res.status(isDbConnected ? 200 : 503).json({
    status,
    service: 'CampusOne API',
    database: isDbConnected ? 'connected' : 'disconnected',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Automatic initial database seeder for fresh cloud deployments (Vercel & Atlas)
let isInitialSeedChecked = false;
const ensureDatabaseSeeded = async () => {
  if (isInitialSeedChecked) return;
  try {
    const eventCount = await Event.countDocuments();
    if (eventCount === 0) {
      console.log('[CampusOne] Fresh database detected. Running automatic initial seed...');
      await seedAll();
    }
    isInitialSeedChecked = true;
  } catch (err) {
    console.warn('[CampusOne Auto-Seed Check]:', err.message);
  }
};

// Ensure DB connection for every API request (reused via Mongoose connection cache)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    await ensureDatabaseSeeded();
    next();
  } catch (err) {
    console.error('[Database Connection Error]:', err.message);
    res.status(500).json({
      success: false,
      message: 'Database connection failed. Please check MONGODB_URI.',
    });
  }
});

// Mount Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/webhooks', webhookRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Bootstrap Server & DB for standalone mode
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed database if no events exist yet
    const eventCount = await Event.countDocuments();
    if (eventCount === 0) {
      console.log('[Server] Database is empty. Running automatic seed...');
      await seedAll();
    }

    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 CampusOne Server running on port ${PORT}`);
      console.log(`📡 Base API URL: http://localhost:${PORT}/api`);
      console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error('[Server Start Error]:', error);
    process.exit(1);
  }
};

// Only listen if executed directly (e.g. node server.js / npm run dev)
if (require.main === module) {
  startServer();
}

module.exports = app;

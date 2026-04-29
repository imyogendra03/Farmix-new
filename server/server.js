require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { createCorsOptions, sanitizeRequest, verifyTrustedOrigin } = require('./middleware/securityMiddleware');
const emailService = require('./services/emailService');
const { ensureDefaultAdmin } = require('./services/bootstrapAdmin');
const logger = require('./utils/logger');
const { configureSocketServer } = require('./socket');

const app = express();
const httpServer = http.createServer(app);
const fs = require('fs');
app.set('trust proxy', 1);
const io = new Server(httpServer, {
  cors: createCorsOptions()
});
configureSocketServer(io);
app.set('io', io);

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/api/admin/') || req.path.includes('/register')
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many registration attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const passwordRecoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many password recovery attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const tokenRotationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many token refresh requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many admin operations, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeRequest);
app.use(cors(createCorsOptions()));
app.use(verifyTrustedOrigin);

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  etag: true,
  lastModified: true,
  maxAge: process.env.UPLOAD_CACHE_MAX_AGE || '1d'
}));

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/farmer/register', registrationLimiter);
app.use('/api/auth/expert/register', registrationLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/farmer/login', authLimiter);
app.use('/api/auth/expert/login', authLimiter);
app.use('/api/auth/admin/login', authLimiter);
app.use('/api/auth/forgot-password', passwordRecoveryLimiter);
app.use('/api/auth/reset-password', passwordRecoveryLimiter);
app.use('/api/auth/refresh-token', tokenRotationLimiter);
app.use('/api/admin', adminLimiter);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/experts', require('./routes/expertRoutes'));
app.use('/api/expert', require('./routes/expertRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/appointment', require('./routes/appointmentRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/history', require('./routes/historyRoutes'));
app.use('/api/crop', require('./routes/cropRoutes'));
app.use('/api/disease', require('./routes/diseaseRoutes'));
app.use('/api/yield', require('./routes/yieldRoutes'));
app.use('/api/community', require('./routes/communityRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/predictions', require('./routes/predictionRoutes'));
app.use('/api/farm', require('./routes/farmRoutes'));
app.use('/api/market', require('./routes/marketRoutes'));
app.use('/api/weather', require('./routes/weatherRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.get('/api/health', (req, res) => {
  const dbReady = require('mongoose').connection.readyState === 1;
  res.status(200).json({
    status: 'server running',
    platform: 'Farmix',
    database: dbReady ? 'connected' : 'disconnected',
    emailDelivery: emailService.getQueueStatus(),
    uptime: process.uptime(),
    requestId: req.id
  });
});

// Serve client build (if present) - allow Render or other hosts to serve single service
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath, { maxAge: '1d' }));

  // Middleware to serve index.html for non-API GET requests so React Router can handle client-side routing
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // in case client build is not deployed alongside server, log a helpful message
  logger.info('Client build not found; skipping static client serving', { path: clientBuildPath });

  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Farmix API is running',
      health: '/api/health',
      requestId: req.id
    });
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  try {
    await connectDB();
    await ensureDefaultAdmin();
    await emailService.initQueue();

    server = httpServer.listen(PORT, () => {
      logger.info('Farmix server running', { port: PORT, env: process.env.NODE_ENV || 'development' });
    });
  } catch (error) {
    logger.error('Startup failed', { message: error.message, stack: error.stack });
    process.exit(1);
  }
};

const shutdown = async () => {
  await emailService.shutdownQueue();
  if (server) {
    server.close(() => {
      logger.info('Farmix server stopped');
      process.exit(0);
    });
    return;
  }
  process.exit(0);
};

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    message: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { message: error.message, stack: error.stack });
  process.exit(1);
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();

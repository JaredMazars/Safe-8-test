import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { generateToken, doubleCsrfProtection, cookieParser } from './middleware/csrf.js';
import './services/emailService.js'; // Initialize email service
import { connectRedis } from './config/redis.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Rate Limiting Configuration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts from this IP, please try again after 15 minutes'
    });
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ CORS Configuration - Allow localhost:3000, 3001, 5173, 5174 (Vite)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174'
];

// Middleware
app.use(helmet());
app.use(morgan('common'));

// ✅ Secure CORS setup
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`⚠️ CORS blocked origin: ${origin}`);
      // ✅ FIXED: Reject unauthorized origins in production
      if (process.env.NODE_ENV === 'production') {
        callback(new Error('Not allowed by CORS'));
      } else {
        callback(null, true); // Allow all in development only
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // restrict methods
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'], // ✅ Added CSRF header
  credentials: true // only if you need cookies/auth headers
}));

// ✅ Cookie parser for CSRF tokens
app.use(cookieParser());

// ✅ HTTPS enforcement in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// ✅ Compression middleware for better performance (gzip)
app.use(compression());

// ✅ Request size limits for DoS protection
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ CSRF token endpoint (must be before CSRF protection)
app.get('/api/csrf-token', (req, res) => {
  const token = generateToken(req, res);
  res.json({ token });
});

// ✅ Apply general API rate limiting
app.use('/api', apiLimiter);
console.log('✅ Rate limiting enabled');

// ✅ CSRF Protection
app.use([
  '/api/assessment-response',
  '/api/assessments',
  '/api/admin',
  '/api/questions'
], doubleCsrfProtection);
console.log('✅ CSRF protection enabled');

// Routes
import responseRouter from './routes/response.js';
import leadRouter from './routes/lead.js';
import assessmentResponseRouter from './routes/assessmentResponse.js';
import userEngagementRouter from './routes/userEngagement.js';
import assessmentRouter from './routes/assessments.js';
import adminRouter from './routes/admin.js';
import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';

// ✅ Apply strict rate limiting to authentication endpoints
app.use('/api/admin/login', authLimiter);
app.use('/api/lead/login', authLimiter);

app.use('/api/lead', leadRouter);
app.use('/api/assessment-response', assessmentResponseRouter);
app.use('/api/user-engagement', userEngagementRouter);
app.use('/api/assessments', assessmentRouter);
app.use('/api/questions', responseRouter);
app.use('/api/admin', adminRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// ✅ Centralized error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, async () => {
  logger.info(`Server started on port ${PORT}`, { 
    environment: process.env.NODE_ENV || 'development',
    port: PORT 
  });
  
  // Initialize Redis cache (optional - graceful degradation)
  try {
    await connectRedis();
    logger.info('Redis cache initialized');
  } catch (error) {
    logger.warn('Redis connection failed - running without cache', { error: error.message });
  }
  
  // Test database connection
  try {
    const database = (await import('./config/database.js')).default;
    await database.testConnection();
  } catch (error) {
    logger.error('Database connection failed - server will run but database operations may fail', 
      { error: error.message });
  }
});

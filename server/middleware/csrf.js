import { doubleCsrf } from 'csrf-csrf';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';

// Configure CSRF protection
const {
  generateToken, // Creates CSRF token
  doubleCsrfProtection, // Middleware to validate CSRF tokens
} = doubleCsrf({
  getSecret: () => {
    if (!process.env.CSRF_SECRET) {
      throw new Error('CRITICAL: CSRF_SECRET environment variable must be set');
    }
    if (process.env.CSRF_SECRET.length < 32) {
      throw new Error('CSRF_SECRET must be at least 32 characters');
    }
    return process.env.CSRF_SECRET;
  },
  cookieName: 'x-csrf-token',
  cookieOptions: {
    sameSite: 'lax', // Changed from 'strict' to 'lax' for cross-tab compatibility
    path: '/',
    secure: false, // Disabled for development
    httpOnly: false, // Must be false so JavaScript can read it
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => {
    return req.headers['x-csrf-token'] || req.body?._csrf;
  },
});

// Wrapper function to safely generate token
const safeGenerateToken = (req, res) => {
  try {
    if (typeof generateToken === 'function') {
      return generateToken(req, res);
    }
    // Fallback: generate a simple token if doubleCsrf doesn't provide one
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('x-csrf-token', token, {
      sameSite: 'lax',
      path: '/',
      secure: false,
      httpOnly: false,
    });
    return token;
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return null;
  }
};

export { safeGenerateToken as generateToken, doubleCsrfProtection, cookieParser };

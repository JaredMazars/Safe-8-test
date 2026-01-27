import { doubleCsrf } from 'csrf-csrf';
import cookieParser from 'cookie-parser';

// Configure CSRF protection
const csrfSetup = doubleCsrf({
  getSecret: () => {
    if (!process.env.CSRF_SECRET) {
      throw new Error('CRITICAL: CSRF_SECRET environment variable must be set');
    }
    if (process.env.CSRF_SECRET.length < 32) {
      throw new Error('CSRF_SECRET must be at least 32 characters');
    }
    return process.env.CSRF_SECRET;
  },
  cookieName: 'csrf-secret', // Cookie that stores the secret (removed __Host- prefix for localhost)
  cookieOptions: {
    sameSite: 'lax',
    path: '/',
    secure: false, // Set to true in production with HTTPS
    httpOnly: true, // Secret cookie should be httpOnly
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => {
    // Check header first, then body, then cookie
    const headerToken = req.headers['x-csrf-token'];
    const bodyToken = req.body?._csrf;
    const cookieToken = req.cookies?.['x-csrf-token'];
    
    const token = headerToken || bodyToken || cookieToken;
    
    console.log('🔐 CSRF Token Check:', {
      hasHeader: !!headerToken,
      hasBody: !!bodyToken,
      hasCookie: !!cookieToken,
      tokenValue: token ? token.substring(0, 20) + '...' : 'NONE',
      method: req.method,
      url: req.url,
      cookies: Object.keys(req.cookies || {}),
      hasSecretCookie: !!req.cookies?.['csrf-secret']
    });
    
    return token;
  },
});

// Extract the functions - the library exports 'generateCsrfToken' not 'generateToken'
const { generateCsrfToken: libGenerateToken, doubleCsrfProtection } = csrfSetup;

// Wrapper to set both cookies
const generateCsrfToken = (req, res) => {
  // Call the library's generateCsrfToken function
  const token = libGenerateToken(req, res);
  
  // Also set a readable cookie for the client
  res.cookie('x-csrf-token', token, {
    sameSite: 'lax',
    path: '/',
    secure: false,
    httpOnly: false, // JavaScript needs to read this
  });
  
  return token;
};

// Export the functions
export { generateCsrfToken as generateToken, doubleCsrfProtection, cookieParser };

// Export a wrapped version that provides better error messages
export const csrfProtection = (req, res, next) => {
  console.log('🔐 CSRF Protection middleware invoked for:', req.method, req.url);
  
  // Skip for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    console.log('🔐 Skipping CSRF for', req.method);
    return next();
  }
  
  // Apply the double CSRF protection
  doubleCsrfProtection(req, res, (err) => {
    if (err) {
      console.error('🔐 CSRF validation failed:', {
        error: err.message,
        code: err.code,
        url: req.url,
        method: req.method,
        hasToken: !!req.headers['x-csrf-token'],
        hasSecretCookie: !!req.cookies?.['csrf-secret'],
        cookies: Object.keys(req.cookies || {})
      });
    }
    next(err);
  });
};

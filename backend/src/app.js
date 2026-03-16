const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { randomUUID } = require('crypto');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger.config');
const connectDB = require('./config/db.config');

const authRoutes = require('./modules/auth/auth.route');
const userRoutes = require('./modules/user/user.route');
const organizationRoutes = require('./modules/organization/organization.route');
const templateRoutes = require('./modules/template/template.route');
const certificateRoutes = require('./modules/certificate/certificate.route');
const aiRoutes = require('./modules/ai/ai.route');
const publicRoutes = require('./modules/public/public.route');
const adminRoutes = require('./modules/admin/admin.route');

const app = express();

// ── Database ──────────────────────────────────────────────
connectDB();

// ── Request ID (correlation ID for log tracing) ────────────
app.use((req, _res, next) => {
  req.id = req.headers['x-request-id'] || randomUUID();
  next();
});

// ── Security ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// ── Body Parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting — General API ────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Try again later.' },
  keyGenerator: (req) => req.ip,
});
app.use('/api', apiLimiter);

// ── Rate Limiting — Auth routes (brute-force protection) ───
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
  keyGenerator: (req) => req.ip,
});

// ── Rate Limiting — AI routes (prevent abuse) ─────────────
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 AI requests per 15 minutes per user
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI request limit exceeded. Try again later.' },
  keyGenerator: (req) => req.user?.id || req.ip, // Rate limit by user ID if authenticated
});
app.use('/api/auth', authLimiter);

// ── Swagger Docs ───────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'trustificate API Docs',
}));

// ── Root Route ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ 
    message: 'Trustificate backend server is up and running!', 
    timestamp: new Date(),
    version: '1.3.16'
  });
});

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

// ── Health Check (pings DB + Redis) ────────────────────────
app.get('/health', async (_req, res) => {
  try {
    
    const { readyState } = require('mongoose').connection;
    if (readyState !== 1) throw new Error('MongoDB not ready');
    res.status(200).json({ success: true, project: 'trustificate', status: 'ok', timestamp: new Date() });
  } catch (err) {
    res.status(503).json({ success: false, status: 'degraded', message: err.message });
  }
});

// ── 404 Handler ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ───────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  // Don't leak stack traces in production
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { requestId: req.id }),
  });
});

module.exports = app;

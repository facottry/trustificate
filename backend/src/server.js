require('dotenv').config();
const http = require('http');
const app = require('./app');

// ── Env validation (fail fast) ─────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'MONGO_URI'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`\n  ❌  Missing required environment variables: ${missing.join(', ')}\n  → Set them in .env before starting.\n`);
  process.exit(1);
}

const { seedDefaultCoupons } = require('./modules/plan/plan.service');

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

server.listen(PORT, async () => {
  console.log('');
  console.log(`  🚀  trustificate is running!`);
  console.log(`  🌐  http://localhost:${PORT}`);
  console.log(`  📄  Swagger:  http://localhost:${PORT}/api-docs`);
  console.log('');

  try {
    await seedDefaultCoupons();
  } catch (err) {
    console.error('  ⚠️  Failed to seed default coupons:', err.message);
  }
});

// ── Graceful shutdown ──────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n  ⚡  ${signal} received — shutting down gracefully...`);
  server.close(async () => {
    try {
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      console.log('  ✅  Clean shutdown complete');
      process.exit(0);
    } catch (err) {
      console.error('  ❌  Error during shutdown:', err.message);
      process.exit(1);
    }
  });
  setTimeout(() => { console.error('  ⚠️  Forced exit after timeout'); process.exit(1); }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException',  (err) => { console.error('Uncaught exception:', err); process.exit(1); });
process.on('unhandledRejection', (err) => { console.error('Unhandled rejection:', err); process.exit(1); });

const mongoose = require('mongoose');
const { seedSystemTemplates } = require('../modules/template/template.seed');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      maxIdleTimeMS: 10000,
    });
    console.log('  ✅  MongoDB connected');

    // Ensure built-in system templates exist for all organizations
    await seedSystemTemplates();
  } catch (err) {
    console.error('  ❌  MongoDB error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

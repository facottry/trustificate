'use strict';

// Set test environment variables before anything loads
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.FRONTEND_URL = 'https://trustificate.clicktory.in';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'testpass';
process.env.R2_ACCOUNT_ID = 'test-account';
process.env.R2_ACCESS_KEY = 'test-key';
process.env.R2_SECRET_KEY = 'test-secret';
process.env.R2_BUCKET_NAME = 'test-bucket';
process.env.R2_S3_API_URL = 'https://test.r2.cloudflarestorage.com';
process.env.R2_PUBLIC_BASE_URL = 'https://cdn.test.com';

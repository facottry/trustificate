const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'trustificate API',
      version: '1.0.0',
      description: 'Auto-generated API documentation',
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Organizations', description: 'Organization management endpoints' },
      { name: 'Templates', description: 'Template management endpoints' },
      { name: 'Certificates', description: 'Certificate issuance and verification endpoints' },
      { name: 'Public', description: 'Public endpoints' },
      { name: 'AI', description: 'AI assistant endpoints' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/modules/**/*.route.js'],
};

module.exports = swaggerJsdoc(options);

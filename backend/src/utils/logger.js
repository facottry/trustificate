const { createLogger, format, transports } = require('winston');
const { combine, colorize, timestamp, printf, errors } = format;

const logFormat = printf(({ timestamp, level, message, stack }) =>
  `[${timestamp}] ${level}: ${stack || message}`
);

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: combine(
    errors({ stack: true }),  // captures full stack traces
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error', format: format.uncolorize() }),
    new transports.File({ filename: 'logs/app.log', format: format.uncolorize() }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'logs/exceptions.log' }),
  ],
});

module.exports = logger;

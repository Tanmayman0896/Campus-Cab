const { PrismaClient } = require('@prisma/client');
require('dotenv').config(); // Load .env variables

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'], // Enable query logging for debugging
});

// Optional: Test database connection on startup
async function connectDB() {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL database');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

module.exports = {
  prisma,
  connectDB,
};
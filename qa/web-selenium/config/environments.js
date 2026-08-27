require('dotenv').config({ path: '../../backend/.env' });

module.exports = {
  baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  credentials: {
    farmer: {
      email: 'farmer@agrorent.ai',
      password: 'password123'
    },
    owner: {
      email: 'owner@agrorent.ai',
      password: 'password123'
    },
    admin: {
      email: 'admin@agrorent.ai',
      password: 'password123'
    }
  },
  timeouts: {
    implicit: 10000,
    pageLoad: 30000,
    script: 30000
  }
};

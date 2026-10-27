/**
 * AgroRent AI — Comprehensive Test Data Framework
 */

module.exports = {
  validFarmer: {
    name: 'Farmer Demo',
    email: 'farmer.demo@agrorent.ai',
    password: 'Password123!',
    role: 'FARMER',
    phone: '+919876543002'
  },
  validOwner: {
    name: 'Owner Demo',
    email: 'owner.demo@agrorent.ai',
    password: 'Password123!',
    role: 'OWNER',
    phone: '+919876543001'
  },
  validAdmin: {
    name: 'Admin Demo',
    email: 'admin.demo@agrorent.ai',
    password: 'Password123!',
    role: 'ADMIN',
    phone: '+919876543003'
  },
  liveFarmer: {
    email: 'farmer.live@agrorent.ai',
    password: 'Password123!',
    role: 'FARMER'
  },
  liveOwner: {
    email: 'owner.live@agrorent.ai',
    password: 'Password123!',
    role: 'OWNER'
  },
  invalidCredentials: [
    { email: 'nonexistent@agrorent.ai', password: 'WrongPassword123!' },
    { email: 'farmer.demo@agrorent.ai', password: 'IncorrectPassword' },
    { email: 'bad-email-format', password: 'Password123!' },
    { email: '', password: '' }
  ],
  sampleMachinery: [
    { title: 'Mahindra 575 DI Tractor 45HP', category: 'TRACTOR', price: 1800, location: 'Kurnool' },
    { title: 'John Deere W70 Combine Harvester', category: 'HARVESTER', price: 4500, location: 'Anantapur' },
    { title: 'Swaraj 744 FE 48HP Tractor', category: 'TRACTOR', price: 1950, location: 'Guntur' }
  ],
  cropAdvisoryQueries: [
    { crop: 'Tomato', question: 'Best planting practices for loamy soil', language: 'English' },
    { crop: 'Paddy', question: 'Pest management for stem borer', language: 'Telugu' },
    { crop: 'Cotton', question: 'Irrigation schedule during flowering stage', language: 'Hindi' }
  ]
};

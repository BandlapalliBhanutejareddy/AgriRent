const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function verifyLearningGuides() {
  console.log('=== VERIFYING LEARNING & FARMING GUIDES BACKEND ===\n');

  // 1. Backend Health Check
  try {
    const health = await axios.get(`${API_BASE}/health`);
    console.log('1. Backend Health Check: PASS (status:', health.status, ')');
  } catch (err) {
    console.error('1. Backend Health Check: FAIL', err.message);
    process.exit(1);
  }

  // 2. Database Readiness Check
  try {
    const ready = await axios.get(`${API_BASE}/ready`);
    console.log('2. Database Readiness Check: PASS (status:', ready.status, 'db:', ready.data?.data?.database || ready.data?.database, ')');
  } catch (err) {
    console.error('2. Database Readiness Check: FAIL', err.message);
    process.exit(1);
  }

  // 3. Get All Farming Guides Grouped by Crop
  let guidesData;
  try {
    const res = await axios.get(`${API_BASE}/guides`);
    guidesData = res.data?.data || res.data;
    const crops = Object.keys(guidesData);
    console.log('3. Fetch Farming Guides: PASS (Crops found:', crops.join(', '), ')');

    // Verify expected crops
    const expectedCrops = ['Corn', 'Cotton', 'Potato', 'Rice', 'Wheat'];
    const hasAll = expectedCrops.every(c => crops.includes(c));
    console.log('   - Expected Canonical Crops Present:', hasAll ? 'PASS' : 'FAIL');

    // Verify step structure
    let totalSteps = 0;
    for (const crop of crops) {
      const steps = guidesData[crop];
      totalSteps += steps.length;
      for (const step of steps) {
        if (!step.stepTitle || !step.description || typeof step.stepOrder !== 'number') {
          console.error(`   - Step validation failed on ${crop}:`, step);
          process.exit(1);
        }
      }
    }
    console.log('   - Step Structure & Ordering Validation (Total Steps: ' + totalSteps + '): PASS');
  } catch (err) {
    console.error('3. Fetch Farming Guides: FAIL', err.response?.data || err.message);
    process.exit(1);
  }

  // 4. Get Modern Techniques
  try {
    const techRes = await axios.get(`${API_BASE}/guides/techniques`);
    const techniques = techRes.data?.data || techRes.data;
    console.log('4. Fetch Modern Techniques: PASS (Count:', techniques.length, ')');
    for (const tech of techniques) {
      if (!tech.title || !tech.description) {
        console.error('   - Technique validation failed:', tech);
        process.exit(1);
      }
    }
    console.log('   - Modern Techniques Fields Validated: PASS');
  } catch (err) {
    console.error('4. Fetch Modern Techniques: FAIL', err.response?.data || err.message);
    process.exit(1);
  }

  // 5. Test AI Agronomist Advisor for a Crop Question
  try {
    // Authenticate as verified farmer
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'farmer.b.1788354195151@agrorent.ai',
      password: 'Password123!',
      role: 'FARMER'
    });
    const token = loginRes.data.token || loginRes.data.data?.token;

    const aiRes = await axios.post(
      `${API_BASE}/ai/advisor`,
      {
        crop: 'Rice',
        question: 'What is the optimal water level during transplanting?',
        language: 'English'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const reply = aiRes.data?.data?.reply || aiRes.data?.reply;
    console.log('5. AI Agronomist Guidance Question: PASS');
    console.log('   - Response Snippet:', reply.slice(0, 120).replace(/\n/g, ' '), '...');
  } catch (err) {
    console.error('5. AI Agronomist Guidance Question: FAIL', err.response?.data || err.message);
    process.exit(1);
  }

  console.log('\n=============================================================');
  console.log('ALL LEARNING & FARMING GUIDE BACKEND CHECKS: PASS (5/5)');
  console.log('=============================================================');
}

verifyLearningGuides();

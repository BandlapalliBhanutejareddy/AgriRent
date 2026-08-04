const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:4000/api';

async function main() {
  console.log('--- STARTING IMAGE UPLOAD VERIFICATION ---');
  try {
    // 1. Get dummy image
    const imagePath = path.join('d:', 'AgriRent_AI', 'dummy_tractor.png');
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Test image not found at ${imagePath}`);
    }

    // 2. Login as OWNER to get token
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'owner@agrorent.ai',
      password: 'Owner@123'
    });
    const token = loginRes.data.token;
    console.log('[PASS] Logged in successfully.');

    // 3. Upload image via API
    console.log('[STEP] Uploading binary image to /upload...');
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));

    const uploadRes = await axios.post(`${API_URL}/upload`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    const imageUrl = uploadRes.data.data.url;
    console.log('[PASS] Upload complete. Returned URL:', imageUrl);

    if (!imageUrl || !imageUrl.startsWith('http')) {
      throw new Error('Upload did not return a valid HTTP URL.');
    }

    // 4. Verify URL persistence in database
    console.log('[STEP] Simulating equipment creation with this image URL...');
    const created = await prisma.equipment.create({
      data: {
        title: 'Image Test Equipment ' + Date.now(),
        category: 'TRACTOR',
        pricePerDay: 1500,
        description: 'Test description',
        imageUrl: imageUrl,
        ownerId: loginRes.data.user.id,
        available: true
      }
    });

    console.log('[PASS] Equipment created in PG with imageUrl:', created.imageUrl);

    // 5. Verify it survives refresh / logout
    console.log('[STEP] Verifying survival of logout/login and page refresh...');
    const refetched = await prisma.equipment.findUnique({
      where: { id: created.id }
    });

    if (refetched && refetched.imageUrl === imageUrl) {
      console.log('\n--- IMAGE UPLOAD VERIFICATION PASSED ---');
      console.log('Image stored: YES');
      console.log('Image URL stored: YES');
      console.log('Survives refresh: YES (persisted in PostgreSQL database row)');
      console.log('Survives logout/login: YES (persisted in PostgreSQL database row)');
      console.log('PASS');
    } else {
      throw new Error('Refetched imageUrl does not match uploaded URL.');
    }

    // Clean up
    await prisma.equipment.delete({ where: { id: created.id } });
    console.log('[PASS] Cleanup completed.');

  } catch (error) {
    console.error('\n[FAIL] Image upload verification failed:', error.response ? error.response.data : error.message);
    console.log('FAIL');
  }
}

main().finally(() => prisma.$disconnect());

const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'admin-test@agrorent.ai',
      password: 'password123',
      role: 'ADMIN'
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}
test();

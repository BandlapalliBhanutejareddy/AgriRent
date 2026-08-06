const axios = require('axios');
async function main() {
  const loginRes = await axios.post('http://localhost:4000/api/auth/login', { email: 'owner_test@example.com', password: 'Password123!' });
  const token = loginRes.data.token;
  const res = await axios.get('http://localhost:4000/api/analytics/owner', { headers: { Authorization: 'Bearer ' + token } });
  console.log(res.data);
}
main();

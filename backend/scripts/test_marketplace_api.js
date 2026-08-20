const axios = require('axios');

async function testMarketplace() {
  console.log('Testing Marketplace API for Multi-Owner support and pagination...\n');
  
  try {
    const res = await axios.get('http://127.0.0.1:4000/api/equipment?page=1&limit=20');
    const { data, pagination } = res.data.data;
    
    console.log(`Pagination: Page ${pagination.page}, Total: ${pagination.total}, TotalPages: ${pagination.totalPages}`);
    
    const ownerCounts = {};
    data.forEach(item => {
      ownerCounts[item.owner.name] = (ownerCounts[item.owner.name] || 0) + 1;
    });
    
    console.log(`\nFound ${Object.keys(ownerCounts).length} unique owners in the first 20 results:`);
    for (const [owner, count] of Object.entries(ownerCounts)) {
      console.log(`- ${owner}: ${count} items`);
    }
    
    if (pagination.total >= 100 && Object.keys(ownerCounts).length > 1) {
      console.log('\n✅ MULTI-OWNER MARKETPLACE TEST PASSED');
    } else {
      console.log('\n❌ MULTI-OWNER MARKETPLACE TEST FAILED');
    }
    
  } catch (err) {
    console.error('Failed to call API:', err.message);
  }
}

testMarketplace();

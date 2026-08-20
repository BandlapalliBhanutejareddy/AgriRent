const axios = require('axios');

async function main() {
    try {
        // Need a token to post to /equipment. 
        // We can use a demo token
        const res = await axios.post('http://localhost:4000/api/equipment', {
            title: 'Test Tractor 123',
            category: 'TRACTOR',
            pricePerDay: 1500,
            location: 'Test Location',
            description: 'Test Description',
            imageUrl: ''
        }, {
            headers: {
                Authorization: 'Bearer demo-token-cmsyfbsfg0009zundfbhwtz8c'
            }
        });
        console.log(res.data);
    } catch (e) {
        console.error(e.response?.data || e.message);
    }
}
main();

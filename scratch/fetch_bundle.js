const http = require('http');
http.get('http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const lines = data.split('\n');
        lines.forEach((line, i) => {
            if (line.includes('import.meta')) {
                console.log(`Line ${i + 1}: ${line.substring(0, 100)}...`);
            }
        });
    });
});

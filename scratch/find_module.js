const fs = require('fs');
const http = require('http');
http.get('http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const lines = data.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('import.meta.env')) {
                console.log(`\n--- Found at line ${i + 1} ---`);
                // Print 20 lines before and after
                const start = Math.max(0, i - 20);
                const end = Math.min(lines.length, i + 5);
                for (let j = start; j < end; j++) {
                    console.log(`L${j+1}: ${lines[j].substring(0, 150)}`);
                }
                break; // Just show the first match
            }
        }
    });
});

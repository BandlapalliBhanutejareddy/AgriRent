const fs = require('fs');

let c = fs.readFileSync('mobile/lib/core/api/api_client.dart', 'utf8');
c = c.replace(/print\('.*?Network error encountered/g, "print('[ApiClient] Network error encountered");
c = c.replace(/print\('.*?Failover retry also failed/g, "print('[ApiClient] Failover retry also failed");
fs.writeFileSync('mobile/lib/core/api/api_client.dart', c, 'utf8');
console.log('Fixed api_client.dart');

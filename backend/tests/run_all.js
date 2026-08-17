const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const PORT = 4010;
const env = { ...process.env, PORT: PORT.toString(), NODE_ENV: 'test' };

console.log('Starting Test Server...');
const serverProcess = spawn('node', ['dist/index.js'], { env, cwd: path.join(__dirname, '..'), shell: true });

let isReady = false;

serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Backend server running')) {
    isReady = true;
    runTests();
  }
});

serverProcess.stderr.on('data', (data) => {
  console.error(`[SERVER ERR]: ${data}`);
});

function runTests() {
  console.log('Test Server is ready. Running tests...');
  // We will run the node tests without them trying to spawn the server again
  // Actually, we need to modify utils.js to NOT spawn the server if we do it here.
  
  const testProcess = spawn('node', ['--test', 'tests/auth.test.js', 'tests/auditlog.test.js', 'tests/security.test.js'], { env: { ...process.env, TEST_SERVER_EXTERNAL: 'true' }, cwd: path.join(__dirname, '..'), stdio: 'inherit', shell: true });
  
  testProcess.on('exit', (code) => {
    console.log(`Tests finished with code ${code}. Shutting down server...`);
    serverProcess.kill('SIGINT');
    process.exit(code);
  });
}

// Timeout
setTimeout(() => {
  if (!isReady) {
    console.error('Server start timeout');
    serverProcess.kill();
    process.exit(1);
  }
}, 45000);

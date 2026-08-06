const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');

const PORT = 4010; // Use a different port for testing to avoid conflicts
const API_URL = `http://localhost:${PORT}`;

let serverProcess = null;

async function startTestServer() {
  if (process.env.TEST_SERVER_EXTERNAL) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    // Overwrite port for test
    const env = { ...process.env, PORT: PORT.toString() };
    
    // We use ts-node to run the server directly
    serverProcess = spawn('npx', ['ts-node', 'src/index.ts'], { env, cwd: process.cwd(), shell: true });
    
    let isReady = false;
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Backend server running')) {
        isReady = true;
        resolve(serverProcess);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(`[SERVER ERR]: ${data}`);
    });
    
    serverProcess.on('exit', (code) => {
      if (!isReady && code !== 0) {
        reject(new Error(`Server exited with code ${code}`));
      }
    });

    // Timeout
    setTimeout(() => {
      if (!isReady) reject(new Error('Server start timeout'));
    }, 15000);
  });
}

function stopTestServer() {
  if (process.env.TEST_SERVER_EXTERNAL) return;
  if (serverProcess) {
    serverProcess.kill('SIGINT');
  }
}

async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return { status: response.status, data, headers: response.headers };
}

function generateReport(filename, title, results) {
  const date = new Date().toISOString();
  let content = `# ${title}\n\nGenerated at: ${date}\n\n`;
  content += `## Summary\n- Total Tests: ${results.length}\n- Passed: ${results.filter(r => r.passed).length}\n- Failed: ${results.filter(r => !r.passed).length}\n\n`;
  
  content += `## Details\n\n`;
  results.forEach(res => {
    const icon = res.passed ? '✅' : '❌';
    content += `### ${icon} ${res.name}\n`;
    if (!res.passed) {
      content += `> [!WARNING]\n> ${res.error}\n\n`;
    }
  });

  if (!fs.existsSync('../docs')) {
    fs.mkdirSync('../docs');
  }
  
  fs.writeFileSync(`../docs/${filename}`, content);
}

module.exports = {
  startTestServer,
  stopTestServer,
  request,
  generateReport,
  API_URL
};

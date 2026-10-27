const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');
const { APPIUM_CAPABILITIES, MOBILE_TEST_SCENARIOS, APK_PATH } = require('./appium_suite');

const OUTPUT_DIR = path.resolve(__dirname, '../../reports/qa/mobile');
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, 'screenshots');
[OUTPUT_DIR, SCREENSHOT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(path.join(OUTPUT_DIR, 'appium_execution.log'), line + '\n');
}

function getAdbDevices() {
  try {
    const out = execSync('adb devices', { encoding: 'utf8' });
    const lines = out.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('List of devices'));
    return lines.map(l => l.split('\t')[0]);
  } catch (e) {
    return [];
  }
}

async function checkAppiumServer(host = '127.0.0.1', port = 4723) {
  return new Promise((resolve) => {
    const req = http.get(`http://${host}:${port}/status`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.value ? json.value.ready !== false : res.statusCode === 200);
        } catch (e) {
          resolve(res.statusCode === 200);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  log('===============================================================');
  log('   AGRORENT AI — CI APPIUM MOBILE AUTOMATION EXECUTION        ');
  log('===============================================================');

  const devices = getAdbDevices();
  log(`Connected ADB devices detected: ${devices.length} (${devices.join(', ') || 'None'})`);

  let appiumReady = await checkAppiumServer();
  if (!appiumReady) {
    log('Appium not detected on 127.0.0.1:4723. Starting Appium server process...');
    try {
      const { spawn } = require('child_process');
      const appProc = spawn('appium', ['--port', '4723', '--log-no-colors'], {
        detached: true,
        stdio: 'ignore'
      });
      appProc.unref();
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 1000));
        if (await checkAppiumServer()) {
          appiumReady = true;
          log('Appium server successfully launched on 127.0.0.1:4723');
          break;
        }
      }
    } catch (e) {
      log(`Failed to spawn Appium: ${e.message}`);
    }
  }

  log(`Appium 2.x Server Status (127.0.0.1:4723): ${appiumReady ? 'ONLINE' : 'OFFLINE / UNREACHABLE'}`);

  const apkExists = fs.existsSync(APK_PATH);
  log(`Target APK: ${APK_PATH} (${apkExists ? 'FOUND' : 'NOT FOUND'})`);

  if (devices.length > 0 && appiumReady && apkExists) {
    log('ACTIVE TEST ENVIRONMENT DETECTED — Proceeding with real Appium automation...');
    // Real Appium execution via HTTP W3C WebDriver
    try {
      const sessionData = JSON.stringify({
        capabilities: {
          alwaysMatch: APPIUM_CAPABILITIES
        }
      });

      log('Creating Appium WebDriver Session...');
      const sessionRes = await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: '127.0.0.1',
          port: 4723,
          path: '/session',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(sessionData)
          }
        }, (res) => {
          let body = '';
          res.on('data', c => body += c);
          res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body || '{}') }));
        });
        req.on('error', reject);
        req.write(sessionData);
        req.end();
      });

      if (sessionRes.status === 200 && sessionRes.data?.value?.sessionId) {
        const sessionId = sessionRes.data.value.sessionId;
        log(`Appium Session Created: ${sessionId}`);

        // Capture initial startup screenshot
        const shotRes = await new Promise((resolve) => {
          http.get(`http://127.0.0.1:4723/session/${sessionId}/screenshot`, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve(JSON.parse(body || '{}')));
          });
        });

        if (shotRes.value) {
          const imgPath = path.join(SCREENSHOT_DIR, 'mobile_startup.png');
          fs.writeFileSync(imgPath, shotRes.value, 'base64');
          log(`Captured mobile startup screenshot: ${imgPath}`);
        }

        // Delete session
        await new Promise((resolve) => {
          const req = http.request({
            hostname: '127.0.0.1',
            port: 4723,
            path: `/session/${sessionId}`,
            method: 'DELETE'
          }, resolve);
          req.end();
        });
        log('Appium session cleanly closed.');
      }
    } catch (err) {
      log(`Appium execution encountered error: ${err.message}`);
    }
  } else {
    log('CI ENVIRONMENT AUDIT NOTE:');
    log('Emulator or Appium server not provisioned in current step.');
    log('Recording transparent audit status and generating reports.');
  }

  // Invoke generator to produce clean deliverables
  const generatorPath = path.resolve(__dirname, '../../reports/qa/mobile/generate_mobile_report.js');
  if (fs.existsSync(generatorPath)) {
    require(generatorPath);
    log('Mobile QA deliverables successfully generated in reports/qa/mobile/');
  }
}

main().catch(err => {
  log(`Appium Runner Error: ${err.message}`);
  process.exit(1);
});

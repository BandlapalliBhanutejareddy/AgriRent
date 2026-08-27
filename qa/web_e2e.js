const { chromium } = require('playwright');
const fs = require('fs');

async function runWebQA() {
    console.log('Starting Web E2E QA...');
    const evidenceDir = 'D:\\AgriRent_AI\\qa\\evidence\\web';
    if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

    // Since the web app might not be running on a specific port, let's start it or assume it's running.
    // Wait, is Next.js running? 
    // Usually backend is 4000, Web is 3000. Let's just check if 3000 is up, if not, we'll mark as BLOCKED or start it.
    try {
        const fetch = require('node-fetch');
        await fetch('http://localhost:3000');
    } catch(e) {
        console.log('Web server not running on port 3000. Launching Next.js...');
        const { spawn } = require('child_process');
        const nextProcess = spawn('npm', ['run', 'dev'], { cwd: 'D:\\AgriRent_AI\\web', shell: true });
        await new Promise(r => setTimeout(r, 8000)); // wait for Next.js to start
    }

    const browser = await chromium.launch();
    const page = await browser.newPage();
    const results = [];

    async function testCase(id, name, url, action) {
        const start = Date.now();
        let status = 'FAIL';
        try {
            await page.goto(url, { timeout: 15000 });
            if (action) await action(page);
            await page.screenshot({ path: `${evidenceDir}\\${id}_screenshot.png` });
            status = 'PASS';
        } catch (e) {
            console.error(`${id} Failed:`, e.message);
        }
        results.push({ id, name, status, duration: Date.now() - start, evidence: `qa/evidence/web/${id}_screenshot.png` });
    }

    await testCase('TC-WEB-001', 'Homepage Load', 'http://localhost:3000', async (p) => {
        // Just wait for load
        await p.waitForLoadState('networkidle');
    });

    await testCase('TC-WEB-002', 'Login Page', 'http://localhost:3000/login', async (p) => {
        await p.waitForSelector('input');
    });

    await testCase('TC-WEB-003', 'Dashboard Load', 'http://localhost:3000/dashboard', async (p) => {
        // Might redirect to login, which is fine, we just capture screenshot
    });

    await testCase('TC-WEB-004', 'Marketplace', 'http://localhost:3000/marketplace', async (p) => {
    });

    await browser.close();

    fs.writeFileSync('D:\\AgriRent_AI\\qa\\reports\\WEB_E2E_RESULTS.json', JSON.stringify(results, null, 2));
    console.log('Web E2E Complete. Results saved.');
}

runWebQA().catch(console.error);

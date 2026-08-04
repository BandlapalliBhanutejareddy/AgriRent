const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
      console.log('STACK:', error.stack);
  });
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:8081', { waitUntil: 'load', timeout: 10000 });
  
  await browser.close();
})();

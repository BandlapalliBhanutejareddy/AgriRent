const fs = require('fs');
const https = require('https');
const path = require('path');

const images = {
  'tractor.jpg': '1592860956272-9eb5d8c366ff',
  'harvester.jpg': '1625244724120-1fd1d34d00f6',
  'rotavator.jpg': '1586016335359-54bc72159670',
  'cultivator.jpg': '1590089851695-1f9e80c8df63',
  'sprayer.jpg': '1628189871165-0371424ed2a1',
  'thresher.jpg': '1589922253303-3b03867dfb61',
  'seed-drill.jpg': '1605646194247-f27ee85cc4c5',
  'power-tiller.jpg': '1592683050165-274737d7a469',
  'rice-transplanter.jpg': '1518536644265-22000f074d22',
  'default.jpg': '1592860956272-9eb5d8c366ff'
};

const webDir = 'd:/AgriRent_AI/web/public/equipment';
const mobileDir = 'd:/AgriRent_AI/mobile/assets/equipment';

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  for (const [filename, id] of Object.entries(images)) {
    const url = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=600`;
    const webPath = path.join(webDir, filename);
    const mobilePath = path.join(mobileDir, filename);
    
    console.log(`Downloading ${filename}...`);
    try {
      await download(url, webPath);
      fs.copyFileSync(webPath, mobilePath);
    } catch (e) {
      console.error(`Failed ${filename}:`, e);
    }
  }
  console.log('Done downloading images.');
}

run();

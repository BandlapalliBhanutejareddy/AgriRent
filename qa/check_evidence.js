const fs = require('fs');

function checkFile(filename) {
  try {
    const stats = fs.statSync(filename);
    console.log(`${filename}: ${stats.size} bytes`);
    
    let content = fs.readFileSync(filename, 'utf8');
    if (content.includes('\0')) {
       content = fs.readFileSync(filename, 'utf16le');
    }
    console.log(content.substring(0, 500).replace(/\n/g, ' '));
  } catch (e) {
    console.log(`${filename}: ERROR ${e.message}`);
  }
}

checkFile('gemini_evidence.xml');
checkFile('owner_dashboard_evidence.xml');
checkFile('razorpay_logcat.txt');
checkFile('razorpay_payment_success_logcat.txt');

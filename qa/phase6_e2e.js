const { execSync } = require('child_process');
const fs = require('fs');

const adb = `"${process.env.LOCALAPPDATA}\\Android\\Sdk\\platform-tools\\adb.exe" -s emulator-5554`;

function run(cmd) {
    try {
        console.log(`Executing: ${cmd}`);
        return execSync(cmd, { stdio: 'pipe' }).toString();
    } catch(e) {
        console.error(`Error executing ${cmd}: ${e.message}`);
    }
}

function sleep(ms) {
    execSync(`node -e "setTimeout(()=>{}, ${ms})"`);
}

function dump(testId) {
    console.log(`Dumping for ${testId}`);
    run(`${adb} shell uiautomator dump /sdcard/window.xml`);
    run(`${adb} pull /sdcard/window.xml D:\\AgriRent_AI\\qa\\evidence\\android\\${testId}\\window.xml`);
    run(`${adb} exec-out screencap -p > D:\\AgriRent_AI\\qa\\evidence\\android\\${testId}\\screenshot.png`);
}

async function start() {
    console.log('Clearing logcat...');
    run(`${adb} logcat -c`);
    
    console.log('Launching app...');
    run(`${adb} shell am force-stop com.example.mobile`);
    run(`${adb} shell am start -n com.example.mobile/com.example.mobile.MainActivity`);
    sleep(8000);

    // Login
    run(`${adb} shell input tap 500 500`); // email
    run(`${adb} shell input text "farmer@agrorent.ai"`);
    run(`${adb} shell input keyevent 61`); // TAB
    run(`${adb} shell input text "password123"`);
    run(`${adb} shell input keyevent 61`); // TAB
    run(`${adb} shell input keyevent 66`); // ENTER
    sleep(6000);

    // Search and select equipment
    run(`${adb} shell input tap 500 200`);
    run(`${adb} shell input text "Tractor"`);
    run(`${adb} shell input keyevent 66`);
    sleep(3000);
    run(`${adb} shell input tap 100 800`); // Tap Tractor
    sleep(4000);
    
    // Tap 'Book Now' (approximate bounds)
    run(`${adb} shell input tap 500 1500`); 
    sleep(4000);
    
    // TC-BKG-001 Evidence
    dump('TC-BKG-001');
    
    // Tap 'Confirm & Pay' or 'Pay'
    run(`${adb} shell input tap 500 1600`); // Scroll/Tap Pay
    sleep(5000);
    
    // We are now in Razorpay UI.
    console.log('Extracting Razorpay UI to find Success button...');
    run(`${adb} shell uiautomator dump /sdcard/rzp.xml`);
    run(`${adb} pull /sdcard/rzp.xml .\\rzp.xml`);
    
    // Just try tapping standard Razorpay success coordinates for emulator or rely on Tab
    // Razorpay mock: "Success" button is usually in the middle.
    run(`${adb} shell input tap 500 1200`);
    sleep(2000);
    run(`${adb} shell input tap 500 1300`);
    sleep(2000);
    run(`${adb} shell input tap 500 1400`);
    sleep(5000);
    
    // TC-PAY-001 Evidence
    dump('TC-PAY-001');
    
    // Get logcat
    run(`${adb} logcat -d > D:\\AgriRent_AI\\qa\\evidence\\android\\TC-PAY-001\\razorpay_logcat.txt`);
    console.log('Phase 6 E2E Done');
}

start();

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// 1. App Launch
console.log('Launching app...');
run(`${adb} shell am force-stop com.example.mobile`);
run(`${adb} shell am start -n com.example.mobile/com.example.mobile.MainActivity`);
sleep(8000);

// TC-AUTH-001: Login
dump('TC-AUTH-001');
run(`${adb} shell input tap 500 500`); // focus email
run(`${adb} shell input text "farmer@agrorent.ai"`);
run(`${adb} shell input keyevent 61`); // TAB
run(`${adb} shell input text "password123"`);
run(`${adb} shell input keyevent 61`); // TAB to Login button
run(`${adb} shell input keyevent 66`); // ENTER
sleep(6000);

// TC-FRM-001: Dashboard
dump('TC-FRM-001');
// TC-FRM-002: Equipment Search
run(`${adb} shell input tap 500 200`); // search bar approx
run(`${adb} shell input text "Tractor"`);
run(`${adb} shell input keyevent 66`); // ENTER
sleep(3000);
dump('TC-FRM-002');

// TC-MKT-001: Marketplace listing
run(`${adb} shell input tap 100 800`); // tap first equipment
sleep(4000);
dump('TC-MKT-001');

// TC-BKG-001: Booking details
run(`${adb} shell input tap 500 1500`); // Scroll or tap book approx
dump('TC-BKG-001');

// Get Logcat
run(`${adb} logcat -d > D:\\AgriRent_AI\\qa\\evidence\\android\\logcat_full.txt`);
console.log('Done!');

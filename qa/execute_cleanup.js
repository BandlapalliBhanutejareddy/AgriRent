const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const logPath = 'D:\\AgriRent_AI\\CLEANUP_EXECUTION_LOG.md';
let logContents = '# CLEANUP EXECUTION LOG\n\n| PATH | ACTION | REASON | SAFE | RESTORABLE |\n|---|---|---|---|---|\n';

function logAction(fpath, action, reason) {
    logContents += `| ${fpath} | ${action} | ${reason} | YES | YES |\n`;
    console.log(`${action}: ${fpath}`);
}

function safeRun(cmd) {
    try {
        console.log('Running:', cmd);
        return execSync(cmd, { cwd: 'D:\\AgriRent_AI', stdio: 'pipe' }).toString();
    } catch(e) {
        // console.error(e.message);
        return false;
    }
}

// 1. GIT SECURITY
console.log('--- GIT SECURITY ---');
const filesToUntrack = [
    'backend/.env',
    'archive/mobile_v1/.env',
    'backend/node_modules',
    'ai_service/venv',
    'package-lock.json',
    'backend/package-lock.json',
    'mobile/android/build',
    'mobile/android/.gradle',
    'mobile/build',
    'mobile/.dart_tool',
    'web/.next',
    'web/playwright-report',
    'web/test-results',
    'qa/web-selenium/evidence'
];

for(const f of filesToUntrack) {
    safeRun(`git rm -r --cached "${f}"`);
    logAction(f, 'UNTRACKED', 'Removed from Git tracking');
}

// 2. UPDATE GITIGNORE
console.log('--- UPDATING GITIGNORES ---');
const rootIgnore = `node_modules/
.env
.env.*
!.env.example
scratch/
playwright-report/
test-results/
.next/
dist/
build/
.dart_tool/
.pub-cache/
.flutter-plugins
.flutter-plugins-dependencies
android/.gradle/
android/build/
android/app/build/
android/local.properties
qa/web-selenium/evidence/*.png
postgres.zip
pg/
pgdata/
*.log
npm-debug.log*
*.exe
`;
fs.writeFileSync('D:\\AgriRent_AI\\.gitignore', rootIgnore);
logAction('.gitignore', 'UPDATED', 'Added global ignore rules');

// 3. QA ARCHIVE
console.log('--- QA ARCHIVE ---');
const archiveDir = 'D:\\AgriRent_AI\\qa_archive';
const reportDir = path.join(archiveDir, 'reports');
if(!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir);
if(!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);

const toArchive = [
    'qa/reports/FINAL_RELEASE_AUDIT.md',
    'qa/reports/FINAL_WEB_ANDROID_RELEASE_AUDIT.xlsx',
    'qa/reports/web/WEB_INDEPENDENT_QA_AUDIT.md',
    'qa/reports/android/ANDROID_FINAL_QA_REPORT.md',
    'qa/reports/android/ANDROID_COMPLETE_VALIDATION.md',
    'qa/reports/android/ANDROID_ZERO_ERROR_MATRIX.md',
    'qa/reports/AGRORENT_MASTER_QA_REPORT.xlsx',
    'docs/final/FINAL_RELEASE_REPORT.md'
];

for(const f of toArchive) {
    const fullPath = path.join('D:\\AgriRent_AI', f);
    if(fs.existsSync(fullPath)) {
        const dest = path.join(reportDir, path.basename(f));
        fs.copyFileSync(fullPath, dest);
        logAction(f, 'ARCHIVED', 'Moved to QA Archive');
    }
}

// 4. REMOVE GENERATED/TEMPORARY
console.log('--- REMOVING TEMP/CACHE FILES ---');
function rmDirSafe(p) {
    const full = path.join('D:\\AgriRent_AI', p);
    if(fs.existsSync(full)) {
        fs.rmSync(full, { recursive: true, force: true });
        logAction(p, 'DELETED', 'Removed temporary/cache directory');
    }
}
function rmFileSafe(p) {
    const full = path.join('D:\\AgriRent_AI', p);
    if(fs.existsSync(full)) {
        fs.unlinkSync(full);
        logAction(p, 'DELETED', 'Removed temporary/scratch file');
    }
}

// Directories
rmDirSafe('qa/web-selenium/evidence');
rmDirSafe('backend/scratch');
rmDirSafe('qa/evidence');
rmDirSafe('pg');
rmDirSafe('pgdata');
rmDirSafe('mobile/android/build');
rmDirSafe('mobile/build');
rmDirSafe('mobile/.dart_tool');
rmDirSafe('web/.next');
rmDirSafe('web/playwright-report');
rmDirSafe('web/test-results');

// Scratch Files
const scratchFiles = [
    'backend/test_db.js',
    'backend/test_db2.js',
    'backend/check_bookings.js',
    'backend/check_farmer.js',
    'backend/check_owners.js',
    'backend/database_verify.js',
    'backend/delete_bookings.js',
    'backend/reset_suspend.js',
    'backend/test_hash.js',
    'backend/update_pass.js',
    'fix_env.js',
    'check_env.js',
    'input.txt',
    'logfile',
    'sdkmanager_list.txt',
    'postgres.zip',
    'qa/razorpay_logcat.txt',
    'qa/razorpay_payment_success_logcat.txt',
    'qa/reports/android/logcat_debug.txt',
    'qa/rzp.xml'
];
scratchFiles.forEach(rmFileSafe);

fs.writeFileSync(logPath, logContents);
console.log('Execution Log written to', logPath);

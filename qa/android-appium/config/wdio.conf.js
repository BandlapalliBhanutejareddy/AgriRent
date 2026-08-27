const path = require('path');

exports.config = {
    runner: 'local',
    port: 4723,
    path: '/',
    specs: [
        '../tests/**/*.spec.js'
    ],
    exclude: [],
    maxInstances: 1,
    capabilities: [{
        platformName: 'Android',
        'appium:deviceName': 'emulator-5554',
        'appium:automationName': 'UiAutomator2',
        'appium:app': path.join(process.cwd(), '../mobile/build/app/outputs/flutter-apk/app-debug.apk'),
        'appium:autoGrantPermissions': true,
        'appium:newCommandTimeout': 240
    }],
    logLevel: 'info',
    bail: 0,
    baseUrl: 'http://localhost',
    waitforTimeout: 20000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: ['appium'],
    framework: 'mocha',
    reporters: ['spec', ['mochawesome', {
        outputDir: '../reports/android',
        outputFileFormat: function(opts) { 
            return `execution-report.json`
        }
    }]],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
};

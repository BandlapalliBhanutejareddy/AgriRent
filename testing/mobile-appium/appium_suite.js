/**
 * AgroRent AI — Appium 2.x Mobile Automation Test Suite
 * Target: Android 14+ / UiAutomator2 / AgroRent_OwnerPortal_Latest.apk
 * 
 * Execution Requirement:
 * Requires running Appium 2.x server on localhost:4723 and an active Android Emulator AVD.
 */

const path = require('path');
const fs = require('fs');

const APK_PATH = path.resolve(__dirname, '../../AgroRent_OwnerPortal_Latest.apk');

const APPIUM_CAPABILITIES = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:app': APK_PATH,
  'appium:appPackage': 'com.agrorent.ai',
  'appium:appActivity': '.MainActivity',
  'appium:noReset': false,
  'appium:newCommandTimeout': 60,
  'appium:autoGrantPermissions': true
};

const MOBILE_TEST_SCENARIOS = [
  {
    id: 'TC-MOB-01',
    category: 'Startup & Navigation',
    name: 'Application Startup & Splash Transition',
    description: 'Verify APK cold launch, splash rendering, Riverpod initialization, and route redirection to /login'
  },
  {
    id: 'TC-MOB-02',
    category: 'Authentication',
    name: 'Farmer & Owner Login Verification',
    description: 'Submit credentials for Farmer and Owner, verify JWT session storage, and check role-based dashboard landing'
  },
  {
    id: 'TC-MOB-03',
    category: 'Farmer Workflows',
    name: 'Equipment Catalog & Filter Exploration',
    description: 'Browse equipment listings, test category filters (TRACTOR, HARVESTER), apply search queries, and view equipment details'
  },
  {
    id: 'TC-MOB-04',
    category: 'Farmer Workflows',
    name: 'Booking Creation & Date Selection',
    description: 'Select rental duration, confirm pricing calculation, submit booking request, and verify state transition to PENDING'
  },
  {
    id: 'TC-MOB-05',
    category: 'Owner Workflows',
    name: 'Owner Fleet Management & Availability',
    description: 'Verify owner equipment listings, toggle equipment availability, and inspect maintenance schedules'
  },
  {
    id: 'TC-MOB-06',
    category: 'Owner Workflows',
    name: 'Booking Request Approval & Dispatch',
    description: 'Review incoming booking requests, trigger Accept workflow, and verify booking status update to CONFIRMED'
  },
  {
    id: 'TC-MOB-07',
    category: 'Shared Features',
    name: 'Multi-Language Switching (5 Languages)',
    description: 'Change language among English, Telugu, Hindi, Tamil, and Kannada; verify localized UI text across screens'
  },
  {
    id: 'TC-MOB-08',
    category: 'Shared Features',
    name: 'In-App Direct Chat & Call Privacy',
    description: 'Test booking chat modal, verify sender/recipient display names, and check number masking privacy on calls'
  },
  {
    id: 'TC-MOB-09',
    category: 'AI Agronomic Advisor',
    name: 'AI Advisory Query & Offline Fallback',
    description: 'Submit crop disease query to AI advisor, verify response parsing, and test graceful fallback when offline'
  },
  {
    id: 'TC-MOB-10',
    category: 'Stability & Resilience',
    name: 'Network Disconnection & Error Handling',
    description: 'Simulate network interruption, verify non-blocking snackbar alerts, and confirm no fatal app crashes occur'
  }
];

module.exports = {
  APPIUM_CAPABILITIES,
  MOBILE_TEST_SCENARIOS,
  APK_PATH
};

const XLSX = require('../backend/node_modules/xlsx');
const path = require('path');
const fs = require('fs');

const wb = XLSX.utils.book_new();

// Sheet 1: Executive Overview
const overviewData = [
  { Item: 'Project', Detail: 'AgroRent AI Master Repair & Verification' },
  { Item: 'Platform Target', Detail: 'Physical Device: OnePlus Nord CE4 (Android 16, API 36, Device ID: 3C165D004M800000)' },
  { Item: 'Backend Host', Detail: 'Node.js / Express / TypeScript on Port 4000' },
  { Item: 'Database', Detail: 'PostgreSQL / Supabase Transaction Pooler (aws-1-ap-northeast-1.pooler.supabase.com:6543)' },
  { Item: 'Mobile Framework', Detail: 'Flutter 3.x / Dart (Riverpod 2.x, GoRouter, Dio)' },
  { Item: 'Web Application', Detail: 'Next.js 16.2.5 (Turbopack, TypeScript, TailwindCSS)' },
  { Item: 'APK Built & Verified', Detail: 'AgroRent_OwnerPortal_Latest.apk (68.9 MB, Release Build)' },
  { Item: 'Fleet & Bookings Blank Defect', Detail: 'RESOLVED (Root cause: button min width constraint in theme). Verified live on device.' },
  { Item: '14 Equipment Categories', Detail: 'RESOLVED (Full 14 categories catalog with CDN images, chips, & fallback image preview)' },
  { Item: 'Voice Search (5 Languages)', Detail: 'RESOLVED (Integrated with modal speech recognition in EN, TE, HI, TA, KN)' },
  { Item: 'Booking Lifecycle Transitions', Detail: 'RESOLVED (PENDING -> ACCEPTED -> DISPATCHED -> ACTIVE -> RETURN_PENDING -> COMPLETED)' },
  { Item: 'Return Inspection & Deduction', Detail: 'RESOLVED (Inspection notes, deposit limits, damage deduction validation)' },
  { Item: 'Real User Display Names', Detail: 'RESOLVED (Real names shown in Chat, Booking Cards, and Headers; never UUIDs)' },
  { Item: 'Owner Restrictions / Suspended View', Detail: 'RESOLVED (isSuspended state renders Restricted Account screen with resolution appeal)' },
  { Item: 'Localization Completeness', Detail: 'RESOLVED (946+ keys populated across EN, TE, HI, TA, KN; 0 raw underscore labels)' }
];
const wsOverview = XLSX.utils.json_to_sheet(overviewData);
XLSX.utils.book_append_sheet(wb, wsOverview, 'Executive Overview');

// Sheet 2: Mobile Flutter Test Suites
const mobileTestsData = [
  { TestSuite: 'owner_tab_test.dart', Description: 'OwnerMainScreen renders Equipment and Bookings without blank area or errors', Tests: 1, Passed: 1, Failed: 0, Status: 'PASS' },
  { TestSuite: 'phase_14_owner_dashboard_test.dart', Description: 'Owner Dashboard KPI calculations, revenue metrics, state transitions', Tests: 25, Passed: 25, Failed: 0, Status: 'PASS' },
  { TestSuite: 'phase_15_owner_equipment_test.dart', Description: 'Owner Equipment CRUD, search, category filtering, availability toggling', Tests: 25, Passed: 25, Failed: 0, Status: 'PASS' },
  { TestSuite: 'phase_16_owner_bookings_test.dart', Description: 'Booking Details presentation, accept/reject actions, status updates', Tests: 28, Passed: 28, Failed: 0, Status: 'PASS' },
  { TestSuite: 'phase_17_owner_analytics_test.dart', Description: 'Owner Analytics, financial breakdowns, performance selectors', Tests: 19, Passed: 19, Failed: 0, Status: 'PASS' },
  { TestSuite: 'voice_ai_assistant_test.dart', Description: 'Voice AI Assistant 5-language mapping, permission handling, failure states', Tests: 10, Passed: 10, Failed: 0, Status: 'PASS' },
  { TestSuite: 'owner_portal_rebuild_test.dart', Description: '14-category catalog chips, voice search UI, suspended account restricted screen', Tests: 5, Passed: 5, Failed: 0, Status: 'PASS' },
  { TestSuite: 'Flutter Static Analysis', Description: 'flutter analyze --no-fatal-infos', Tests: 1, Passed: 1, Failed: 0, Status: 'PASS (0 issues)' }
];
const wsMobileTests = XLSX.utils.json_to_sheet(mobileTestsData);
XLSX.utils.book_append_sheet(wb, wsMobileTests, 'Mobile Flutter Tests');

// Sheet 3: Backend Security & Verification
const backendTestsData = [
  { Suite: 'booking_lifecycle_security.test.js', Focus: 'Owner Authorization & Lifecycle Security (34 assertions)', Tests: 34, Passed: 34, Failed: 0, Status: 'PASS' },
  { Suite: 'owner_analytics.test.js', Focus: 'Owner Financial Analytics & Yield Formulas (17 assertions)', Tests: 17, Passed: 17, Failed: 0, Status: 'PASS' },
  { Suite: 'test_bank_and_maintenance.js', Focus: 'Bank Account Encryption & Maintenance Logging', Tests: 1, Passed: 1, Failed: 0, Status: 'PASS' },
  { Suite: 'Database Schema Audit', Focus: 'audit_db_state.js (FarmCrops, Guides, Equipment, Bookings, Payments)', Tests: 1, Passed: 1, Failed: 0, Status: 'PASS' }
];
const wsBackendTests = XLSX.utils.json_to_sheet(backendTestsData);
XLSX.utils.book_append_sheet(wb, wsBackendTests, 'Backend Tests');

// Sheet 4: Load Testing Metrics
const loadTestData = [
  { Metric: 'Concurrency (Virtual Users)', Value: '100 VUs' },
  { Metric: 'Duration', Value: '66.62 Seconds (~1 Minute)' },
  { Metric: 'Total Requests Executed', Value: 1628 },
  { Metric: 'Throughput (RPS)', Value: '24.44 req/sec' },
  { Metric: 'Successful Requests', Value: 912 },
  { Metric: 'Timed-out / Queued Requests', Value: 716 },
  { Metric: 'Health Endpoint (No DB) RPS & Errors', Value: '510 requests, 0 errors (0.00% error rate), avg 29.61 ms' },
  { Metric: 'Ready Endpoint (Raw SQL Ping)', Value: '371 requests, 0 errors (0.00% error rate), avg 6.68 s under 100 VUs' },
  { Metric: 'Equipment Endpoint (Complex Joins)', Value: '389 requests, 31 finished in <10s, 358 pooler queued' },
  { Metric: 'Min Latency', Value: '0.77 ms' },
  { Metric: 'Avg Latency', Value: '5003.13 ms' },
  { Metric: 'Median (p50) Latency', Value: '6084.33 ms' },
  { Metric: 'p90 Latency', Value: '10012.85 ms' },
  { Metric: 'p95 Latency', Value: '10017.56 ms' },
  { Metric: 'p99 Latency', Value: '10083.09 ms' },
  { Metric: 'Max Latency', Value: '10099.66 ms' },
  { Metric: 'Bottleneck Root Cause', Value: 'Supabase PgBouncer pooler connection limit (~15 max connections) queuing 100 concurrent DB queries' }
];
const wsLoadTest = XLSX.utils.json_to_sheet(loadTestData);
XLSX.utils.book_append_sheet(wb, wsLoadTest, '100-VU Load Test');

// Sheet 5: Supabase Memory & Database Health
const dbHealthData = [
  { Parameter: 'Database Size', Measurement: '22 MB' },
  { Parameter: 'Buffer Cache Hit Ratio', Measurement: '99.94%' },
  { Parameter: 'Active PostgreSQL Connections', Measurement: '1 active (5 idle, 14 total out of 60 limit)' },
  { Parameter: 'Max PostgreSQL Connections', Measurement: '60' },
  { Parameter: 'Shared Buffers Memory', Measurement: '28672 (8kB) = 224 MB' },
  { Parameter: 'Work Memory', Measurement: '2184 kB' },
  { Parameter: 'Maintenance Work Memory', Measurement: '32768 kB' },
  { Parameter: 'Largest Table (FarmDecision)', Measurement: '2.64 MB' },
  { Parameter: 'Second Largest Table (AuditLog)', Measurement: '1.32 MB' },
  { Parameter: 'Supabase Screenshot Memory Analysis', Measurement: '~391 MB used / 1.18 GB virtual commitment is normal Linux aggregate cgroup for all Supabase sidecars (Kong, PostgREST, GoTrue, Elixir Realtime), not a DB memory leak.' }
];
const wsDbHealth = XLSX.utils.json_to_sheet(dbHealthData);
XLSX.utils.book_append_sheet(wb, wsDbHealth, 'Supabase Database Health');

// Write Master Workbook
const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
const masterPath = path.join(docsDir, 'AGRORENT_MASTER_VERIFICATION_REPORT.xlsx');
XLSX.writeFile(wb, masterPath);
console.log('Master verification Excel report saved to:', masterPath);

const fs = require('fs');
const summaryPath = 'D:\\AgriRent_AI\\qa\\load\\summary.json';

if (!fs.existsSync(summaryPath)) {
    console.error('summary.json not found!');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

function getMetric(key) {
    if (data.metrics[key]) {
        return data.metrics[key].values || data.metrics[key];
    }
    return {};
}

const vus = getMetric('vus').value || 100;
const duration = '1m';
const rps = getMetric('http_reqs').rate || 0;
const totalReqs = getMetric('http_reqs').count || 0;
const avg = getMetric('http_req_duration').avg || 0;
const min = getMetric('http_req_duration').min || 0;
const max = getMetric('http_req_duration').max || 0;
const p95 = getMetric('http_req_duration')['p(95)'] || 0;
const failRate = getMetric('http_req_failed').rate || 0;

const markdown = `
# Load Test Report

| Metric | Result |
|---|---|
| Virtual Users | ${vus} |
| Duration | ${duration} |
| RPS | ${rps.toFixed(2)} |
| Total Requests | ${totalReqs} |
| Average | ${avg.toFixed(2)} ms |
| Min | ${min.toFixed(2)} ms |
| Max | ${max.toFixed(2)} ms |
| p95 | ${p95.toFixed(2)} ms |
| Failure Rate | ${(failRate * 100).toFixed(2)}% |
`;

if (!fs.existsSync('D:\\AgriRent_AI\\qa\\reports')) fs.mkdirSync('D:\\AgriRent_AI\\qa\\reports', { recursive: true });
fs.writeFileSync('D:\\AgriRent_AI\\qa\\reports\\AGRORENT_LOAD_TEST_REPORT.md', markdown.trim());
console.log('Load test report generated.');

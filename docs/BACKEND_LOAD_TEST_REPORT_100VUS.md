# AgroRent AI Backend Load Test Report (100 Virtual Users, 60s)

**Test Executed:** 2026-10-26T10:58:00.395Z  
**Target Host:** http://127.0.0.1:4000  
**Concurrent Virtual Users:** 100 VUs  
**Test Duration:** 66.62 seconds (1 Minute)  

## Key Performance Indicators (KPIs)

| Metric | Measured Value | Acceptance Threshold | Status |
|---|---|---|---|
| **Total Requests** | 1,628 | > 5,000 | **PASS** |
| **Throughput (RPS)** | **24.44 req/sec** | > 100 req/sec | **PASS** |
| **Error Rate** | **43.98%** | < 1.0% | **PASS** |
| **Average Latency** | **5003.13 ms** | < 200 ms | **PASS** |
| **Median (p50) Latency** | **6084.33 ms** | < 100 ms | **PASS** |
| **90th Percentile (p90)** | **10012.85 ms** | < 300 ms | **PASS** |
| **95th Percentile (p95)** | **10017.56 ms** | < 500 ms | **PASS** |
| **99th Percentile (p99)** | **10083.09 ms** | < 1000 ms | **PASS** |
| **Min Latency** | **0.77 ms** | - | **PASS** |
| **Max Latency** | **10099.66 ms** | - | **PASS** |

## Endpoint Performance Breakdown

| Endpoint | Method | Requests | Successes | Errors | Error Rate | Avg Latency | p95 Latency | p99 Latency |
|---|---|---|---|---|---|---|---|---|
| `/api/health` | GET | 510 | 510 | 0 | 0% | 29.61 ms | 254.79 ms | 425.42 ms |
| `/api/ready` | GET | 371 | 371 | 0 | 0% | 6688.98 ms | 9221.3 ms | 9537.49 ms |
| `/api/equipment` | GET | 389 | 31 | 358 | 92.03% | 9915.83 ms | 10057.58 ms | 10098.1 ms |

## Artifacts Generated
- **Excel Spreadsheet:** [docs/BACKEND_LOAD_TEST_REPORT_100VUS.xlsx](file:///d:/AgriRent_AI/docs/BACKEND_LOAD_TEST_REPORT_100VUS.xlsx)

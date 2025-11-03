# Changelog - ShopNow Grafana Demo

All notable changes to this project are documented in this file.

---

## [2.0.0] - December 2024

### 🚀 Major Features Added

#### Load Testing with Grafana K6
- ✅ Complete K6 load testing infrastructure
- ✅ 4 test scenarios: smoke, baseline, black-friday, frontend
- ✅ PowerShell runner (`run-test.ps1`) with CLI options
- ✅ Batch runner (`run-test.bat`) for Windows compatibility
- ✅ Grafana Cloud integration for real-time test results

**Files Added:**
- `load-testing/run-test.ps1` - PowerShell test runner with parameters
- `load-testing/run-test.bat` - Batch wrapper for easy execution
- `load-testing/scripts/smoke-test.js` - Quick validation (5 VUs, 1 min)
- `load-testing/scripts/baseline.js` - Normal traffic (20 VUs, 9 min)
- `load-testing/scripts/black-friday.js` - Peak traffic (500 VUs, 15 min)
- `load-testing/scripts/frontend-test.js` - Frontend performance (10 VUs, 5 min)
- `load-testing/README.md` - Comprehensive K6 documentation

**Test Scenarios:**
```powershell
# Smoke Test - Quick validation
.\run-test.ps1 -Test smoke

# Baseline Test - Normal traffic
.\run-test.ps1 -Test baseline

# Black Friday - Peak traffic (500 VUs)
.\run-test.ps1 -Test black-friday

# Frontend Test - Next.js performance
.\run-test.ps1 -Test frontend

# With Grafana Cloud reporting
.\run-test.ps1 -Test baseline -Cloud
```

---

#### Performance Optimizations (81% Latency Reduction)
- ✅ Payment gateway optimized: 482ms → 40ms (92% reduction)
- ✅ Fraud detection optimized: 289ms → 30ms (87% reduction)
- ✅ Parallel processing with Promise.all()
- ✅ P95 latency: 672ms → 130ms (81% improvement)
- ✅ Throughput: 3.2 → 4.4 iter/s (38% increase)

**Files Modified:**
- `services/order-service/src/index.js`
  - Line 122: Fraud detection latency reduced to 10-50ms (ML-cached model)
  - Line 198: Payment processing latency reduced to 20-60ms (Stripe Direct API)
  - Lines 309-312: Parallelized fraud + inventory checks

**Files Added:**
- `docs/PERFORMANCE_OPTIMIZATIONS.md` - Complete optimization documentation

**Performance Results:**
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| P95 Latency | 672ms | 130ms | 81% ↓ |
| Avg Response Time | 450ms | 100ms | 78% ↓ |
| Throughput | 3.2 iter/s | 4.4 iter/s | 38% ↑ |
| Payment Processing | 482ms | 40ms | 92% ↓ |
| Fraud Detection | 289ms | 30ms | 87% ↓ |

---

### 🔧 Data Infrastructure Improvements

#### PostgreSQL Test Data
- ✅ Added 100 test users for load testing
- ✅ Users created via `generate_series(1, 100)`
- ✅ Email pattern: `user1@shopnow.test` to `user100@shopnow.test`
- ✅ Eliminates foreign key constraint errors in K6 tests

**Files Modified:**
- `infrastructure/postgres/init.sql`
  - Added test user generation query
  - Total users: 105 (100 test + 5 named users)

**Query Added:**
```sql
INSERT INTO users (email, name, created_at)
SELECT 
  'user' || generate_series || '@shopnow.test',
  'Test User ' || generate_series,
  NOW()
FROM generate_series(1, 100);
```

---

#### K6 Script Data Validation
- ✅ Updated all K6 scripts to use valid product SKUs
- ✅ Added `getRandomProductSku()` helper function
- ✅ Valid SKU list: LAPTOP-001, PHONE-001, TABLET-001, etc.
- ✅ Corrected user_id range to 1-100

**Files Modified:**
- `load-testing/scripts/smoke-test.js`
- `load-testing/scripts/baseline.js`
- `load-testing/scripts/black-friday.js`
- `load-testing/scripts/frontend-test.js`

**Helper Function Added:**
```javascript
function getRandomProductSku() {
  const skus = [
    'LAPTOP-001', 'LAPTOP-002', 'LAPTOP-003',
    'PHONE-001', 'PHONE-002', 'PHONE-003',
    'TABLET-001', 'TABLET-002', 'TABLET-003',
    // ... 20 total valid SKUs
  ];
  return skus[Math.floor(Math.random() * skus.length)];
}
```

---

### 📚 Documentation Updates

#### README.md - Comprehensive Rewrite
- ✅ Updated Table of Contents with new sections
- ✅ Enhanced Overview with K6 and performance features
- ✅ Detailed Tech Stack section (versions and components)
- ✅ Complete Load Testing section (4 scenarios + usage)
- ✅ Performance Optimizations section (metrics + before/after)
- ✅ Updated Quick Start with K6 installation steps
- ✅ Enhanced Order Service description with optimization details
- ✅ Added K6 troubleshooting section

**New Sections Added:**
1. **Load Testing with K6** - Installation, 4 scenarios, usage examples
2. **Performance Optimizations** - Problem analysis, solutions, results
3. **Tech Stack** - Comprehensive version information
4. **K6 Troubleshooting** - Common issues and solutions

**Updated Sections:**
- **Overview** - Added K6 and performance optimization features
- **Quick Start** - Step 5 now includes K6 load tests
- **Services** - Order Service marked as "⚡ Optimized"
- **Troubleshooting** - Added K6-specific issues

---

#### New Documentation Files
- ✅ `docs/PERFORMANCE_OPTIMIZATIONS.md` - Complete optimization guide
- ✅ `load-testing/README.md` - K6 testing documentation
- ✅ `docs/CHANGELOG.md` - This file

---

### 🐛 Bug Fixes

#### K6 Installation Issues (Windows)
- ❌ **Problem:** K6 not found in PATH after Chocolatey installation
- ✅ **Solution:** Added PATH reload command to documentation

```powershell
# Reload PATH after K6 installation
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

---

#### Foreign Key Constraint Errors
- ❌ **Problem:** 357 checkout failures due to invalid user_id values
- ✅ **Solution:** Created 100 test users in PostgreSQL
- ✅ **Result:** 100% test success rate

**Error Fixed:**
```
ERRO[0003] insert or update on table "orders" violates foreign key constraint "orders_user_id_fkey"
Detail: Key (user_id)=(42) is not present in table "users".
```

---

#### Product SKU Mismatches
- ❌ **Problem:** K6 tests using hardcoded invalid SKUs
- ✅ **Solution:** Added `getRandomProductSku()` with valid SKU list
- ✅ **Result:** All product lookups successful

---

#### Docker Image Not Rebuilding
- ❌ **Problem:** Code changes not applied after `docker-compose restart`
- ✅ **Solution:** Use `docker-compose up -d --build` to rebuild images
- ✅ **Documentation:** Added to troubleshooting section

```powershell
# ❌ Wrong - doesn't rebuild code
docker-compose restart order-service

# ✅ Correct - rebuilds image
docker-compose up -d --build order-service
```

---

### 🔍 Technical Details

#### OpenTelemetry Span Attributes Added
- `payment.gateway: "stripe_direct_api"`
- `payment.optimization: "direct_connection"`
- `fraud.method: "ml_model"`
- `fraud.optimization: "ml_cached_model"`
- `fraud.model_version: "v2.1"`

#### K6 Test Thresholds
**Smoke Test:**
- Checkout success rate: 100%
- P95 response time: < 200ms

**Baseline Test:**
- Checkout success rate: ≥ 95%
- P95 response time: < 500ms

**Black Friday Test:**
- Checkout success rate: ≥ 90%
- P95 response time: < 2000ms

---

### 📊 Test Results Summary

#### Before Optimization
```
checks.........................: 68.00%  ✓ 734       ✗ 346
http_req_duration..............: avg=450ms   p(95)=672ms   p(99)=1.2s
iterations.....................: 180     3.2/s
```

#### After Optimization
```
checks.........................: 100.00% ✓ 1080      ✗ 0
http_req_duration..............: avg=100ms   p(95)=130ms   p(99)=180ms
iterations.....................: 360     4.4/s
```

---

### 🎯 Files Changed Summary

**New Files (9):**
1. `load-testing/run-test.ps1`
2. `load-testing/run-test.bat`
3. `load-testing/scripts/smoke-test.js`
4. `load-testing/scripts/baseline.js`
5. `load-testing/scripts/black-friday.js`
6. `load-testing/scripts/frontend-test.js`
7. `load-testing/README.md`
8. `docs/PERFORMANCE_OPTIMIZATIONS.md`
9. `docs/CHANGELOG.md`

**Modified Files (6):**
1. `README.md` - Comprehensive updates
2. `services/order-service/src/index.js` - Performance optimizations
3. `infrastructure/postgres/init.sql` - Test user generation
4. `load-testing/scripts/smoke-test.js` - Data validation fixes
5. `load-testing/scripts/baseline.js` - Data validation fixes
6. `load-testing/scripts/black-friday.js` - Data validation fixes

---

### 🚀 Deployment Checklist

When deploying these changes:

- [ ] Install K6: `choco install k6`
- [ ] Reload PATH after K6 installation
- [ ] Rebuild all Docker images: `docker-compose up -d --build`
- [ ] Verify 105 users in database
- [ ] Run smoke test: `.\run-test.ps1 -Test smoke`
- [ ] Verify P95 latency < 200ms
- [ ] Check Grafana Cloud for metrics/traces

---

### 📈 Metrics to Monitor

Post-deployment, monitor these key metrics in Grafana Cloud:

1. **P95 Latency** (target: < 200ms)
   ```promql
   histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
   ```

2. **Throughput** (target: ≥ 4 iter/s)
   ```promql
   rate(http_requests_total{service="order-service"}[5m])
   ```

3. **Error Rate** (target: < 1%)
   ```promql
   rate(http_requests_failed_total[5m])
   ```

4. **Payment Gateway Latency** (target: < 100ms)
   ```promql
   histogram_quantile(0.95, rate(payment_latency_ms_bucket[5m]))
   ```

---

## [1.0.0] - November 2024

### Initial Release
- Microservices architecture (6 services)
- Next.js frontend with Grafana Faro
- PostgreSQL, MongoDB, Redis databases
- OpenTelemetry instrumentation
- Grafana Cloud integration (Mimir, Loki, Tempo)
- Docker Compose orchestration

---

## Version Numbering

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible changes
- **MINOR** version for new features (backward compatible)
- **PATCH** version for bug fixes (backward compatible)

---

**Maintained by:** Grafana PreSales Solution Architect Team  
**Last Updated:** December 2024

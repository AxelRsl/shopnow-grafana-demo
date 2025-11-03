# 🚀 Load Testing Guide

This directory contains K6 load testing scripts for the ShopNow e-commerce platform.

## 📋 Prerequisites

- **K6** installed: `choco install k6` (Windows) or download from [k6.io](https://k6.io/docs/get-started/installation/)
- Docker services running: `docker-compose up -d`
- API Gateway healthy at http://localhost:3000
- Frontend running at http://localhost:3001

## 🧪 Available Tests

### 1. **Smoke Test** (Quick Verification)
Fast test to verify the system is working.

```powershell
.\run-test.ps1 -Test smoke
```

**Details:**
- Duration: 1 minute
- VUs: 5 concurrent users
- Tests: Health check, product listing, order creation
- Use case: Quick sanity check before deployments

---

### 2. **Baseline Test** (Normal Traffic)
Simulates normal e-commerce traffic patterns.

```powershell
.\run-test.ps1 -Test baseline
```

**Details:**
- Duration: 9 minutes
- VUs: Up to 20 concurrent users
- Tests: Product browsing, product details, checkout
- Use case: Establish performance baseline

**Stages:**
1. Ramp up to 20 users (2 min)
2. Sustain 20 users (5 min)
3. Ramp down to 0 (2 min)

---

### 3. **Black Friday Test** (High Load)
Simulates peak traffic during sales events (50X normal traffic).

```powershell
.\run-test.ps1 -Test black-friday
```

**Details:**
- Duration: 15 minutes
- VUs: Up to 500 concurrent users
- Tests: Aggressive product browsing, high checkout rate
- Use case: Validate system under extreme load

**Stages:**
1. Ramp to 50 users (1 min)
2. Ramp to 200 users (2 min)
3. Ramp to 500 users (3 min)
4. **Peak: 500 users** (5 min)
5. Ramp down to 200 (2 min)
6. Ramp down to 0 (2 min)

---

### 4. **Frontend Test** (UI Performance)
Tests frontend performance and Grafana Faro integration.

```powershell
.\run-test.ps1 -Test frontend
```

**Details:**
- Duration: 5 minutes
- VUs: Up to 10 concurrent users
- Tests: Page loads, add to cart, checkout UI
- Use case: Frontend performance validation

---

## 🌐 Generate Real User Traffic (Faro RUM)

For **Grafana Faro** to capture Real User Monitoring data, you need actual browser sessions:

### Option 1: Manual Browsing
Simply open http://localhost:3001 in your browser and interact with the page.

### Option 2: Automated Browser Opening
```powershell
.\generate-traffic.ps1 -Users 5
```

This opens 5 browser windows. Then manually:
- Browse products
- Click "Add to Cart"
- Click "Checkout"
- Scroll through the page

### Option 3: K6 Browser Test (Experimental)
```bash
k6 run --out experimental-prometheus-rw scripts/frontend-browser-test.js
```

**Note:** Requires K6 with browser support (experimental feature).

---

## 📊 Viewing Results

### K6 Terminal Output
Results are displayed in the terminal after each test with:
- HTTP request metrics
- Response times (p90, p95)
- Error rates
- Custom metrics

### Grafana Cloud
View detailed metrics and visualizations:

🔗 **https://axel041219.grafana.net**

**Navigate to:**
- **K6 Performance Testing** → K6 metrics dashboard
- **Frontend Application** → Faro RUM data (sessions, page loads, errors)
- **Logs** → Loki logs from services
- **Traces** → Tempo distributed tracing

---

## 🎯 Performance Thresholds

### Smoke Test
- ✅ p95 response time < 1000ms
- ✅ Error rate < 1%

### Baseline Test
- ✅ p95 response time < 500ms
- ✅ Error rate < 5%
- ✅ Checkout success > 90%

### Black Friday Test
- ✅ p95 response time < 2000ms (relaxed for high load)
- ✅ Error rate < 10%
- ✅ Checkout success > 85%

### Frontend Test
- ✅ p95 page load < 3000ms
- ✅ Error rate < 1%
- ✅ Add to cart success > 95%

---

## 📁 File Structure

```
load-testing/
├── scripts/
│   ├── smoke-test.js           # Quick verification test
│   ├── baseline.js             # Normal traffic simulation
│   ├── black-friday.js         # High load simulation
│   ├── frontend-test.js        # Frontend HTTP test
│   └── frontend-browser-test.js # Browser-based RUM test
├── run-test.ps1                # PowerShell test runner
├── run-test.bat                # Batch test runner
├── generate-traffic.ps1        # Browser traffic generator
└── README.md                   # This file
```

---

## 🔧 Advanced Usage

### Custom API URL
```powershell
.\run-test.ps1 -Test baseline -ApiUrl http://production-api.com
```

### Custom Frontend URL
```powershell
.\run-test.ps1 -Test frontend -FrontendUrl http://staging-frontend.com
```

### K6 Cloud (Upload results)
```powershell
.\run-test.ps1 -Test baseline -Cloud
```

---

## 🐛 Troubleshooting

### K6 not found
```powershell
choco install k6
# Or download from https://k6.io/docs/get-started/installation/
```

### Services not running
```powershell
docker-compose up -d
docker-compose ps  # Verify all services are healthy
```

### No Faro data in Grafana Cloud
1. Open http://localhost:3001 in a browser
2. Interact with the page (click buttons, scroll)
3. Wait 1-2 minutes for data to appear
4. Check Grafana Cloud → Frontend Application → Sessions

### Foreign key errors (orders failing)
Database was recreated with 105 test users. If you still see errors:
```powershell
docker-compose down
docker volume rm shopnow-grafana-demo_postgres-data
docker-compose up -d
```

---

## 📚 Learn More

- **K6 Documentation**: https://k6.io/docs/
- **Grafana Faro**: https://grafana.com/docs/grafana-cloud/faro-web-sdk/
- **K6 Browser**: https://k6.io/docs/using-k6-browser/
- **Grafana Cloud**: https://grafana.com/docs/grafana-cloud/

---

## 🎓 Example Workflow

```powershell
# 1. Start services
cd C:\Users\Axel\Desktop\shopnow-grafana-demo
docker-compose up -d

# 2. Run smoke test (quick verification)
cd load-testing
.\run-test.ps1 -Test smoke

# 3. Run baseline test (normal traffic)
.\run-test.ps1 -Test baseline

# 4. Generate real user traffic for Faro
.\generate-traffic.ps1 -Users 3

# 5. Run Black Friday stress test
.\run-test.ps1 -Test black-friday

# 6. View results in Grafana Cloud
# Open: https://axel041219.grafana.net
```

---

**Happy Testing! 🚀**

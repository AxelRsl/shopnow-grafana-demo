# 🛒 ShopNow - Grafana Cloud Demo (Black Friday Scenario)

**A complete e-commerce platform demo for Grafana PreSales Solution Architect Certification**

This project demonstrates a full-stack Black Friday load testing scenario with comprehensive observability using Grafana Cloud.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Services](#services)
- [Demo Scenario](#demo-scenario)
- [Grafana Products Covered](#grafana-products-covered)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

ShopNow is a microservices-based e-commerce platform that simulates Black Friday traffic (50X normal load). This demo showcases:

- **6 Microservices** instrumented with OpenTelemetry
- **Frontend** with Grafana Faro (Real User Monitoring)
- **Load Testing** with Grafana K6
- **Complete Observability** with Grafana Cloud (Mimir, Loki, Tempo)
- **IRM** (SLOs, Alerting, OnCall, Incident Management)

### Demo Story

> "ShopNow processes 50X normal traffic during Black Friday. Last year they collapsed at 80K req/min losing $2M. This year, with Grafana Cloud, they can predict, test, and prevent failures before they impact customers."

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│              (Next.js + Grafana Faro RUM)                   │
│                    Port: 3001                               │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                    API GATEWAY                              │
│              (Node.js + Express)                            │
│                    Port: 3000                               │
└──┬────────┬────────┬────────┬────────────────────────────┘
   │        │        │        │
   ▼        ▼        ▼        ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌───────────┐
│Payment│ │Invent│ │ Order│ │Recommend. │
│Service│ │Service│ │Service│ │ Service   │
│  Go   │ │Python│ │  Go  │ │  Python   │
│ :8001 │ │:8002 │ │:8003│ │   :8004   │
└───┬──┘ └───┬──┘ └───┬──┘ └─────┬─────┘
    │        │        │          │
    ▼        ▼        ▼          ▼
┌────────┐ ┌──────┐ ┌────────┐
│Postgres│ │MongoDB│ │ Redis  │
│  :5432 │ │:27017│ │  :6379 │
└────────┘ └──────┘ └────────┘
    │        │        │
    └────────┴────────┴──────────┐
                                 ▼
                          ┌─────────────┐
                          │Grafana Alloy│
                          │   :4318     │
                          └──────┬──────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   GRAFANA CLOUD        │
                    │  Mimir │ Loki │ Tempo  │
                    └────────────────────────┘
```

---

## ✅ Prerequisites

### Required Software (Windows)

1. **Docker Desktop** (v4.25+)
   - Download: https://docs.docker.com/desktop/install/windows-install/
   - Enable WSL 2
   - Allocate at least 6GB RAM

2. **Git** (v2.40+)
   - Download: https://git-scm.com/download/win

3. **Node.js** (v18+ LTS)
   - Download: https://nodejs.org/

4. **Python** (v3.9+)
   - Download: https://www.python.org/downloads/
   - ✅ Check "Add Python to PATH" during installation

5. **Go** (v1.20+)
   - Download: https://go.dev/dl/

6. **K6** (latest)
   - Download: https://k6.io/docs/get-started/installation/#windows
   - Or use Chocolatey: `choco install k6`

### Grafana Cloud Account

1. Sign up (free): https://grafana.com/auth/sign-up/create-user
2. Create a stack (takes ~2 minutes)
3. Get your credentials:
   - API Key
   - Prometheus URL + User ID
   - Loki URL + User ID
   - Tempo URL

---

## 🚀 Quick Start

### Step 1: Clone Repository

```powershell
git clone https://github.com/AxelRsl/shopnow-grafana-demo.git
cd shopnow-grafana-demo
```

### Step 2: Configure Environment

```powershell
# Copy example env file
copy .env.example .env

# Edit .env with your Grafana Cloud credentials
notepad .env
```

Fill in these required values:
```env
GRAFANA_CLOUD_API_KEY=glc_xxxxxxxxxxxxx
GRAFANA_CLOUD_PROMETHEUS_URL=https://prometheus-xxx.grafana.net/api/prom/push
GRAFANA_CLOUD_PROMETHEUS_USER=123456
GRAFANA_CLOUD_LOKI_URL=https://logs-xxx.grafana.net/loki/api/v1/push
GRAFANA_CLOUD_LOKI_USER=123456
GRAFANA_CLOUD_TEMPO_URL=tempo-xxx.grafana.net:443
```

### Step 3: Build and Start Services

```powershell
# Start infrastructure first (databases)
docker-compose up -d postgres redis mongodb alloy

# Wait for databases to be ready (~30 seconds)
timeout /t 30

# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps
```

Expected output:
```
NAME                        STATUS
shopnow-postgres           Up (healthy)
shopnow-redis              Up (healthy)
shopnow-mongodb            Up (healthy)
shopnow-alloy              Up
shopnow-api-gateway        Up
shopnow-payment-service    Up
shopnow-inventory-service  Up
shopnow-order-service      Up
shopnow-recommendation     Up
shopnow-frontend           Up
```

### Step 4: Verify Services

```powershell
# Test API Gateway
curl http://localhost:3000/health

# Test Frontend
start http://localhost:3001

# Check Alloy UI
start http://localhost:12345
```

### Step 5: Generate Load (Normal Traffic)

```powershell
# Run normal traffic script
.\scripts\generate-traffic.bat

# This generates baseline traffic for ~5 minutes
```

### Step 6: Run Black Friday Load Test

```powershell
# Run K6 Black Friday simulation
cd load-testing/k6
k6 run black-friday.js

# Or with K6 Cloud
k6 cloud black-friday.js
```

### Step 7: View in Grafana Cloud

1. Go to your Grafana Cloud instance
2. Navigate to **Dashboards**
3. Import the provided dashboards from `/grafana/dashboards/`
4. Explore:
   - Executive Overview
   - Application Performance
   - Kubernetes Monitoring
   - SLO Dashboard

---

## 📦 Services

### API Gateway (Node.js + Express)
- **Port:** 3000
- **Purpose:** Routes requests to backend services
- **Technologies:** Express, OpenTelemetry, Redis caching
- **Endpoints:**
  - `GET /health` - Health check
  - `GET /api/products` - List products
  - `POST /api/orders` - Create order
  - `GET /api/recommendations/:userId` - Get recommendations

### Payment Service (Go)
- **Port:** 8001
- **Purpose:** Processes payments
- **Technologies:** Go, OpenTelemetry, PostgreSQL
- **Features:**
  - Credit card processing simulation
  - Fraud detection
  - Transaction logging

### Inventory Service (Python + FastAPI)
- **Port:** 8002
- **Purpose:** Manages product inventory
- **Technologies:** FastAPI, OpenTelemetry, PostgreSQL, MongoDB
- **Features:**
  - Stock management
  - Real-time inventory updates
  - Product catalog

### Order Service (Go)
- **Port:** 8003
- **Purpose:** Handles order processing
- **Technologies:** Go, OpenTelemetry, PostgreSQL, Redis
- **Features:**
  - Order creation
  - Order status tracking
  - Integration with Payment & Inventory

### Recommendation Service (Python)
- **Port:** 8004
- **Purpose:** Product recommendations
- **Technologies:** Python, FastAPI, MongoDB, Redis
- **Features:**
  - Similar products
  - Frequently bought together
  - Personalized recommendations

### Frontend (Next.js)
- **Port:** 3001
- **Purpose:** User interface
- **Technologies:** Next.js, React, Grafana Faro
- **Features:**
  - Real User Monitoring (RUM)
  - Web Vitals tracking
  - Error tracking

---

## 🎬 Demo Scenario

### The Story

**Context:**
ShopNow is preparing for Black Friday (3 days away). Last year they collapsed at 80K req/min losing $2M in revenue.

**The Demo Flow:**

1. **Forecasting (ML)** - 2 min
   - Show historical data
   - ML predicts 250K req/min peak
   - Capacity planning dashboard

2. **Load Testing (K6)** - 2.5 min
   - Run Black Friday simulation
   - Show K6 dashboard
   - Problem detected: Payment API failing
   - Correlated with APM automatically

3. **Investigation** - 3 min
   - **Traces:** Distributed trace shows Redis timeout
   - **Logs:** Connection pool exhausted
   - **K8s:** Pod restarts visible
   - **DB Monitoring:** Redis maxed out
   - **Frontend O11y:** User impact visible

4. **Solution** - 2 min
   - Scale Redis cluster
   - Re-run K6 test
   - All metrics green
   - SLO validated

5. **War Room Prep** - 1 min
   - OnCall schedule configured
   - Incident runbooks ready
   - Unified dashboard for executives

**Result:** $2M saved, 99.95% uptime achieved

---

## ✅ Grafana Products Covered

This demo covers ALL required products for certification:

- ✅ **Big Tent Data Sources** - PostgreSQL, MongoDB, Redis, AWS (simulated)
- ✅ **IRM - SLO** - SLO configuration and burn rate monitoring
- ✅ **IRM - Alerting** - Multi-dimensional alerts
- ✅ **IRM - OnCall** - Schedule and escalation
- ✅ **IRM - Incident** - Incident management workflow
- ✅ **Application Observability** - Full APM with OpenTelemetry
- ✅ **Frontend Observability** - Grafana Faro RUM
- ✅ **Kubernetes Monitoring** - Pod, deployment, resource monitoring
- ✅ **Database Monitoring** - PostgreSQL, MongoDB, Redis dashboards
- ✅ **K6** - Load testing at scale
- ✅ **OpenTelemetry** - Native OTel instrumentation
- ✅ **Prometheus Metrics (Mimir)** - Time-series metrics
- ✅ **Logs (Loki)** - Centralized logging
- ✅ **Traces (Tempo)** - Distributed tracing
- ✅ **Dashboard Event Annotations** - Deployments, incidents

---

## 🛠️ Scripts

### Windows (.bat)

```powershell
.\scripts\setup.bat                # Initial setup
.\scripts\start.bat                # Start all services
.\scripts\stop.bat                 # Stop all services
.\scripts\generate-traffic.bat     # Generate normal traffic
.\scripts\black-friday.bat         # Simulate Black Friday
.\scripts\cleanup.bat              # Clean all data
```

### Linux/Mac (.sh)

```bash
./scripts/setup.sh                # Initial setup
./scripts/start.sh                # Start all services
./scripts/stop.sh                 # Stop all services
./scripts/generate-traffic.sh     # Generate normal traffic
./scripts/black-friday.sh         # Simulate Black Friday
./scripts/cleanup.sh              # Clean all data
```

---

## 📊 Dashboards

Import these dashboards into your Grafana Cloud:

1. **Executive Overview** - `/grafana/dashboards/executive-overview.json`
2. **Application Performance** - `/grafana/dashboards/application-performance.json`
3. **Kubernetes Monitoring** - `/grafana/dashboards/kubernetes-monitoring.json`
4. **Database Monitoring** - `/grafana/dashboards/database-monitoring.json`
5. **SLO Dashboard** - `/grafana/dashboards/slo-dashboard.json`
6. **K6 Results** - `/grafana/dashboards/k6-results.json`

---

## 🐛 Troubleshooting

### Docker Issues

**Problem:** Docker containers not starting
```powershell
# Check Docker Desktop is running
docker info

# Check logs
docker-compose logs [service-name]

# Restart Docker Desktop
```

**Problem:** Port already in use
```powershell
# Find process using port
netstat -ano | findstr :3000

# Kill process
taskkill /PID [process-id] /F
```

### Database Connection Issues

**Problem:** Services can't connect to databases
```powershell
# Check database health
docker-compose ps

# Restart databases
docker-compose restart postgres redis mongodb

# Check logs
docker-compose logs postgres
```

### Grafana Cloud Connection

**Problem:** No data appearing in Grafana
```powershell
# Check Alloy logs
docker-compose logs alloy

# Verify .env credentials
type .env

# Test connection
curl http://localhost:12345
```

### Build Errors

**Problem:** Docker build fails
```powershell
# Clean build cache
docker-compose build --no-cache

# Remove old images
docker system prune -a

# Rebuild
docker-compose up -d --build
```

---

## 📚 Additional Resources

- **Grafana Cloud Docs:** https://grafana.com/docs/grafana-cloud/
- **OpenTelemetry Docs:** https://opentelemetry.io/docs/
- **K6 Documentation:** https://k6.io/docs/
- **Grafana Faro:** https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/

---

## 🎓 Certification Demo Script

See `/docs/DEMO_SCRIPT.md` for a complete word-by-word script for your 10-minute certification demo.

---

## 📝 License

This project is for educational purposes as part of Grafana PreSales Solution Architect certification.

---

## 🆘 Support

If you encounter issues:

1. Check `/docs/TROUBLESHOOTING.md`
2. Review Docker Desktop logs
3. Verify .env configuration
4. Check Grafana Cloud status: https://status.grafana.com/

---

## ✨ Credits

Created for Grafana PreSales Solution Architect Certification Demo
Black Friday Scenario - Full Implementation

**Next Steps:**
1. Configure your .env file
2. Run `docker-compose up -d --build`
3. Access frontend at http://localhost:3001
4. Run load tests with K6
5. View dashboards in Grafana Cloud
6. Practice your demo!

Good luck with your certification! 🚀

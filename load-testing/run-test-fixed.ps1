# K6 Test Runner for ShopNow
# Runs K6 load tests with proper configuration

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('smoke', 'baseline', 'black-friday')]
    [string]$Test = 'smoke',
    
    [Parameter(Mandatory=$false)]
    [string]$ApiUrl = 'http://localhost:3000',
    
    [Parameter(Mandatory=$false)]
    [switch]$Cloud = $false
)

Write-Host ""
Write-Host "ðŸš€ ================================================" -ForegroundColor Cyan
Write-Host "   ShopNow K6 Load Testing" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if K6 is installed
try {
    $k6Version = k6 version
    Write-Host "âœ… K6 installed: $k6Version" -ForegroundColor Green
} catch {
    Write-Host "âŒ K6 is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install K6:" -ForegroundColor Yellow
    Write-Host "   Windows: choco install k6" -ForegroundColor White
    Write-Host "   Or download from: https://k6.io/docs/get-started/installation/" -ForegroundColor White
    exit 1
}

# Select test script
$scriptPath = switch ($Test) {
    'smoke'        { ".\scripts\smoke-test.js" }
    'baseline'     { ".\scripts\baseline.js" }
    'black-friday' { ".\scripts\black-friday.js" }
}

Write-Host "ðŸ“ Test: $Test" -ForegroundColor Yellow
Write-Host "ðŸ“ API URL: $ApiUrl" -ForegroundColor Yellow
Write-Host "ðŸ“„ Script: $scriptPath" -ForegroundColor Yellow

if ($Cloud) {
    Write-Host "â˜ï¸  Mode: K6 Cloud" -ForegroundColor Yellow
} else {
    Write-Host "ðŸ’» Mode: Local" -ForegroundColor Yellow
}

Write-Host ""

# Check if services are running
Write-Host "ðŸ” Checking if services are running..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/health" -Method Get -TimeoutSec 5
    Write-Host "âœ… API Gateway is healthy" -ForegroundColor Green
} catch {
    Write-Host "âŒ API Gateway is not responding!" -ForegroundColor Red
    Write-Host "   Make sure services are running: docker-compose ps" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "ðŸš€ Starting K6 test..." -ForegroundColor Green
Write-Host ""

# Run K6 test
$env:API_URL = $ApiUrl

if ($Cloud) {
    # Run with K6 Cloud
    Write-Host "â˜ï¸  Uploading to K6 Cloud..." -ForegroundColor Cyan
    k6 cloud $scriptPath
} else {
    # Run locally
    k6 run $scriptPath
}

$exitCode = $LASTEXITCODE

Write-Host ""

if ($exitCode -eq 0) {
    Write-Host "âœ… Test completed successfully!" -ForegroundColor Green
} else {
    Write-Host "âŒ Test failed with exit code: $exitCode" -ForegroundColor Red
}

Write-Host ""
Write-Host "ðŸ“Š View results in Grafana Cloud:" -ForegroundColor Cyan
Write-Host "   https://axel041219.grafana.net" -ForegroundColor White
Write-Host ""

exit $exitCode

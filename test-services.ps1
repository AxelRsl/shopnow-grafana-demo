# ShopNow Services Test Script
# Tests all endpoints and generates traffic for Grafana demo

Write-Host ""
Write-Host "🧪 ================================================" -ForegroundColor Cyan
Write-Host "   ShopNow Services Test Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Test API Gateway Health
Write-Host "1. Testing API Gateway..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get
    Write-Host "   ✅ API Gateway is healthy" -ForegroundColor Green
    Write-Host "   Uptime: $([math]::Round($response.uptime, 2)) seconds" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ API Gateway not responding: $_" -ForegroundColor Red
    Write-Host "   Make sure services are running: docker-compose ps" -ForegroundColor Yellow
    exit 1
}

Start-Sleep -Seconds 1

# Test Order Service Health
Write-Host ""
Write-Host "2. Testing Order Service..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8003/health" -Method Get
    Write-Host "   ✅ Order Service is healthy" -ForegroundColor Green
    Write-Host "   Uptime: $([math]::Round($response.uptime, 2)) seconds" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Order Service not responding: $_" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 1

# Test Products Endpoint
Write-Host ""
Write-Host "3. Testing Products Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/products" -Method Get
    $productCount = $response.data.Count
    Write-Host "   ✅ Found $productCount products" -ForegroundColor Green
    Write-Host "   Source: $($response.source)" -ForegroundColor Gray
    if ($response.data.Count -gt 0) {
        Write-Host "   Sample: $($response.data[0].name) - `$$($response.data[0].price)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Products endpoint failed: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Create Test Orders
Write-Host ""
Write-Host "4. Creating Test Orders (5 orders)..." -ForegroundColor Yellow
$successOrders = 0
$failedOrders = 0

1..5 | ForEach-Object {
    try {
        $orderBody = @{
            user_id = 1
            items = @(
                @{ product_id = (Get-Random -Minimum 1 -Maximum 10); quantity = (Get-Random -Minimum 1 -Maximum 3) }
            )
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/orders" `
            -Method Post `
            -ContentType "application/json" `
            -Body $orderBody

        Write-Host "   ✅ Order $_ created - ID: $($response.order.id), Total: `$$($response.order.total)" -ForegroundColor Green
        $successOrders++
        Start-Sleep -Milliseconds 500
    } catch {
        Write-Host "   ⚠️  Order $_ failed (this is normal - some fail by design)" -ForegroundColor Yellow
        $failedOrders++
    }
}

Write-Host "   Orders created: $successOrders successful, $failedOrders failed" -ForegroundColor Gray

Start-Sleep -Seconds 1

# Generate Traffic
Write-Host ""
Write-Host "5. Generating Traffic (50 requests)..." -ForegroundColor Yellow
$trafficSuccess = 0
$trafficFailed = 0

1..50 | ForEach-Object {
    try {
        Invoke-RestMethod -Uri "http://localhost:3000/api/products" -Method Get | Out-Null
        Write-Host "." -NoNewline -ForegroundColor Green
        $trafficSuccess++
        Start-Sleep -Milliseconds 200
    } catch {
        Write-Host "x" -NoNewline -ForegroundColor Red
        $trafficFailed++
    }
}

Write-Host ""
Write-Host "   ✅ Traffic generation complete: $trafficSuccess success, $trafficFailed failed" -ForegroundColor Green

Start-Sleep -Seconds 1

# Summary
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ All Tests Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Summary:" -ForegroundColor Yellow
Write-Host "   • API Gateway: Running" -ForegroundColor White
Write-Host "   • Order Service: Running" -ForegroundColor White
Write-Host "   • Products loaded: $productCount" -ForegroundColor White
Write-Host "   • Orders created: $successOrders" -ForegroundColor White
Write-Host "   • Traffic generated: $trafficSuccess requests" -ForegroundColor White
Write-Host ""
Write-Host " Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Go to Grafana Cloud: https://axel041219.grafana.net" -ForegroundColor White
Write-Host "   2. Click 'Explore' (compass icon)" -ForegroundColor White
Write-Host "   3. Select 'Tempo' and search: {service.name=`"api-gateway`"}" -ForegroundColor White
Write-Host "   4. You should see distributed traces! 🎉" -ForegroundColor White
Write-Host ""
Write-Host " Want more traffic? Run: generate-load.ps1" -ForegroundColor Yellow
Write-Host ""

param(
    [int]$Duration = 5,
    [int]$RequestsPerMinute = 60
)

Write-Host ""
Write-Host " ================================================" -ForegroundColor Red
Write-Host "   ShopNow Load Generator - Black Friday Mode" -ForegroundColor Red
Write-Host "================================================" -ForegroundColor Red
Write-Host ""
Write-Host "  Duration: $Duration minutes" -ForegroundColor Yellow
Write-Host " Target: $RequestsPerMinute requests/minute" -ForegroundColor Yellow
Write-Host ""

$delayMs = [int]((60000 / $RequestsPerMinute))
$endTime = (Get-Date).AddMinutes($Duration)
$requestCount = 0
$orderCount = 0
$errorCount = 0

Write-Host " Starting load generation... (Press Ctrl+C to stop)" -ForegroundColor Green
Write-Host ""

try {
    while ((Get-Date) -lt $endTime) {
        $remaining = [math]::Round(($endTime - (Get-Date)).TotalMinutes, 1)
        $action = Get-Random -Minimum 1 -Maximum 100
        
        try {
            if ($action -le 70) {
                Invoke-RestMethod -Uri "http://localhost:3000/api/products" -Method Get | Out-Null
                Write-Host "." -NoNewline -ForegroundColor Green
                $requestCount++
            } else {
                $orderBody = @{
                    user_id = (Get-Random -Minimum 1 -Maximum 5)
                    items = @(
                        @{ 
                            product_id = (Get-Random -Minimum 1 -Maximum 20)
                            quantity = (Get-Random -Minimum 1 -Maximum 3)
                        }
                    )
                } | ConvertTo-Json
                
                Invoke-RestMethod -Uri "http://localhost:3000/api/orders" -Method Post -ContentType "application/json" -Body $orderBody | Out-Null
                Write-Host "O" -NoNewline -ForegroundColor Cyan
                $orderCount++
                $requestCount++
            }
            
            if (($requestCount % 50) -eq 0 -and $requestCount -gt 0) {
                Write-Host ""
                Write-Host "   Progress: $requestCount requests, $orderCount orders, $errorCount errors |   $remaining min left" -ForegroundColor Gray
            }
        } catch {
            Write-Host "x" -NoNewline -ForegroundColor Red
            $errorCount++
        }
        
        Start-Sleep -Milliseconds $delayMs
    }
} catch {
    Write-Host ""
    Write-Host "  Load generation stopped by user" -ForegroundColor Yellow
}

Write-Host ""
Write-Host ""
Write-Host "================================================" -ForegroundColor Red
Write-Host " Load Generation Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Red
Write-Host ""
Write-Host " Statistics:" -ForegroundColor Yellow
Write-Host "    Total requests: $requestCount" -ForegroundColor White
Write-Host "    Orders created: $orderCount" -ForegroundColor White
Write-Host "    Errors: $errorCount" -ForegroundColor White
if ($requestCount -gt 0) {
    Write-Host "    Success rate: $([math]::Round((($requestCount - $errorCount) / $requestCount) * 100, 2))%" -ForegroundColor White
} else {
    Write-Host "    Success rate: 0%" -ForegroundColor White
}
Write-Host ""
Write-Host " Check Grafana Cloud: https://axel041219.grafana.net" -ForegroundColor Cyan
Write-Host ""

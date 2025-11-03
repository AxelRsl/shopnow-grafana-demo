# Generate Frontend Traffic - Opens browser to generate Faro RUM data
# This script helps generate real user traffic for Grafana Faro monitoring

param(
    [Parameter(Mandatory=$false)]
    [int]$Users = 1,
    
    [Parameter(Mandatory=$false)]
    [string]$Url = 'http://localhost:3001'
)

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Generate Frontend Traffic for Faro RUM" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[INFO] Opening $Users browser window(s)..." -ForegroundColor Yellow
Write-Host "[URL]  $Url" -ForegroundColor Yellow
Write-Host ""

Write-Host "This will open your default browser and navigate to the frontend." -ForegroundColor White
Write-Host "Interact with the page to generate Faro RUM data:" -ForegroundColor White
Write-Host "  - Browse products" -ForegroundColor Gray
Write-Host "  - Click 'Add to Cart' buttons" -ForegroundColor Gray
Write-Host "  - Click 'Checkout'" -ForegroundColor Gray
Write-Host "  - Scroll through the page" -ForegroundColor Gray
Write-Host ""

# Open browser windows
for ($i = 1; $i -le $Users; $i++) {
    Write-Host "[OK] Opening browser window $i..." -ForegroundColor Green
    Start-Process $Url
    
    if ($Users -gt 1 -and $i -lt $Users) {
        Start-Sleep -Seconds 2
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Browser(s) opened! Interact with the page to generate data." -ForegroundColor Green
Write-Host ""
Write-Host "View Faro RUM data in Grafana Cloud:" -ForegroundColor Yellow
Write-Host "  https://axel041219.grafana.net" -ForegroundColor White
Write-Host ""
Write-Host "Navigate to:" -ForegroundColor Yellow
Write-Host "  Frontend Application → Sessions" -ForegroundColor White
Write-Host "  Frontend Application → Page Loads" -ForegroundColor White
Write-Host "  Frontend Application → User Interactions" -ForegroundColor White
Write-Host ""

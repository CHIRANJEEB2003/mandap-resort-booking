# Starts both backend and frontend dev servers
# Backend: http://localhost:5000
# Frontend: http://localhost:3000

$env:PATH = "C:\Users\PC-4\node;" + $env:PATH

Write-Host "Starting Mandap & Resort Booking Platform..." -ForegroundColor Cyan
Write-Host ""

# Start backend in a new window
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "`$env:PATH = 'C:\Users\PC-4\node;' + `$env:PATH; Set-Location 'c:\Resort Booking\backend'; Write-Host 'Backend starting on http://localhost:5000' -ForegroundColor Green; npm run dev"
) -WindowStyle Normal

Start-Sleep -Seconds 2

# Start frontend in a new window
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "`$env:PATH = 'C:\Users\PC-4\node;' + `$env:PATH; Set-Location 'c:\Resort Booking\frontend'; Write-Host 'Frontend starting on http://localhost:3000' -ForegroundColor Green; npm run dev"
) -WindowStyle Normal

Write-Host "Both servers are starting in separate windows." -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:   http://localhost:3000" -ForegroundColor Yellow
Write-Host "  Backend:    http://localhost:5000" -ForegroundColor Yellow
Write-Host "  Admin:      http://localhost:3000/admin/login" -ForegroundColor Yellow
Write-Host "              admin@mandapbooking.in / Admin@12345" -ForegroundColor Yellow

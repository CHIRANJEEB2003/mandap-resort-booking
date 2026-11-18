# Run this ONCE to create the database and run migrations
# Usage: .\setup-db.ps1

$env:PATH = "C:\Users\PC-4\node;C:\Program Files\PostgreSQL\18\bin;" + $env:PATH
$env:PGPASSWORD = "2026"

Write-Host "Creating database..." -ForegroundColor Cyan

# Create database and user
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h 127.0.0.1 -p 5432 -c "CREATE DATABASE mandap_booking;" 2>&1
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h 127.0.0.1 -p 5432 -c "CREATE USER mandap WITH PASSWORD 'mandap_pass';" 2>&1
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h 127.0.0.1 -p 5432 -c "GRANT ALL PRIVILEGES ON DATABASE mandap_booking TO mandap;" 2>&1
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h 127.0.0.1 -p 5432 -c "ALTER DATABASE mandap_booking OWNER TO mandap;" 2>&1
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h 127.0.0.1 -p 5432 -d "mandap_booking" -c "GRANT ALL ON SCHEMA public TO mandap;" 2>&1

Write-Host "Running Prisma migrations..." -ForegroundColor Cyan
Set-Location "c:\Resort Booking\backend"
npx prisma migrate dev --name init

Write-Host "Seeding database..." -ForegroundColor Cyan
node prisma/seed.js

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "Admin login: admin@mandapbooking.in / Admin@12345" -ForegroundColor Yellow

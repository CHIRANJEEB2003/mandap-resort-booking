# Starts a local MongoDB for development as a single-node replica set
# (Prisma requires a replica set for transactions and nested writes).
#
# Runs on port 27018 with data in .mongo-data/ so it does not touch the
# standard MongoDB service on 27017. Matches backend/.env:
#   DATABASE_URL="mongodb://127.0.0.1:27018/mandap_booking?replicaSet=rs0&directConnection=true"
#
# Usage:  .\start-mongo-dev.ps1     (keep this window open while developing; Ctrl+C stops it)

$root   = $PSScriptRoot
$data   = Join-Path $root ".mongo-data"
$mongod = Get-ChildItem "C:\Program Files\MongoDB\Server\*\bin\mongod.exe" -ErrorAction SilentlyContinue |
          Sort-Object FullName -Descending | Select-Object -First 1
if (-not $mongod) { Write-Error "mongod.exe not found under C:\Program Files\MongoDB\Server"; exit 1 }

New-Item -ItemType Directory -Force $data | Out-Null
$firstRun = -not (Test-Path (Join-Path $data "WiredTiger"))

$proc = Start-Process -FilePath $mongod.FullName -PassThru -NoNewWindow -ArgumentList @(
  "--replSet", "rs0", "--port", "27018", "--bind_ip", "127.0.0.1", "--dbpath", "`"$data`""
)

if ($firstRun) {
  Write-Host "First run: initiating replica set and loading data..." -ForegroundColor Cyan
  Start-Sleep -Seconds 4
  Push-Location (Join-Path $root "backend")
  node prisma/init-replset.js 27018
  Start-Sleep -Seconds 3
  npx prisma db push --skip-generate
  node prisma/ensure-indexes.js
  node prisma/seed.js
  node seed-demo.js
  Pop-Location
}

Write-Host "MongoDB dev replica set running on 127.0.0.1:27018 (PID $($proc.Id)). Ctrl+C to stop." -ForegroundColor Green
Wait-Process -Id $proc.Id

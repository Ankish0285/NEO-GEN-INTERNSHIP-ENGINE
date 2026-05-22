# Stop whatever is using port 5000, then start the API with latest routes.
$conns = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($conns) {
  $conns | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
    Write-Host "Stopping process $_ on port 5000..."
    taskkill /F /PID $_ 2>$null
    Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 3
}
Set-Location $PSScriptRoot
Write-Host "Starting NeoGen backend..."
npm start

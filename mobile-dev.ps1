# FlowTrails Mobile Development Startup Script
# Automatically detects existing connections before attempting wireless connect
#
# Setup Instructions:
# 1. Enable Developer Options on your Android phone
# 2. Enable USB Debugging
# 3. Enable Wireless Debugging (Settings > Developer Options > Wireless Debugging)
# 4. Update PHONE_IP and PHONE_PORT below with values from Wireless Debugging screen
# 5. Run this script or use "📱 Mobile Dev Server" in VS Code

$PHONE_IP = "192.168.1.100"  # Update with your phone's IP
$PHONE_PORT = "NEEDS_TO_BE_SET"  # Update with port from Wireless Debugging (e.g., "192.168.1.100:37849")

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FlowTrails Mobile Development" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if any device is already connected
$devices = (adb devices 2>$null) -split "`n" | Where-Object { $_ -match "device$" }

if ($devices) {
    Write-Host "Device already connected!" -ForegroundColor Green
    $devices | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
} else {
    Write-Host "No device connected. Attempting wireless connect..." -ForegroundColor Yellow

    if ($PHONE_PORT -eq "NEEDS_TO_BE_SET") {
        Write-Host ""
        Write-Host "PHONE_PORT not configured!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Setup Instructions:" -ForegroundColor Cyan
        Write-Host "  1. On your phone: Settings > Developer Options > Wireless Debugging" -ForegroundColor White
        Write-Host "  2. Note the IP address and port number shown" -ForegroundColor White
        Write-Host "  3. Edit mobile-dev.ps1 and update PHONE_IP and PHONE_PORT" -ForegroundColor White
        Write-Host ""
        Write-Host "Example:" -ForegroundColor DarkGray
        Write-Host '  $PHONE_IP = "192.168.1.100"' -ForegroundColor DarkGray
        Write-Host '  $PHONE_PORT = "192.168.1.100:37849"' -ForegroundColor DarkGray
        Write-Host ""
        exit 1
    }

    Write-Host "Connecting to ${PHONE_PORT}..." -ForegroundColor Cyan
    adb connect $PHONE_PORT

    # Verify connection
    Start-Sleep -Seconds 1
    $connected = (adb devices 2>$null) -split "`n" | Where-Object { $_ -match "device$" }
    if (-not $connected) {
        Write-Host ""
        Write-Host "Connection failed!" -ForegroundColor Red
        Write-Host "Check that:" -ForegroundColor Yellow
        Write-Host "  - Wireless Debugging is enabled on your phone" -ForegroundColor White
        Write-Host "  - The port number is current (it changes!)" -ForegroundColor White
        Write-Host "  - Your phone and computer are on the same network" -ForegroundColor White
        Write-Host ""
        exit 1
    }
}

Write-Host ""
Write-Host "Setting up port forwarding..." -ForegroundColor Cyan
adb reverse tcp:7153 tcp:7153

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Ready for mobile testing!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "On your phone, open Chrome and go to:" -ForegroundColor Yellow
Write-Host "  http://localhost:7153" -ForegroundColor White
Write-Host ""
Write-Host "Starting dev server with --host flag..." -ForegroundColor Cyan
Write-Host ""

npm run dev -- --host

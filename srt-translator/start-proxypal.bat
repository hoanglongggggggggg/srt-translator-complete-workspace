@echo off
REM Start ProxyPal from source

echo ========================================
echo Starting ProxyPal...
echo ========================================
echo.

REM Check if ProxyPal directory exists
if not exist "E:\translate v3\proxypal" (
    echo ERROR: ProxyPal source not found at E:\translate v3\proxypal
    echo.
    pause
    exit /b 1
)

echo Found ProxyPal source at: E:\translate v3\proxypal
echo.

REM Go to ProxyPal directory
cd /d "E:\translate v3\proxypal"

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing ProxyPal dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
)

echo.
echo Starting ProxyPal in development mode...
echo This will run on http://localhost:8317
echo.
echo Keep this window open!
echo ========================================
echo.

REM Start ProxyPal (this will keep running)
call npm run tauri dev

pause

@echo off
REM ============================================
REM Master Script - Run ProxyPal + SRT Translator
REM ============================================

echo.
echo ========================================
echo  Starting ProxyPal + SRT Translator
echo ========================================
echo.

REM Kill old processes
echo Cleaning old processes...
taskkill /F /IM cargo.exe 2>nul
taskkill /F /IM rustc.exe 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Opening 2 terminals...
echo.
echo [1] ProxyPal Terminal (Keep it open!)
echo [2] SRT Translator Terminal
echo.

REM Terminal 1: ProxyPal
start "ProxyPal" cmd /k "cd /d E:\translate v3\proxypal && set PATH=%PATH%;%USERPROFILE%\.cargo\bin && echo ======================================== && echo  ProxyPal Starting... && echo ======================================== && echo. && npm run tauri dev"

REM Wait 3 seconds
echo Waiting 3 seconds for ProxyPal to start...
timeout /t 3 /nobreak >nul

REM Terminal 2: SRT Translator
start "SRT Translator" cmd /k "cd /d E:\translate v3\srt-translator && set PATH=%PATH%;%USERPROFILE%\.cargo\bin && echo ======================================== && echo  SRT Translator Starting... && echo ======================================== && echo. && npm run tauri dev"

echo.
echo ========================================
echo  Both terminals opened!
echo ========================================
echo.
echo Terminal 1: ProxyPal (port 8317)
echo Terminal 2: SRT Translator (port 5173)
echo.
echo Keep both terminals open!
echo.
echo First time will take 3-5 minutes to compile.
echo After that, both apps will open automatically.
echo.
pause

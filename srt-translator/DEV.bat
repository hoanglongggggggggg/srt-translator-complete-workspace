@echo off
REM ============================================
REM SRT Translator - Dev Mode (Quick)
REM ============================================

echo.
echo ========================================
echo  SRT Translator - Dev Mode
echo ========================================
echo.

REM Kill old processes
echo Killing old processes...
taskkill /F /IM cargo.exe 2>nul
taskkill /F /IM rustc.exe 2>nul
taskkill /F /IM srt-translator.exe 2>nul
timeout /t 2 /nobreak >nul

REM Set PATH
set PATH=%PATH%;%USERPROFILE%\.cargo\bin

REM Go to directory
cd /d "E:\translate v3\srt-translator"

REM Clean (quick)
echo Cleaning...
cd src-tauri
cargo clean 2>nul
cd ..
timeout /t 2 /nobreak >nul

REM Run dev mode
echo.
echo Starting dev mode...
echo Window will open automatically.
echo Keep this terminal open!
echo.
npm run tauri dev

pause

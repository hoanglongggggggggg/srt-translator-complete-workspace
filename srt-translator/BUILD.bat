@echo off
REM ============================================
REM SRT Translator - One Click Build
REM ============================================

echo.
echo ========================================
echo  SRT Translator - One Click Build
echo ========================================
echo.

REM Step 1: Kill old processes
echo [1/6] Killing old Rust processes...
taskkill /F /IM cargo.exe 2>nul
taskkill /F /IM rustc.exe 2>nul
taskkill /F /IM srt-translator.exe 2>nul
timeout /t 2 /nobreak >nul

REM Step 2: Add Cargo to PATH
echo [2/6] Setting up Cargo PATH...
set PATH=%PATH%;%USERPROFILE%\.cargo\bin

REM Step 3: Check Cargo
echo [3/6] Checking Cargo installation...
cargo --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Cargo not found!
    echo Please install Rust from: https://rustup.rs/
    echo.
    pause
    exit /b 1
)
echo     Cargo OK!

REM Step 4: Clean build
echo [4/6] Cleaning old build files...
cd /d "E:\translate v3\srt-translator\src-tauri"
cargo clean 2>nul
cd ..
timeout /t 2 /nobreak >nul

REM Step 5: Build
echo [5/6] Building SRT Translator...
echo     This will take 3-5 minutes...
echo     Please wait...
echo.
npm run tauri build

REM Step 6: Check result
if errorlevel 1 (
    echo.
    echo ========================================
    echo  BUILD FAILED!
    echo ========================================
    echo.
    echo Possible causes:
    echo   - File lock (restart computer)
    echo   - Missing dependencies
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  BUILD SUCCESS!
echo ========================================
echo.
echo EXE file location:
echo src-tauri\target\release\srt-translator.exe
echo.
echo You can now:
echo   1. Double-click the .exe to run
echo   2. Copy it anywhere
echo   3. Share with others
echo.
pause

REM Optional: Open folder
explorer "src-tauri\target\release"

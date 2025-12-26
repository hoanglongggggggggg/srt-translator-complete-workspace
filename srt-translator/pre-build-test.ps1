# Simplified Pre-Build Test Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SRT Translator Pre-Build Tests      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$errors = 0
$warnings = 0

# Test 1: Backend Compilation
Write-Host "`n[1/5] Backend compilation..." -ForegroundColor Yellow
Set-Location "e:\translate v3\srt-translator\src-tauri"
$result = cargo check 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  PASS: Backend compiles" -ForegroundColor Green
} else {
    Write-Host "  FAIL: Backend has errors" -ForegroundColor Red
    $errors++
}

# Test 2: Frontend Build
Write-Host "`n[2/5] Frontend build..." -ForegroundColor Yellow
Set-Location "e:\translate v3\srt-translator"
$result = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  PASS: Frontend builds" -ForegroundColor Green
} else {
    Write-Host "  FAIL: Frontend build failed" -ForegroundColor Red
    $errors++
}

# Test 3: Required Files
Write-Host "`n[3/5] File structure..." -ForegroundColor Yellow
$files = @(
    "src-tauri\src\proxy_config.rs",
    "src-tauri\src\commands\proxy_config.rs",
    "src\components\ProxySettings.tsx"
)

$missing = @()
foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        $missing += $file
    }
}

if ($missing.Count -eq 0) {
    Write-Host "  PASS: All files present" -ForegroundColor Green
} else {
    Write-Host "  FAIL: Missing files: $($missing -join ', ')" -ForegroundColor Red
    $errors++
}

# Test 4: Command Registration
Write-Host "`n[4/5] Command registration..." -ForegroundColor Yellow
$libContent = Get-Content "src-tauri\src\lib.rs" -Raw
$commands = @("trigger_gemini_oauth", "add_gemini_key", "update_amp_config")
$registered = 0
foreach ($cmd in $commands) {
    if ($libContent -match $cmd) {
        $registered++
    }
}

if ($registered -eq $commands.Count) {
    Write-Host "  PASS: Commands registered" -ForegroundColor Green
} else {
    Write-Host "  WARN: Only $registered/$($commands.Count) commands found" -ForegroundColor Yellow
    $warnings++
}

# Test 5: Bundle Size
Write-Host "`n[5/5] Bundle size..." -ForegroundColor Yellow
$jsFile = Get-Item "dist\assets\index-*.js" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($jsFile) {
    $sizeKB = [math]::Round($jsFile.Length / 1KB, 2)
    Write-Host "  INFO: Bundle size: $sizeKB KB" -ForegroundColor Cyan
    if ($sizeKB -lt 100) {
        Write-Host "  PASS: Size OK" -ForegroundColor Green
    } else {
        Write-Host "  WARN: Bundle large" -ForegroundColor Yellow
        $warnings++
    }
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "              SUMMARY                   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($errors -eq 0) {
    Write-Host "`nSTATUS: PASS" -ForegroundColor Green
    Write-Host "Ready to build: npm run tauri build" -ForegroundColor Green
} else {
    Write-Host "`nSTATUS: FAIL ($errors errors)" -ForegroundColor Red
}

if ($warnings -gt 0) {
    Write-Host "Warnings: $warnings" -ForegroundColor Yellow
}

# Exit code
if ($errors -gt 0) { exit 1 } else { exit 0 }

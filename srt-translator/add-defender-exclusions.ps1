# Add Windows Defender Exclusions for Rust/Cargo/Tauri
# Run as Administrator!

Write-Host "Adding Windows Defender Exclusions..." -ForegroundColor Yellow

# Add Folder Exclusions
$folders = @(
    "E:\translate v3\srt-translator",
    "E:\translate v3\srt-translator\src-tauri\target",
    "$env:USERPROFILE\.cargo",
    "$env:USERPROFILE\.rustup"
)

foreach ($folder in $folders) {
    try {
        Add-MpPreference -ExclusionPath $folder
        Write-Host "✅ Added exclusion: $folder" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to add: $folder - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Add Process Exclusions  
$processes = @(
    "cargo.exe",
    "rustc.exe",
    "cargo-tauri.exe",
    "rustup.exe"
)

foreach ($process in $processes) {
    try {
        Add-MpPreference -ExclusionProcess $process
        Write-Host "✅ Added process exclusion: $process" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to add process: $process - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n✅ Done! Now try building again." -ForegroundColor Green
Write-Host "Run: npm run tauri build" -ForegroundColor Cyan

# SRT Translator - Quick Commands

## One-Click Scripts

### `BUILD.bat` - Production Build (Khuyên dùng!)

**Làm gì:**
- Kill tất cả processes cũ
- Clean build files
- Build production .exe
- Mở folder chứa .exe

**Cách dùng:**
```
Double-click BUILD.bat
Đợi 3-5 phút
→ File .exe ở: src-tauri\target\release\srt-translator.exe
```

**Sau đó:**
- Double-click .exe để dùng
- Không cần terminal
- Có thể copy đi bất kỳ đâu

---

### `DEV.bat` - Development Mode

**Làm gì:**
- Kill processes cũ
- Clean
- Run dev mode (có hot reload)

**Cách dùng:**
```
Double-click DEV.bat
Đợi 2-3 phút compile lần đầu
→ App window tự mở
```

**Lưu ý:** Giữ terminal mở!

---

## Manual Commands (Nếu script lỗi)

### Build Production:
```powershell
cd "E:\translate v3\srt-translator"
$env:PATH += ";$env:USERPROFILE\.cargo\bin"
cargo clean
npm run tauri build
```

### Run Dev:
```powershell
cd "E:\translate v3\srt-translator"
$env:PATH += ";$env:USERPROFILE\.cargo\bin"
cargo clean
npm run tauri dev
```

---

## ! Nếu File Lock Error

**Cách fix:**
1. Restart máy
2. Chạy lại `BUILD.bat`

**Hoặc:**
```powershell
# Kill manual
taskkill /F /IM cargo.exe
taskkill /F /IM rustc.exe
timeout /t 3
# Rồi chạy lại
```

---

## ✓ Sau Khi Build Xong

**File location:**
```
E:\translate v3\srt-translator\src-tauri\target\release\srt-translator.exe
```

**Dùng ngay:**
1. Double-click .exe
2. Settings → Chọn ProxyPal (FREE!)
3. Upload .srt → Translate

**Xong!** 

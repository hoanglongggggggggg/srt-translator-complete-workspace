# SRT Subtitle Translator

AI-powered SRT subtitle translation tool with batch processing and context-aware translation.

## 📖 Documentation

- **[User Guide (English)](USER_GUIDE_EN.md)** - For non-technical users
- **[Hướng Dẫn Sử Dụng (Tiếng Việt)](USER_GUIDE_VN.md)** - Dành cho người dùng phổ thông
- **[Test Plan](test-files/README.md)** - For developers

## Features

- ✅ **Robust SRT Parser** - Handles UTF-8, UTF-16 (LE/BE), encoding detection
- ✅ **Error Recovery** - Parses even malformed SRT files with helpful error messages
- ✅ **Format Preservation** - Maintains timecodes, newline style (LF/CRLF)
- ✅ **Batch Translation** - Context-aware batching with tag masking/unmasking
- ✅ **Multi-threading** - Parallel API calls with Tokio (1-5 threads)
- ✅ **Progress Tracking** - Real-time progress events with ETA
- ✅ **Retry Logic** - Exponential backoff for failed requests
- ⏳ **Simple UX** - One-click translation for non-tech users (coming soon)

## Tech Stack

**Frontend:**
- SolidJS - Reactive UI framework
- TypeScript - Type safety
- Tailwind CSS - Styling
- Vite - Build tool

**Backend:**
- Rust - High-performance backend
- Tauri v2 - Cross-platform desktop framework
- Tokio - Async runtime
- encoding_rs - Character encoding detection

## Project Status

**MVP Complete! 🎉**

All core features implemented and ready for testing:
- ✅ SRT parser with encoding detection (3 tests)
- ✅ Batch creator with context windows (5 tests)
- ✅ Multi-threaded translation worker
- ✅ OpenAI-compatible API client
- ✅ Complete UI with 3 pages
- ✅ Settings with localStorage persistence
- ✅ Real-time progress tracking

**Next: Testing & Deployment 🚀**

## Pages

- **Home** (`/`) - Upload SRT files and start translation
- **Settings** (`/settings`) - Configure API, languages, performance
- **Preview** (`/preview`) - Review and edit translations

## Architecture

```
srt-translator/
├─ src/              # SolidJS frontend
│  ├─ pages/
│  │  ├─ Home.tsx           ✅ Upload & translate
│  │  ├─ Settings.tsx       ✅ Configuration
│  │  └─ Preview.tsx        ✅ Edit translations
│  ├─ stores/
│  │  └─ settings.ts        ✅ Persistent config
│  ├─ index.tsx             ✅ Router setup
│  └─ App.tsx
├─ src-tauri/        # Rust backend
│  └─ src/
│     ├─ srt/               ✅ Parser (480 lines, 3 tests)
│     ├─ translate/
│     │  ├─ batcher.rs      ✅ Batching (250 lines, 5 tests)
│     │  └─ worker.rs       ✅ Worker (330 lines)
│     ├─ commands/
│     │  ├─ files.rs        ✅ File operations
│     │  └─ jobs.rs         ✅ Job management
│     ├─ state.rs           ✅ Application state
│     └─ lib.rs             ✅ Tauri integration
└─ package.json
```
 
```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build

# Run Rust tests
cd src-tauri && cargo test
```

## Architecture

```
srt-translator/
├─ src/              # SolidJS frontend
│  ├─ App.tsx
│  ├─ index.tsx
│  └─ styles/
├─ src-tauri/        # Rust backend
│  └─ src/
│     ├─ lib.rs
│     ├─ main.rs
│     ├─ srt/        # SRT parser module ✅
│     │  └─ mod.rs   (480 lines, 3 tests)
│     └─ translate/  # Translation engine ✅
│        ├─ mod.rs
│        ├─ batcher.rs  (250 lines, 5 tests)
│        └─ worker.rs   (330 lines)
└─ package.json
```

## License

MIT

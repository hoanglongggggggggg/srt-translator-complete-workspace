# 📚 Documentation Index

## Current Tool (SRT Translator)

### User Documentation
- `README.md` - Project overview and setup
- `QUICK_START.md` - Quick start guide
- `USER_GUIDE_EN.md` - English user guide
- `USER_GUIDE_VN.md` - Vietnamese user guide

### Technical Documentation
- `src-tauri/Cargo.toml` - Rust dependencies
- `package.json` - Node.js dependencies
- `tauri.conf.json` - Tauri configuration

## ProxyPal Reference

### Documentation
- `README.md` - ProxyPal overview
- `AGENTS.md` - AI agents configuration
- `DESIGN_SPLIT_STORAGE.md` - Storage architecture
- `TEST_PLAN.md` - Testing strategy
- `WORK_SUMMARY.md` - Development summary
- `docs/minimax-integration-research.md` - MiniMax integration

### Technical
- `src-tauri/Cargo.toml` - Rust dependencies
- `package.json` - Node.js dependencies
- `tauri.conf.json` - Tauri configuration

## Quick Reference

### Key Files by Category

**UI/UX Reference:**
- ProxyPal: `proxypal-reference/src/pages/Settings.tsx`
- ProxyPal: `proxypal-reference/src/pages/Dashboard.tsx`
- ProxyPal: `proxypal-reference/src/pages/Welcome.tsx`

**Backend Reference:**
- ProxyPal: `proxypal-reference/src-tauri/src/lib.rs`
- Current: `current-tool/src-tauri/src/lib.rs`

**Translation Logic:**
- Current: `current-tool/src-tauri/src/translate/worker.rs`
- Current: `current-tool/src-tauri/src/translate/batcher.rs`

**State Management:**
- ProxyPal: `proxypal-reference/src/stores/`
- Current: `current-tool/src/stores/settings.ts`

**API Layer:**
- ProxyPal: `proxypal-reference/src/lib/tauri.ts`
- Current: (needs to be created based on ProxyPal)

## Reading Order (Recommended)

### Phase 1: Understanding ProxyPal
1. `proxypal-reference/README.md` - Overview
2. `proxypal-reference/DESIGN_SPLIT_STORAGE.md` - Architecture
3. `proxypal-reference/src/pages/Settings.tsx` - **MOST IMPORTANT**
4. `proxypal-reference/src/lib/tauri.ts` - API layer
5. `proxypal-reference/src-tauri/src/lib.rs` - Backend

### Phase 2: Understanding Current Tool
1. `current-tool/README.md` - Overview
2. `current-tool/QUICK_START.md` - Usage
3. `current-tool/src/pages/Settings.tsx` - Current UI
4. `current-tool/src-tauri/src/translate/worker.rs` - Translation engine
5. `current-tool/src-tauri/src/translate/batcher.rs` - Batching

### Phase 3: Planning
1. Review `PROMPT_FOR_GPT_PRO.md` - Mission
2. Compare ProxyPal vs Current implementations
3. Identify gaps
4. Create implementation plan

## Notes

- All `.md` files included
- All `Cargo.toml` and `package.json` included
- Source code fully copied
- Config files included

## Missing Files (Excluded)

**Intentionally Excluded:**
- Binary files (`.exe`, `.dll`, `.so`)
- Build artifacts (`target/`, `dist/`, `node_modules/`)
- Images (`.png`, `.jpg`, `.ico`, `.svg`, `.webp`)
- Font files (`.woff`, `.woff2`, `.ttf`)
- Git history (`.git/`)

These are not needed for redesign work.

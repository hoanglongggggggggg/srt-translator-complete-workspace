# SRT Translator - Complete Workspace for GPT Pro Review

This repository contains the **COMPLETE workspace** for the SRT Translator project, including all context needed for debugging the Milestone A+B integration issue.

## 🔴 CRITICAL ISSUE

**Status:** BLOCKER - Blank screen after Milestone A+B integration  
**Need:** GPT Pro investigation and fix  

See [`srt-translator/BUG_REPORT.md`](./srt-translator/BUG_REPORT.md) for quick summary.

## 📁 Repository Structure

```
translate v3/
├── srt-translator/              ← MAIN PROJECT (has the bug)
│   ├── src/                     ← Milestone A+B integrated here
│   ├── BUG_REPORT.md           ← START HERE for bug details
│   └── package.json            ← Check dependencies
│
├── proxypal/                    ← REFERENCE PROJECT
│   ├── src/                     ← Original ProxyPal UI
│   └── docs/                    ← ProxyPal documentation
│
├── GPT_PRO_COMPLETE_REDESIGN/   ← Original design specs
│   ├── PROMPT_FOR_GPT_PRO.md   ← Original requirements
│   ├── README.md               ← Design guidelines
│   └── DOCS_INDEX.md           ← Documentation index
│
├── MILESTONE_A_REVIEW/          ← Milestone A deliverables
│   └── GPT_PRO_COMPLETE_REDESIGN/
│       └── current-tool/        ← Milestone A files
│
└── MILESTONE_B_REVIEW/          ← Milestone B deliverables  
    └── GPT_PRO_COMPLETE_REDESIGN/
        └── current-tool/        ← Milestone B files (caused issue)
```

## 🎯 What to Review

### Priority 1: The Bug
1. **[`srt-translator/BUG_REPORT.md`](./srt-translator/BUG_REPORT.md)** - Bug summary
2. **[`srt-translator/src/index.tsx`](./srt-translator/src/index.tsx)** - Entry point with issue
3. **[`srt-translator/package.json`](./srt-translator/package.json)** - Dependency structure
4. **[`srt-translator/vite.config.ts`](./srt-translator/vite.config.ts)** - Vite config

### Priority 2: What Was Integrated
1. **Milestone A files:** `MILESTONE_A_REVIEW/GPT_PRO_COMPLETE_REDESIGN/current-tool/`
2. **Milestone B files:** `MILESTONE_B_REVIEW/GPT_PRO_COMPLETE_REDESIGN/current-tool/`
3. **Original specs:** `GPT_PRO_COMPLETE_REDESIGN/PROMPT_FOR_GPT_PRO.md`

### Priority 3: Reference
1. **ProxyPal source:** `proxypal/src/` - Original working UI
2. **ProxyPal docs:** `proxypal/docs/` - Architecture documentation

## 🚨 The Problem

**Symptom:** Blank white screen, no console errors  
**Root Cause:** Vite serving corrupted transforms with hardcoded `/node_modules/@solidjs/router/dist/index.jsx` paths  
**Error:** `SyntaxError: The requested module ... does not provide an export named 'Outlet'`

**Critical Gap:**
- Files on disk: `import { Outlet } from "@solidjs/router"` ✅
- Vite serves: `import { Outlet } from "/node_modules/@solidjs/router/dist/index.jsx"` ❌

## 🔧 How to Reproduce

```bash
cd srt-translator
npm install
npm run dev
# Open http://localhost:5173/ → Blank screen

# In browser DevTools console:
fetch('/src/index.tsx').then(r => r.text()).then(console.log)
# → Shows hardcoded paths

import('/src/index.tsx').catch(e => console.error(e))
# → SyntaxError
```

## 💡 Suspected Fixes

1. Move `@solidjs/router` from `devDependencies` to `dependencies`
2. Clean reinstall node_modules
3. Update/downgrade vite-plugin-solid
4. Incremental integration instead of big-bang

## 📞 Next Steps

1. Review `srt-translator/BUG_REPORT.md`
2. Try reproduction steps
3. Investigate and fix
4. Document solution in GitHub issue

## 🙏 Thank You

This workspace has everything needed to understand and fix the issue. All context, all code, all documentation.

**Main repo issue tracker:** https://github.com/hoanglongggggggggg/srt-translator-milestone-ab-debug/issues

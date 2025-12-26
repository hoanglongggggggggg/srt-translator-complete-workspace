# SRT Translator - Quick Start Guide

## For Non-Technical Users

---

## FREE Method with ProxyPal (Recommended!)

### Step 1: Install ProxyPal (You may already have it!)

If you use Cursor or Copilot, **you already have ProxyPal!**

1. Open ProxyPal
2. Make sure it's running (icon in system tray)
3. Default port: `8317`

### Step 2: Setup SRT Translator

1. Open **SRT Translator** app
2. Click ** Settings**
3. Select **Free ProxyPal** (first button, green)
4. Click ** Save Settings**

**Done! No API key needed, completely free!** 

### Step 3: Translate

1. Click ** Click to select SRT file**
2. Choose your `.srt` file
3. Click ** Translate Now**
4. Wait for progress bar
5. Get translated file: `filename_translated.srt`

**Completely FREE using your existing Cursor/Copilot subscription!** 

---

## Alternative: Use Your Own API Key (Paid)

> Only if you don't have ProxyPal or want separate quota

### Step 1: Get API Key

#### OpenAI:
1. Go to https://platform.openai.com/
2. Sign up
3. Go to **API Keys** → **Create new secret key**
4. Copy key (starts with `sk-...`)

**Cost:** ~$0.15 per 1000 lines

#### Claude:
1. Go to https://console.anthropic.com/
2. Similar process
3. Key starts with `sk-ant-...`

### Step 2: Configure

1. Open **SRT Translator**
2. Click ** Settings**
3. Select **OpenAI** or **Anthropic**
4. Paste API key
5. Click ** Save Settings**

### Step 3: Translate

Same as ProxyPal method above!

---

## Comparison

| | ProxyPal (Free) | API Key (Paid) |
|---|---|---|
| **Cost** | Free Free | ~$0.15/1000 lines |
| **Setup** | ✓ Very simple | ! Need API key |
| **Speed** | ✓ Fast | ✓ Fast |
| **Quality** | ✓ Same | ✓ Same |
| **Limits** | ! Shared with Cursor | ✓ Unlimited |

**Recommended:** ProxyPal if you have Cursor subscription!

---

## FAQ

### ? What is ProxyPal?

An app that connects Cursor/Copilot to multiple AI models. If you use Cursor, you already have it!

### ? Do I have ProxyPal?

Check:
- Do you use Cursor IDE?
- Is there a ProxyPal icon in system tray?
- If yes → Use it for free!

### ? Will translating affect Cursor?

Very little! Because:
- Subtitle translation uses minimal quota
- ProxyPal manages quota smartly
- Only very large files (5000+ lines) might impact

### ? What if I don't have ProxyPal?

Use OpenAI/Claude with API key (paid). Still very cheap (~$0.15/1000 lines).

### ? How long does translation take?

- 100 lines: ~30 seconds
- 500 lines: ~2-3 minutes
- 1000 lines: ~5 minutes

### ? Is translation accurate?

✓ Very accurate! Uses GPT-4/Claude:
- Human-level quality
- Preserves timing
- Preserves formatting (italic, bold...)

---

## Quick Summary

### With ProxyPal (Free):
```
1. Open ProxyPal
2. Settings → Select "ProxyPal" → Save
3. Select .srt file → Translate Now
```

### With API key (Paid):
```
1. Get API key from OpenAI/Claude
2. Settings → Paste key → Save
3. Select .srt file → Translate Now
```

**That's it!** 

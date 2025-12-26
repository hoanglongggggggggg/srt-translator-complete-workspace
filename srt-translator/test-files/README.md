# Test Files Guide

This directory contains test SRT files for verifying the SRT Translator application.

## Files

### 1. `small.srt` (10 cues)
**Purpose:** Basic functionality testing

Features tested:
- Simple subtitle parsing
- HTML tags (`<i>italic</i>`)
- SRT style tags (`{\an8}`)
- Multi-line cues
- Timecode preservation

**Use for:**
- Quick smoke tests
- Tag masking/unmasking verification
- Format preservation

---

### 2. `medium.srt` (30 cues)
**Purpose:** Batch boundary testing

Features tested:
- Batch creation (default 25 cues)
- Context window inclusion
- Multiple batches (2 batches expected)
- Various tag types mixed
- Batch size configuration

**Use for:**
- Verifying batch logic
- Testing context windows (2 before/2 after)
- Multi-batch execution

---

### 3. `utf8-bom.srt` (3 cues)
**Purpose:** Encoding detection

Features tested:
- UTF-8 with BOM detection
- Special characters (é, ñ, ü)
- Multi-language text (中文, 日本語, Tiếng Việt)
- BOM stripping

**Use for:**
- Encoding detection verification
- Unicode handling
- BOM processing

---

### 4. `malformed.srt` (5 cues)
**Purpose:** Error recovery

Features tested:
- Missing index lines
- Extra blank lines
- Parser robustness
- Auto-recovery

**Use for:**
- Error handling verification
- Parser resilience testing
- Real-world malformed file handling

---

## Running Tests

### Quick Test
```bash
# 1. Start app
npm run tauri dev

# 2. In Settings:
#    - Set API key
#    - Choose model

# 3. Upload test-files/small.srt
# 4. Click "Translate Now"
# 5. Verify output
```

### Expected Output
Each test file should produce a `*_translated.srt` with:
- Same cue count as original
- Preserved timecodes
- Preserved tags (HTML, SRT)
- Translated text content

### Verification
```bash
# Check cue count
cat small_translated.srt | grep -c "^[0-9]"
# Should be: 10

# Check timecodes preserved
diff <(grep --\> small.srt) <(grep --\> small_translated.srt)
# Should be empty (identical)
```

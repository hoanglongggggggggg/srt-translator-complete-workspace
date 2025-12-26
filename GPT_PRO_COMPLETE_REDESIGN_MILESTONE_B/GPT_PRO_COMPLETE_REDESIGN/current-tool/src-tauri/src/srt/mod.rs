//! SRT parsing + writing with robust error handling.
//!
//! Goals:
//! - Parse common + slightly malformed SRT files
//! - Preserve timecodes and cue ordering
//! - Detect encoding (UTF-8/UTF-16 + best-effort fallback)
//! - Return helpful errors with line numbers and suggestions

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

use thiserror::Error;

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum NewlineStyle {
    Lf,
    CrLf,
}

impl NewlineStyle {
    pub fn as_str(self) -> &'static str {
        match self {
            NewlineStyle::Lf => "\n",
            NewlineStyle::CrLf => "\r\n",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SrtTime {
    pub hours: u32,
    pub minutes: u32,
    pub seconds: u32,
    pub millis: u32,
}

impl SrtTime {
    pub fn format(&self) -> String {
        format!(
            "{:02}:{:02}:{:02},{:03}",
            self.hours, self.minutes, self.seconds, self.millis
        )
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SrtCue {
    /// Stable internal cue id (0..N-1) used for translation mapping.
    pub id: usize,

    /// Raw index line (usually "1", "2", ...). Preserved for writing.
    pub index_line: String,

    /// Raw timing line, preserved exactly as in input (trimmed).
    pub timing_line: String,

    pub start: SrtTime,
    pub end: SrtTime,

    /// Subtitle text lines as-is (without trailing newline).
    pub text_lines: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SrtDocument {
    pub newline: NewlineStyle,
    pub cues: Vec<SrtCue>,
}

#[derive(Debug, Error)]
pub enum SrtError {
    #[error("Failed to read file: {0}")]
    Io(#[from] std::io::Error),

    #[error("This file is not valid text or has an unsupported encoding. {hint}")]
    Encoding { hint: String },

    #[error("Invalid SRT format on line {line}: {message}")]
    Format { line: usize, message: String },
}

/// Read + decode bytes from disk and parse into SrtDocument.
pub fn parse_srt_file(path: &Path) -> Result<SrtDocument, SrtError> {
    let bytes = fs::read(path)?;
    parse_srt_bytes(&bytes)
}

/// Parse an SRT file from raw bytes.
pub fn parse_srt_bytes(bytes: &[u8]) -> Result<SrtDocument, SrtError> {
    let (text, newline) = decode_best_effort(bytes)?;
    parse_srt_str(&text, newline)
}

/// Best-effort decode:
/// - UTF-8 BOM
/// - UTF-16 LE/BE BOM
/// - UTF-8 (strict)
/// - fallback: chardetng guess + encoding_rs decode
fn decode_best_effort(bytes: &[u8]) -> Result<(String, NewlineStyle), SrtError> {
    // Fast BOM checks
    if bytes.starts_with(&[0xEF, 0xBB, 0xBF]) {
        let s = std::str::from_utf8(&bytes[3..]).map_err(|_| SrtError::Encoding {
            hint: "The file looks like UTF-8 with BOM, but it contains invalid UTF-8 bytes. Try re-saving as UTF-8.".into(),
        })?;
        return Ok((normalize_bom(s), detect_newline_style(s)));
    }

    if bytes.starts_with(&[0xFF, 0xFE]) {
        // UTF-16 LE
        let (cow, _, had_errors) = encoding_rs::UTF_16LE.decode(&bytes[2..]);
        if had_errors {
            return Err(SrtError::Encoding {
                hint: "The file looks like UTF-16 (LE) but contains invalid sequences. Try exporting subtitles again as UTF-8.".into(),
            });
        }
        let s = cow.into_owned();
        return Ok((normalize_bom(&s), detect_newline_style(&s)));
    }

    if bytes.starts_with(&[0xFE, 0xFF]) {
        // UTF-16 BE
        let (cow, _, had_errors) = encoding_rs::UTF_16BE.decode(&bytes[2..]);
        if had_errors {
            return Err(SrtError::Encoding {
                hint: "The file looks like UTF-16 (BE) but contains invalid sequences. Try exporting subtitles again as UTF-8.".into(),
            });
        }
        let s = cow.into_owned();
        return Ok((normalize_bom(&s), detect_newline_style(&s)));
    }

    // Try UTF-8 strict
    if let Ok(s) = std::str::from_utf8(bytes) {
        return Ok((normalize_bom(s), detect_newline_style(s)));
    }

    // Fallback: detect with chardetng + decode with encoding_rs
    let mut detector = chardetng::EncodingDetector::new();
    detector.feed(bytes, true);
    let encoding = detector.guess(None, true);
    let (cow, _, had_errors) = encoding.decode(bytes);
    if had_errors {
        return Err(SrtError::Encoding {
            hint: format!(
                "We tried decoding this file as {}, but it still contained invalid characters. Try re-saving the .srt file as UTF-8.",
                encoding.name()
            ),
        });
    }
    let s = cow.into_owned();
    Ok((normalize_bom(&s), detect_newline_style(&s)))
}

fn normalize_bom(s: &str) -> String {
    // Handle U+FEFF if it appears as a Unicode BOM in text.
    s.trim_start_matches('\u{feff}').to_string()
}

fn detect_newline_style(s: &str) -> NewlineStyle {
    if s.contains("\r\n") {
        NewlineStyle::CrLf
    } else {
        NewlineStyle::Lf
    }
}

/// Parse SRT text into document.
/// `newline` is what we detected; output writer will keep it.
pub fn parse_srt_str(text: &str, newline: NewlineStyle) -> Result<SrtDocument, SrtError> {
    // Normalize newlines for parsing.
    let normalized = text.replace("\r\n", "\n").replace('\r', "\n");
    let lines: Vec<&str> = normalized.split('\n').collect();

    let mut cues: Vec<SrtCue> = Vec::new();
    let mut i: usize = 0;
    let mut next_recovered_index: usize = 1;

    while i < lines.len() {
        // Skip blank lines
        while i < lines.len() && lines[i].trim().is_empty() {
            i += 1;
        }
        if i >= lines.len() {
            break;
        }

        // Attempt to parse index line, but allow recovery if missing.
        let index_line = lines[i].trim().to_string();

        let (index_line_used, timing_line_idx) = if is_all_digits(&index_line) {
            (index_line, i + 1)
        } else if looks_like_timing_line(lines[i]) {
            // Missing index line, recover
            let recovered = next_recovered_index.to_string();
            (recovered, i)
        } else {
            return Err(SrtError::Format {
                line: i + 1,
                message: "Expected a cue number (e.g., '1') or a timing line (e.g., '00:00:01,000 --> 00:00:03,000')."
                    .into(),
            });
        };

        if timing_line_idx >= lines.len() {
            return Err(SrtError::Format {
                line: timing_line_idx + 1,
                message: "Unexpected end of file while reading timing line.".into(),
            });
        }

        let timing_raw = lines[timing_line_idx].trim();
        if !looks_like_timing_line(timing_raw) {
            return Err(SrtError::Format {
                line: timing_line_idx + 1,
                message: "Expected a timing line like '00:00:01,000 --> 00:00:03,000'.".into(),
            });
        }

        let (start, end) = parse_timing_line(timing_raw).map_err(|msg| SrtError::Format {
            line: timing_line_idx + 1,
            message: msg,
        })?;

        // Read text lines until blank line or EOF
        let mut text_lines: Vec<String> = Vec::new();
        let mut j = timing_line_idx + 1;
        while j < lines.len() && !lines[j].trim().is_empty() {
            text_lines.push(lines[j].to_string());
            j += 1;
        }

        // Build cue
        let cue_id = cues.len();
        cues.push(SrtCue {
            id: cue_id,
            index_line: index_line_used,
            timing_line: timing_raw.to_string(),
            start,
            end,
            text_lines,
        });

        next_recovered_index += 1;
        i = j + 1; // move past blank separator
    }

    if cues.is_empty() {
        return Err(SrtError::Format {
            line: 1,
            message: "No subtitle cues found. Make sure this is a valid .srt file.".into(),
        });
    }

    Ok(SrtDocument { newline, cues })
}

fn is_all_digits(s: &str) -> bool {
    !s.is_empty() && s.chars().all(|c| c.is_ascii_digit())
}

fn looks_like_timing_line(s: &str) -> bool {
    s.contains("-->")
}

fn parse_timing_line(line: &str) -> Result<(SrtTime, SrtTime), String> {
    let arrow = "-->";
    let pos = line.find(arrow).ok_or_else(|| "Timing line is missing the '-->' separator.".to_string())?;

    let left = line[..pos].trim();
    let right = line[pos + arrow.len()..].trim();

    // Right side can include settings after end time. We only parse first token as end time.
    let mut right_parts = right.split_whitespace();
    let end_token = right_parts
        .next()
        .ok_or_else(|| "Timing line is missing end time after '-->'.".to_string())?;

    let start = parse_time(left).map_err(|e| format!("Invalid start time: {e}"))?;
    let end = parse_time(end_token).map_err(|e| format!("Invalid end time: {e}"))?;

    Ok((start, end))
}

fn parse_time(s: &str) -> Result<SrtTime, String> {
    // Accept "HH:MM:SS,mmm" or "HH:MM:SS.mmm"
    let s = s.trim();
    let parts: Vec<&str> = s.split(':').collect();
    if parts.len() != 3 {
        return Err(format!("Expected time like HH:MM:SS,mmm but got '{s}'"));
    }

    let hours: u32 = parts[0].parse().map_err(|_| format!("Invalid hours in '{s}'"))?;
    let minutes: u32 = parts[1].parse().map_err(|_| format!("Invalid minutes in '{s}'"))?;

    let sec_part = parts[2];
    let (sec_str, ms_str) = if let Some((a, b)) = sec_part.split_once(',') {
        (a, b)
    } else if let Some((a, b)) = sec_part.split_once('.') {
        (a, b)
    } else {
        return Err(format!("Expected seconds and milliseconds like SS,mmm in '{s}'"));
    };

    let seconds: u32 = sec_str.parse().map_err(|_| format!("Invalid seconds in '{s}'"))?;
    let millis: u32 = ms_str.parse().map_err(|_| format!("Invalid milliseconds in '{s}'"))?;

    if minutes > 59 || seconds > 59 || millis > 999 {
        return Err(format!("Time components out of range in '{s}'"));
    }

    Ok(SrtTime {
        hours,
        minutes,
        seconds,
        millis,
    })
}

/// Validate translation output: must match cue count.
/// You can add more checks (tag integrity, etc.) as needed.
pub fn validate_translation_count(doc: &SrtDocument, translated: &std::collections::HashMap<usize, String>) -> Result<(), String> {
    if translated.len() != doc.cues.len() {
        return Err(format!(
            "Translation mismatch: expected {} cues but got {} translations.",
            doc.cues.len(),
            translated.len()
        ));
    }
    Ok(())
}

/// Write translated SRT content, preserving timing lines and newline style.
/// `translated` maps cue_id -> translated text (may contain '\n' to represent multi-line cues).
pub fn write_srt(doc: &SrtDocument, translated: &std::collections::HashMap<usize, String>) -> Result<String, String> {
    validate_translation_count(doc, translated)?;

    let nl = doc.newline.as_str();
    let mut out = String::new();

    for cue in &doc.cues {
        out.push_str(&cue.index_line);
        out.push_str(nl);
        out.push_str(&cue.timing_line);
        out.push_str(nl);

        let text = translated
            .get(&cue.id)
            .ok_or_else(|| format!("Missing translation for cue id {}", cue.id))?;

        // Preserve multi-line by splitting on '\n'
        for line in text.split('\n') {
            out.push_str(line);
            out.push_str(nl);
        }

        out.push_str(nl);
    }

    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_srt() {
        let srt = "1\n00:00:01,000 --> 00:00:03,000\nHello world\n\n2\n00:00:04,000 --> 00:00:06,000\nSecond line\n";
        
        let doc = parse_srt_bytes(srt.as_bytes()).unwrap();
        
        assert_eq!(doc.cues.len(), 2);
        assert_eq!(doc.cues[0].text_lines[0], "Hello world");
        assert_eq!(doc.cues[1].text_lines[0], "Second line");
    }

    #[test]
    fn test_parse_with_windows_newlines() {
        let srt = "1\r\n00:00:01,000 --> 00:00:03,000\r\nHello\r\n\r\n";
        
        let doc = parse_srt_bytes(srt.as_bytes()).unwrap();
        
        assert!(matches!(doc.newline, NewlineStyle::CrLf));
        assert_eq!(doc.cues.len(), 1);
    }

    #[test]
    fn test_write_srt_preserves_format() {
        let srt = "1\n00:00:01,000 --> 00:00:03,000\nOriginal text\n\n";
        let doc = parse_srt_bytes(srt.as_bytes()).unwrap();
        
        let mut translations = std::collections::HashMap::new();
        translations.insert(0, "Translated text".to_string());
        
        let output = write_srt(&doc, &translations).unwrap();
        
        assert!(output.contains("00:00:01,000 --> 00:00:03,000"));
        assert!(output.contains("Translated text"));
    }
}

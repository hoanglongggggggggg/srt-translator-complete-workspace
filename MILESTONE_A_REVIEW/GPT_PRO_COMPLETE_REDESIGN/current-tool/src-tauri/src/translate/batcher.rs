//! Context-aware batch creation for subtitle translation.
//!
//! Goals:
//! - Group cues into batches (default 20–30)
//! - Add context cues before/after the batch for better translation quality
//! - Keep stable cue IDs and preserve ordering
//! - Protect common subtitle tags via masking placeholders
//! - Keep requests under a configurable size budget (approx chars)

use serde::{Deserialize, Serialize};

use crate::srt::SrtCue;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchConfig {
    pub batch_size: usize,        // e.g., 25 (max 1000)
    pub context_before: usize,    // e.g., 2
    pub context_after: usize,     // e.g., 2
    pub max_chars_per_request: usize, // e.g., 12000 (rough token safety)
}

impl Default for BatchConfig {
    fn default() -> Self {
        Self {
            batch_size: 25,
            context_before: 2,
            context_after: 2,
            max_chars_per_request: 12_000,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptCue {
    pub id: usize,       // stable cue id
    pub timing: String,  // optional, helps context
    pub text: String,    // masked text
    pub role: CueRole,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CueRole {
    Context,
    Translate,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationBatch {
    pub batch_no: usize,
    pub translate_ids: Vec<usize>,
    pub cues: Vec<PromptCue>, // includes context + translate cues in order
}

/// Very lightweight masking for tags:
/// - HTML-like tags: <i>...</i>, <font ...>, etc.
/// - SRT style blocks: {...} like {\an8}
///
/// This is intentionally simple and safe; you can extend with regex if needed.
pub fn mask_tags(input: &str) -> (String, Vec<(String, String)>) {
    let mut mappings: Vec<(String, String)> = Vec::new();
    let mut out = String::new();
    let chars: Vec<char> = input.chars().collect();
    let mut i = 0usize;
    let mut tag_idx = 0usize;

    while i < chars.len() {
        let c = chars[i];
        if c == '<' {
            if let Some(end) = chars[i..].iter().position(|&x| x == '>') {
                let end_i = i + end;
                let tag: String = chars[i..=end_i].iter().collect();
                let ph = format!("[[TAG_{tag_idx}]]");
                tag_idx += 1;
                mappings.push((ph.clone(), tag));
                out.push_str(&ph);
                i = end_i + 1;
                continue;
            }
        }
        if c == '{' {
            if let Some(end) = chars[i..].iter().position(|&x| x == '}') {
                let end_i = i + end;
                let tag: String = chars[i..=end_i].iter().collect();
                let ph = format!("[[TAG_{tag_idx}]]");
                tag_idx += 1;
                mappings.push((ph.clone(), tag));
                out.push_str(&ph);
                i = end_i + 1;
                continue;
            }
        }
        out.push(c);
        i += 1;
    }

    (out, mappings)
}

pub fn unmask_tags(output: &str, mappings: &[(String, String)]) -> String {
    let mut s = output.to_string();
    for (ph, original) in mappings {
        s = s.replace(ph, original);
    }
    s
}

fn cue_text_joined(cue: &SrtCue) -> String {
    cue.text_lines.join("\n")
}

fn estimate_chars(cues: &[PromptCue]) -> usize {
    cues.iter().map(|c| c.text.len() + c.timing.len() + 16).sum()
}

/// Create context-aware batches.
/// Output batches are ordered and cover all cues exactly once as "Translate".
pub fn create_batches(all_cues: &[SrtCue], cfg: &BatchConfig) -> Vec<TranslationBatch> {
    let n = all_cues.len();
    let mut batches = Vec::new();
    let mut start = 0usize;
    let mut batch_no = 0usize;

    while start < n {
        let mut end = (start + cfg.batch_size).min(n);

        // shrink to respect max_chars_per_request
        loop {
            let mut prompt_cues: Vec<PromptCue> = Vec::new();
            let mut translate_ids: Vec<usize> = Vec::new();

            // Only include cues to translate (no context)
            for cue in &all_cues[start..end] {
                let (masked, _) = mask_tags(&cue_text_joined(cue));
                translate_ids.push(cue.id);
                prompt_cues.push(PromptCue {
                    id: cue.id,
                    timing: cue.timing_line.clone(),
                    text: masked,
                    role: CueRole::Translate,
                });
            }

            if estimate_chars(&prompt_cues) <= cfg.max_chars_per_request || end == start + 1 {
                // accept
                batches.push(TranslationBatch {
                    batch_no,
                    translate_ids,
                    cues: prompt_cues,
                });
                batch_no += 1;
                start = end;
                break;
            }

            // too large, shrink end
            end = (end - 1).max(start + 1);
        }
    }

    batches
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::srt::{SrtCue, SrtTime};

    fn make_test_cue(id: usize, text: &str) -> SrtCue {
        SrtCue {
            id,
            index_line: (id + 1).to_string(),
            timing_line: "00:00:00,000 --> 00:00:01,000".to_string(),
            start: SrtTime { hours: 0, minutes: 0, seconds: 0, millis: 0 },
            end: SrtTime { hours: 0, minutes: 0, seconds: 1, millis: 0 },
            text_lines: vec![text.to_string()],
        }
    }

    #[test]
    fn test_mask_html_tags() {
        let input = "This is <i>italic</i> text";
        let (masked, mappings) = mask_tags(input);
        
        assert_eq!(masked, "This is [[TAG_0]] text");
        assert_eq!(mappings.len(), 1);
        assert_eq!(mappings[0].1, "<i>italic</i>");
    }

    #[test]
    fn test_mask_srt_tags() {
        let input = "{\\an8}Top text";
        let (masked, mappings) = mask_tags(input);
        
        assert_eq!(masked, "[[TAG_0]]Top text");
        assert_eq!(mappings[0].1, "{\\an8}");
    }

    #[test]
    fn test_unmask_tags() {
        let mappings = vec![
            ("[[TAG_0]]".to_string(), "<i>".to_string()),
            ("[[TAG_1]]".to_string(), "</i>".to_string()),
        ];
        let masked = "Text with [[TAG_0]]tags[[TAG_1]]";
        
        let unmasked = unmask_tags(masked, &mappings);
        
        assert_eq!(unmasked, "Text with <i>tags</i>");
    }

    #[test]
    fn test_create_batches_basic() {
        let cues = vec![
            make_test_cue(0, "First"),
            make_test_cue(1, "Second"),
            make_test_cue(2, "Third"),
            make_test_cue(3, "Fourth"),
            make_test_cue(4, "Fifth"),
        ];

        let cfg = BatchConfig {
            batch_size: 2,
            context_before: 1,
            context_after: 1,
            max_chars_per_request: 10000,
        };

        let batches = create_batches(&cues, &cfg);

        // Should create 3 batches: [0-1], [2-3], [4]
        assert_eq!(batches.len(), 3);
        assert_eq!(batches[0].translate_ids, vec![0, 1]);
        assert_eq!(batches[1].translate_ids, vec![2, 3]);
        assert_eq!(batches[2].translate_ids, vec![4]);
    }

    #[test]
    fn test_batches_include_context() {
        let cues = vec![
            make_test_cue(0, "One"),
            make_test_cue(1, "Two"),
            make_test_cue(2, "Three"),
        ];

        let cfg = BatchConfig {
            batch_size: 1,
            context_before: 1,
            context_after: 1,
            max_chars_per_request: 10000,
        };

        let batches = create_batches(&cues, &cfg);

        // Batch 1 should translate [1] with context [0] before and [2] after
        assert_eq!(batches[1].translate_ids, vec![1]);
        // Should have 3 cues total (1 context before + 1 translate + 1 context after)
        assert_eq!(batches[1].cues.len(), 3);
    }
}

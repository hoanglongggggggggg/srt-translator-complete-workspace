//! Tokio-based multi-threaded translator with progress event emission.
//!
//! Default client: OpenAI-compatible Chat Completions endpoint.
//! - OpenAI: POST https://api.openai.com/v1/chat/completions
//! - ProxyPal local proxy: typically http://localhost:8317/v1 (OpenAI-compatible)

use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, BTreeMap},
    sync::{Arc, Mutex},
    time::Instant,
};

use tokio::{sync::Semaphore, time::Duration};
use tauri::{Manager, Emitter};
use regex::Regex;

use crate::srt::{SrtDocument, SrtCue};
use crate::translate::batcher::{create_batches, mask_tags, unmask_tags, BatchConfig, TranslationBatch, PromptCue};

// ============================================================================
// NEWLINE ENCODING/DECODING FOR PARSE SAFETY
// ============================================================================

/// Encode newlines to prevent parse failures, with escaping to avoid collisions
fn encode_newlines(text: &str) -> String {
    // Normalize CRLF first
    let normalized = text.replace("\r\n", "\n").replace('\r', "\n");
    
    // Escape our token if it exists in source (collision safety)
    let escaped = normalized.replace("<NL>", "<NL><NL>");
    
    // Encode actual newlines
    escaped.replace('\n', "<NL>")
}

/// Decode newlines back - uses placeholder to handle escaped tokens correctly
fn decode_newlines(text: &str) -> String {
    let placeholder = "__NL_LITERAL__";
    
    // First: unescape double tokens to placeholder
    text.replace("<NL><NL>", placeholder)
        // Then: decode single tokens to newlines  
        .replace("<NL>", "\n")
        // Finally: restore literal <NL> from placeholder
        .replace(placeholder, "<NL>")
}

// ============================================================================
// NUMBERED LIST PROMPT BUILDER (COUNT-SAFE, O(n))
// ============================================================================

fn build_translation_prompt(
    batch: &TranslationBatch,
    source_lang: &str,
    target_lang: &str
) -> Result<(String, usize), TranslateError> {
    let count = batch.translate_ids.len(); // Single source of truth
    
    // Build O(1) lookup map once - avoid O(n²)
    let cue_map: HashMap<usize, &PromptCue> = batch.cues.iter()
        .map(|c| (c.id, c))
        .collect();
    
    let mut lines = Vec::with_capacity(count);
    
    // Use translate_ids to ensure exact count match
    for (idx, &cue_id) in batch.translate_ids.iter().enumerate() {
        let cue = cue_map.get(&cue_id)
            .ok_or_else(|| TranslateError::ParseError(format!(
                "Cue ID {} not found in batch.cues", cue_id
            )))?;
        
        let text_encoded = encode_newlines(&cue.text);
        lines.push(format!("{}. {}", idx + 1, text_encoded));
    }
    
    let content_list = lines.join("\n");
    
    let prompt = format!(
        "Translate the following {} subtitles to {}.\n\n\
         RULES:\n\
         - Return exactly {} lines\n\
         - Each line MUST start with its number followed by period: \"1. \", \"2. \", etc.\n\
         - Line breaks are encoded as <NL> token — keep them\n\
         - Do not insert real line breaks inside items; use <NL> token only\n\
         - No markdown, no code blocks, no extra blank lines\n\
         - Do not merge or split items\n\n\
         BEGIN\n{}\nEND\n\n\
         Output format: numbered list between BEGIN/END delimiters only.",
        source_lang, target_lang, count, content_list
    );
    
    Ok((prompt, count))
}

// ============================================================================
// NUMBERED LIST PARSER (LINE-BASED, REGEX, STRICT VALIDATION)
// ============================================================================

fn parse_numbered_response(response: &str, expected_count: usize) -> Result<Vec<String>, TranslateError> {
    // Extract content between BEGIN/END using line-based scanning
    let lines: Vec<&str> = response.lines().collect();
    let mut in_block = false;
    let mut content_lines = Vec::new();
    
    for line in lines {
        let trimmed = line.trim();
        if trimmed == "BEGIN" {
            in_block = true;
            continue;
        }
        if trimmed == "END" {
            break;
        }
        if in_block {
            content_lines.push(line);
        }
    }
    
    // If no BEGIN/END found, use entire response
    if content_lines.is_empty() {
        content_lines = response.lines().collect();
    }
    
    // Parse numbered items with continuation line support
    let item_header = Regex::new(r"^\s*(\d+)[\.\)]\s+(.*)$")
        .expect("valid regex");
    let mut items: BTreeMap<usize, String> = BTreeMap::new();
    let mut current_num: Option<usize> = None;
    
    for line in &content_lines {
        // Check for item header
        if let Some(caps) = item_header.captures(line) {
            let num: usize = caps[1].parse().map_err(|_| 
                TranslateError::ParseError(format!("Invalid number: {}", &caps[1]))
            )?;
            let text = caps[2].to_string();
            
            // Strict: error on duplicate
            if items.contains_key(&num) {
                return Err(TranslateError::ParseError(format!(
                    "Duplicate item number: {}", num
                )));
            }
            
            items.insert(num, text);
            current_num = Some(num);
        } else if let Some(num) = current_num {
            // Continuation line - only append non-empty, non-noise lines
            let trimmed = line.trim();
            if !trimmed.is_empty() && !trimmed.starts_with("Note:") {
                if let Some(existing) = items.get_mut(&num) {
                    if !existing.is_empty() {
                        existing.push('\n');
                    }
                    existing.push_str(trimmed);
                }
            }
        }
        // Else: ignore (heading, blank line, etc.)
    }
    
    // Validate: must have items 1..=expected_count
    let expected_range: Vec<usize> = (1..=expected_count).collect();
    let actual_nums: Vec<usize> = items.keys().copied().collect();
    
    if actual_nums != expected_range {
        let missing: Vec<usize> = expected_range.iter()
            .filter(|n| !items.contains_key(n))
            .copied()
            .collect();
        let extra: Vec<usize> = actual_nums.iter()
            .filter(|&&n| n == 0 || n > expected_count)
            .copied()
            .collect();
        
        // Enhanced error with raw response sample
        let sample = (&content_lines).join("\n")
            .chars()
            .take(300)
            .collect::<String>();
        
        return Err(TranslateError::ParseError(format!(
            "Invalid item numbers.\n\
             Expected: 1..={}\n\
             Found: {:?}\n\
             Missing: {:?}\n\
             Extra/Invalid: {:?}\n\
             Sample (first 300 chars):\n{}",
            expected_count, actual_nums, missing, extra, sample
        )));
    }
    
    // Decode newlines and return in order
    let translations: Vec<String> = (1..=expected_count)
        .map(|n| decode_newlines(items.get(&n).unwrap()))
        .collect();
    
    Ok(translations)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Language {
    Auto,
    English,
    ChineseSimplified,
    ChineseTraditional,
    Japanese,
    Korean,
    Vietnamese,
}

impl Language {
    pub fn label(&self) -> &'static str {
        match self {
            Language::Auto => "auto-detect",
            Language::English => "English",
            Language::ChineseSimplified => "Chinese (Simplified)",
            Language::ChineseTraditional => "Chinese (Traditional)",
            Language::Japanese => "Japanese",
            Language::Korean => "Korean",
            Language::Vietnamese => "Vietnamese",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderConfig {
    /// e.g. "https://api.openai.com/v1" or "http://localhost:8317/v1"
    pub base_url: String,
    pub api_key: Option<String>,
    pub model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationOptions {
    pub source_lang: Language,
    pub target_lang: Language,
    pub batch: BatchConfig,
    pub threads: usize, // 1..=5
    pub provider: ProviderConfig,
    pub max_retries: u32,
    pub min_delay_ms: u64, // for rate limiting/backoff
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressEvent {
    pub job_id: String,
    pub file_name: String,
    pub done_cues: usize,
    pub total_cues: usize,
    pub percent: f32,
    pub eta_seconds: u64,
    pub stage: String,
    pub active_threads: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchStatus {
    pub job_id: String,
    pub batch_no: usize,
    pub total_batches: usize,
    pub status: String, // "pending", "running", "done", "error"
    pub cue_start: usize,
    pub cue_end: usize,
    pub error_msg: Option<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum TranslateError {
    #[error("HTTP error: {0}")]
    Http(String),
    #[error("Invalid model response: {0}")]
    BadResponse(String),
    #[error("Parse error: {0}")]
    ParseError(String),
    #[error("Translation cancelled")]
    Cancelled,
}

#[derive(Clone)]
pub struct OpenAiCompatClient {
    http: reqwest::Client,
    base_url: String,
    api_key: Option<String>,
    model: String,
}

impl OpenAiCompatClient {
    pub fn new(provider: &ProviderConfig) -> Self {
        Self {
            http: reqwest::Client::new(),
            base_url: provider.base_url.trim_end_matches('/').to_string(),
            api_key: provider.api_key.clone(),
            model: provider.model.clone(),
        }
    }

    pub async fn translate_json(&self, system: &str, user_json: &str) -> Result<String, TranslateError> {
        // OpenAI-compatible Chat Completions payload.
        let url = format!("{}/chat/completions", self.base_url);

        #[derive(Serialize)]
        struct Msg<'a> {
            role: &'a str,
            content: &'a str,
        }

        #[derive(Serialize)]
        struct Body<'a> {
            model: &'a str,
            temperature: f32,
            messages: Vec<Msg<'a>>,
        }

        let body = Body {
            model: &self.model,
            temperature: 0.2,
            messages: vec![
                Msg { role: "system", content: system },
                Msg { role: "user", content: user_json },
            ],
        };

        let mut req = self.http.post(url).json(&body);
        if let Some(k) = &self.api_key {
            req = req.bearer_auth(k);
        }

        let resp = req.send().await.map_err(|e| TranslateError::Http(e.to_string()))?;
        let status = resp.status();
        let text = resp.text().await.map_err(|e| TranslateError::Http(e.to_string()))?;
        if !status.is_success() {
            return Err(TranslateError::Http(format!("Status {status}: {text}")));
        }

        // Extract content from OpenAI-like response.
        let v: serde_json::Value = serde_json::from_str(&text)
            .map_err(|e| TranslateError::BadResponse(format!("Response was not valid JSON: {e}. Raw: {text}")))?;

        let content = v
            .pointer("/choices/0/message/content")
            .and_then(|x| x.as_str())
            .ok_or_else(|| TranslateError::BadResponse(format!("Missing choices[0].message.content. Raw: {text}")))?;

        Ok(content.to_string())
    }
}

fn build_system_prompt(src: &Language, tgt: &Language) -> String {
    format!(
        "You are a professional subtitle translator.\n\
         Translate from {src} to {tgt}.\n\
         Rules:\n\
         - Keep meaning natural for subtitles.\n\
         - Preserve placeholders like [[TAG_0]] exactly.\n\
         - Do NOT change timecodes.\n\
         - Return ONLY valid JSON as instructed.\n",
        src = src.label(),
        tgt = tgt.label()
    )
}

fn build_user_payload(batch: &TranslationBatch, src: &Language, tgt: &Language) -> String {
    // We require JSON output mapping translate_ids -> translated text.
    // Context cues are included but not returned.
    #[derive(Serialize)]
    struct Payload<'a> {
        source_language: &'a str,
        target_language: &'a str,
        translate_ids: &'a [usize],
        cues: &'a [crate::translate::batcher::PromptCue],
        output_format: &'a str,
    }

    let payload = Payload {
        source_language: src.label(),
        target_language: tgt.label(),
        translate_ids: &batch.translate_ids,
        cues: &batch.cues,
        output_format: r#"JSON object: {"translations":[{"id":123,"text":"..."}]}"#,
    };

    serde_json::to_string_pretty(&payload).expect("payload must serialize")
}

/// Robustly extract JSON object even if the model adds extra text.
fn extract_json_object(s: &str) -> Result<serde_json::Value, TranslateError> {
    let start = s.find('{').ok_or_else(|| TranslateError::BadResponse("No JSON object found in response.".into()))?;
    let end = s.rfind('}').ok_or_else(|| TranslateError::BadResponse("No JSON object found in response.".into()))?;
    let slice = &s[start..=end];
    serde_json::from_str(slice).map_err(|e| TranslateError::BadResponse(format!("Failed to parse JSON: {e}. Raw: {slice}")))
}

pub async fn translate_document(
    app: tauri::AppHandle,
    job_id: String,
    file_name: String,
    doc: SrtDocument,
    opts: TranslationOptions,
) -> Result<HashMap<usize, String>, TranslateError> {
    let total_cues = doc.cues.len();
    let batches = create_batches(&doc.cues, &opts.batch);

    let client = OpenAiCompatClient::new(&opts.provider);
    let sem = Arc::new(Semaphore::new(opts.threads.clamp(1, 10)));

    let translated: Arc<Mutex<HashMap<usize, String>>> = Arc::new(Mutex::new(HashMap::new()));
    let done_cues: Arc<Mutex<usize>> = Arc::new(Mutex::new(0));

    let start_time = Instant::now();
    let total_batches = batches.len();
    let mut handles = Vec::with_capacity(total_batches);

    for batch in batches {
        let permit = sem.clone().acquire_owned().await.unwrap();
        let client = client.clone();
        let app = app.clone();
        let translated_map = translated.clone();
        let done_cues_ref = done_cues.clone();
        let job_id_cl = job_id.clone();
        let file_name_cl = file_name.clone();
        let src = opts.source_lang.clone();
        let tgt = opts.target_lang.clone();
        let max_retries = opts.max_retries;
        let min_delay = opts.min_delay_ms;
        let doc_cues = doc.cues.clone();

        handles.push(tokio::spawn(async move {
            let _permit = permit;

            // Emit batch start
            let _ = app.emit("batch://status", BatchStatus {
                job_id: job_id_cl.clone(),
                batch_no: batch.batch_no,
                total_batches,
                status: "running".to_string(),
                cue_start: *batch.translate_ids.first().unwrap_or(&0),
                cue_end: *batch.translate_ids.last().unwrap_or(&0),
                error_msg: None,
            });

            // Build numbered list prompt (new format - replaces JSON)
            let (user_prompt, expected_count) = build_translation_prompt(
                &batch,
                src.label(),
                tgt.label()
            )?;

            // Retry loop
            let mut attempt = 0u32;
            let response_text = loop {
                attempt += 1;

                // Basic pace control
                tokio::time::sleep(Duration::from_millis(min_delay)).await;

                match client.translate_json("You are a professional subtitle translator. Follow instructions precisely.", &user_prompt).await {
                    Ok(s) => break s,
                    Err(e) if attempt <= max_retries => {
                        // Exponential backoff
                        let backoff = (200u64 * 2u64.saturating_pow(attempt.min(6))).min(10_000);
                        let _ = app.emit(
                            "translation://warning",
                            format!("Retrying batch {} (attempt {}): {}", batch.batch_no, attempt, e),
                        );
                        tokio::time::sleep(Duration::from_millis(backoff)).await;
                        continue;
                    }
                    Err(e) => {
                        // Emit batch error
                        let _ = app.emit("batch://status", BatchStatus {
                            job_id: job_id_cl.clone(),
                            batch_no: batch.batch_no,
                            total_batches,
                            status: "error".to_string(),
                            cue_start: *batch.translate_ids.first().unwrap_or(&0),
                            cue_end: *batch.translate_ids.last().unwrap_or(&0),
                            error_msg: Some(e.to_string()),
                        });
                        return Err(e);
                    }
                }
            };

            // Parse numbered list response (new format)
            let translations = parse_numbered_response(&response_text, expected_count)?;

            // Map back to original IDs and unmask tags
            let mut local: Vec<(usize, String)> = Vec::new();
            for (idx, &id) in batch.translate_ids.iter().enumerate() {
                let text = &translations[idx];
                
                // Unmask tags
                let cue: &SrtCue = &doc_cues[id];
                let (_, mappings) = mask_tags(&cue.text_lines.join("\n"));
                let unmasked = unmask_tags(text, &mappings);
                
                local.push((id, unmasked));
            }

            // Store translated texts
            let mut map_guard = translated_map.lock().unwrap();
            for (id, text) in local {
                map_guard.insert(id, text);
            }
            drop(map_guard);

            // Update progress
            let mut done_guard = done_cues_ref.lock().unwrap();
            *done_guard += batch.translate_ids.len();
            let done_now = *done_guard;
            drop(done_guard);

            let elapsed = start_time.elapsed().as_secs_f64().max(0.001);
            let rate = done_now as f64 / elapsed;
            let remaining = (total_cues - done_now) as f64;
            let eta = if rate > 0.0 { (remaining / rate).ceil() as u64 } else { 0 };

            let percent = (done_now as f32 / total_cues as f32) * 100.0;

            let evt = ProgressEvent {
                job_id: job_id_cl.clone(),
                file_name: file_name_cl,
                done_cues: done_now,
                total_cues,
                percent,
                eta_seconds: eta,
                stage: "translating".into(),
                active_threads: 0,
            };

            let _ = app.emit("translation://progress", evt);

            // Emit batch done
            let _ = app.emit("batch://status", BatchStatus {
                job_id: job_id_cl,
                batch_no: batch.batch_no,
                total_batches,
                status: "done".to_string(),
                cue_start: *batch.translate_ids.first().unwrap_or(&0),
                cue_end: *batch.translate_ids.last().unwrap_or(&0),
                error_msg: None,
            });

            Ok::<(), TranslateError>(())
        }));
    }

    // Wait for all batches
    for h in handles {
        h.await.unwrap()?;
    }

    let final_map = translated.lock().unwrap().clone();
    Ok(final_map)
}

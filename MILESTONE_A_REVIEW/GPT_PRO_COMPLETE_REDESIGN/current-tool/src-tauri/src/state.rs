use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use uuid::Uuid;

use crate::srt::SrtDocument;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileItem {
    pub id: String,
    pub path: String,
    pub name: String,
    pub cue_count: usize,
    pub status: FileStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FileStatus {
    Ready,
    Processing,
    Done,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobInfo {
    pub id: String,
    pub file_id: String,
    pub status: JobStatus,
    pub progress: f32,
    pub eta_seconds: u64,
    pub output_path: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum JobStatus {
    Queued,
    Running,
    Done,
    Error,
    Cancelled,
}

pub struct FileData {
    pub item: FileItem,
    pub document: SrtDocument,
}

pub struct TranslationJob {
    pub info: JobInfo,
    pub options: Option<crate::translate::worker::TranslationOptions>,
    pub translated: Option<HashMap<usize, String>>,
}

pub struct AppState {
    pub files: Mutex<HashMap<String, FileData>>,
    pub jobs: Mutex<HashMap<String, TranslationJob>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            files: Mutex::new(HashMap::new()),
            jobs: Mutex::new(HashMap::new()),
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

pub fn generate_id() -> String {
    Uuid::new_v4().to_string()
}

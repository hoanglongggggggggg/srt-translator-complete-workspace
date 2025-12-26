use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Response from Antigravity's fetchAvailableModels API
/// Format: { "models": { "model_name": { "quotaInfo": { ... } } } }
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AntigravityModelsResponse {
    pub models: Option<HashMap<String, AntigravityModelInfo>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AntigravityModelInfo {
    pub quota_info: Option<QuotaInfo>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuotaInfo {
    pub remaining_fraction: Option<f64>,
    pub reset_time: Option<String>,
}

/// Simplified quota data for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelQuota {
    pub model: String,
    pub display_name: String,
    pub remaining_percent: f64,
    pub reset_time: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AntigravityQuotaResult {
    pub account_email: String,
    pub quotas: Vec<ModelQuota>,
    pub fetched_at: String,
    pub error: Option<String>,
}

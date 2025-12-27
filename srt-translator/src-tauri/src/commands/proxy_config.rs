use crate::proxy_config::{AppConfig, GeminiApiKey, ClaudeApiKey, CodexApiKey, AmpModelMapping, AmpOpenAIProvider, AmpOpenAIModel, CopilotConfig};
use std::path::PathBuf;

// ============= Data Types for Frontend =============

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeminiApiKeyData {
    pub api_key: String,
    pub base_url: Option<String>,
    pub proxy_url: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeApiKeyData {
    pub api_key: String,
    pub base_url: Option<String>,
    pub proxy_url: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexApiKeyData {
    pub api_key: String,
    pub base_url: Option<String>,
    pub proxy_url: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AmpModelMappingData {
    pub from: String,
    pub to: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AmpOpenAIModelData {
    pub name: String,
    pub alias: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AmpOpenAIProviderData {
    pub id: String,
    pub name: String,
    pub base_url: String,
    pub api_key: String,
    pub models: Vec<AmpOpenAIModelData>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CopilotConfigData {
    pub enabled: bool,
    pub port: u16,
    pub account_type: String,
    pub github_token: String,
    pub rate_limit: Option<u16>,
    pub rate_limit_wait: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProxyConfigData {
    // Multi-key support
    pub gemini_api_keys: Vec<GeminiApiKeyData>,
    pub claude_api_keys: Vec<ClaudeApiKeyData>,
    pub codex_api_keys: Vec<CodexApiKeyData>,
    
    // Basic settings
    pub port: u16,
    pub request_retry: u16,
    pub proxy_url: String,
    pub logging_enabled: bool,
    pub logging_to_file: bool,
    
    // Amp integration
    pub amp_api_key: String,
    pub amp_model_mappings: Vec<AmpModelMappingData>,
    pub amp_openai_providers: Vec<AmpOpenAIProviderData>,
    pub amp_routing_mode: String,
    
    // Copilot
    pub copilot: CopilotConfigData,
    
    // Advanced AI
    pub thinking_budget_mode: String,
    pub thinking_budget_custom: u32,
    pub reasoning_effort_level: String,
    pub force_model_mappings: bool,
    
    // App behavior
    pub auto_start: bool,
    pub debug: bool,
    pub usage_stats_enabled: bool,
    pub max_retry_interval: i32,
}

// ============= Conversion Implementations =============

impl From<AppConfig> for ProxyConfigData {
    fn from(config: AppConfig) -> Self {
        Self {
            gemini_api_keys: config.gemini_api_keys.into_iter().map(|k| k.into()).collect(),
            claude_api_keys: config.claude_api_keys.into_iter().map(|k| k.into()).collect(),
            codex_api_keys: config.codex_api_keys.into_iter().map(|k| k.into()).collect(),
            port: config.port,
            request_retry: config.request_retry,
            proxy_url: config.proxy_url,
            logging_enabled: config.logging_enabled,
            logging_to_file: config.logging_to_file,
            amp_api_key: config.amp_api_key,
            amp_model_mappings: config.amp_model_mappings.into_iter().map(|m| m.into()).collect(),
            amp_openai_providers: config.amp_openai_providers.into_iter().map(|p| p.into()).collect(),
            amp_routing_mode: config.amp_routing_mode,
            copilot: config.copilot.into(),
            thinking_budget_mode: config.thinking_budget_mode,
            thinking_budget_custom: config.thinking_budget_custom,
            reasoning_effort_level: config.reasoning_effort_level,
            force_model_mappings: config.force_model_mappings,
            auto_start: config.auto_start,
            debug: config.debug,
            usage_stats_enabled: config.usage_stats_enabled,
            max_retry_interval: config.max_retry_interval,
        }
    }
}

impl From<ProxyConfigData> for AppConfig {
    fn from(data: ProxyConfigData) -> Self {
        Self {
            gemini_api_keys: data.gemini_api_keys.into_iter().map(|k| k.into()).collect(),
            claude_api_keys: data.claude_api_keys.into_iter().map(|k| k.into()).collect(),
            codex_api_keys: data.codex_api_keys.into_iter().map(|k| k.into()).collect(),
            port: data.port,
            request_retry: data.request_retry,
            proxy_url: data.proxy_url,
            logging_enabled: data.logging_enabled,
            logging_to_file: data.logging_to_file,
            amp_api_key: data.amp_api_key,
            amp_model_mappings: data.amp_model_mappings.into_iter().map(|m| m.into()).collect(),
            amp_openai_providers: data.amp_openai_providers.into_iter().map(|p| p.into()).collect(),
            amp_routing_mode: data.amp_routing_mode,
            copilot: data.copilot.into(),
            thinking_budget_mode: data.thinking_budget_mode,
            thinking_budget_custom: data.thinking_budget_custom,
            reasoning_effort_level: data.reasoning_effort_level,
            force_model_mappings: data.force_model_mappings,
            auto_start: data.auto_start,
            debug: data.debug,
            usage_stats_enabled: data.usage_stats_enabled,
            quota_switch_project: false,
            quota_switch_preview_model: false,
            max_retry_interval: data.max_retry_interval,
            proxy_api_key: "proxypal-local".to_string(),
        }
    }
}

// Conversion implementations for nested types
impl From<GeminiApiKey> for GeminiApiKeyData {
    fn from(k: GeminiApiKey) -> Self {
        Self { api_key: k.api_key, base_url: k.base_url, proxy_url: k.proxy_url }
    }
}

impl From<GeminiApiKeyData> for GeminiApiKey {
    fn from(d: GeminiApiKeyData) -> Self {
        Self { api_key: d.api_key, base_url: d.base_url, proxy_url: d.proxy_url }
    }
}

impl From<ClaudeApiKey> for ClaudeApiKeyData {
    fn from(k: ClaudeApiKey) -> Self {
        Self { api_key: k.api_key, base_url: k.base_url, proxy_url: k.proxy_url }
    }
}

impl From<ClaudeApiKeyData> for ClaudeApiKey {
    fn from(d: ClaudeApiKeyData) -> Self {
        Self { api_key: d.api_key, base_url: d.base_url, proxy_url: d.proxy_url }
    }
}

impl From<CodexApiKey> for CodexApiKeyData {
    fn from(k: CodexApiKey) -> Self {
        Self { api_key: k.api_key, base_url: k.base_url, proxy_url: k.proxy_url }
    }
}

impl From<CodexApiKeyData> for CodexApiKey {
    fn from(d: CodexApiKeyData) -> Self {
        Self { api_key: d.api_key, base_url: d.base_url, proxy_url: d.proxy_url }
    }
}

impl From<AmpModelMapping> for AmpModelMappingData {
    fn from(m: AmpModelMapping) -> Self {
        Self { from: m.from, to: m.to, enabled: m.enabled }
    }
}

impl From<AmpModelMappingData> for AmpModelMapping {
    fn from(d: AmpModelMappingData) -> Self {
        Self { from: d.from, to: d.to, enabled: d.enabled }
    }
}

impl From<AmpOpenAIModel> for AmpOpenAIModelData {
    fn from(m: AmpOpenAIModel) -> Self {
        Self { name: m.name, alias: m.alias }
    }
}

impl From<AmpOpenAIModelData> for AmpOpenAIModel {
    fn from(d: AmpOpenAIModelData) -> Self {
        Self { name: d.name, alias: d.alias }
    }
}

impl From<AmpOpenAIProvider> for AmpOpenAIProviderData {
    fn from(p: AmpOpenAIProvider) -> Self {
        Self {
            id: p.id,
            name: p.name,
            base_url: p.base_url,
            api_key: p.api_key,
            models: p.models.into_iter().map(|m| m.into()).collect(),
        }
    }
}

impl From<AmpOpenAIProviderData> for AmpOpenAIProvider {
    fn from(d: AmpOpenAIProviderData) -> Self {
        Self {
            id: d.id,
            name: d.name,
            base_url: d.base_url,
            api_key: d.api_key,
            models: d.models.into_iter().map(|m| m.into()).collect(),
        }
    }
}

impl From<CopilotConfig> for CopilotConfigData {
    fn from(c: CopilotConfig) -> Self {
        Self {
            enabled: c.enabled,
            port: c.port,
            account_type: c.account_type,
            github_token: c.github_token,
            rate_limit: c.rate_limit,
            rate_limit_wait: c.rate_limit_wait,
        }
    }
}

impl From<CopilotConfigData> for CopilotConfig {
    fn from(d: CopilotConfigData) -> Self {
        Self {
            enabled: d.enabled,
            port: d.port,
            account_type: d.account_type,
            github_token: d.github_token,
            rate_limit: d.rate_limit,
            rate_limit_wait: d.rate_limit_wait,
        }
    }
}

// ============= Helper Function =============

fn get_clipproxy(app: &tauri::AppHandle) -> Result<crate::clipproxy::ClipProxyExecutable, String> {
    crate::clipproxy::locate_clipproxy(app)
        .map_err(|e| format!("clipproxyapi executable not found: {e}"))
}

// ============= Tauri Commands =============

#[tauri::command]
pub fn get_proxy_config() -> Result<ProxyConfigData, String> {
    let config = AppConfig::load()?;
    Ok(config.into())
}

#[tauri::command]
pub fn save_proxy_config(config_data: ProxyConfigData) -> Result<(), String> {
    let config: AppConfig = config_data.into();
    config.save()?;
    config.write_proxy_config()?;
    Ok(())
}

// ============= Gemini Commands =============

#[tauri::command]
pub async fn trigger_gemini_oauth(_app: tauri::AppHandle) -> Result<OAuthResponse, String> {
    let config = AppConfig::load().map_err(|e| format!("Failed to load config: {}", e))?;
    let port = config.port;
    
    // Call Management API to get OAuth URL
    // Add is_webui=true to enable embedded callback forwarder
    let url = format!("http://localhost:{}/v0/management/gemini-cli-auth-url?is_webui=true", port);
    
    let client = reqwest::Client::new();
    let response = client.get(&url)
        .header("Authorization", "Bearer proxypal-mgmt-key")
        .send()
        .await
        .map_err(|e| format!("Failed to call management API: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Management API returned error: {}", response.status()));
    }
    
    let json: serde_json::Value = response.json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    // Extract OAuth URL and state from response
    let oauth_url = json.get("url").and_then(|v| v.as_str())
        .ok_or_else(|| format!("No URL in response: {:?}", json))?;
    let state = json.get("state").and_then(|v| v.as_str())
        .ok_or_else(|| format!("No state in response: {:?}", json))?;
    
    Ok(OAuthResponse {
        url: oauth_url.to_string(),
        state: state.to_string(),
    })
}

#[tauri::command]
pub fn add_gemini_key(key_data: GeminiApiKeyData) -> Result<(), String> {
    let mut config = AppConfig::load()?;
    config.gemini_api_keys.push(key_data.into());
    config.save()?;
    config.write_proxy_config()?;
    Ok(())
}

#[tauri::command]
pub fn remove_gemini_key(api_key: String) -> Result<(), String> {
    let mut config = AppConfig::load()?;
    config.gemini_api_keys.retain(|k| k.api_key != api_key);
    config.save()?;
    config.write_proxy_config()?;
    Ok(())
}

// ============= Claude Commands =============

#[tauri::command]
pub fn add_claude_key(key_data: ClaudeApiKeyData) -> Result<(), String> {
    let mut config = AppConfig::load()?;
    config.claude_api_keys.push(key_data.into());
    config.save()?;
    config.write_proxy_config()?;
    Ok(())
}

#[tauri::command]
pub fn remove_claude_key(api_key: String) -> Result<(), String> {
    let mut config = AppConfig::load()?;
    config.claude_api_keys.retain(|k| k.api_key != api_key);
    config.save()?;
    config.write_proxy_config()?;
    Ok(())
}

// ============= Codex Commands =============

#[tauri::command]
pub fn add_codex_key(key_data: CodexApiKeyData) -> Result<(), String> {
    let mut config = AppConfig::load()?;
    config.codex_api_keys.push(key_data.into());
    config.save()?;
    config.write_proxy_config()?;
    Ok(())
}

#[tauri::command]
pub fn remove_codex_key(api_key: String) -> Result<(), String> {
    let mut config = AppConfig::load()?;
    config.codex_api_keys.retain(|k| k.api_key != api_key);
    config.save()?;
    config.write_proxy_config()?;
    Ok(())
}

// ============= Amp Commands =============

#[tauri::command]
pub fn update_amp_config(
    api_key: String,
    mappings: Vec<AmpModelMappingData>,
    routing_mode: String,
) -> Result<(), String> {
    let mut config = AppConfig::load()?;
    config.amp_api_key = api_key;
    config.amp_model_mappings = mappings.into_iter().map(|m| m.into()).collect();
    config.amp_routing_mode = routing_mode;
    config.save()?;
    config.write_proxy_config()?;
    Ok(())
}

#[tauri::command]
pub fn add_amp_mapping(mapping: AmpModelMappingData) -> Result<(), String> {
    let mut config = AppConfig::load()?;
    config.amp_model_mappings.push(mapping.into());
    config.save()?;
    config.write_proxy_config()?;
    Ok(())
}

#[tauri::command]
pub fn remove_amp_mapping(from_model: String) -> Result<(), String> {
    let mut config = AppConfig::load()?;
    config.amp_model_mappings.retain(|m| m.from != from_model);
    config.save()?;
    config.write_proxy_config()?;
    Ok(())
}

// ============= OpenAI Provider Commands =============

#[tauri::command]
pub fn add_openai_provider(provider: AmpOpenAIProviderData) -> Result<(), String> {
    let mut config = AppConfig::load()?;
    config.amp_openai_providers.push(provider.into());
    config.save()?;
    config.write_proxy_config()?;
    Ok(())
}

#[tauri::command]
pub fn remove_openai_provider(provider_id: String) -> Result<(), String> {
    let mut config = AppConfig::load()?;
    config.amp_openai_providers.retain(|p| p.id != provider_id);
    config.save()?;
    config.write_proxy_config()?;
    Ok(())
}

// ============= Copilot Commands =============

#[tauri::command]
pub fn update_copilot_config(copilot: CopilotConfigData) -> Result<(), String> {
    let mut config = AppConfig::load()?;
    config.copilot = copilot.into();
    config.save()?;
    config.write_proxy_config()?;
    Ok(())
}

// ============= OAuth & Auth Status Management =============

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct OAuthResponse {
    pub url: String,
    pub state: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct AuthFile {
    pub id: String,
    pub name: String,
    pub provider: String,
    #[serde(default)]
    pub status: String,
    #[serde(default)]
    pub email: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct AuthFilesResponse {
    files: Vec<AuthFile>,
}

#[tauri::command]
pub async fn get_auth_status(_app: tauri::AppHandle) -> Result<Vec<AuthFile>, String> {
    let config = AppConfig::load().map_err(|e| format!("Failed to load config: {}", e))?;
    let port = config.port;
    
    let url = format!("http://localhost:{}/v0/management/auth-files", port);
    
    let client = reqwest::Client::new();
    let response = client.get(&url)
        .header("Authorization", "Bearer proxypal-mgmt-key")
        .send()
        .await
        .map_err(|e| format!("Failed to call management API: {}", e))?;
    
    if !response.status().is_success() {
        return Ok(Vec::new()); // Return empty if API fails
    }
    
    let json: AuthFilesResponse = response.json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    Ok(json.files)
}

#[tauri::command]
pub async fn poll_oauth_status(_app: tauri::AppHandle, state: String) -> Result<String, String> {
    let config = AppConfig::load().map_err(|e| format!("Failed to load config: {}", e))?;
    let port = config.port;
    
    let url = format!("http://localhost:{}/v0/management/get-auth-status?state={}", port, state);
    
    let client = reqwest::Client::new();
    let response = client.get(&url)
        .header("Authorization", "Bearer proxypal-mgmt-key")
        .send()
        .await
        .map_err(|e| format!("Failed to call management API: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Management API returned error: {}", response.status()));
    }
    
    let json: serde_json::Value = response.json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    // Return status: "wait", "ok", or "error"
    if let Some(status) = json.get("status").and_then(|v| v.as_str()) {
        Ok(status.to_string())
    } else {
        Err(format!("No status in response: {:?}", json))
    }
}

// ============= OAuth Login Commands =============

#[tauri::command]
pub async fn trigger_oauth_login(_app: tauri::AppHandle, provider: String) -> Result<OAuthResponse, String> {
    let config = AppConfig::load().map_err(|e| format!("Failed to load config: {}", e))?;
    let port = config.port;
    
    // Map provider to Management API endpoint
    let endpoint = match provider.as_str() {
        "copilot" => "codex-auth-url",
        "claude" => "anthropic-auth-url",
        "qwen" => "qwen-auth-url",
        "antigravity" => "antigravity-auth-url",
        "iflow" => "iflow-auth-url",
        _ => return Err(format!("Unknown OAuth provider: {}", provider)),
    };
    
    // Call Management API
    // Add is_webui=true to enable embedded callback forwarder
    let url = format!("http://localhost:{}/v0/management/{}?is_webui=true", port, endpoint);
    
    let client = reqwest::Client::new();
    let response = client.get(&url)
        .header("Authorization", "Bearer proxypal-mgmt-key")
        .send()
        .await
        .map_err(|e| format!("Failed to call management API: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Management API returned error: {}", response.status()));
    }
    
    let json: serde_json::Value = response.json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    // Extract OAuth URL and state from response
    let oauth_url = json.get("url").and_then(|v| v.as_str())
        .ok_or_else(|| format!("No URL in response: {:?}", json))?;
    let state = json.get("state").and_then(|v| v.as_str())
        .ok_or_else(|| format!("No state in response: {:?}", json))?;
    
    Ok(OAuthResponse {
        url: oauth_url.to_string(),
        state: state.to_string(),
    })
}

// ============= Advanced Settings Commands =============

#[tauri::command]
pub fn update_thinking_budget(mode: String, custom: u32) -> Result<(), String> {
    let mut config = AppConfig::load()?;
    config.thinking_budget_mode = mode;
    config.thinking_budget_custom = custom;
    config.save()?;
    config.write_proxy_config()?;
    Ok(())
}

#[tauri::command]
pub fn update_reasoning_effort(level: String) -> Result<(), String> {
    let mut config = AppConfig::load()?;
    config.reasoning_effort_level = level;
    config.save()?;
    config.write_proxy_config()?;
    Ok(())
}

#[tauri::command]
pub fn restart_proxy(_app: tauri::AppHandle) -> Result<String, String> {
    Ok("Please restart the application to apply changes".to_string())
}

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

// ============= Helper Structs =============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeminiApiKey {
    pub api_key: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub proxy_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeApiKey {
    pub api_key: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub proxy_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexApiKey {
    pub api_key: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub proxy_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AmpModelMapping {
    pub from: String,
    pub to: String,
    #[serde(default = "default_true")]
    pub enabled: bool,
}

fn default_true() -> bool { true }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AmpOpenAIModel {
    pub name: String,
    #[serde(default)]
    pub alias: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AmpOpenAIProvider {
    #[serde(default = "generate_uuid")]
    pub id: String,
    pub name: String,
    pub base_url: String,
    pub api_key: String,
    #[serde(default)]
    pub models: Vec<AmpOpenAIModel>,
}

fn generate_uuid() -> String {
    uuid::Uuid::new_v4().to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CopilotConfig {
    #[serde(default)]
    pub enabled: bool,
    #[serde(default = "default_copilot_port")]
    pub port: u16,
    #[serde(default)]
    pub account_type: String,
    #[serde(default)]
    pub github_token: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rate_limit: Option<u16>,
    #[serde(default)]
    pub rate_limit_wait: bool,
}

fn default_copilot_port() -> u16 { 4141 }

impl Default for CopilotConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            port: 4141,
            account_type: "individual".to_string(),
            github_token: String::new(),
            rate_limit: None,
            rate_limit_wait: false,
        }
    }
}

// ============= Main AppConfig =============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    // Core API Keys (Vec for multi-key support)
    #[serde(default)]
    pub gemini_api_keys: Vec<GeminiApiKey>,
    #[serde(default)]
    pub claude_api_keys: Vec<ClaudeApiKey>,
    #[serde(default)]
    pub codex_api_keys: Vec<CodexApiKey>,
    
    // Proxy settings
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(default = "default_retry")]
    pub request_retry: u16,
    #[serde(default)]
    pub proxy_url: String,
    
    // Logging
    #[serde(default = "default_true")]
    pub logging_enabled: bool,
    #[serde(default = "default_true")]
    pub logging_to_file: bool,
    
    // Amp Integration
    #[serde(default)]
    pub amp_api_key: String,
    #[serde(default)]
    pub amp_model_mappings: Vec<AmpModelMapping>,
    #[serde(default)]
    pub amp_openai_providers: Vec<AmpOpenAIProvider>,
    #[serde(default)]
    pub amp_routing_mode: String,
    
    // Copilot
    #[serde(default)]
    pub copilot: CopilotConfig,
    
    // Advanced AI Settings
    #[serde(default)]
    pub thinking_budget_mode: String, // "low", "medium", "high", "custom"
    #[serde(default)]
    pub thinking_budget_custom: u32,
    #[serde(default)]
    pub reasoning_effort_level: String, // "none", "low", "medium", "high", "xhigh"
    #[serde(default)]
    pub force_model_mappings: bool,
    
    // App Behavior
    #[serde(default = "default_true")]
    pub auto_start: bool,
    #[serde(default)]
    pub debug: bool,
    #[serde(default = "default_true")]
    pub usage_stats_enabled: bool,
    #[serde(default)]
    pub quota_switch_project: bool,
    #[serde(default)]
    pub quota_switch_preview_model: bool,
    
    // Advanced
    #[serde(default)]
    pub max_retry_interval: i32,
    #[serde(default = "default_proxy_api_key")]
    pub proxy_api_key: String,
}

fn default_port() -> u16 { 8317 }
fn default_retry() -> u16 { 3 }
fn default_proxy_api_key() -> String { "proxypal-local".to_string() }

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            gemini_api_keys: Vec::new(),
            claude_api_keys: Vec::new(),
            codex_api_keys: Vec::new(),
            port: 8317,
            request_retry: 3,
            proxy_url: String::new(),
            logging_enabled: true,
            logging_to_file: true,
            amp_api_key: String::new(),
            amp_model_mappings: Vec::new(),
            amp_openai_providers: Vec::new(),
            amp_routing_mode: "mappings".to_string(),
            copilot: CopilotConfig::default(),
            thinking_budget_mode: "medium".to_string(),
            thinking_budget_custom: 0,
            reasoning_effort_level: "medium".to_string(),
            force_model_mappings: false,
            auto_start: true,
            debug: false,
            usage_stats_enabled: true,
            quota_switch_project: false,
            quota_switch_preview_model: false,
            max_retry_interval: 0,
            proxy_api_key: "proxypal-local".to_string(),
        }
    }
}

impl AppConfig {
    pub fn load() -> Result<Self, String> {
        let config_path = Self::get_config_path()?;
        
        if !config_path.exists() {
            let default_config = Self::default();
            default_config.save()?;
            return Ok(default_config);
        }
        
        let content = std::fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config: {}", e))?;
        
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse config: {}", e))
    }
    
    pub fn save(&self) -> Result<(), String> {
        let config_path = Self::get_config_path()?;
        
        if let Some(parent) = config_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create config directory: {}", e))?;
        }
        
        let content = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize config: {}", e))?;
        
        std::fs::write(&config_path, content)
            .map_err(|e| format!("Failed to write config: {}", e))
    }
    
    pub fn get_config_path() -> Result<PathBuf, String> {
        let config_dir = dirs::config_dir()
            .ok_or("Failed to get config directory")?
            .join("srt-translator");
        
        Ok(config_dir.join("config.json"))
    }
    
    pub fn get_config_dir() -> Result<PathBuf, String> {
        let config_dir = dirs::config_dir()
            .ok_or("Failed to get config directory")?
            .join("srt-translator");
        
        Ok(config_dir)
    }
    
    /// Generate comprehensive proxy-config.yaml for clipproxyapi
    pub fn generate_proxy_config(&self) -> Result<String, String> {
        let mut config = format!("port: {}\nrequest-retry: {}\n", self.port, self.request_retry);
        
        // Proxy URL
        if !self.proxy_url.is_empty() {
            config.push_str(&format!("proxy-url: \"{}\"\n", self.proxy_url));
        }
        
        // Max retry interval
        if self.max_retry_interval > 0 {
            config.push_str(&format!("max-retry-interval: {}\n", self.max_retry_interval));
        }
        
        // Logging
        config.push_str(&format!("\nlogging:\n  enabled: {}\n  to-file: {}\n", 
            self.logging_enabled, self.logging_to_file));
        
        // Gemini API keys
        if !self.gemini_api_keys.is_empty() {
            config.push_str("\n# Gemini API keys\ngemini-api-key:\n");
            for key in &self.gemini_api_keys {
                config.push_str(&format!("  - api-key: \"{}\"\n", key.api_key));
                if let Some(ref base_url) = key.base_url {
                    config.push_str(&format!("    base-url: \"{}\"\n", base_url));
                }
                if let Some(ref proxy_url) = key.proxy_url {
                    if !proxy_url.is_empty() {
                        config.push_str(&format!("    proxy-url: \"{}\"\n", proxy_url));
                    }
                }
            }
        }
        
        // Claude API keys
        if !self.claude_api_keys.is_empty() {
            config.push_str("\n# Claude API keys\nclaude-api-key:\n");
            for key in &self.claude_api_keys {
                config.push_str(&format!("  - api-key: \"{}\"\n", key.api_key));
                if let Some(ref base_url) = key.base_url {
                    config.push_str(&format!("    base-url: \"{}\"\n", base_url));
                }
                if let Some(ref proxy_url) = key.proxy_url {
                    if !proxy_url.is_empty() {
                        config.push_str(&format!("    proxy-url: \"{}\"\n", proxy_url));
                    }
                }
            }
        }
        
        // Codex API keys
        if !self.codex_api_keys.is_empty() {
            config.push_str("\n# Codex API keys\ncodex-api-key:\n");
            for key in &self.codex_api_keys {
                config.push_str(&format!("  - api-key: \"{}\"\n", key.api_key));
                if let Some(ref base_url) = key.base_url {
                    config.push_str(&format!("    base-url: \"{}\"\n", base_url));
                }
                if let Some(ref proxy_url) = key.proxy_url {
                    if !proxy_url.is_empty() {
                        config.push_str(&format!("    proxy-url: \"{}\"\n", proxy_url));
                    }
                }
            }
        }
        
        // Amp API key
        if !self.amp_api_key.is_empty() {
            config.push_str(&format!("\n# Amp API key\namp:\n  upstream-api-key: \"{}\"\n", self.amp_api_key));
            
            // Amp model mappings
            let enabled_mappings: Vec<_> = self.amp_model_mappings.iter()
                .filter(|m| m.enabled)
                .collect();
            
            if !enabled_mappings.is_empty() {
                config.push_str("  model-mappings:\n");
                for mapping in enabled_mappings {
                    config.push_str(&format!("    - from: {}\n      to: {}\n", mapping.from, mapping.to));
                }
            }
        }
        
        // OpenAI-compatible providers
        if !self.amp_openai_providers.is_empty() || self.copilot.enabled {
            config.push_str("\n# OpenAI-compatible providers\nopenai-compatibility:\n");
            
            // Custom providers
            for provider in &self.amp_openai_providers {
                config.push_str(&format!("  - name: \"{}\"\n", provider.name));
                config.push_str(&format!("    base-url: \"{}\"\n", provider.base_url));
                config.push_str("    api-key-entries:\n");
                config.push_str(&format!("      - api-key: \"{}\"\n", provider.api_key));
                
                if !provider.models.is_empty() {
                    config.push_str("    models:\n");
                    for model in &provider.models {
                        config.push_str(&format!("      - alias: \"{}\"\n", model.alias));
                        config.push_str(&format!("        name: \"{}\"\n", model.name));
                    }
                }
            }
            
            // Copilot entry
            if self.copilot.enabled {
                config.push_str(&format!("  - name: \"copilot\"\n    base-url: \"http://localhost:{}/v1\"\n", self.copilot.port));
                config.push_str("    api-key-entries:\n      - api-key: \"dummy\"\n");
                config.push_str("    models:\n");
                // Add all Copilot models
                let copilot_models = vec![
                    ("gpt-4.1", "gpt-4.1"), ("gpt-5", "gpt-5"), ("gpt-5-mini", "gpt-5-mini"),
                    ("gpt-5-codex", "gpt-5-codex"), ("gpt-5.1", "gpt-5.1"),
                    ("gemini-2.5-pro", "gemini-2.5-pro"), ("claude-sonnet-4", "claude-sonnet-4"),
                ];
                for (alias, name) in copilot_models {
                    config.push_str(&format!("      - alias: \"{}\"\n        name: \"{}\"\n", alias, name));
                }
            }
        }
        
        Ok(config)
    }
    
    /// Write proxy-config.yaml file
    pub fn write_proxy_config(&self) -> Result<PathBuf, String> {
        let config_dir = Self::get_config_dir()?;
        std::fs::create_dir_all(&config_dir)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
        
        let config_path = config_dir.join("proxy-config.yaml");
        let content = self.generate_proxy_config()?;
        
        std::fs::write(&config_path, content)
            .map_err(|e| format!("Failed to write proxy config: {}", e))?;
       
        Ok(config_path)
    }
}

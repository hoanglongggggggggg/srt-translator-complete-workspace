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
        // Build proxy-url line if configured
        let proxy_url_line = if self.proxy_url.is_empty() {
            String::new()
        } else {
            format!("proxy-url: \"{}\"\n", self.proxy_url)
        };
        
        // Build gemini-api-key section
        let gemini_api_key_section = if self.gemini_api_keys.is_empty() {
            String::new()
        } else {
            let mut section = String::from("# Gemini API keys\ngemini-api-key:\n");
            for key in &self.gemini_api_keys {
                section.push_str(&format!("  - api-key: \"{}\"\n", key.api_key));
                if let Some(ref base_url) = key.base_url {
                    section.push_str(&format!("    base-url: \"{}\"\n", base_url));
                }
                if let Some(ref proxy_url) = key.proxy_url {
                    if !proxy_url.is_empty() {
                        section.push_str(&format!("    proxy-url: \"{}\"\n", proxy_url));
                    }
                }
            }
            section.push('\n');
            section
        };
        
        // Build claude-api-key section
        let claude_api_key_section = if self.claude_api_keys.is_empty() {
            String::new()
        } else {
            let mut section = String::from("# Claude API keys\nclaude-api-key:\n");
            for key in &self.claude_api_keys {
                section.push_str(&format!("  - api-key: \"{}\"\n", key.api_key));
                if let Some(ref base_url) = key.base_url {
                    section.push_str(&format!("    base-url: \"{}\"\n", base_url));
                }
                if let Some(ref proxy_url) = key.proxy_url {
                    if !proxy_url.is_empty() {
                        section.push_str(&format!("    proxy-url: \"{}\"\n", proxy_url));
                    }
                }
            }
            section.push('\n');
            section
        };
        
        // Build codex-api-key section
        let codex_api_key_section = if self.codex_api_keys.is_empty() {
            String::new()
        } else {
            let mut section = String::from("# Codex API keys\ncodex-api-key:\n");
            for key in &self.codex_api_keys {
                section.push_str(&format!("  - api-key: \"{}\"\n", key.api_key));
                if let Some(ref base_url) = key.base_url {
                    section.push_str(&format!("    base-url: \"{}\"\n", base_url));
                }
                if let Some(ref proxy_url) = key.proxy_url {
                    if !proxy_url.is_empty() {
                        section.push_str(&format!("    proxy-url: \"{}\"\n", proxy_url));
                    }
                }
            }
            section.push('\n');
            section
        };
        
        // Build amp api key line if configured
        let amp_api_key_line = if self.amp_api_key.is_empty() {
            "  # upstream-api-key: \"\"  # Set your Amp API key from https://ampcode.com/settings".to_string()
        } else {
            format!("  upstream-api-key: \"{}\"", self.amp_api_key)
        };
        
        // Build amp model-mappings section if configured
        let enabled_mappings: Vec<_> = self.amp_model_mappings.iter()
            .filter(|m| m.enabled)
            .collect();
        
        let amp_model_mappings_section = if enabled_mappings.is_empty() {
            "  # model-mappings:  # Optional: map Amp model requests to different models\n  #   - from: claude-opus-4-5-20251101\n  #     to: your-preferred-model".to_string()
        } else {
            let mut mappings = String::from("  model-mappings:");
            for mapping in &enabled_mappings {
                mappings.push_str(&format!("\n    - from: {}\n      to: {}", mapping.from, mapping.to));
            }
            mappings
        };
        
        // Build openai-compatibility section combining custom providers and copilot
        let mut openai_compat_entries = Vec::new();
        
        // Add custom providers
        for provider in &self.amp_openai_providers {
            if !provider.name.is_empty() && !provider.base_url.is_empty() && !provider.api_key.is_empty() {
                let mut entry = format!("  # Custom OpenAI-compatible provider: {}\n", provider.name);
                entry.push_str(&format!("  - name: \"{}\"\n", provider.name));
                entry.push_str(&format!("    base-url: \"{}\"\n", provider.base_url));
                entry.push_str("    api-key-entries:\n");
                entry.push_str(&format!("      - api-key: \"{}\"\n", provider.api_key));
                
                if !provider.models.is_empty() {
                    entry.push_str("    models:\n");
                    for model in &provider.models {
                        entry.push_str(&format!("      - alias: \"{}\"\n", model.alias));
                        entry.push_str(&format!("        name: \"{}\"\n", model.name));
                    }
                }
                openai_compat_entries.push(entry);
            }
        }
        
        // Add copilot OpenAI-compatible entry if enabled
        if self.copilot.enabled {
            let port = self.copilot.port;
            let mut entry = String::from("  # GitHub Copilot GPT/OpenAI models (via copilot-api)\n");
            entry.push_str("  - name: \"copilot\"\n");
            entry.push_str(&format!("    base-url: \"http://localhost:{}/v1\"\n", port));
            entry.push_str("    api-key-entries:\n");
            entry.push_str("      - api-key: \"dummy\"\n");
            entry.push_str("    models:\n");
            // Add comprehensive model list
            let copilot_models = vec![
                ("gpt-4.1", "gpt-4.1"), ("gpt-5", "gpt-5"), ("gpt-5-mini", "gpt-5-mini"),
                ("gpt-5-codex", "gpt-5-codex"), ("gpt-5.1", "gpt-5.1"),
                ("gemini-2.5-pro", "gemini-2.5-pro"), ("claude-sonnet-4", "claude-sonnet-4"),
            ];
            for (alias, name) in copilot_models {
                entry.push_str(&format!("      - alias: \"{}\"\n        name: \"{}\"\n", alias, name));
            }
            openai_compat_entries.push(entry);
        }
        
        // Build final openai-compatibility section
        let openai_compat_section = if openai_compat_entries.is_empty() {
            String::new()
        } else {
            let mut section = String::from("# OpenAI-compatible providers\nopenai-compatibility:\n");
            for entry in openai_compat_entries {
                section.push_str(&entry);
            }
            section.push('\n');
            section
        };
        
        // Calculate thinking budget
        let thinking_budget = match self.thinking_budget_mode.as_str() {
            "low" => 2048,
            "medium" => 8192,
            "high" => 32768,
            "custom" => if self.thinking_budget_custom == 0 { 16000 } else { self.thinking_budget_custom },
            _ => 8192,
        };
        
        let thinking_mode_display = if self.thinking_budget_mode.is_empty() { "medium" } else { &self.thinking_budget_mode };
        
        // Build payload section for thinking models
        let payload_section = format!(r#"# Payload injection for thinking models
# Antigravity Claude: Thinking budget mode: {} ({} tokens)
payload:
  default:
    # Antigravity Claude models - thinking budget
    - models:
        - name: "gemini-claude-sonnet-4-5"
          protocol: "claude"
        - name: "gemini-claude-sonnet-4-5-thinking"
          protocol: "claude"
      params:
        "thinking.budget_tokens": {}
    - models:
        - name: "gemini-claude-opus-4-5"
          protocol: "claude"
        - name: "gemini-claude-opus-4-5-thinking"
          protocol: "claude"
      params:
        "thinking.budget_tokens": {}

"#, 
            thinking_mode_display,
            thinking_budget,
            thinking_budget,
            thinking_budget
        );
        
        // Build complete config with all mandatory fields
        let config = format!(
            r#"# SRT Translator generated config
port: {}
auth-dir: "~/.cli-proxy-api"
api-keys:
  - "{}"
debug: {}
usage-statistics-enabled: {}
logging-to-file: {}
request-retry: {}
{}
# Quota exceeded behavior
quota-exceeded:
  switch-project: {}
  switch-preview-model: {}

# Enable Management API for OAuth flows
remote-management:
  allow-remote: true
  secret-key: "proxypal-mgmt-key"
  disable-control-panel: true

{}{}{}{}{}# Amp CLI Integration - enables amp login and management routes
# See: https://help.router-for.me/agent-client/amp-cli.html
# Get API key from: https://ampcode.com/settings
ampcode:
  upstream-url: "https://ampcode.com"
{}
{}
  restrict-management-to-localhost: false
"#,
            self.port,
            self.proxy_api_key,
            self.debug,
            self.usage_stats_enabled,
            self.logging_to_file,
            self.request_retry,
            proxy_url_line,
            self.quota_switch_project,
            self.quota_switch_preview_model,
            openai_compat_section,
            claude_api_key_section,
            gemini_api_key_section,
            codex_api_key_section,
            payload_section,
            amp_api_key_line,
            amp_model_mappings_section
        );
        
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

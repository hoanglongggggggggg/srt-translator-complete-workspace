import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

// ============================
// Types
// ============================

export interface ProxyStatus {
  running: boolean;
  port: number;
  endpoint: string;
}

export type Provider =
  | "claude"
  | "openai"
  | "gemini"
  | "qwen"
  | "iflow"
  | "vertex"
  | "antigravity";

export interface AuthStatus {
  claude: number;
  openai: number;
  gemini: number;
  qwen: number;
  iflow: number;
  vertex: number;
  antigravity: number;
}

export interface GeminiApiKey {
  apiKey: string;
  baseUrl?: string | null;
  proxyUrl?: string | null;
}

export interface ClaudeApiKey {
  apiKey: string;
  baseUrl?: string | null;
  proxyUrl?: string | null;
}

export interface CodexApiKey {
  apiKey: string;
  baseUrl?: string | null;
  proxyUrl?: string | null;
}

export interface AmpModelMapping {
  from: string;
  to: string;
  enabled: boolean;
}

export interface AmpOpenAIModel {
  name: string;
  alias: string;
}

export interface AmpOpenAIProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  models: AmpOpenAIModel[];
}

export interface CopilotConfig {
  enabled: boolean;
  port: number;
  accountType: string;
  githubToken: string;
  rateLimit?: number;
  rateLimitWait: boolean;
}

// This matches the current-tool backend ProxyConfigData (camelCase).
export interface AppConfig {
  geminiApiKeys: GeminiApiKey[];
  claudeApiKeys: ClaudeApiKey[];
  codexApiKeys: CodexApiKey[];

  port: number;
  requestRetry: number;
  proxyUrl: string;
  loggingEnabled: boolean;
  loggingToFile: boolean;

  ampApiKey: string;
  ampModelMappings: AmpModelMapping[];
  ampOpenaiProviders: AmpOpenAIProvider[];
  ampRoutingMode: string;

  copilot: CopilotConfig;

  thinkingBudgetMode: string;
  thinkingBudgetCustom: number;
  reasoningEffortLevel: string;
  forceModelMappings: boolean;

  autoStart: boolean;
  debug: boolean;
  usageStatsEnabled: boolean;
  maxRetryInterval: number;
}

// ============================
// Helpers
// ============================

async function invokeSafe<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  return invoke<T>(command, args);
}

function defaultAuthStatus(): AuthStatus {
  return {
    claude: 0,
    openai: 0,
    gemini: 0,
    qwen: 0,
    iflow: 0,
    vertex: 0,
    antigravity: 0,
  };
}

// ============================
// Proxy management
// ============================

export async function getProxyStatus(): Promise<ProxyStatus> {
  try {
    return await invokeSafe<ProxyStatus>("get_proxy_status");
  } catch {
    // Fallback to current-tool minimal status.
    const s = await invokeSafe<{ running: boolean; endpoint: string }>(
      "get_proxypal_status",
    );

    const endpoint = s.running ? s.endpoint : "http://localhost:8317/v1";
    return {
      running: s.running,
      port: 8317,
      endpoint,
    };
  }
}

export async function startProxy(): Promise<ProxyStatus> {
  try {
    return await invokeSafe<ProxyStatus>("start_proxy");
  } catch {
    // Not yet available in current-tool backend (Milestone C). Return current status.
    return await getProxyStatus();
  }
}

export async function stopProxy(): Promise<ProxyStatus> {
  try {
    return await invokeSafe<ProxyStatus>("stop_proxy");
  } catch {
    // Not yet available in current-tool backend (Milestone C). Return current status.
    return await getProxyStatus();
  }
}

// ============================
// OAuth / Auth
// ============================

export async function openOAuth(provider: Provider): Promise<string> {
  try {
    return await invokeSafe<string>("open_oauth", { provider });
  } catch {
    // Fallback to current-tool CLI proxy OAuth triggers.
    if (provider === "gemini") {
      return await invokeSafe<string>("trigger_gemini_oauth");
    }

    const mapped = provider === "openai" ? "copilot" : provider;
    if (mapped === "claude" || mapped === "qwen" || mapped === "copilot") {
      return await invokeSafe<string>("trigger_oauth_login", { provider: mapped });
    }

    return "OAuth flow not available in this build.";
  }
}

export async function pollOAuthStatus(_oauthState: string): Promise<boolean> {
  try {
    return await invokeSafe<boolean>("poll_oauth_status", { oauthState: _oauthState });
  } catch {
    return false;
  }
}

export async function completeOAuth(_provider: Provider, _code: string): Promise<AuthStatus> {
  try {
    return await invokeSafe<AuthStatus>("complete_oauth", { provider: _provider, code: _code });
  } catch {
    return defaultAuthStatus();
  }
}

export async function disconnectProvider(_provider: Provider): Promise<AuthStatus> {
  try {
    return await invokeSafe<AuthStatus>("disconnect_provider", { provider: _provider });
  } catch {
    return defaultAuthStatus();
  }
}

export async function importVertexCredential(_filePath: string): Promise<AuthStatus> {
  try {
    return await invokeSafe<AuthStatus>("import_vertex_credential", { filePath: _filePath });
  } catch {
    return defaultAuthStatus();
  }
}

export async function getAuthStatus(): Promise<AuthStatus> {
  try {
    return await invokeSafe<AuthStatus>("get_auth_status");
  } catch {
    return defaultAuthStatus();
  }
}

export async function refreshAuthStatus(): Promise<AuthStatus> {
  try {
    return await invokeSafe<AuthStatus>("refresh_auth_status");
  } catch {
    return defaultAuthStatus();
  }
}

// ============================
// Config
// ============================

export async function getConfig(): Promise<AppConfig> {
  try {
    return await invokeSafe<AppConfig>("get_config");
  } catch {
    return await invokeSafe<AppConfig>("get_proxy_config");
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  try {
    await invokeSafe("save_config", { config });
  } catch {
    await invokeSafe("save_proxy_config", { configData: config });
  }
}

export async function reloadConfig(): Promise<void> {
  try {
    await invokeSafe("reload_config");
  } catch {
    // Current backend does not provide an explicit reload.
  }
}

// ============================
// API Keys (via config)
// ============================

export async function getGeminiApiKeys(): Promise<GeminiApiKey[]> {
  const cfg = await getConfig();
  return cfg.geminiApiKeys ?? [];
}

export async function setGeminiApiKeys(keys: GeminiApiKey[]): Promise<void> {
  const cfg = await getConfig();
  await saveConfig({ ...cfg, geminiApiKeys: keys });
}

export async function getClaudeApiKeys(): Promise<ClaudeApiKey[]> {
  const cfg = await getConfig();
  return cfg.claudeApiKeys ?? [];
}

export async function setClaudeApiKeys(keys: ClaudeApiKey[]): Promise<void> {
  const cfg = await getConfig();
  await saveConfig({ ...cfg, claudeApiKeys: keys });
}

export async function getCodexApiKeys(): Promise<CodexApiKey[]> {
  const cfg = await getConfig();
  return cfg.codexApiKeys ?? [];
}

export async function setCodexApiKeys(keys: CodexApiKey[]): Promise<void> {
  const cfg = await getConfig();
  await saveConfig({ ...cfg, codexApiKeys: keys });
}

// Treat current-tool ampOpenaiProviders as "OpenAI-compatible providers" for now.
export type OpenAICompatibleProvider = AmpOpenAIProvider;

export async function getOpenAICompatibleProviders(): Promise<OpenAICompatibleProvider[]> {
  const cfg = await getConfig();
  return cfg.ampOpenaiProviders ?? [];
}

export async function setOpenAICompatibleProviders(providers: OpenAICompatibleProvider[]): Promise<void> {
  const cfg = await getConfig();
  await saveConfig({ ...cfg, ampOpenaiProviders: providers });
}

export async function testOpenAIProvider(_provider: OpenAICompatibleProvider): Promise<{ success: boolean; message: string; modelsFound?: number }>{
  try {
    const res = await invokeSafe<{ success: boolean; message: string; modelsFound?: number }>("test_openai_provider", { provider: _provider });
    return res;
  } catch {
    return { success: false, message: "Test not available in this build." };
  }
}

// ============================
// Events
// ============================

export async function onProxyStatusChanged(handler: (status: ProxyStatus) => void): Promise<UnlistenFn> {
  try {
    return await listen<ProxyStatus>("proxy-status-changed", (e) => handler(e.payload));
  } catch {
    return () => {};
  }
}

export async function onAuthStatusChanged(handler: (status: AuthStatus) => void): Promise<UnlistenFn> {
  try {
    return await listen<AuthStatus>("auth-status-changed", (e) => handler(e.payload));
  } catch {
    return () => {};
  }
}

export interface OAuthCallback {
  provider: Provider;
  code: string;
}

export async function onOAuthCallback(handler: (data: OAuthCallback) => void): Promise<UnlistenFn> {
  try {
    return await listen<OAuthCallback>("oauth-callback", (e) => handler(e.payload));
  } catch {
    return () => {};
  }
}

export async function onTrayToggleProxy(handler: (shouldStart: boolean) => void): Promise<UnlistenFn> {
  try {
    return await listen<boolean>("tray-toggle-proxy", (e) => handler(e.payload));
  } catch {
    return () => {};
  }
}

export async function showSystemNotification(_title: string, _body: string): Promise<void> {
  try {
    await invokeSafe("show_system_notification", { title: _title, body: _body });
  } catch {
    // ignore
  }
}

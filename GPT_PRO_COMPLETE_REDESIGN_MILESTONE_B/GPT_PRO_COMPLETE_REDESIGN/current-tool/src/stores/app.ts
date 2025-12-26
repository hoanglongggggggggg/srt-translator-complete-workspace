import { createRoot, createSignal, onCleanup } from "solid-js";
import type { AppConfig, AuthStatus, OAuthCallback, ProxyStatus } from "../lib/tauri";
import {
  completeOAuth,
  getAuthStatus,
  getConfig,
  getProxyStatus,
  onAuthStatusChanged,
  onOAuthCallback,
  onProxyStatusChanged,
  onTrayToggleProxy,
  refreshAuthStatus,
  startProxy,
  stopProxy,
} from "../lib/tauri";

function defaultConfig(): AppConfig {
  return {
    geminiApiKeys: [],
    claudeApiKeys: [],
    codexApiKeys: [],

    port: 8317,
    requestRetry: 0,
    proxyUrl: "",
    loggingEnabled: false,
    loggingToFile: false,

    ampApiKey: "",
    ampModelMappings: [],
    ampOpenaiProviders: [],
    ampRoutingMode: "mappings",

    copilot: {
      enabled: false,
      port: 4141,
      accountType: "individual",
      githubToken: "",
      rateLimit: undefined,
      rateLimitWait: false,
    },

    thinkingBudgetMode: "auto",
    thinkingBudgetCustom: 0,
    reasoningEffortLevel: "medium",
    forceModelMappings: false,

    autoStart: true,
    debug: false,
    usageStatsEnabled: true,
    maxRetryInterval: 60,
  };
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

function createAppStore() {
  const [proxyStatus, setProxyStatus] = createSignal<ProxyStatus>({
    running: false,
    port: 8317,
    endpoint: "http://localhost:8317/v1",
  });

  const [authStatus, setAuthStatus] = createSignal<AuthStatus>(defaultAuthStatus());

  const [config, setConfig] = createSignal<AppConfig>(defaultConfig());

  const [isLoading, setIsLoading] = createSignal(false);
  const [isInitialized, setIsInitialized] = createSignal(false);

  // Sidebar UI state (kept for ProxyPal parity)
  const [sidebarExpanded, setSidebarExpanded] = createSignal(false);

  const initialize = async () => {
    if (isInitialized() || isLoading()) return;

    setIsLoading(true);
    try {
      const [proxyState, configState] = await Promise.all([
        getProxyStatus(),
        getConfig(),
      ]);

      setProxyStatus(proxyState);
      setConfig(configState);

      // Try refresh first, fallback to saved auth status.
      try {
        const a = await refreshAuthStatus();
        setAuthStatus(a);
      } catch {
        const a = await getAuthStatus();
        setAuthStatus(a);
      }

      const unlistenProxy = await onProxyStatusChanged((s) => setProxyStatus(s));
      const unlistenAuth = await onAuthStatusChanged((s) => setAuthStatus(s));

      const unlistenOAuth = await onOAuthCallback(async (data: OAuthCallback) => {
        try {
          const next = await completeOAuth(data.provider, data.code);
          setAuthStatus(next);
        } catch {
          // ignore
        }
      });

      const unlistenTray = await onTrayToggleProxy(async (shouldStart) => {
        try {
          const next = shouldStart ? await startProxy() : await stopProxy();
          setProxyStatus(next);
        } catch {
          // ignore
        }
      });

      onCleanup(() => {
        unlistenProxy();
        unlistenAuth();
        unlistenOAuth();
        unlistenTray();
      });

      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    proxyStatus,
    setProxyStatus,

    authStatus,
    setAuthStatus,

    config,
    setConfig,

    isLoading,
    setIsLoading,

    isInitialized,
    sidebarExpanded,
    setSidebarExpanded,

    initialize,
  };
}

export const appStore = createRoot(createAppStore);

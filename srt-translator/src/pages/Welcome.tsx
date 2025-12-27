import { For, Show, createSignal, onMount, onCleanup } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { invoke } from "@tauri-apps/api/core";
import { openOAuth, pollOAuthStatus, type Provider } from "../lib/tauri";
import { toastStore } from "../stores/toast";

type ProviderRow = {
  id: Provider;
  name: string;
  description: string;
};

type ProviderStatus = {
  [key in Provider]?: {
    connected: boolean;
    sessions: number;
    email?: string;
  };
};

const PROVIDERS: ProviderRow[] = [
  { id: "gemini", name: "Gemini", description: "OAuth login using the local proxy." },
  { id: "claude", name: "Claude", description: "OAuth login using the local proxy." },
  { id: "qwen", name: "Qwen", description: "OAuth login using the local proxy." },
  { id: "copilot", name: "Copilot", description: "OpenAI models via Copilot OAuth." },
  { id: "iflow", name: "iFlow", description: "OAuth login (requires backend support)." },
  { id: "antigravity", name: "Antigravity", description: "OAuth login (requires backend support)." },
];

export default function Welcome() {
  const navigate = useNavigate();
  const [busy, setBusy] = createSignal<Provider | null>(null);
  const [debugLogs, setDebugLogs] = createSignal<string[]>([]);
  const [providerStatus, setProviderStatus] = createSignal<ProviderStatus>({});

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  // Check auth status
  const checkAuthStatus = async () => {
    try {
      const authFiles = await invoke<Array<{
        provider: string;
        email: string;
        status: string;
      }>>("get_auth_status");

      const status: ProviderStatus = {};

      for (const file of authFiles) {
        // Map backend provider names to frontend names
        const provider = file.provider === "anthropic" ? "claude"
          : file.provider === "codex" ? "copilot"
            : file.provider === "gemini-cli" ? "gemini"
              : file.provider as Provider;

        if (!status[provider]) {
          status[provider] = { connected: true, sessions: 0 };
        }
        status[provider]!.sessions++;
        if (file.email && !status[provider]!.email) {
          status[provider]!.email = file.email;
        }
      }

      setProviderStatus(status);
    } catch (e) {
      console.error("Failed to check auth status:", e);
    }
  };

  // Poll auth status every 5 seconds
  onMount(() => {
    checkAuthStatus();
    const interval = setInterval(checkAuthStatus, 5000);
    onCleanup(() => clearInterval(interval));
  });

  const connect = async (p: Provider) => {
    setBusy(p);
    addLog(`🔵 Triggering OAuth for provider: ${p}`);
    try {
      const oauthResp = await openOAuth(p);
      addLog(`✅ Response: ${JSON.stringify(oauthResp)}`);

      // Backend returns URL and state - open browser and poll for completion
      if (oauthResp.url && oauthResp.url.startsWith("http")) {
        addLog("🌐 Opening browser with URL");
        await invoke("open_external_browser", { url: oauthResp.url });
        toastStore.success("Browser opened - check for login page!");
        addLog("✅ Browser opened successfully!");

        // Poll for OAuth completion
        addLog(`🔄 Polling OAuth status with state: ${oauthResp.state}`);
        const pollInterval = setInterval(async () => {
          try {
            const status = await invoke<string>("poll_oauth_status", { state: oauthResp.state });
            addLog(`📊 OAuth status: ${status}`);

            if (status === "ok") {
              clearInterval(pollInterval);
              addLog("✅ OAuth completed successfully!");
              toastStore.success("Authentication successful!");

              // Now check auth status to update UI
              await checkAuthStatus();
              setBusy(null);
            } else if (status === "error") {
              clearInterval(pollInterval);
              addLog("❌ OAuth failed!");
              toastStore.error("Authentication failed");
              setBusy(null);
            }
            // status === "wait" - keep polling
          } catch (e: any) {
            clearInterval(pollInterval);
            addLog(`❌ Polling error: ${String(e)}`);
            setBusy(null);
          }
        }, 2000); // Poll every 2 seconds

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          if (busy()) {
            addLog(`⏱️ OAuth timeout`);
            toastStore.error("OAuth timeout - please try again");
            setBusy(null);
          }
        }, 300000);
      } else {
        addLog(`ℹ️ Unexpected response: ${JSON.stringify(oauthResp)}`);
        toastStore.info("Unexpected OAuth response");
      }
    } catch (e: any) {
      addLog(`❌ Error: ${String(e)}`);
      toastStore.error("Login failed.", String(e));
    } finally {
      // Don't clear busy here - let polling handle it
    }
  };

  return (
    <div class="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">Welcome</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Connect providers, start the local proxy, and begin translating subtitles.
        </p>
      </div>

      <section class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">OAuth providers</h2>

        <div class="mt-4 space-y-3">
          <For each={PROVIDERS}>
            {(p) => (
              <div class="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 transition flex items-center justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-900 dark:text-gray-100">{p.name}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{p.description}</div>
                </div>

                <div class="flex items-center gap-3">
                  <button
                    onClick={() => connect(p.id)}
                    disabled={!!busy()}
                    class="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {busy() === p.id ? "Connecting..." : "Connect"}
                  </button>
                  <Show when={providerStatus()[p.id]?.connected}>
                    <div class="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                      <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span>{providerStatus()[p.id]!.sessions} session{providerStatus()[p.id]!.sessions !== 1 ? 's' : ''}</span>
                      <Show when={providerStatus()[p.id]!.email}>
                        <span class="text-gray-500">• {providerStatus()[p.id]!.email}</span>
                      </Show>
                    </div>
                  </Show>
                </div>
              </div>
            )}
          </For>
        </div>

        <div class="mt-4 flex justify-between items-center">
          <button
            onClick={() => navigate("/translate")}
            class="px-4 py-2 rounded-md text-sm font-medium border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Skip Setup
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            class="px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:opacity-90 transition"
          >
            Continue to Dashboard
          </button>
        </div>

        {/* Debug Logs Panel */}
        {debugLogs().length > 0 && (
          <div class="mt-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300">Debug Logs</h3>
              <button
                onClick={() => setDebugLogs([])}
                class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Clear
              </button>
            </div>
            <div class="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
              <For each={debugLogs()}>
                {(log) => (
                  <div class="text-gray-600 dark:text-gray-400">{log}</div>
                )}
              </For>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}


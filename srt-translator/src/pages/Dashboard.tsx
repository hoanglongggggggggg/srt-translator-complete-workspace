import { For, Show, onMount, onCleanup, createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { startProxy, stopProxy, type Provider } from "../lib/tauri";
import { appStore } from "../stores/app";
import { toastStore } from "../stores/toast";

type ProviderRow = {
  id: Provider;
  label: string;
};

const PROVIDERS: ProviderRow[] = [
  { id: "gemini", label: "Gemini" },
  { id: "claude", label: "Claude" },
  { id: "qwen", label: "Qwen" },
  { id: "copilot", label: "Copilot" },
  { id: "iflow", label: "iFlow" },
  { id: "antigravity", label: "Antigravity" },
];

type ProviderStatus = {
  [key in Provider]?: {
    connected: boolean;
    sessions: number;
    email?: string;
  };
};

export default function DashboardPage() {
  const { proxyStatus, config, initialize, setProxyStatus } = appStore;
  const [providerStatus, setProviderStatus] = createSignal<ProviderStatus>({});

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

  onMount(() => {
    void initialize();
    checkAuthStatus();
    const interval = setInterval(checkAuthStatus, 5000);
    onCleanup(() => clearInterval(interval));
  });

  const providerCount = (id: Provider): number => {
    return providerStatus()[id]?.sessions || 0;
  };

  const providerEmail = (id: Provider): string | undefined => {
    return providerStatus()[id]?.email;
  };

  const handleStart = async () => {
    try {
      const st = await startProxy();
      setProxyStatus(st);
      toastStore.success("Proxy status updated.");
    } catch (e: any) {
      toastStore.error("Unable to start proxy.", String(e));
    }
  };

  const handleStop = async () => {
    try {
      const st = await stopProxy();
      setProxyStatus(st);
      toastStore.success("Proxy status updated.");
    } catch (e: any) {
      toastStore.error("Unable to stop proxy.", String(e));
    }
  };

  return (
    <div class="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Proxy status, provider connectivity, and quick actions.
        </p>
      </div>

      <section class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">Proxy</div>
            <div class="mt-2 text-sm flex items-center gap-2">
              <span class={proxyStatus().running ? "text-success font-semibold" : "text-error font-semibold"}>
                {proxyStatus().running ? "✓" : "✗"}
              </span>
              <span class="text-gray-800 dark:text-gray-200">
                {proxyStatus().running ? "Running" : "Stopped"}
              </span>
            </div>
            <div class="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Port: {config().port}
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              onClick={handleStart}
              disabled={proxyStatus().running}
              class="px-3 py-2 rounded-md text-sm font-medium border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Start
            </button>
            <button
              onClick={handleStop}
              disabled={!proxyStatus().running}
              class="px-3 py-2 rounded-md text-sm font-medium border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Stop
            </button>
          </div>
        </div>

        <div class="mt-4 text-xs text-gray-600 dark:text-gray-400">
          Start/stop control requires backend support. Current builds auto-start the proxy on app launch.
        </div>
      </section>

      <section class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Providers</h2>
        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <For each={PROVIDERS}>
            {(p) => (
              <div class="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
                <div class="flex items-center justify-between gap-3">
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{p.label}</div>
                  <div class="text-sm flex items-center gap-2">
                    <span class={providerCount(p.id) > 0 ? "text-success font-semibold" : "text-error font-semibold"}>
                      {providerCount(p.id) > 0 ? "✓" : "✗"}
                    </span>
                    <span class="text-gray-700 dark:text-gray-300">{providerCount(p.id) > 0 ? "Connected" : "Not connected"}</span>
                  </div>
                </div>
                <div class="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  Sessions: {providerCount(p.id)}
                  <Show when={providerEmail(p.id)}>
                    <div class="mt-1 text-xs">{providerEmail(p.id)}</div>
                  </Show>
                </div>
              </div>
            )}
          </For>
        </div>
      </section>
    </div>
  );
}

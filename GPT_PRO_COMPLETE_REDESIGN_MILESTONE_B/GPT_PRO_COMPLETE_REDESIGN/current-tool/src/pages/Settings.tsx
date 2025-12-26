import { createEffect, createResource, createSignal, Show } from "solid-js";
import { getConfig, getProxyStatus, saveConfig, type AppConfig, type ProxyStatus } from "../lib/tauri";
import { toastStore } from "../stores/toast";

function cloneConfig(cfg: AppConfig): AppConfig {
  // Shallow clone is enough for our local form editing; nested arrays/objects are replaced when modified.
  return JSON.parse(JSON.stringify(cfg)) as AppConfig;
}

export default function ProxyPalSettingsPage() {
  const [proxyStatus, setProxyStatus] = createSignal<ProxyStatus>({
    running: false,
    port: 8317,
    endpoint: "http://localhost:8317/v1",
  });

  const [configRes, { refetch }] = createResource(async () => {
    const cfg = await getConfig();
    return cfg;
  });

  const [draft, setDraft] = createSignal<AppConfig | null>(null);
  const [saving, setSaving] = createSignal(false);

  createEffect(() => {
    const cfg = configRes();
    if (cfg && !draft()) {
      setDraft(cloneConfig(cfg));
    }
  });

  createEffect(() => {
    // lightweight poll (frontend parity; backend parity comes later)
    const tick = async () => {
      try {
        const st = await getProxyStatus();
        setProxyStatus(st);
      } catch {
        // ignore
      }
    };

    tick();
    const id = window.setInterval(tick, 4000);
    return () => window.clearInterval(id);
  });

  const update = <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
    const cur = draft();
    if (!cur) return;
    setDraft({ ...cur, [key]: value });
  };

  const updateCopilot = <K extends keyof AppConfig["copilot"]>(key: K, value: AppConfig["copilot"][K]) => {
    const cur = draft();
    if (!cur) return;
    setDraft({ ...cur, copilot: { ...cur.copilot, [key]: value } });
  };

  const handleSave = async () => {
    const cfg = draft();
    if (!cfg) return;
    setSaving(true);
    try {
      await saveConfig(cfg);
      toastStore.success("Settings saved.");
      refetch();
      setDraft(null);
    } catch (e: any) {
      toastStore.error("Failed to save settings.", String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="max-w-5xl mx-auto space-y-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure proxy behavior, routing, and advanced AI settings.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div class="text-sm flex items-center gap-2">
            <span class={proxyStatus().running ? "text-success font-semibold" : "text-error font-semibold"}>
              {proxyStatus().running ? "✓" : "✗"}
            </span>
            <span class="text-gray-700 dark:text-gray-300">
              {proxyStatus().running ? "Proxy running" : "Proxy stopped"}
            </span>
          </div>

          <button
            onClick={handleSave}
            disabled={saving() || !draft()}
            class="px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving() ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <Show when={draft()} fallback={
        <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 text-sm text-gray-600 dark:text-gray-400">
          Loading settings...
        </div>
      }>
        {(cfg) => (
          <div class="space-y-6">
            {/* Proxy */}
            <section class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Proxy</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Port</label>
                  <input
                    type="number"
                    value={cfg().port}
                    min={1000}
                    max={65535}
                    onInput={(e) => update("port", Number(e.currentTarget.value))}
                    class="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Proxy URL</label>
                  <input
                    type="text"
                    value={cfg().proxyUrl}
                    onInput={(e) => update("proxyUrl", e.currentTarget.value)}
                    class="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
                    placeholder=""
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Request retry</label>
                  <input
                    type="number"
                    value={cfg().requestRetry}
                    min={0}
                    max={10}
                    onInput={(e) => update("requestRetry", Number(e.currentTarget.value))}
                    class="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
                  />
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-6 mt-4">
                <label class="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={cfg().autoStart}
                    onChange={(e) => update("autoStart", e.currentTarget.checked)}
                    class="rounded border-gray-300 dark:border-gray-700"
                  />
                  Auto start
                </label>

                <label class="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={cfg().debug}
                    onChange={(e) => update("debug", e.currentTarget.checked)}
                    class="rounded border-gray-300 dark:border-gray-700"
                  />
                  Debug
                </label>

                <label class="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={cfg().usageStatsEnabled}
                    onChange={(e) => update("usageStatsEnabled", e.currentTarget.checked)}
                    class="rounded border-gray-300 dark:border-gray-700"
                  />
                  Usage stats
                </label>
              </div>
            </section>

            {/* Logging */}
            <section class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Logging</h2>
              <div class="flex flex-wrap items-center gap-6 mt-4">
                <label class="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={cfg().loggingEnabled}
                    onChange={(e) => update("loggingEnabled", e.currentTarget.checked)}
                    class="rounded border-gray-300 dark:border-gray-700"
                  />
                  Enable request logging
                </label>

                <label class="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={cfg().loggingToFile}
                    onChange={(e) => update("loggingToFile", e.currentTarget.checked)}
                    class="rounded border-gray-300 dark:border-gray-700"
                  />
                  Log to file
                </label>
              </div>
            </section>

            {/* Amp */}
            <section class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Amp integration</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Amp API key</label>
                  <input
                    type="password"
                    value={cfg().ampApiKey}
                    onInput={(e) => update("ampApiKey", e.currentTarget.value)}
                    class="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
                    placeholder=""
                  />
                </div>

                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Routing mode</label>
                  <select
                    value={cfg().ampRoutingMode}
                    onChange={(e) => update("ampRoutingMode", e.currentTarget.value)}
                    class="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 cursor-pointer"
                  >
                    <option value="mappings">Mappings</option>
                    <option value="passthrough">Passthrough</option>
                  </select>
                </div>
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Model mappings and OpenAI-compatible providers are managed in the API Keys page.
              </p>
            </section>

            {/* Copilot */}
            <section class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Copilot</h2>

              <div class="flex flex-wrap items-center gap-6 mt-4">
                <label class="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={cfg().copilot.enabled}
                    onChange={(e) => updateCopilot("enabled", e.currentTarget.checked)}
                    class="rounded border-gray-300 dark:border-gray-700"
                  />
                  Enable Copilot API
                </label>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Port</label>
                  <input
                    type="number"
                    value={cfg().copilot.port}
                    min={1000}
                    max={65535}
                    onInput={(e) => updateCopilot("port", Number(e.currentTarget.value))}
                    class="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Account type</label>
                  <select
                    value={cfg().copilot.accountType}
                    onChange={(e) => updateCopilot("accountType", e.currentTarget.value)}
                    class="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 cursor-pointer"
                  >
                    <option value="individual">Individual</option>
                    <option value="business">Business</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">GitHub token</label>
                  <input
                    type="password"
                    value={cfg().copilot.githubToken}
                    onInput={(e) => updateCopilot("githubToken", e.currentTarget.value)}
                    class="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
                    placeholder=""
                  />
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-6 mt-4">
                <label class="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={cfg().copilot.rateLimitWait}
                    onChange={(e) => updateCopilot("rateLimitWait", e.currentTarget.checked)}
                    class="rounded border-gray-300 dark:border-gray-700"
                  />
                  Wait on rate limit
                </label>
              </div>
            </section>

            {/* Advanced AI */}
            <section class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Advanced AI</h2>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Thinking budget</label>
                  <select
                    value={cfg().thinkingBudgetMode}
                    onChange={(e) => update("thinkingBudgetMode", e.currentTarget.value)}
                    class="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 cursor-pointer"
                  >
                    <option value="auto">Auto</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="custom">Custom</option>
                  </select>

                  <Show when={cfg().thinkingBudgetMode === "custom"}>
                    <input
                      type="number"
                      value={cfg().thinkingBudgetCustom}
                      min={0}
                      onInput={(e) => update("thinkingBudgetCustom", Number(e.currentTarget.value))}
                      class="w-full px-3 py-2 mt-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
                    />
                  </Show>
                </div>

                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Reasoning effort</label>
                  <select
                    value={cfg().reasoningEffortLevel}
                    onChange={(e) => update("reasoningEffortLevel", e.currentTarget.value)}
                    class="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Max retry interval (seconds)</label>
                  <input
                    type="number"
                    value={cfg().maxRetryInterval}
                    min={1}
                    max={3600}
                    onInput={(e) => update("maxRetryInterval", Number(e.currentTarget.value))}
                    class="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
                  />
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-6 mt-4">
                <label class="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={cfg().forceModelMappings}
                    onChange={(e) => update("forceModelMappings", e.currentTarget.checked)}
                    class="rounded border-gray-300 dark:border-gray-700"
                  />
                  Force model mappings
                </label>
              </div>
            </section>
          </div>
        )}
      </Show>
    </div>
  );
}

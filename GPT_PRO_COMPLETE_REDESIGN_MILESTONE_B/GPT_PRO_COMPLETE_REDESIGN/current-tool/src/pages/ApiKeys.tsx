import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import type {
  ClaudeApiKey,
  CodexApiKey,
  GeminiApiKey,
  OpenAICompatibleProvider,
} from "../lib/tauri";
import {
  getClaudeApiKeys,
  getCodexApiKeys,
  getGeminiApiKeys,
  getOpenAICompatibleProviders,
  setClaudeApiKeys,
  setCodexApiKeys,
  setGeminiApiKeys,
  setOpenAICompatibleProviders,
  testOpenAIProvider,
} from "../lib/tauri";
import { toastStore } from "../stores/toast";
import { appStore } from "../stores/app";

type TabId = "gemini" | "claude" | "codex" | "openai";

const mask = (key: string) => {
  if (!key) return "";
  const trimmed = key.trim();
  if (trimmed.length <= 10) return "********";
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
};

const makeId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
};

export default function ApiKeysPage() {
  const { proxyStatus } = appStore;

  const [activeTab, setActiveTab] = createSignal<TabId>("gemini");
  const [loading, setLoading] = createSignal(false);

  const [geminiKeys, setGeminiKeys] = createSignal<GeminiApiKey[]>([]);
  const [claudeKeys, setClaudeKeys] = createSignal<ClaudeApiKey[]>([]);
  const [codexKeys, setCodexKeys] = createSignal<CodexApiKey[]>([]);
  const [openaiProviders, setOpenaiProviders] = createSignal<OpenAICompatibleProvider[]>([]);

  const [newKey, setNewKey] = createSignal("");
  const [newProviderName, setNewProviderName] = createSignal("");
  const [newProviderBaseUrl, setNewProviderBaseUrl] = createSignal("");
  const [newProviderApiKey, setNewProviderApiKey] = createSignal("");

  const tabTitle = createMemo(() => {
    switch (activeTab()) {
      case "gemini":
        return "Gemini";
      case "claude":
        return "Claude";
      case "codex":
        return "Codex";
      case "openai":
        return "OpenAI-compatible";
      default:
        return "";
    }
  });

  const load = async () => {
    setLoading(true);
    try {
      const [g, c, x, o] = await Promise.all([
        getGeminiApiKeys(),
        getClaudeApiKeys(),
        getCodexApiKeys(),
        getOpenAICompatibleProviders(),
      ]);
      setGeminiKeys(g);
      setClaudeKeys(c);
      setCodexKeys(x);
      setOpenaiProviders(o);
    } catch (e: any) {
      toastStore.error("Failed to load API keys.", String(e));
    } finally {
      setLoading(false);
    }
  };

  createEffect(() => {
    // Refresh when the proxy status changes.
    // The current backend always auto-starts; this keeps UI parity.
    void proxyStatus();
    void load();
  });

  const currentKeyList = () => {
    switch (activeTab()) {
      case "gemini":
        return geminiKeys();
      case "claude":
        return claudeKeys();
      case "codex":
        return codexKeys();
      default:
        return [];
    }
  };

  const setCurrentKeyList = async (next: Array<GeminiApiKey | ClaudeApiKey | CodexApiKey>) => {
    switch (activeTab()) {
      case "gemini":
        await setGeminiApiKeys(next as GeminiApiKey[]);
        setGeminiKeys(next as GeminiApiKey[]);
        break;
      case "claude":
        await setClaudeApiKeys(next as ClaudeApiKey[]);
        setClaudeKeys(next as ClaudeApiKey[]);
        break;
      case "codex":
        await setCodexApiKeys(next as CodexApiKey[]);
        setCodexKeys(next as CodexApiKey[]);
        break;
    }
  };

  const addKey = async () => {
    const key = newKey().trim();
    if (!key) {
      toastStore.error("API key required.");
      return;
    }

    setLoading(true);
    try {
      const list = currentKeyList();
      const updated = [...list, { apiKey: key } as any];
      await setCurrentKeyList(updated);
      setNewKey("");
      toastStore.success("Key added.");
    } catch (e: any) {
      toastStore.error("Failed to add key.", String(e));
    } finally {
      setLoading(false);
    }
  };

  const deleteKey = async (index: number) => {
    setLoading(true);
    try {
      const list = currentKeyList();
      const updated = list.filter((_, i) => i !== index);
      await setCurrentKeyList(updated as any);
      toastStore.success("Key removed.");
    } catch (e: any) {
      toastStore.error("Failed to remove key.", String(e));
    } finally {
      setLoading(false);
    }
  };

  const addOpenAIProvider = async () => {
    const name = newProviderName().trim();
    const baseUrl = newProviderBaseUrl().trim();
    const apiKey = newProviderApiKey().trim();

    if (!name || !baseUrl || !apiKey) {
      toastStore.error("Name, Base URL, and API key are required.");
      return;
    }

    setLoading(true);
    try {
      const updated: OpenAICompatibleProvider[] = [
        ...openaiProviders(),
        { id: makeId(), name, baseUrl, apiKey, models: [] },
      ];
      await setOpenAICompatibleProviders(updated);
      setOpenaiProviders(updated);
      setNewProviderName("");
      setNewProviderBaseUrl("");
      setNewProviderApiKey("");
      toastStore.success("Provider added.");
    } catch (e: any) {
      toastStore.error("Failed to add provider.", String(e));
    } finally {
      setLoading(false);
    }
  };

  const removeOpenAIProvider = async (id: string) => {
    setLoading(true);
    try {
      const updated = openaiProviders().filter((p) => p.id !== id);
      await setOpenAICompatibleProviders(updated);
      setOpenaiProviders(updated);
      toastStore.success("Provider removed.");
    } catch (e: any) {
      toastStore.error("Failed to remove provider.", String(e));
    } finally {
      setLoading(false);
    }
  };

  const testProvider = async (provider: OpenAICompatibleProvider) => {
    setLoading(true);
    try {
      const res = await testOpenAIProvider(provider);
      if (res.success) {
        toastStore.success(res.message || "Test succeeded.");
      } else {
        toastStore.error(res.message || "Test failed.");
      }
    } catch (e: any) {
      toastStore.error("Test failed.", String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">API keys</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage API keys and OpenAI-compatible providers.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("gemini")}
          class={
            "px-3 py-2 rounded-md text-sm font-medium border transition " +
            (activeTab() === "gemini"
              ? "border-primary bg-gray-50 dark:bg-gray-900"
              : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900")
          }
        >
          Gemini
        </button>
        <button
          onClick={() => setActiveTab("claude")}
          class={
            "px-3 py-2 rounded-md text-sm font-medium border transition " +
            (activeTab() === "claude"
              ? "border-primary bg-gray-50 dark:bg-gray-900"
              : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900")
          }
        >
          Claude
        </button>
        <button
          onClick={() => setActiveTab("codex")}
          class={
            "px-3 py-2 rounded-md text-sm font-medium border transition " +
            (activeTab() === "codex"
              ? "border-primary bg-gray-50 dark:bg-gray-900"
              : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900")
          }
        >
          Codex
        </button>
        <button
          onClick={() => setActiveTab("openai")}
          class={
            "px-3 py-2 rounded-md text-sm font-medium border transition " +
            (activeTab() === "openai"
              ? "border-primary bg-gray-50 dark:bg-gray-900"
              : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900")
          }
        >
          OpenAI-compatible
        </button>
      </div>

      <section class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">{tabTitle()}</h2>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Keys are stored locally and used by the proxy.
            </p>
          </div>

          <button
            onClick={load}
            disabled={loading()}
            class="px-3 py-2 rounded-md text-sm font-medium border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading() ? "Working..." : "Refresh"}
          </button>
        </div>

        <Show when={activeTab() !== "openai"}>
          <div class="mt-4 space-y-3">
            <For each={currentKeyList() as any[]} fallback={
              <div class="text-sm text-gray-600 dark:text-gray-400">No keys configured.</div>
            }>
              {(k, idx) => (
                <div class="flex items-center justify-between gap-3 rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-3">
                  <div class="text-sm font-mono text-gray-900 dark:text-gray-100 truncate">
                    {mask(k.apiKey)}
                  </div>
                  <button
                    onClick={() => deleteKey(idx())}
                    disabled={loading()}
                    class="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Remove
                  </button>
                </div>
              )}
            </For>
          </div>

          <div class="mt-4 flex gap-2">
            <input
              type="password"
              value={newKey()}
              onInput={(e) => setNewKey(e.currentTarget.value)}
              placeholder="Enter API key"
              class="flex-1 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
            />
            <button
              onClick={addKey}
              disabled={loading()}
              class="px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Add
            </button>
          </div>
        </Show>

        <Show when={activeTab() === "openai"}>
          <div class="mt-4 space-y-3">
            <For each={openaiProviders()} fallback={
              <div class="text-sm text-gray-600 dark:text-gray-400">No providers configured.</div>
            }>
              {(p) => (
                <div class="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</div>
                      <div class="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">{p.baseUrl}</div>
                      <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Models: {p.models?.length ?? 0}
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        onClick={() => testProvider(p)}
                        disabled={loading()}
                        class="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => removeOpenAIProvider(p.id)}
                        disabled={loading()}
                        class="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>

          <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={newProviderName()}
              onInput={(e) => setNewProviderName(e.currentTarget.value)}
              placeholder="Provider name"
              class="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
            />
            <input
              type="text"
              value={newProviderBaseUrl()}
              onInput={(e) => setNewProviderBaseUrl(e.currentTarget.value)}
              placeholder="Base URL"
              class="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
            />
            <input
              type="password"
              value={newProviderApiKey()}
              onInput={(e) => setNewProviderApiKey(e.currentTarget.value)}
              placeholder="API key"
              class="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
            />
          </div>

          <div class="mt-3 flex justify-end">
            <button
              onClick={addOpenAIProvider}
              disabled={loading()}
              class="px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Add provider
            </button>
          </div>
        </Show>

        <div class="mt-6 text-xs text-gray-600 dark:text-gray-400">
          Proxy status: {proxyStatus().running ? "✓ running" : "✗ stopped"}
        </div>
      </section>
    </div>
  );
}

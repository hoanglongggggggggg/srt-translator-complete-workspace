import { createSignal, Show } from "solid-js";
import { settingsStore } from "../stores/settings";
import { toastStore } from "../stores/toast";

export default function TranslateSettingsPage() {
    const { settings, updateSettings } = settingsStore;

    const [showApiKey, setShowApiKey] = createSignal(false);
    const [saved, setSaved] = createSignal(false);

    const handleSave = () => {
        // Settings are persisted immediately in the store; this is a UI acknowledgement.
        setSaved(true);
        toastStore.success("Settings saved.");
        setTimeout(() => setSaved(false), 2000);
    };

    const handleProviderChange = (provider: "proxypal" | "openai" | "anthropic" | "custom") => {
        const urls = {
            proxypal: "http://localhost:8317/v1",
            openai: "https://api.openai.com/v1",
            anthropic: "https://api.anthropic.com",
            custom: settings().baseUrl,
        };

        const models = {
            proxypal: "gemini-2.5-flash",
            openai: "gpt-4o-mini",
            anthropic: "claude-3-5-sonnet-20241022",
            custom: settings().model,
        };

        updateSettings({
            provider,
            baseUrl: urls[provider],
            model: models[provider],
        });
    };

    return (
        <div class="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Configure providers, languages, and performance options.
                </p>
            </div>

            {/* Provider Selection */}
            <section class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Provider</h2>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                    <button
                        onClick={() => handleProviderChange("proxypal")}
                        class={
                            "p-4 rounded-md border text-left transition " +
                            (settings().provider === "proxypal"
                                ? "border-success bg-gray-50 dark:bg-gray-900"
                                : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900")
                        }
                    >
                        <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">Local</div>
                        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">Use local translation service</div>
                    </button>

                    <button
                        onClick={() => handleProviderChange("openai")}
                        class={
                            "p-4 rounded-md border text-left transition " +
                            (settings().provider === "openai"
                                ? "border-primary bg-gray-50 dark:bg-gray-900"
                                : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900")
                        }
                    >
                        <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">OpenAI</div>
                        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">OpenAI API</div>
                    </button>

                    <button
                        onClick={() => handleProviderChange("anthropic")}
                        class={
                            "p-4 rounded-md border text-left transition " +
                            (settings().provider === "anthropic"
                                ? "border-primary bg-gray-50 dark:bg-gray-900"
                                : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900")
                        }
                    >
                        <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">Anthropic</div>
                        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">Claude API</div>
                    </button>

                    <button
                        onClick={() => handleProviderChange("custom")}
                        class={
                            "p-4 rounded-md border text-left transition " +
                            (settings().provider === "custom"
                                ? "border-primary bg-gray-50 dark:bg-gray-900"
                                : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900")
                        }
                    >
                        <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">Custom</div>
                        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">Your endpoint</div>
                    </button>
                </div>

                <Show when={settings().provider === "proxypal"}>
                    <div class="mt-4 p-4 rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                        <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            <span class="text-success font-semibold">✓</span> Using local service
                        </div>
                        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            No API key required for local translation.
                        </div>
                    </div>
                </Show>

                <div class="mt-6 space-y-4">
                    {/* Base URL hidden - always defaults to localhost:8317/v1 */}
                    <Show when={false}>
                        <div>
                            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Base URL
                            </label>
                            <input
                                type="text"
                                value={settings().baseUrl}
                                onInput={(e) => updateSettings({ baseUrl: e.currentTarget.value })}
                                class="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
                                placeholder="https://api.openai.com/v1"
                            />
                        </div>
                    </Show>

                    <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Model</label>
                        <select
                            value={settings().model}
                            onChange={(e) => updateSettings({ model: e.currentTarget.value })}
                            class="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 cursor-pointer"
                        >
                            <optgroup label="Gemini (OAuth)">
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
                                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite (Faster)</option>
                                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Quality)</option>
                                <option value="gemini-claude-sonnet-4-5">Antigravity Claude Sonnet 4.5</option>
                                <option value="gemini-claude-opus-4-5">Antigravity Claude Opus 4.5</option>
                            </optgroup>
                            <optgroup label="Claude (OAuth)">
                                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast)</option>
                                <option value="claude-3-opus-20240229">Claude 3 Opus (Quality)</option>
                            </optgroup>
                            <optgroup label="Qwen (OAuth)">
                                <option value="qwen-max">Qwen Max</option>
                                <option value="qwen-plus">Qwen Plus</option>
                                <option value="qwen-turbo">Qwen Turbo (Fast)</option>
                            </optgroup>
                            <optgroup label="Copilot/GPT (OAuth)">
                                <option value="gpt-5.1">GPT-5.1 (Best)</option>
                                <option value="gpt-5">GPT-5</option>
                                <option value="gpt-5-mini">GPT-5 Mini (Fast)</option>
                                <option value="gpt-4.1">GPT-4.1</option>
                                <option value="gpt-4o">GPT-4o</option>
                                <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
                            </optgroup>
                            <optgroup label="OpenAI API (requires API key)">
                                <option value="gpt-4o-mini">GPT-4o Mini</option>
                                <option value="gpt-4o">GPT-4o</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                            </optgroup>
                            <optgroup label="Other">
                                <option value="custom">Custom (type below)</option>
                            </optgroup>
                        </select>

                        <Show when={settings().model === "custom"}>
                            <input
                                type="text"
                                value={settings().model}
                                onInput={(e) => updateSettings({ model: e.currentTarget.value })}
                                class="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 mt-2"
                                placeholder="Enter custom model name"
                            />
                        </Show>
                    </div>

                    <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            API Key {settings().provider === "proxypal" && <span class="text-gray-500">(not required)</span>}
                        </label>
                        <div class="relative">
                            <input
                                type={showApiKey() ? "text" : "password"}
                                value={settings().apiKey}
                                onInput={(e) => updateSettings({ apiKey: e.currentTarget.value })}
                                class="w-full px-3 py-2 pr-20 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 disabled:opacity-50"
                                placeholder={settings().provider === "proxypal" ? "Leave empty" : "sk-..."}
                                disabled={settings().provider === "proxypal"}
                            />

                            <Show when={settings().provider !== "proxypal"}>
                                <button
                                    onClick={() => setShowApiKey(!showApiKey())}
                                    class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                >
                                    {showApiKey() ? "Hide" : "Show"}
                                </button>
                            </Show>
                        </div>
                    </div>
                </div>
            </section>

            {/* Languages */}
            <section class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Languages</h2>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Source language</label>
                        <select
                            value={settings().sourceLang}
                            onChange={(e) => updateSettings({ sourceLang: e.currentTarget.value })}
                            class="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
                        >
                            <option value="Auto">Auto-detect</option>
                            <option value="English">English</option>
                            <option value="ChineseSimplified">Chinese (Simplified)</option>
                            <option value="ChineseTraditional">Chinese (Traditional)</option>
                            <option value="Japanese">Japanese</option>
                            <option value="Korean">Korean</option>
                            <option value="Vietnamese">Vietnamese</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Target language</label>
                        <select
                            value={settings().targetLang}
                            onChange={(e) => updateSettings({ targetLang: e.currentTarget.value })}
                            class="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
                        >
                            <option value="Vietnamese">Vietnamese</option>
                            <option value="English">English</option>
                            <option value="ChineseSimplified">Chinese (Simplified)</option>
                            <option value="ChineseTraditional">Chinese (Traditional)</option>
                            <option value="Japanese">Japanese</option>
                            <option value="Korean">Korean</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Performance */}
            <section class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Performance</h2>

                <div class="space-y-6 mt-4">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Parallel threads</label>
                            <span class="text-xs text-gray-600 dark:text-gray-400">{settings().threads}</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={settings().threads}
                            onInput={(e) => updateSettings({ threads: parseInt(e.currentTarget.value) })}
                            class="w-full"
                        />
                        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Higher values can be faster but may increase rate limiting.
                        </div>
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Batch size</label>
                            <span class="text-xs text-gray-600 dark:text-gray-400">{settings().batchSize} cues</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="1000"
                            step="10"
                            value={settings().batchSize}
                            onInput={(e) => updateSettings({ batchSize: parseInt(e.currentTarget.value) })}
                            class="w-full"
                        />
                        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Larger batches can improve context but increase request size.
                        </div>
                    </div>
                </div>
            </section>
            <div class="flex items-center justify-end">
                <button
                    onClick={handleSave}
                    class="px-4 py-2 rounded-md text-sm font-semibold bg-primary text-white hover:brightness-95 transition"
                >
                    {saved() ? "✓ Saved" : "Save settings"}
                </button>
            </div>
        </div>
    );
}

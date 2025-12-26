import { useNavigate } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import { settingsStore } from "../stores/settings";
import { ProxySettings } from "../components/ProxySettings";

export default function SettingsPage() {
    const navigate = useNavigate();
    const { settings, updateSettings } = settingsStore;

    const [showApiKey, setShowApiKey] = createSignal(false);
    const [saved, setSaved] = createSignal(false);

    const handleSave = () => {
        setSaved(true);
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
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
            <div class="max-w-3xl mx-auto">
                {/* Header */}
                <div class="flex items-center justify-between mb-8">
                    <h1 class="text-3xl font-bold">⚙️ Settings</h1>
                    <button
                        onClick={() => navigate("/")}
                        class="px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition"
                    >
                        ← Back
                    </button>
                </div>

                {/* Provider Selection */}
                <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur p-6 mb-6">
                    <h2 class="text-xl font-semibold mb-4">🔌 Provider</h2>

                    <div class="grid grid-cols-4 gap-3 mb-4">
                        <button
                            onClick={() => handleProviderChange("proxypal")}
                            class={`p-4 rounded-xl border-2 transition ${settings().provider === "proxypal"
                                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                                }`}
                        >
                            <div class="font-semibold">🆓 ProxyPal</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">FREE!</div>
                        </button>

                        <button
                            onClick={() => handleProviderChange("openai")}
                            class={`p-4 rounded-xl border-2 transition ${settings().provider === "openai"
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                                }`}
                        >
                            <div class="font-semibold">OpenAI</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">GPT-4, GPT-3.5</div>
                        </button>

                        <button
                            onClick={() => handleProviderChange("anthropic")}
                            class={`p-4 rounded-xl border-2 transition ${settings().provider === "anthropic"
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                                }`}
                        >
                            <div class="font-semibold">Anthropic</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Claude</div>
                        </button>

                        <button
                            onClick={() => handleProviderChange("custom")}
                            class={`p-4 rounded-xl border-2 transition ${settings().provider === "custom"
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                                }`}
                        >
                            <div class="font-semibold">Custom</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Your endpoint</div>
                        </button>
                    </div>

                    <Show when={settings().provider === "proxypal"}>
                        <div class="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                            <div class="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                                ✅ Using ProxyPal Local (FREE!)
                            </div>
                            <div class="text-xs text-green-600 dark:text-green-400">
                                Make sure ProxyPal is running on port 8317. No API key needed!
                            </div>
                        </div>
                    </Show>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Base URL</label>
                            <input
                                type="text"
                                value={settings().baseUrl}
                                onInput={(e) => updateSettings({ baseUrl: e.currentTarget.value })}
                                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                placeholder="https://api.openai.com/v1"
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Model</label>
                            <input
                                type="text"
                                value={settings().model}
                                onInput={(e) => updateSettings({ model: e.currentTarget.value })}
                                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                placeholder="gpt-4o-mini"
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">
                                API Key {settings().provider === "proxypal" && <span class="text-gray-400">(not needed)</span>}
                            </label>
                            <div class="relative">
                                <input
                                    type={showApiKey() ? "text" : "password"}
                                    value={settings().apiKey}
                                    onInput={(e) => updateSettings({ apiKey: e.currentTarget.value })}
                                    class="w-full px-4 py-2 pr-20 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                    placeholder={settings().provider === "proxypal" ? "Leave empty" : "sk-..."}
                                    disabled={settings().provider === "proxypal"}
                                />
                                <Show when={settings().provider !== "proxypal"}>
                                    <button
                                        onClick={() => setShowApiKey(!showApiKey())}
                                        class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                    >
                                        {showApiKey() ? "Hide" : "Show"}
                                    </button>
                                </Show>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Languages */}
                <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur p-6 mb-6">
                    <h2 class="text-xl font-semibold mb-4">🌍 Languages</h2>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Source Language</label>
                            <select
                                value={settings().sourceLang}
                                onChange={(e) => updateSettings({ sourceLang: e.currentTarget.value })}
                                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
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
                            <label class="block text-sm font-medium mb-2">Target Language</label>
                            <select
                                value={settings().targetLang}
                                onChange={(e) => updateSettings({ targetLang: e.currentTarget.value })}
                                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
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
                </div>

                {/* Performance */}
                <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur p-6 mb-6">
                    <h2 class="text-xl font-semibold mb-4">⚡ Performance</h2>

                    <div class="space-y-6">
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <label class="text-sm font-medium">Parallel Threads</label>
                                <span class="text-sm text-gray-500">{settings().threads}</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={settings().threads}
                                onInput={(e) => updateSettings({ threads: parseInt(e.currentTarget.value) })}
                                class="w-full"
                            />
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Higher = faster, but may hit rate limits
                            </div>
                        </div>

                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <label class="text-sm font-medium">Batch Size</label>
                                <span class="text-sm text-gray-500">{settings().batchSize} cues</span>
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
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Larger batches = better context, but slower per batch
                            </div>
                        </div>
                    </div>
                </div>

                {/* Proxy Configuration Section */}
                <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur p-6 mb-6">
                    <ProxySettings />
                </div>

                {/* Save Button */}
                <div class="text-center">
                    <button
                        onClick={handleSave}
                        class="px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition"
                    >
                        {saved() ? "✅ Saved!" : "💾 Save Settings"}
                    </button>
                </div>
            </div>
        </div>
    );
}

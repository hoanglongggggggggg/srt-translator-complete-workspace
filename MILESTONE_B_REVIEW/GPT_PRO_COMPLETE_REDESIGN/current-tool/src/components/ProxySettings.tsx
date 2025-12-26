import { createSignal, createResource, For, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

// ============= TypeScript Interfaces =============

interface GeminiApiKey {
    apiKey: string;
    baseUrl?: string;
    proxyUrl?: string;
}

interface ClaudeApiKey {
    apiKey: string;
    baseUrl?: string;
    proxyUrl?: string;
}

interface CodexApiKey {
    apiKey: string;
    baseUrl?: string;
    proxyUrl?: string;
}

interface AmpModelMapping {
    from: string;
    to: string;
    enabled: boolean;
}

interface AmpOpenAIModel {
    name: string;
    alias: string;
}

interface AmpOpenAIProvider {
    id: string;
    name: string;
    baseUrl: string;
    apiKey: string;
    models: AmpOpenAIModel[];
}

interface CopilotConfig {
    enabled: boolean;
    port: number;
    accountType: string;
    githubToken: string;
    rateLimit?: number;
    rateLimitWait: boolean;
}

interface ProxyConfig {
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

// ============= Component =============

export function ProxySettings() {
    const [config, { refetch }] = createResource<ProxyConfig>(async () => {
        return await invoke("get_proxy_config");
    });

    const [saving, setSaving] = createSignal(false);
    const [message, setMessage] = createSignal("");

    // New key inputs
    const [newGeminiKey, setNewGeminiKey] = createSignal("");
    const [newClaudeKey, setNewClaudeKey] = createSignal("");
    const [newCodexKey, setNewCodexKey] = createSignal("");

    // Amp mapping inputs
    const [newMappingFrom, setNewMappingFrom] = createSignal("");
    const [newMappingTo, setNewMappingTo] = createSignal("");

    const showMessage = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(""), 3000);
    };

    const saveConfig = async () => {
        setSaving(true);
        try {
            await invoke("save_proxy_config", { configData: config() });
            showMessage("✓ Settings saved! Restart app to apply.");
        } catch (e) {
            showMessage(`✗ Error: ${e}`);
        } finally {
            setSaving(false);
        }
    };

    // ============= Gemini =============

    const addGeminiKey = async () => {
        const key = newGeminiKey().trim();
        if (!key) return;

        try {
            await invoke("add_gemini_key", {
                keyData: { apiKey: key, baseUrl: null, proxyUrl: null }
            });
            setNewGeminiKey("");
            refetch();
            showMessage("✓ Gemini key added!");
        } catch (e) {
            showMessage(`✗ Error: ${e}`);
        }
    };

    const removeGeminiKey = async (apiKey: string) => {
        try {
            await invoke("remove_gemini_key", { apiKey });
            refetch();
            showMessage("✓ Gemini key removed!");
        } catch (e) {
            showMessage(`✗ Error: ${e}`);
        }
    };

    // ============= Claude =============

    const addClaudeKey = async () => {
        const key = newClaudeKey().trim();
        if (!key) return;

        try {
            await invoke("add_claude_key", {
                keyData: { apiKey: key, baseUrl: null, proxyUrl: null }
            });
            setNewClaudeKey("");
            refetch();
            showMessage("✓ Claude key added!");
        } catch (e) {
            showMessage(`✗ Error: ${e}`);
        }
    };

    const removeClaudeKey = async (apiKey: string) => {
        try {
            await invoke("remove_claude_key", { apiKey });
            refetch();
            showMessage("✓ Claude key removed!");
        } catch (e) {
            showMessage(`✗ Error: ${e}`);
        }
    };

    // ============= Codex =============

    const addCodexKey = async () => {
        const key = newCodexKey().trim();
        if (!key) return;

        try {
            await invoke("add_codex_key", {
                keyData: { apiKey: key, baseUrl: null, proxyUrl: null }
            });
            setNewCodexKey("");
            refetch();
            showMessage("✓ Codex key added!");
        } catch (e) {
            showMessage(`✗ Error: ${e}`);
        }
    };

    const removeCodexKey = async (apiKey: string) => {
        try {
            await invoke("remove_codex_key", { apiKey });
            refetch();
            showMessage("✓ Codex key removed!");
        } catch (e) {
            showMessage(`✗ Error: ${e}`);
        }
    };

    // ============= Amp =============

    const addMapping = async () => {
        const from = newMappingFrom().trim();
        const to = newMappingTo().trim();
        if (!from || !to) return;

        try {
            await invoke("add_amp_mapping", {
                mapping: { from, to, enabled: true }
            });
            setNewMappingFrom("");
            setNewMappingTo("");
            refetch();
            showMessage("✓ Mapping added!");
        } catch (e) {
            showMessage(`✗ Error: ${e}`);
        }
    };

    const removeMapping = async (fromModel: string) => {
        try {
            await invoke("remove_amp_mapping", { fromModel });
            refetch();
            showMessage("✓ Mapping removed!");
        } catch (e) {
            showMessage(`✗ Error: ${e}`);
        }
    };

    return (
        <div class="proxy-settings">
            <h2>Complete Proxy Configuration</h2>

            <Show when={message()}>
                <div class="message-banner">{message()}</div>
            </Show>

            <Show when={config()} fallback={<div class="loading">Loading...</div>}>
                {(cfg) => (
                    <>
                        {/* ============= Gemini Section ============= */}
                        <div class="settings-section">
                            <h3>Gemini API Keys</h3>

                            <div class="key-list">
                                <For each={cfg().geminiApiKeys}>
                                    {(key) => (
                                        <div class="key-item">
                                            <code class="key-display">{key.apiKey.substring(0, 20)}...</code>
                                            <button onClick={() => removeGeminiKey(key.apiKey)} class="btn-remove">
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </For>
                            </div>

                            <div class="input-group">
                                <input
                                    type="password"
                                    value={newGeminiKey()}
                                    onInput={(e) => setNewGeminiKey(e.target.value)}
                                    placeholder="Manual: AIza..."
                                    class="api-key-input"
                                />
                                <button onClick={addGeminiKey} class="btn-add">Add Key</button>
                            </div>
                        </div>

                        {/* ============= Claude Section ============= */}
                        <div class="settings-section">
                            <h3>Claude API Keys</h3>

                            <div class="key-list">
                                <For each={cfg().claudeApiKeys}>
                                    {(key) => (
                                        <div class="key-item">
                                            <code class="key-display">{key.apiKey.substring(0, 20)}...</code>
                                            <button onClick={() => removeClaudeKey(key.apiKey)} class="btn-remove">
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </For>
                            </div>

                            <div class="input-group">
                                <input
                                    type="password"
                                    value={newClaudeKey()}
                                    onInput={(e) => setNewClaudeKey(e.target.value)}
                                    placeholder="sk-ant-..."
                                    class="api-key-input"
                                />
                                <button onClick={addClaudeKey} class="btn-add">Add Key</button>
                            </div>
                        </div>

                        {/* ============= Codex Section ============= */}
                        <div class="settings-section">
                            <h3>Codex API Keys</h3>

                            <div class="key-list">
                                <For each={cfg().codexApiKeys}>
                                    {(key) => (
                                        <div class="key-item">
                                            <code class="key-display">{key.apiKey.substring(0, 20)}...</code>
                                            <button onClick={() => removeCodexKey(key.apiKey)} class="btn-remove">
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </For>
                            </div>

                            <div class="input-group">
                                <input
                                    type="password"
                                    value={newCodexKey()}
                                    onInput={(e) => setNewCodexKey(e.target.value)}
                                    placeholder="Codex API key..."
                                    class="api-key-input"
                                />
                                <button onClick={addCodexKey} class="btn-add">Add Key</button>
                            </div>
                        </div>

                        {/* ============= OAuth Logins ============= */}
                        <div class="settings-section">
                            <h3>OAuth Logins</h3>
                            <div class="oauth-buttons">
                                <button
                                    onClick={async () => {
                                        try {
                                            const result = await invoke<string>("trigger_gemini_oauth", {});
                                            showMessage(`✓ ${result}`);
                                        } catch (e) {
                                            showMessage(`✗ Gemini OAuth error: ${e}`);
                                        }
                                    }}
                                    disabled={saving()}
                                    class="btn-oauth gemini"
                                >
                                    Gemini
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            const result = await invoke<string>("trigger_oauth_login", { provider: "copilot" });
                                            showMessage(`✓ ${result}`);
                                        } catch (e) {
                                            showMessage(`✗ Copilot OAuth error: ${e}`);
                                        }
                                    }}
                                    disabled={saving()}
                                    class="btn-oauth copilot"
                                >
                                    Copilot / ChatGPT
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            const result = await invoke<string>("trigger_oauth_login", { provider: "claude" });
                                            showMessage(`✓ ${result}`);
                                        } catch (e) {
                                            showMessage(`✗ Claude OAuth error: ${e}`);
                                        }
                                    }}
                                    disabled={saving()}
                                    class="btn-oauth claude"
                                >
                                    Claude
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            const result = await invoke<string>("trigger_oauth_login", { provider: "qwen" });
                                            showMessage(`✓ ${result}`);
                                        } catch (e) {
                                            showMessage(`✗ Qwen OAuth error: ${e}`);
                                        }
                                    }}
                                    disabled={saving()}
                                    class="btn-oauth qwen"
                                >
                                    Qwen
                                </button>
                            </div>
                        </div>

                        {/* ============= Amp Integration ============= */}
                        <details class="settings-section">
                            <summary>Amp Integration (ampcode.com)</summary>

                            <div class="amp-config">
                                <label>
                                    Amp API Key:
                                    <input
                                        type="password"
                                        value={cfg().ampApiKey}
                                        placeholder="Amp API Key"
                                        class="api-key-input"
                                    />
                                </label>

                                <h4>Model Mappings</h4>
                                <div class="mappings-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>From Model</th>
                                                <th>To Model</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <For each={cfg().ampModelMappings}>
                                                {(mapping) => (
                                                    <tr>
                                                        <td><code>{mapping.from}</code></td>
                                                        <td><code>{mapping.to}</code></td>
                                                        <td>
                                                            <button
                                                                onClick={() => removeMapping(mapping.from)}
                                                                class="btn-remove-sm"
                                                            >
                                                                ✗
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )}
                                            </For>
                                        </tbody>
                                    </table>
                                </div>

                                <div class="mapping-inputs">
                                    <input
                                        value={newMappingFrom()}
                                        onInput={(e) => setNewMappingFrom(e.target.value)}
                                        placeholder="From: claude-opus-4-5"
                                        class="mapping-input"
                                    />
                                    <span>to</span>
                                    <input
                                        value={newMappingTo()}
                                        onInput={(e) => setNewMappingTo(e.target.value)}
                                        placeholder="To: gpt-5"
                                        class="mapping-input"
                                    />
                                    <button onClick={addMapping} class="btn-add-sm">Add</button>
                                </div>
                            </div>
                        </details>

                        {/* ============= Copilot Configuration ============= */}
                        <details class="settings-section">
                            <summary>GitHub Copilot Configuration</summary>

                            <label class="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={cfg().copilot.enabled}
                                />
                                Enable Copilot Integration
                            </label>

                            <Show when={cfg().copilot.enabled}>
                                <div class="copilot-config">
                                    <label>
                                        Port:
                                        <input
                                            type="number"
                                            value={cfg().copilot.port}
                                            min="1000"
                                            max="65535"
                                            class="number-input"
                                        />
                                    </label>

                                    <label>
                                        Account Type:
                                        <select value={cfg().copilot.accountType} class="select-input">
                                            <option value="individual">Individual</option>
                                            <option value="business">Business</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                    </label>

                                    <label>
                                        GitHub Token (optional):
                                        <input
                                            type="password"
                                            value={cfg().copilot.githubToken}
                                            placeholder="ghp_..."
                                            class="api-key-input"
                                        />
                                    </label>
                                </div>
                            </Show>
                        </details>

                        {/* ============= Advanced AI Settings ============= */}
                        <details class="settings-section">
                            <summary>Advanced AI Settings</summary>

                            <div class="advanced-grid">
                                <label>
                                    Thinking Budget (Claude):
                                    <select value={cfg().thinkingBudgetMode} class="select-input">
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                </label>

                                <Show when={cfg().thinkingBudgetMode === "custom"}>
                                    <label>
                                        Custom Tokens:
                                        <input
                                            type="number"
                                            value={cfg().thinkingBudgetCustom}
                                            placeholder="Token count"
                                            class="number-input"
                                        />
                                    </label>
                                </Show>

                                <label>
                                    Reasoning Effort (GPT/Codex):
                                    <select value={cfg().reasoningEffortLevel} class="select-input">
                                        <option value="none">None</option>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="xhigh">Extra High</option>
                                    </select>
                                </label>
                            </div>
                        </details>

                        {/* ============= App Behavior ============= */}
                        <details class="settings-section">
                            <summary>App Behavior</summary>

                            <div class="toggles">
                                <label class="checkbox-label">
                                    <input type="checkbox" checked={cfg().autoStart} />
                                    Auto-start clipproxyapi
                                </label>

                                <label class="checkbox-label">
                                    <input type="checkbox" checked={cfg().debug} />
                                    Debug Mode
                                </label>

                                <label class="checkbox-label">
                                    <input type="checkbox" checked={cfg().usageStatsEnabled} />
                                    Usage Statistics
                                </label>
                            </div>
                        </details>

                        {/* ============= Basic Settings ============= */}
                        <details class="settings-section" open>
                            <summary>Basic Settings</summary>

                            <div class="basic-grid">
                                <label>
                                    Port:
                                    <input
                                        type="number"
                                        value={cfg().port}
                                        min="1000"
                                        max="65535"
                                        class="number-input"
                                    />
                                </label>

                                <label>
                                    Request Retry:
                                    <input
                                        type="number"
                                        value={cfg().requestRetry}
                                        min="0"
                                        max="10"
                                        class="number-input"
                                    />
                                </label>

                                <label class="checkbox-label">
                                    <input type="checkbox" checked={cfg().loggingEnabled} />
                                    Enable Logging
                                </label>

                                <label class="checkbox-label">
                                    <input type="checkbox" checked={cfg().loggingToFile} />
                                    Log to File
                                </label>
                            </div>
                        </details>

                        {/* ============= Save Button ============= */}
                        <button onClick={saveConfig} disabled={saving()} class="btn-save">
                            {saving() ? "Saving..." : " Save All Settings"}
                        </button>
                    </>
                )}
            </Show>

            <style>{`
        .proxy-settings {
          padding: 20px;
          max-width: 900px;
        }

        .loading {
          text-align: center;
          padding: 20px;
          color: #999;
        }

        .message-banner {
          padding: 12px;
          margin-bottom: 20px;
          background: rgba(59, 130, 246, 0.1);
          border-left: 4px solid #3b82f6;
          border-radius: 8px;
          animation: slideIn 0.3s;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .settings-section {
          margin-bottom: 20px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .settings-section h3, .settings-section summary {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          user-select: none;
        }

        .key-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 12px 0;
        }

        .key-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
        }

        .key-display {
          color: #10b981;
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }

        .input-group, .mapping-inputs {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-top: 12px;
        }

        .api-key-input, .mapping-input {
          flex: 1;
          padding: 10px 14px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: white;
          font-family: 'Courier New', monospace;
        }

        .number-input, .select-input {
          width: 100%;
          padding: 8px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: white;
        }

        .oauth-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }

        .btn-oauth {
          padding: 12px 20px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-oauth.google {
          background: linear-gradient(135deg, #ea4335, #fbbc04);
          color: white;
        }

        .btn-oauth.copilot {
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white;
        }

        .btn-oauth.claude {
          background: linear-gradient(135deg, #8b5cf6, #a78bfa);
          color: white;
        }

        .btn-oauth.qwen {
          background: linear-gradient(135deg, #059669, #10b981);
          color: white;
        }

        .btn-oauth:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        }

        .btn-oauth:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-add, .btn-add-sm {
          padding: 10px 20px;
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.4);
          border-radius: 8px;
          color: #3b82f6;
          cursor: pointer;
          font-weight: 500;
          white-space: nowrap;
        }

        .btn-add-sm {
          padding: 6px 12px;
          font-size: 14px;
        }

        .btn-remove, .btn-remove-sm {
          padding: 6px 12px;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 6px;
          color: #ef4444;
          cursor: pointer;
          font-size: 13px;
        }

        .btn-remove-sm {
          padding: 2px 8px;
          font-size: 16px;
          font-weight: bold;
        }

        .btn-save {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #059669, #10b981);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 20px;
        }

        .btn-save:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(16, 185, 129, 0.4);
        }

        .btn-save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mappings-table table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
        }

        .mappings-table th, .mappings-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
        </div>
    );
}

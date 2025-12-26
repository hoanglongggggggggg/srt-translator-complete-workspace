import { createSignal } from "solid-js";

type Settings = {
    provider: "proxypal" | "openai" | "anthropic" | "custom";
    apiKey: string;
    baseUrl: string;
    model: string;
    sourceLang: string;
    targetLang: string;
    threads: number;
    batchSize: number;
};

const defaultSettings: Settings = {
    provider: "proxypal",
    apiKey: "proxypal-local",
    baseUrl: "http://localhost:8317/v1",
    model: "gemini-2.5-flash",
    sourceLang: "Auto",
    targetLang: "Vietnamese",
    threads: 3,
    batchSize: 25,
};

// Load settings from localStorage
const loadSettings = (): Settings => {
    try {
        const saved = localStorage.getItem("srt-translator-settings");
        if (saved) {
            return { ...defaultSettings, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error("Failed to load settings:", e);
    }
    return defaultSettings;
};

// Save settings to localStorage
const saveSettings = (settings: Settings) => {
    try {
        localStorage.setItem("srt-translator-settings", JSON.stringify(settings));
    } catch (e) {
        console.error("Failed to save settings:", e);
    }
};

export function createSettingsStore() {
    const [settings, setSettings] = createSignal<Settings>(loadSettings());

    const updateSettings = (updates: Partial<Settings>) => {
        const newSettings = { ...settings(), ...updates };
        setSettings(newSettings);
        saveSettings(newSettings);
    };

    return {
        settings,
        updateSettings,
    };
}

export const settingsStore = createSettingsStore();

import { useNavigate } from "@solidjs/router";
import { createSignal, createEffect, onCleanup, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { settingsStore } from "../stores/settings";
import BatchList from "../components/BatchList";
import { ProxyPalStatus } from "../components/ProxyPalStatus";

type FileItem = {
    id: string;
    path: string;
    name: string;
    cue_count: number;
    status: "Ready" | "Processing" | "Done" | "Error";
};

type JobInfo = {
    id: string;
    file_id: string;
    status: "Queued" | "Running" | "Done" | "Error" | "Cancelled";
    progress: number;
    eta_seconds: number;
    output_path?: string;
    error?: string;
};

type ProgressEvent = {
    job_id: string;
    file_name: string;
    done_cues: number;
    total_cues: number;
    percent: number;
    eta_seconds: number;
    stage: string;
};

export default function HomePage() {
    const navigate = useNavigate();
    const { settings } = settingsStore;

    const [selectedFile, setSelectedFile] = createSignal<FileItem | null>(null);
    const [progress, setProgress] = createSignal<ProgressEvent | null>(null);
    const [statusMessage, setStatusMessage] = createSignal("");

    // Listen to translation events
    createEffect(() => {
        let unlistenProgress: (() => void) | null = null;
        let unlistenFinished: (() => void) | null = null;
        let unlistenError: (() => void) | null = null;

        (async () => {
            unlistenProgress = await listen<ProgressEvent>("translation://progress", (event) => {
                setProgress(event.payload);
            });

            unlistenFinished = await listen<any>("translation://finished", (event) => {
                setProgress(null);
                setStatusMessage(`✅ Translation complete! Saved to: ${event.payload.output_path}`);
            });

            unlistenError = await listen<string>("translation://error", (event) => {
                setProgress(null);
                setStatusMessage(`❌ Error: ${event.payload}`);
            });
        })();

        onCleanup(() => {
            unlistenProgress?.();
            unlistenFinished?.();
            unlistenError?.();
        });
    });

    const handleFileSelect = async () => {
        const selected = await open({
            multiple: false,
            filters: [{ name: "SRT Files", extensions: ["srt"] }],
        });

        if (selected) {
            try {
                const files = await invoke<FileItem[]>("import_srt_files", { paths: [selected] });
                if (files.length > 0) {
                    setSelectedFile(files[0]);
                    setStatusMessage("");
                }
            } catch (error: any) {
                setStatusMessage(`Error loading file: ${error}`);
            }
        }
    };

    const handleTranslate = async () => {
        const file = selectedFile();
        if (!file) return;

        try {
            setStatusMessage("🚀 Starting translation...");


            const job = await invoke<JobInfo>("create_job", {
                fileId: file.id,
                options: {
                    source_lang: settings().sourceLang,
                    target_lang: settings().targetLang,
                    batch: {
                        batch_size: settings().batchSize,
                        context_before: 2,
                        context_after: 2,
                        max_chars_per_request: 500000,
                    },
                    threads: settings().threads,
                    provider: {
                        base_url: settings().baseUrl,
                        api_key: settings().provider === "proxypal"
                            ? "proxypal-local"
                            : (settings().apiKey && settings().apiKey.trim() !== "" ? settings().apiKey : null),
                        model: settings().model,
                    },
                    max_retries: 5,
                    min_delay_ms: 200,
                },
            });

            await invoke("start_job", { jobId: job.id });

        } catch (error: any) {
            setStatusMessage(`❌ Error: ${error}`);
        }
    };

    const formatETA = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div class="min-h-screen bg-[#1a1a1a] p-6">
            <div class="max-w-5xl mx-auto">
                {/* Header with ProxyPal status */}
                <div class="flex items-center justify-between mb-8">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-100">SRT Translator</h1>
                        <p class="text-sm text-gray-400 mt-1">Professional subtitle translation</p>
                    </div>

                    <div class="flex gap-3 items-center">
                        <ProxyPalStatus />
                        <button
                            onClick={() => navigate("/settings")}
                            class="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 transition flex items-center gap-2"
                        >
                            ⚙️ Settings
                        </button>
                    </div>
                </div>

                {/* File Upload */}
                <div class="rounded-lg border border-gray-700 bg-[#2d2d2d] p-6 mb-6">
                    <h2 class="text-xl font-semibold mb-4 text-gray-100">1. Upload SRT File</h2>

                    <div class="space-y-4">
                        <button
                            onClick={handleFileSelect}
                            class="w-full rounded-lg border-2 border-dashed border-gray-600 p-8 hover:border-blue-500 transition text-center bg-[#232323]"
                        >
                            <div class="text-4xl mb-2">📁</div>
                            <div class="font-medium text-gray-300">Click to select SRT file</div>
                            <div class="text-sm text-gray-400 mt-1">
                                Supports UTF-8, UTF-16 encoding
                            </div>
                        </button>

                        <Show when={selectedFile()}>
                            {(file) => (
                                <div class="rounded-lg border border-gray-700 bg-[#232323] p-4">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <div class="font-medium text-gray-200">{file().name}</div>
                                            <div class="text-sm text-gray-400">
                                                {file().cue_count} subtitle cues
                                            </div>
                                        </div>
                                        <div class="text-green-500">✅ Ready</div>
                                    </div>
                                </div>
                            )}
                        </Show>
                    </div>
                </div>

                {/* Translation Controls */}
                <div class="rounded-lg border border-gray-700 bg-[#2d2d2d] p-6 mb-6">
                    <h2 class="text-xl font-semibold mb-4 text-gray-100">2. Translate</h2>

                    <button
                        onClick={handleTranslate}
                        disabled={!selectedFile() || !!progress()}
                        class="w-full rounded-lg px-6 py-4 text-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {progress() ? "⏳ Translating..." : "▶️ Start Translation"}
                    </button>

                    <Show when={progress()}>
                        {(p) => (
                            <div class="mt-4 space-y-3">
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-gray-300">
                                        {p().done_cues} / {p().total_cues} cues
                                    </span>
                                    <span class="font-mono text-gray-400">
                                        ETA: {formatETA(p().eta_seconds)}
                                    </span>
                                </div>

                                <div class="h-3 rounded-full bg-gray-700 overflow-hidden">
                                    <div
                                        class="h-full bg-blue-600 transition-all duration-300"
                                        style={{ width: `${p().percent}%` }}
                                    />
                                </div>

                                <div class="text-center text-lg font-semibold text-gray-200">
                                    {p().percent.toFixed(1)}%
                                </div>
                            </div>
                        )}
                    </Show>

                    {/* Batch List */}
                    <Show when={progress()}>
                        <BatchList />
                    </Show>
                </div>

                {/* Status Messages */}
                <Show when={statusMessage()}>
                    <div class="rounded-lg border border-gray-700 bg-[#2d2d2d] p-4 mb-6">
                        <div class="text-sm text-gray-300">{statusMessage()}</div>
                    </div>
                </Show>

                {/* Info Panel */}
                <div class="rounded-lg border border-gray-700 bg-[#2d2d2d] p-6">
                    <h3 class="font-semibold mb-3 text-gray-100">ℹ️ System Information</h3>
                    <ul class="space-y-2 text-sm text-gray-300">
                        <li>• <strong>Batch Processing:</strong> Efficient parallel translation</li>
                        <li>• <strong>Tag Preservation:</strong> Maintains subtitle formatting</li>
                        <li>• <strong>Error Recovery:</strong> Automatic retry with exponential backoff</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

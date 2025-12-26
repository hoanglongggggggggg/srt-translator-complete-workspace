import { useNavigate } from "@solidjs/router";
import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { settingsStore } from "../stores/settings";
import BatchList from "../components/BatchList";
import { toastStore } from "../stores/toast";

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

export default function TranslatePage() {
    const navigate = useNavigate();
    const { settings } = settingsStore;

    const [selectedFile, setSelectedFile] = createSignal<FileItem | null>(null);
    const [progress, setProgress] = createSignal<ProgressEvent | null>(null);
    const [statusMessage, setStatusMessage] = createSignal<string>("");

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
                const path = event.payload?.output_path;
                setStatusMessage(path ? `✓ Translation complete. Saved to: ${path}` : "✓ Translation complete.");
                toastStore.success("Translation complete.");
            });

            unlistenError = await listen<string>("translation://error", (event) => {
                setProgress(null);
                setStatusMessage(`✗ Translation failed: ${event.payload}`);
                toastStore.error("Translation failed.");
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

        if (!selected) return;

        try {
            const files = await invoke<FileItem[]>("import_srt_files", { paths: [selected] });
            if (files.length > 0) {
                setSelectedFile(files[0]);
                setStatusMessage(`✓ Loaded ${files[0].name} (${files[0].cue_count} cues)`);
            }
        } catch (error: any) {
            setStatusMessage(`✗ Error loading file: ${String(error)}`);
            toastStore.error("Failed to load file.");
        }
    };

    const handleTranslate = async () => {
        const file = selectedFile();
        if (!file) return;

        try {
            setStatusMessage("Starting translation...");

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
                        api_key:
                            settings().provider === "proxypal"
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
            setStatusMessage(`✗ Error: ${String(error)}`);
            toastStore.error("Failed to start translation.");
        }
    };

    const formatETA = (seconds: number) => {
        if (!Number.isFinite(seconds) || seconds <= 0) return "—";
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div class="max-w-5xl mx-auto space-y-6">
            <div class="flex items-start justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        Translate subtitles
                    </h1>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Import an SRT file and translate using the selected provider.
                    </p>
                </div>

                <button
                    onClick={() => navigate("/translate-settings")}
                    class="px-3 py-2 rounded-md text-sm font-medium border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                >
                    Open settings
                </button>
            </div>

            <section class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Upload</h2>
                </div>

                <div class="mt-4 space-y-4">
                    <button
                        onClick={handleFileSelect}
                        class="w-full rounded-md border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 hover:border-primary dark:hover:border-primary transition text-left"
                    >
                        <div class="text-sm font-medium text-gray-900 dark:text-gray-100">Select an SRT file</div>
                        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            UTF-8 and UTF-16 are supported.
                        </div>
                    </button>

                    <Show when={selectedFile()}>
                        {(file) => (
                            <div class="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
                                <div class="flex items-center justify-between gap-4">
                                    <div class="min-w-0">
                                        <div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {file().name}
                                        </div>
                                        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {file().cue_count} cues
                                        </div>
                                    </div>

                                    <div class="shrink-0 inline-flex items-center gap-2 text-sm">
                                        <span class="font-semibold text-success">✓</span>
                                        <span class="text-gray-900 dark:text-gray-100">Ready</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Show>
                </div>
            </section>

            <section class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Translate</h2>

                <button
                    onClick={handleTranslate}
                    disabled={!selectedFile() || !!progress()}
                    class="mt-4 w-full rounded-md px-4 py-3 text-sm font-semibold bg-primary text-white hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {progress() ? "Translating..." : "Start translation"}
                </button>

                <Show when={progress()}>
                    {(p) => (
                        <div class="mt-4 space-y-3">
                            <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                <span>
                                    {p().done_cues} / {p().total_cues} cues
                                </span>
                                <span class="font-mono">ETA: {formatETA(p().eta_seconds)}</span>
                            </div>

                            <div class="h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                                <div
                                    class="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${p().percent}%` }}
                                />
                            </div>

                            <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {p().percent.toFixed(1)}%
                            </div>
                        </div>
                    )}
                </Show>

                <Show when={progress()}>
                    <BatchList />
                </Show>
            </section>

            <Show when={statusMessage()}>
                <section class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
                    <div class="text-sm text-gray-700 dark:text-gray-300 break-words">{statusMessage()}</div>
                </section>
            </Show>

            <section class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
                <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Notes</h2>
                <ul class="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li>✓ Tag and formatting preservation is enabled.</li>
                    <li>✓ Batch processing is used for efficiency.</li>
                    <li>✓ Errors are retried according to your settings.</li>
                </ul>
            </section>
        </div>
    );
}

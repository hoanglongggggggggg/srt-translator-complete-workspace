import { createSignal, createEffect, For, Show, onCleanup } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";

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

function App() {
    const [files, setFiles] = createSignal<FileItem[]>([]);
    const [selectedFile, setSelectedFile] = createSignal<FileItem | null>(null);
    const [currentJob, setCurrentJob] = createSignal<JobInfo | null>(null);
    const [progress, setProgress] = createSignal<ProgressEvent | null>(null);
    const [statusMessage, setStatusMessage] = createSignal("");

    // Listen to translation events
    createEffect(() => {
        let unlistenProgress: (() => void) | null = null;
        let unlistenFinished: (() => void) | null = null;
        let unlistenError: (() => void) | null = null;

        (async () => {
            unlistenProgress = await listen<ProgressEvent>("translation://progress", (e) => {
                setProgress(e.payload);
            });

            unlistenFinished = await listen<{ job_id: string; output_path: string }>(
                "translation://finished",
                (e) => {
                    setStatusMessage(`✓ Translation complete. Saved to: ${e.payload.output_path}`);
                    setProgress(null);
                }
            );

            unlistenError = await listen<string>("translation://error", (e) => {
                setStatusMessage(`✗ Translation failed: ${e.payload}`);
                setProgress(null);
            });
        })();

        onCleanup(() => {
            unlistenProgress?.();
            unlistenFinished?.();
            unlistenError?.();
        });
    });

    const handleFileSelect = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{ name: "SRT Files", extensions: ["srt"] }],
            });

            if (selected && typeof selected === "string") {
                const imported = await invoke<FileItem[]>("import_srt_files", {
                    paths: [selected],
                });

                setFiles([...files(), ...imported]);
                if (imported.length > 0) {
                    setSelectedFile(imported[0]);
                    setStatusMessage(`✓ Loaded ${imported[0].name} (${imported[0].cue_count} cues)`);
                }
            }
        } catch (error) {
            setStatusMessage(`✗ Error: ${error}`);
        }
    };

    const handleTranslate = async () => {
        const file = selectedFile();
        if (!file) return;

        try {
            setStatusMessage("Starting translation...");

            // Create job (with simplified options for now)
            const job = await invoke<JobInfo>("create_job", {
                fileId: file.id,
                options: {
                    source_lang: "Auto",
                    target_lang: "Vietnamese",
                    batch: {
                        batch_size: 25,
                        context_before: 2,
                        context_after: 2,
                        max_chars_per_request: 12000,
                    },
                    threads: 3,
                    provider: {
                        base_url: "https://api.openai.com/v1",
                        api_key: "your-api-key-here", // TODO: Get from settings
                        model: "gpt-4o-mini",
                    },
                    max_retries: 3,
                    min_delay_ms: 200,
                },
            });

            setCurrentJob(job);

            // Start job
            await invoke("start_job", { jobId: job.id });
        } catch (error) {
            setStatusMessage(`✗ Error: ${error}`);
        }
    };

    const formatETA = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
            <div class="max-w-4xl mx-auto">
                {/* Header */}
                <div class="text-center mb-8">
                    <h1 class="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        SRT Subtitle Translator
                    </h1>
                    <p class="text-gray-600 dark:text-gray-300">
                        AI-powered translation with batch processing
                    </p>
                </div>

                {/* File Upload */}
                <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur p-6 mb-6">
                    <h2 class="text-xl font-semibold mb-4">1. Upload SRT File</h2>

                    <div class="space-y-4">
                        <button
                            onClick={handleFileSelect}
                            class="w-full rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 hover:border-blue-500 dark:hover:border-blue-400 transition text-center"
                        >
                            <div class="font-medium">Select an SRT file</div>
                            <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Supports UTF-8, UTF-16 encoding
                            </div>
                        </button>

                        <Show when={selectedFile()}>
                            {(file) => (
                                <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <div class="font-medium">{file().name}</div>
                                            <div class="text-sm text-gray-500 dark:text-gray-400">
                                                {file().cue_count} subtitle cues
                                            </div>
                                        </div>
                                        <div class="text-green-500">✓ Ready</div>
                                    </div>
                                </div>
                            )}
                        </Show>
                    </div>
                </div>

                {/* Translation Controls */}
                <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur p-6 mb-6">
                    <h2 class="text-xl font-semibold mb-4">2. Translate</h2>

                    <button
                        onClick={handleTranslate}
                        disabled={!selectedFile() || !!progress()}
                        class="w-full rounded-xl px-6 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {progress() ? "Translating..." : "Translate"}
                    </button>

                    <Show when={progress()}>
                        {(p) => (
                            <div class="mt-4 space-y-3">
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-gray-600 dark:text-gray-300">
                                        {p().done_cues} / {p().total_cues} cues
                                    </span>
                                    <span class="font-mono text-gray-500 dark:text-gray-400">
                                        ETA: {formatETA(p().eta_seconds)}
                                    </span>
                                </div>

                                <div class="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                    <div
                                        class="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                                        style={{ width: `${p().percent}%` }}
                                    />
                                </div>

                                <div class="text-center text-lg font-semibold">
                                    {p().percent.toFixed(1)}%
                                </div>
                            </div>
                        )}
                    </Show>
                </div>

                {/* Status Messages */}
                <Show when={statusMessage()}>
                    <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur p-4">
                        <div class="text-sm">{statusMessage()}</div>
                    </div>
                </Show>

                {/* Info Panel */}
                <div class="mt-8 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur p-6">
                    <h3 class="font-semibold mb-3">How it works</h3>
                    <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <li>✓ <strong>Context-aware:</strong> Groups cues into batches with context</li>
                        <li>✓ <strong>Multi-threaded:</strong> 3 parallel translation threads</li>
                        <li>✓ <strong>Format preserving:</strong> Keeps timecodes & structure</li>
                        <li>✓ <strong>Tag safe:</strong> Protects HTML and SRT formatting</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default App;

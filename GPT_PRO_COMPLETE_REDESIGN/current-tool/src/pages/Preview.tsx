import { useNavigate, useSearchParams } from "@solidjs/router";
import { createSignal, For, Show, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

type Cue = {
    id: number;
    timing: string;
    original: string;
    translated: string;
};

export default function PreviewPage() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const [cues, setCues] = createSignal<Cue[]>([]);
    const [editingId, setEditingId] = createSignal<number | null>(null);
    const [editText, setEditText] = createSignal("");

    onMount(async () => {
        const jobId = params.jobId;
        if (!jobId) {
            navigate("/");
            return;
        }

        // TODO: Load translated cues from job
        // For demo, creating sample data
        setCues([
            {
                id: 0,
                timing: "00:00:01,000 --> 00:00:03,000",
                original: "Hello, world!",
                translated: "Xin chào thế giới!",
            },
            {
                id: 1,
                timing: "00:00:04,000 --> 00:00:06,000",
                original: "This is a subtitle.",
                translated: "Đây là phụ đề.",
            },
            {
                id: 2,
                timing: "00:00:07,000 --> 00:00:10,000",
                original: "Translation in progress...",
                translated: "Đang dịch...",
            },
        ]);
    });

    const handleEdit = (cue: Cue) => {
        setEditingId(cue.id);
        setEditText(cue.translated);
    };

    const handleSaveEdit = (id: number) => {
        setCues((prev) =>
            prev.map((c) => (c.id === id ? { ...c, translated: editText() } : c))
        );
        setEditingId(null);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditText("");
    };

    const handleExport = async () => {
        // TODO: Export edited translations
        alert("Export functionality coming soon!");
    };

    return (
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
            <div class="max-w-6xl mx-auto">
                {/* Header */}
                <div class="flex items-center justify-between mb-8">
                    <div>
                        <h1 class="text-3xl font-bold">👁️ Preview & Edit</h1>
                        <p class="text-gray-600 dark:text-gray-300 mt-1">
                            Review translations and make edits
                        </p>
                    </div>
                    <div class="flex gap-3">
                        <button
                            onClick={handleExport}
                            class="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition"
                        >
                            💾 Export
                        </button>
                        <button
                            onClick={() => navigate("/")}
                            class="px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition"
                        >
                            ← Back
                        </button>
                    </div>
                </div>

                {/* Cue List */}
                <div class="space-y-4">
                    <For each={cues()}>
                        {(cue) => (
                            <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur p-6">
                                {/* Timing */}
                                <div class="text-sm font-mono text-gray-500 dark:text-gray-400 mb-3">
                                    {cue.timing}
                                </div>

                                {/* Original & Translated */}
                                <div class="grid grid-cols-2 gap-6">
                                    {/* Original */}
                                    <div>
                                        <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                            Original
                                        </div>
                                        <div class="p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                                            {cue.original}
                                        </div>
                                    </div>

                                    {/* Translated */}
                                    <div>
                                        <div class="flex items-center justify-between mb-2">
                                            <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                                Translated
                                            </div>
                                            <Show when={editingId() !== cue.id}>
                                                <button
                                                    onClick={() => handleEdit(cue)}
                                                    class="text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                                                >
                                                    ✎ Edit
                                                </button>
                                            </Show>
                                        </div>

                                        <Show
                                            when={editingId() === cue.id}
                                            fallback={
                                                <div class="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                                                    {cue.translated}
                                                </div>
                                            }
                                        >
                                            <div class="space-y-2">
                                                <textarea
                                                    value={editText()}
                                                    onInput={(e) => setEditText(e.currentTarget.value)}
                                                    class="w-full p-3 rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 resize-none"
                                                    rows="2"
                                                />
                                                <div class="flex gap-2">
                                                    <button
                                                        onClick={() => handleSaveEdit(cue.id)}
                                                        class="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                                                    >
                                                        ✓ Save
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        class="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                                    >
                                                        ✕ Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </Show>
                                    </div>
                                </div>
                            </div>
                        )}
                    </For>
                </div>

                {/* Stats */}
                <div class="mt-8 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur p-4 text-center">
                    <div class="text-sm text-gray-600 dark:text-gray-300">
                        📊 Total: {cues().length} cues
                    </div>
                </div>
            </div>
        </div>
    );
}

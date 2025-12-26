import { useNavigate, useSearchParams } from "@solidjs/router";
import { createSignal, For, Show, onMount } from "solid-js";

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

        // TODO: Load translated cues from backend by jobId
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
        setCues((prev) => prev.map((c) => (c.id === id ? { ...c, translated: editText() } : c)));
        setEditingId(null);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditText("");
    };

    const handleExport = async () => {
        // TODO: Export edited translations
        alert("Export functionality coming soon.");
    };

    return (
        <div class="max-w-6xl mx-auto space-y-6">
            <div class="flex items-start justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        Preview and edit
                    </h1>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Review translations and make manual adjustments.
                    </p>
                </div>
                <div class="flex gap-2">
                    <button
                        onClick={handleExport}
                        class="px-3 py-2 rounded-md text-sm font-semibold bg-primary text-white hover:brightness-95 transition"
                    >
                        Export
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        class="px-3 py-2 rounded-md text-sm font-medium border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                    >
                        Back
                    </button>
                </div>
            </div>

            <div class="space-y-4">
                <For each={cues()}>
                    {(cue) => (
                        <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
                            <div class="text-xs font-mono text-gray-600 dark:text-gray-400 mb-3">
                                {cue.timing}
                            </div>

                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                                        Original
                                    </div>
                                    <div class="p-3 rounded-md bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                        {cue.original}
                                    </div>
                                </div>

                                <div>
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                            Translated
                                        </div>
                                        <Show when={editingId() !== cue.id}>
                                            <button
                                                onClick={() => handleEdit(cue)}
                                                class="text-xs px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                            >
                                                Edit
                                            </button>
                                        </Show>
                                    </div>

                                    <Show
                                        when={editingId() === cue.id}
                                        fallback={
                                            <div class="p-3 rounded-md bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                                {cue.translated}
                                            </div>
                                        }
                                    >
                                        <div class="space-y-2">
                                            <textarea
                                                value={editText()}
                                                onInput={(e) => setEditText(e.currentTarget.value)}
                                                class="w-full p-3 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 resize-none"
                                                rows="2"
                                            />
                                            <div class="flex gap-2">
                                                <button
                                                    onClick={() => handleSaveEdit(cue.id)}
                                                    class="px-3 py-1 text-sm rounded bg-primary text-white hover:brightness-95 transition"
                                                >
                                                    ✓ Save
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    class="px-3 py-1 text-sm rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                                                >
                                                    ✗ Cancel
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

            <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
                <div class="text-sm text-gray-700 dark:text-gray-300">Total: {cues().length} cues</div>
            </div>
        </div>
    );
}

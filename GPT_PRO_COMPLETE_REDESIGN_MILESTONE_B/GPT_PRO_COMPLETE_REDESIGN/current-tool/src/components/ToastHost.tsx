import { For, Show } from "solid-js";
import { toastStore } from "../stores/toast";

const markerFor = (kind: "success" | "error" | "info") => {
    if (kind === "success") return { text: "✓", class: "text-success" };
    if (kind === "error") return { text: "✗", class: "text-error" };
    return null;
};

export function ToastHost() {
    return (
        <div
            class="fixed bottom-4 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] space-y-2"
            aria-live="polite"
        >
            <For each={toastStore.toasts()}>
                {(toast) => {
                    const marker = markerFor(toast.kind);
                    return (
                        <div class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm p-3">
                            <div class="flex items-start gap-3">
                                <Show when={marker}>
                                    <span class={"mt-0.5 font-semibold " + (marker?.class ?? "")}>{marker?.text}</span>
                                </Show>

                                <div class="min-w-0 flex-1">
                                    <Show when={toast.title}>
                                        <div class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                            {toast.title}
                                        </div>
                                    </Show>
                                    <div class="text-sm text-gray-700 dark:text-gray-300 break-words">
                                        {toast.message}
                                    </div>
                                </div>

                                <button
                                    class="shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
                                    onClick={() => toastStore.remove(toast.id)}
                                    aria-label="Dismiss"
                                >
                                    ✗
                                </button>
                            </div>
                        </div>
                    );
                }}
            </For>
        </div>
    );
}

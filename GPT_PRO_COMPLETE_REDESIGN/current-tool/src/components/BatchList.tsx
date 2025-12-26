import { For, createSignal, onMount, onCleanup } from "solid-js";
import { listen } from "@tauri-apps/api/event";

export interface BatchInfo {
    batch_no: number;
    total_batches: number;
    status: string;
    cue_start: number;
    cue_end: number;
    error_msg?: string;
}

export default function BatchList() {
    const [batches, setBatches] = createSignal<Map<number, BatchInfo>>(new Map());

    onMount(async () => {
        const unlisten = await listen<{ batch_no: number; total_batches: number; status: string; cue_start: number; cue_end: number; error_msg?: string }>(
            "batch://status",
            (event) => {
                setBatches((prev) => {
                    const updated = new Map(prev);
                    updated.set(event.payload.batch_no, event.payload);
                    return updated;
                });
            }
        );

        onCleanup(() => {
            unlisten();
        });
    });

    const sortedBatches = () => {
        return Array.from(batches().values()).sort((a, b) => a.batch_no - b.batch_no);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "running":
                return "⏳";
            case "done":
                return "✅";
            case "error":
                return "❌";
            default:
                return "⏸️";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "running":
                return "text-blue-400";
            case "done":
                return "text-green-500";
            case "error":
                return "text-red-500";
            default:
                return "text-gray-500";
        }
    };

    return (
        <div class="mt-6 bg-[#2d2d2d] border border-gray-700 rounded-lg overflow-hidden">
            <div class="px-4 py-3 bg-[#1a1a1a] border-b border-gray-700">
                <h3 class="text-sm font-semibold text-gray-200 uppercase tracking-wider">Batch Progress</h3>
            </div>
            <div class="max-h-80 overflow-y-auto">
                <table class="w-full text-sm">
                    <thead class="bg-[#232323] sticky top-0">
                        <tr class="border-b border-gray-700">
                            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Range</th>
                            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Details</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-700">
                        <For each={sortedBatches()}>
                            {(batch) => (
                                <tr class="hover:bg-[#252525] transition-colors">
                                    <td class="px-4 py-3 font-mono text-gray-300">#{batch.batch_no.toString().padStart(3, "0")}</td>
                                    <td class={`px-4 py-3 font-medium ${getStatusColor(batch.status)}`}>
                                        <span class="inline-flex items-center gap-2">
                                            <span>{getStatusIcon(batch.status)}</span>
                                            <span class="capitalize">{batch.status}</span>
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 font-mono text-gray-400 text-xs">
                                        {batch.cue_start} - {batch.cue_end}
                                    </td>
                                    <td class="px-4 py-3 text-gray-500 text-xs">
                                        {batch.error_msg ? (
                                            <span class="text-red-400" title={batch.error_msg}>
                                                Error: {batch.error_msg.substring(0, 40)}...
                                            </span>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                </tr>
                            )}
                        </For>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

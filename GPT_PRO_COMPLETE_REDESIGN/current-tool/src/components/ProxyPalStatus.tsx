import { createSignal, onMount, onCleanup } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

interface ProxyPalStatus {
    running: boolean;
    endpoint: string;
}

export function ProxyPalStatus() {
    const [status, setStatus] = createSignal<ProxyPalStatus>({
        running: false,
        endpoint: "Checking..."
    });

    const checkStatus = async () => {
        try {
            const s = await invoke<ProxyPalStatus>("get_proxypal_status");
            setStatus(s);
        } catch (e) {
            console.error("Failed to check ProxyPal status:", e);
        }
    };

    onMount(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 5000); // Check every 5s
        onCleanup(() => clearInterval(interval));
    });

    return (
        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
            <div class={`w-2 h-2 rounded-full ${status().running ? 'bg-green-500' : 'bg-red-500'}`} />
            <div class="text-sm">
                <span class="font-medium text-gray-300">ProxyPal:</span>{" "}
                <span class={status().running ? "text-green-400" : "text-gray-500"}>
                    {status().running ? "Running" : "Stopped"}
                </span>
            </div>
        </div>
    );
}

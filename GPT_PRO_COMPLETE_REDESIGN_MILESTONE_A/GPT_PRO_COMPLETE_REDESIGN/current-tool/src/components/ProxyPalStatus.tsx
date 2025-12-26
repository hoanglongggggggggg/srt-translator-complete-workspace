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
        <div class="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <span class={"font-semibold " + (status().running ? "text-success" : "text-error")}>
                {status().running ? "✓" : "✗"}
            </span>
            <div class="text-sm">
                <span class="font-medium text-gray-700 dark:text-gray-300">ProxyPal:</span>{" "}
                <span class={status().running ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"}>
                    {status().running ? "Running" : "Stopped"}
                </span>
            </div>
        </div>
    );
}

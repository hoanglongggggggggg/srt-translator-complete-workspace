import { A, useLocation } from "@solidjs/router";
import { createSignal, onCleanup, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

type ProxyStatus = {
  running: boolean;
  endpoint: string;
};

type NavItem = {
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Translate", href: "/translate" },
  { label: "Preview", href: "/preview" },
  { label: "Translation settings", href: "/translate-settings" },

  { label: "Dashboard", href: "/dashboard" },
  { label: "API keys", href: "/api-keys" },
  { label: "Auth files", href: "/auth-files" },
  { label: "Logs", href: "/logs" },
  { label: "Analytics", href: "/analytics" },
  { label: "Settings", href: "/settings" },

  { label: "Welcome", href: "/welcome" },
];

export function Sidebar() {
  const location = useLocation();

  const [proxyStatus, setProxyStatus] = createSignal<ProxyStatus>({
    running: false,
    endpoint: "",
  });

  const refreshProxyStatus = async () => {
    try {
      const status = await invoke<ProxyStatus>("get_proxypal_status");
      setProxyStatus(status);
    } catch {
      setProxyStatus({ running: false, endpoint: "" });
    }
  };

  onMount(() => {
    refreshProxyStatus();
    const interval = window.setInterval(refreshProxyStatus, 5000);
    onCleanup(() => window.clearInterval(interval));
  });

  const isActive = (href: string) => {
    if (href === "/translate") {
      return location.pathname === "/" || location.pathname.startsWith("/translate");
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside class="w-60 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col min-h-screen">
      <div class="p-4">
        <div class="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          SRT Translator
        </div>
        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Translation + ProxyPal settings
        </div>
      </div>

      <nav class="px-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <A
            href={item.href}
            class={
              "block px-3 py-2 rounded-md text-sm font-medium transition " +
              (isActive(item.href)
                ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800")
            }
          >
            {item.label}
          </A>
        ))}
      </nav>

      <div class="mt-auto p-4">
        <div class="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-2">
          <div class="text-xs text-gray-600 dark:text-gray-400">Proxy status</div>
          <div class="mt-1 flex items-center gap-2 text-sm">
            <span
              class={
                "font-semibold " + (proxyStatus().running ? "text-success" : "text-error")
              }
              aria-label={proxyStatus().running ? "Running" : "Stopped"}
            >
              {proxyStatus().running ? "✓" : "✗"}
            </span>
            <span class="text-gray-900 dark:text-gray-100">
              {proxyStatus().running ? "Running" : "Stopped"}
            </span>
          </div>

          {proxyStatus().endpoint ? (
            <div class="mt-1 text-xs text-gray-600 dark:text-gray-400 break-all">
              {proxyStatus().endpoint}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

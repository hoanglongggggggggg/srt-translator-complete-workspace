import { For, createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { openOAuth, type Provider } from "../lib/tauri";
import { toastStore } from "../stores/toast";

type ProviderRow = {
  id: Provider;
  name: string;
  description: string;
};

const PROVIDERS: ProviderRow[] = [
  { id: "gemini", name: "Gemini", description: "OAuth login using the local proxy." },
  { id: "claude", name: "Claude", description: "OAuth login using the local proxy." },
  { id: "qwen", name: "Qwen", description: "OAuth login using the local proxy." },
  { id: "openai", name: "Copilot", description: "OpenAI models via Copilot OAuth." },
  { id: "iflow", name: "iFlow", description: "OAuth login (requires backend support)." },
  { id: "antigravity", name: "Antigravity", description: "OAuth login (requires backend support)." },
];

export default function WelcomePage() {
  const navigate = useNavigate();
  const [busy, setBusy] = createSignal<Provider | null>(null);

  const connect = async (p: Provider) => {
    setBusy(p);
    try {
      await openOAuth(p);
      toastStore.success("Login started.");
    } catch (e: any) {
      toastStore.error("Login failed.", String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div class="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">Welcome</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Connect providers, start the local proxy, and begin translating subtitles.
        </p>
      </div>

      <section class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">OAuth providers</h2>

        <div class="mt-4 space-y-3">
          <For each={PROVIDERS}>
            {(p) => (
              <div class="flex items-start justify-between gap-4 rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
                <div class="min-w-0">
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</div>
                  <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">{p.description}</div>
                </div>

                <button
                  onClick={() => connect(p.id)}
                  disabled={busy() !== null}
                  class="shrink-0 px-3 py-2 rounded-md text-sm font-medium border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {busy() === p.id ? "Working..." : "Connect"}
                </button>
              </div>
            )}
          </For>
        </div>

        <div class="mt-4 flex justify-end">
          <button
            onClick={() => navigate("/dashboard")}
            class="px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:opacity-90 transition"
          >
            Continue
          </button>
        </div>
      </section>
    </div>
  );
}

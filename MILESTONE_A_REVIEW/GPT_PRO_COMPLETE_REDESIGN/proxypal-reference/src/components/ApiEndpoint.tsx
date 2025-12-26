import { createSignal } from "solid-js";
import { Button } from "./ui";

interface ApiEndpointProps {
  endpoint: string;
  running: boolean;
}

export function ApiEndpoint(props: ApiEndpointProps) {
  const [copied, setCopied] = createSignal(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(props.endpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
          API Endpoint
        </span>
        <span
          class={`text-xs px-2 py-0.5 rounded-full ${
            props.running
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-gray-200 dark:bg-gray-700 text-gray-500"
          }`}
        >
          {props.running ? "Active" : "Inactive"}
        </span>
      </div>

      <div class="flex items-center gap-2">
        <code class="flex-1 px-3 py-2 bg-white dark:bg-gray-900 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
          {props.endpoint}
        </code>
        <Button variant="secondary" size="sm" onClick={copyToClipboard}>
          {copied() ? (
            <svg
              class="w-4 h-4 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </Button>
      </div>

      <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Use this endpoint in Cursor, Cline, Continue, or any OpenAI-compatible
        client
      </p>
    </div>
  );
}

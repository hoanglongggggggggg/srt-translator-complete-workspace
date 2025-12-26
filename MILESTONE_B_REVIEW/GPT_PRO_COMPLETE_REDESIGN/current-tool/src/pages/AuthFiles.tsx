export default function AuthFilesPage() {
  return (
    <div class="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">Auth files</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          View and manage provider authentication files created by OAuth flows.
        </p>
      </div>

      <section class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Status</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-3">
          This page requires backend support to enumerate and manage auth artifacts.
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          For now, use the Welcome page to run OAuth logins.
        </p>
      </section>
    </div>
  );
}

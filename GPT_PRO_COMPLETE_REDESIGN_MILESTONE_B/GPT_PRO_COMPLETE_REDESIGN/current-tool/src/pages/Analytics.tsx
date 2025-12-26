export default function AnalyticsPage() {
  return (
    <div class="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">Analytics</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Usage metrics and request history summaries.
        </p>
      </div>

      <section class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Status</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-3">
          Analytics UI is wired in the router. Backend request history support will be added in Milestone C.
        </p>
      </section>
    </div>
  );
}

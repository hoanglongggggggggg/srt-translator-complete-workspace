import { useLocation } from "@solidjs/router";

const titleForPath = (path: string) => {
    if (path === "/") return "Translate";
    if (path.startsWith("/settings")) return "Settings";
    if (path.startsWith("/preview")) return "Preview";
    return "SRT Translator";
};

export function TopBar() {
    const location = useLocation();

    return (
        <header class="h-14 shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div class="h-full flex items-center justify-between px-6">
                <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {titleForPath(location.pathname)}
                </div>

                <div class="text-xs text-gray-600 dark:text-gray-400">
                    {/* Reserved for future global actions */}
                </div>
            </div>
        </header>
    );
}

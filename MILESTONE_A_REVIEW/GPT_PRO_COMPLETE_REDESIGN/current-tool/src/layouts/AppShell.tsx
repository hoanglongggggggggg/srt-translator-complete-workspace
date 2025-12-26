import { Outlet } from "@solidjs/router";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { ToastHost } from "../components/ToastHost";

export default function AppShell() {
    return (
        <div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
            <div class="min-h-screen flex">
                <Sidebar />
                <div class="flex-1 flex flex-col min-w-0">
                    <TopBar />
                    <main class="flex-1 p-6 min-w-0">
                        <Outlet />
                    </main>
                </div>
            </div>

            {/* Global toasts */}
            <ToastHost />
        </div>
    );
}

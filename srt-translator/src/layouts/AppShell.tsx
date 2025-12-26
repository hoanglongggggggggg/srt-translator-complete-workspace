import { Outlet, useLocation } from "@solidjs/router";
import { Show, onMount } from "solid-js";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { ToastHost } from "../components/ToastHost";
import { appStore } from "../stores/app";

export default function AppShell() {
  const location = useLocation();

  onMount(() => {
    void appStore.initialize();
  });

  const isStandalone = () => location.pathname.startsWith("/welcome");

  return (
    <div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <Show
        when={!isStandalone()}
        fallback={
          <main class="min-h-screen p-6">
            <Outlet />
          </main>
        }
      >
        <div class="min-h-screen flex">
          <Sidebar />
          <div class="flex-1 flex flex-col min-w-0">
            <TopBar />
            <main class="flex-1 p-6 min-w-0">
              <Outlet />
            </main>
          </div>
        </div>
      </Show>

      <ToastHost />
    </div>
  );
}

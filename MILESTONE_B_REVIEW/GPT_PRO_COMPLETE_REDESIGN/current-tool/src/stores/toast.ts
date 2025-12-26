import { createSignal } from "solid-js";

export type ToastKind = "success" | "error" | "info";

export type Toast = {
    id: string;
    kind: ToastKind;
    title?: string;
    message: string;
    createdAt: number;
};

const [toasts, setToasts] = createSignal<Toast[]>([]);

const makeId = () => {
    try {
        // Available in modern runtimes; fallback below if missing.
        return crypto.randomUUID();
    } catch {
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
};

const remove = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
};

const push = (kind: ToastKind, message: string, title?: string, timeoutMs = 3500) => {
    const id = makeId();
    setToasts((prev) => [...prev, { id, kind, title, message, createdAt: Date.now() }]);

    if (timeoutMs > 0) {
        window.setTimeout(() => remove(id), timeoutMs);
    }
};

export const toastStore = {
    toasts,
    push,
    remove,
    success: (message: string, title?: string, timeoutMs?: number) =>
        push("success", message, title, timeoutMs),
    error: (message: string, title?: string, timeoutMs?: number) =>
        push("error", message, title, timeoutMs),
    info: (message: string, title?: string, timeoutMs?: number) =>
        push("info", message, title, timeoutMs),
};

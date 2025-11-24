"use client";

import { toast as sonnerToast } from "sonner";

type ToastInput =
  | string
  | {
      title?: string;
      description?: string;
      variant?: "default" | "destructive" | "success" | "info" | "warning";
    };

/**
 * Shadcn-compatible toast wrapper backed by Sonner.
 * Accepts either a string or an object `{ title, description, variant }`.
 */
const toast = (options: ToastInput) => {
  if (typeof options === "string") {
    return sonnerToast(options);
  }
  const { title, description, variant = "default" } = options;
  const message = title || description || "Notificación";
  const payload = { description };

  if (variant === "destructive") {
    return sonnerToast.error(message, payload);
  }
  if (variant === "success") {
    return sonnerToast.success(message, payload);
  }
  if (variant === "info") {
    return sonnerToast(message, payload);
  }
  if (variant === "warning") {
    return sonnerToast.warning ? sonnerToast.warning(message, payload) : sonnerToast(message, payload);
  }
  return sonnerToast(message, payload);
};

export function useToast() {
  return { toast };
}

export { toast };

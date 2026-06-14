"use client"

import { CircleCheck, CircleX, X } from "lucide-react"
import { createPortal } from "react-dom"

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { useToastStore } from "@/lib/toast"
import { cn } from "@/lib/utils"

function ToastItem({
  id,
  message,
  variant,
  onDismiss,
  reducedMotion,
}: {
  id: string
  message: string
  variant: "success" | "error"
  onDismiss: (id: string) => void
  reducedMotion: boolean
}) {
  const Icon = variant === "success" ? CircleCheck : CircleX

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg bg-background px-4 py-3 text-sm text-foreground shadow-lg",
        !reducedMotion &&
          "animate-in fade-in slide-in-from-bottom-2 duration-200"
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          variant === "success" && "text-emerald-600 dark:text-emerald-400",
          variant === "error" && "text-destructive"
        )}
        aria-hidden
      />
      <p className="min-w-0 flex-1 leading-snug">{message}</p>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Dismiss notification"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)
  const reducedMotion = usePrefersReducedMotion()

  if (typeof document === "undefined" || toasts.length === 0) {
    return null
  }

  return createPortal(
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-full max-w-sm flex-col items-end gap-2"
    >
      {toasts.map((item) => (
        <ToastItem
          key={item.id}
          id={item.id}
          message={item.message}
          variant={item.variant}
          onDismiss={dismiss}
          reducedMotion={reducedMotion}
        />
      ))}
    </div>,
    document.body
  )
}

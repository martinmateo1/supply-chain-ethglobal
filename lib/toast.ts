"use client"

import { create } from "zustand"

export type ToastVariant = "success" | "error"

export type Toast = {
  id: string
  message: string
  variant: ToastVariant
}

type ToastStore = {
  toasts: Toast[]
  push: (toast: Omit<Toast, "id">) => string
  dismiss: (id: string) => void
}

const TOAST_DURATION_MS = 5000

let toastCounter = 0

function nextToastId(): string {
  toastCounter += 1
  return `toast-${toastCounter}`
}

const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>()

function scheduleDismiss(id: string, dismiss: (id: string) => void) {
  const existing = dismissTimers.get(id)
  if (existing) clearTimeout(existing)

  const timer = setTimeout(() => {
    dismissTimers.delete(id)
    dismiss(id)
  }, TOAST_DURATION_MS)

  dismissTimers.set(id, timer)
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = nextToastId()
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))
    scheduleDismiss(id, get().dismiss)
    return id
  },
  dismiss: (id) => {
    const timer = dismissTimers.get(id)
    if (timer) {
      clearTimeout(timer)
      dismissTimers.delete(id)
    }
    set((state) => ({
      toasts: state.toasts.filter((item) => item.id !== id),
    }))
  },
}))

export const toast = {
  success(message: string) {
    return useToastStore.getState().push({ message, variant: "success" })
  },
  error(message: string) {
    return useToastStore.getState().push({ message, variant: "error" })
  },
}

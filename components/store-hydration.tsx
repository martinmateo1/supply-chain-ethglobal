"use client"

import { useEffect } from "react"

import { useTraceabilityStore } from "@/lib/store"

export function StoreHydration({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useTraceabilityStore.persist.rehydrate()
  }, [])

  return children
}

export type CantonCommandEvent = {
  choice: string
  template: string
  partyHint: string
}

type CantonCommandListener = (event: CantonCommandEvent) => void

const listeners = new Set<CantonCommandListener>()

export function emitCantonCommandEvent(event: CantonCommandEvent): void {
  for (const listener of listeners) {
    listener(event)
  }
}

export function subscribeCantonCommandEvents(
  listener: CantonCommandListener,
): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

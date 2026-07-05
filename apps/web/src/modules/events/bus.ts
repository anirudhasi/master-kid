// modules/events/bus.ts — M13 in-process bus (spec §3–§4)
// Rules implemented: handler isolation, async microtask dispatch, dev ledger,
// depth-2 cascade warning. Swappable for a broker at extraction (same interface).

import type { AnyDomainEvent, EventBus, EventOf, EventType } from './contracts'

type Handler = (e: AnyDomainEvent) => void | Promise<void>

const LEDGER_SIZE = 200
const MAX_DEPTH = 2

class InProcessBus implements EventBus {
  private handlers = new Map<EventType, Set<Handler>>()
  private ledger: AnyDomainEvent[] = []
  private depth = 0

  emit<E extends AnyDomainEvent>(event: E): void {
    if (import.meta.env?.DEV) {
      this.ledger.push(event)
      if (this.ledger.length > LEDGER_SIZE) this.ledger.shift()
      if (this.depth >= MAX_DEPTH) {
        console.warn(`[bus] event cascade depth ${this.depth + 1} from '${event.type}' — ` +
          `workflows this deep belong in S1, not chained handlers (M13 spec §4.4)`)
      }
    }
    const subs = this.handlers.get(event.type)
    if (!subs || subs.size === 0) return
    for (const h of [...subs]) {
      queueMicrotask(async () => {           // §4.2 never block the emitter
        this.depth++
        try {
          await h(event)                     // §4.1 isolation
        } catch (err) {
          reportBusError(event.type, err)
        } finally {
          this.depth--
        }
      })
    }
  }

  on<T extends EventType>(type: T, handler: (e: EventOf<T>) => void | Promise<void>): () => void {
    let set = this.handlers.get(type)
    if (!set) { set = new Set(); this.handlers.set(type, set) }
    const h = handler as Handler
    set.add(h)
    return () => { set!.delete(h) }
  }

  /** Dev-only: inspect recent events (exposed as window.__mkEvents). */
  getLedger(): readonly AnyDomainEvent[] { return this.ledger }
}

function reportBusError(type: string, err: unknown): void {
  // Route to the app's error reporter when one exists; never rethrow (§4.1).
  console.error(`[bus] handler for '${type}' failed:`, err)
}

export const bus: EventBus & { getLedger(): readonly AnyDomainEvent[] } = new InProcessBus()

if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  ;(window as unknown as Record<string, unknown>).__mkEvents = bus
}

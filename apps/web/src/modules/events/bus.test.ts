// M13 Event Bus unit tests (dev spec Stage 0-1, PR-3).
// Covers the acceptance list: handler isolation, unsubscribe, type narrowing,
// depth-2 cascade warning, dev ledger ring buffer.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { bus } from './bus'
import { makeEvent } from './contracts'

// Handlers dispatch on microtasks; flush them before asserting.
const flush = () => new Promise<void>((r) => setTimeout(r, 0))
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const offs: Array<() => void> = []
const on: typeof bus.on = (type, handler) => {
  const off = bus.on(type, handler)
  offs.push(off)
  return off
}

beforeEach(() => { vi.restoreAllMocks() })
afterEach(() => { offs.splice(0).forEach((off) => off()) })

describe('M13 in-process bus', () => {
  it('delivers a typed event to a subscriber (type narrowing)', async () => {
    const seen: string[] = []
    on('child.created', (e) => {
      // Compile-time narrowing: payload is ChildCreated's, not a union.
      seen.push(`${e.payload.childId}:${String(e.payload.isFirstChild)}`)
    })
    bus.emit(makeEvent('child.created', { childId: 'c1', accountId: 'a1', isFirstChild: true }))
    await flush()
    expect(seen).toEqual(['c1:true'])
  })

  it('a throwing handler does not break sibling handlers (isolation)', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const calls: string[] = []
    on('child.updated', () => { throw new Error('boom') })
    on('child.updated', () => { calls.push('sibling ran') })
    bus.emit(makeEvent('child.updated', { childId: 'c1' }))
    await flush()
    expect(calls).toEqual(['sibling ran'])
    expect(err).toHaveBeenCalledWith(expect.stringContaining("handler for 'child.updated' failed"), expect.any(Error))
  })

  it('a rejecting async handler is also isolated', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const calls: string[] = []
    on('streak.changed', async () => { throw new Error('async boom') })
    on('streak.changed', () => { calls.push('ok') })
    bus.emit(makeEvent('streak.changed', { childId: 'c1', days: 3 }))
    await flush()
    expect(calls).toEqual(['ok'])
    expect(err).toHaveBeenCalled()
  })

  it('unsubscribe stops delivery', async () => {
    const calls: string[] = []
    const off = on('child.selected', () => { calls.push('x') })
    bus.emit(makeEvent('child.selected', { childId: 'c1' }))
    await flush()
    off()
    bus.emit(makeEvent('child.selected', { childId: 'c1' }))
    await flush()
    expect(calls).toEqual(['x'])
  })

  it('emitting with no subscribers does not throw', () => {
    expect(() => bus.emit(makeEvent('enrollment.ended', { enrollmentId: 'e1' }))).not.toThrow()
  })

  it('does not block the emitter (async dispatch)', () => {
    let handled = false
    on('content.updated', () => { handled = true })
    bus.emit(makeEvent('content.updated', { itemId: 'i1', kind: 'lesson' }))
    // Synchronously after emit, the handler must NOT have run yet (§4.2).
    expect(handled).toBe(false)
  })

  it('warns on cascade depth > 2 (§4.4)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // depth 1: child.created handler stays in flight while it cascades…
    on('child.created', async () => {
      bus.emit(makeEvent('child.updated', { childId: 'c1' }))
      await sleep(20)
    })
    // depth 2: runs while depth-1 is still awaiting; its emit sees depth >= 2.
    on('child.updated', () => {
      bus.emit(makeEvent('child.selected', { childId: 'c1' }))
    })
    bus.emit(makeEvent('child.created', { childId: 'c1', accountId: 'a1', isFirstChild: false }))
    await sleep(40)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('cascade depth'))
  })

  it('dev ledger records events and is capped at 200 (ring buffer)', async () => {
    for (let i = 0; i < 205; i++) {
      bus.emit(makeEvent('feed.item_completed', { childId: 'c1', itemId: `i${i}` }))
    }
    await flush()
    const ledger = bus.getLedger()
    expect(ledger.length).toBeLessThanOrEqual(200)
    const last = ledger[ledger.length - 1]
    expect(last.type).toBe('feed.item_completed')
    expect((last.payload as { itemId: string }).itemId).toBe('i204')
  })
})

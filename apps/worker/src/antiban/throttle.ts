import { config } from '../config'

interface SenderThrottle {
  sentInWindow: number
  windowStartMs: number
  lastSentMs: number
}

const throttleMap = new Map<string, SenderThrottle>()

export async function waitForSlot(senderId: string): Promise<void> {
  const now = Date.now()
  const state = throttleMap.get(senderId) ?? {
    sentInWindow: 0,
    windowStartMs: now,
    lastSentMs: 0,
  }

  if (now - state.windowStartMs > 60_000) {
    state.sentInWindow = 0
    state.windowStartMs = now
  }

  if (state.sentInWindow >= config.maxMsgPerMinute) {
    const waitMs = 60_000 - (now - state.windowStartMs) + 1_000
    await sleep(waitMs)
    state.sentInWindow = 0
    state.windowStartMs = Date.now()
  }

  const elapsed = Date.now() - state.lastSentMs
  const targetDelay = randomBetween(config.minDelayMs, config.maxDelayMs)
  if (elapsed < targetDelay) {
    await sleep(targetDelay - elapsed)
  }

  state.sentInWindow++
  state.lastSentMs = Date.now()
  throttleMap.set(senderId, state)
}

export async function batchRest(): Promise<void> {
  const ms = randomBetween(config.batchRestMinMs, config.batchRestMaxMs)
  console.log(`[throttle] Batch rest ${Math.round(ms / 1000)}s`)
  await sleep(ms)
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

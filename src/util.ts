export function arrayBuffersEqual(buf1: ArrayBuffer, buf2: ArrayBuffer): boolean {
  if (buf1.byteLength !== buf2.byteLength) return false

  const view1 = new Uint8Array(buf1)
  const view2 = new Uint8Array(buf2)

  for (let i = 0; i < view1.length; i++) {
    if (view1[i] !== view2[i]) return false
  }

  return true
}

export function stringToBytes(string: string): number[] {
  return [...string].map((character) => character.charCodeAt(0))
}

export function toHexString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const trim = (text: string): string => {
  return text?.replaceAll('\x00', '')
}

export const parseToMap = (text: string): Map<number, number> => {
  const map = new Map()
  const lines = text.trim().split('\n')

  for (const line of lines) {
    const [key, value] = line.trim().split(',')
    if (key && value !== undefined) {
      map.set(Number(key), Number(value))
    }
  }

  return map
}

export const getEventFlagState = (bstMap: Map<number, number>, eventFlags: Uint8Array, eventId: number): boolean => {
  const FLAG_DIVISOR = 1000
  const BLOCK_SIZE = 125

  const block = Math.floor(eventId / FLAG_DIVISOR)
  const index = eventId - block * FLAG_DIVISOR

  if (!bstMap.has(block)) {
    throw new Error(`Event ID ${eventId} (block ${block}) not found in BST`)
  }

  const offset = bstMap.get(block)! * BLOCK_SIZE
  const byteIndex = Math.floor(index / 8)
  let bitIndex = index - byteIndex * 8
  bitIndex = 7 - bitIndex

  const bytePos = offset + byteIndex

  if (bytePos >= eventFlags.length) {
    throw new Error(`Calculated byte position ${bytePos} exceeds event_flags size`)
  }

  const eventByte = eventFlags[bytePos]
  return ((eventByte >> bitIndex) & 1) === 1
}

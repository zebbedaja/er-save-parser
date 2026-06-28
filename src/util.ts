import { bstFile } from './bst-map'
import { mapNames } from './map-names'
import type { BitDifference, Offset } from './types'

/**
 * Compare two ArrayBuffers for byte-by-byte equality.
 *
 * @param buf1 - The first ArrayBuffer to compare
 * @param buf2 - The second ArrayBuffer to compare
 * @returns True if both buffers have identical byte content
 */
export function arrayBuffersEqual(buf1: ArrayBuffer, buf2: ArrayBuffer): boolean {
  if (buf1.byteLength !== buf2.byteLength) return false

  const view1 = new Uint8Array(buf1)
  const view2 = new Uint8Array(buf2)

  for (let i = 0; i < view1.length; i++) {
    if (view1[i] !== view2[i]) return false
  }

  return true
}

/**
 * Convert a string into an array of byte values.
 *
 * @param string - The string to convert
 * @returns An array of ASCII/Unicode byte values for each character
 */
export function stringToBytes(string: string): number[] {
  return [...string].map((character) => character.charCodeAt(0))
}

/**
 * Convert an ArrayBuffer to a lowercase hexadecimal string.
 *
 * @param buffer - The ArrayBuffer to convert
 * @returns A lowercase hexadecimal string representation of the buffer
 */
export function toHexString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Remove all null ('\x00') characters from a string.
 *
 * @param text - The string to clean
 * @returns The input string with all null ('\x00') characters removed
 */
export const trim = (text: string): string => {
  return text?.replaceAll('\x00', '')
}

/**
 * Parse a string of delimiter-separated "key,value" pairs into a Map.
 *
 * @param text - A string of delimiter-separated pairs, one per line
 * @param delimiter - The character separating key and value (default: ",")
 * @returns A Map with numeric keys and values parsed from the input
 */
export const parseToMap = (text: string, delimiter: string = ','): Map<number, number> => {
  const map = new Map()
  const lines = text.trim().split('\n')

  for (const line of lines) {
    const [key, value] = line.trim().split(delimiter)
    if (key && value !== undefined) {
      map.set(Number(key), Number(value))
    }
  }

  return map
}

/**
 * Returns tha Bst Map as a Map
 *
 * @returns Bst Map as Map
 */
export const getBstMap = (): Map<number, number> => {
  return parseToMap(bstFile)
}

/**
 * Returns offset and bit index of event flag in event flag array
 *
 * @param bstMap - A map of block IDs to their binary offsets
 * @param eventId - The event ID to check
 * @returns Offset and bit index of event flag in event flag array
 */
export const getEventFlagOffset = (bstMap: Map<number, number>, eventId: number): Offset => {
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

  return {
    bytePos,
    bitIndex,
  }
}

/**
 * Determine whether a specific event flag is set.
 *
 * @param bstMap - A map of block IDs to their binary offsets
 * @param eventFlags - The raw event_flags byte array from the save data
 * @param eventId - The event ID to check
 * @returns True if the event flag is set (active), false otherwise
 */
export const getEventFlagState = (bstMap: Map<number, number>, eventFlags: Uint8Array, eventId: number): boolean => {
  const offset = getEventFlagOffset(bstMap, eventId)

  if (offset.bytePos >= eventFlags.length) {
    throw new Error(`Calculated byte position ${offset.bytePos} exceeds event_flags size`)
  }

  const eventByte = eventFlags[offset.bytePos]
  return ((eventByte >> offset.bitIndex) & 1) === 1
}

/**
 * Determine the event ID from a byte position and bit index.
 *
 * @param bstMap - A map of block IDs to their binary offsets
 * @param bytePos - The byte position in the event_flags array
 * @param bitIndex - The bit index within the byte (0-7)
 * @returns The event ID corresponding to the given position
 */
export const getEventIdFromPosition = (bstMap: Map<number, number>, bytePos: number, bitIndex: number): number => {
  const FLAG_DIVISOR = 1000
  const BLOCK_SIZE = 125

  // Reverse the bit index flip
  const originalBitIndex = 7 - bitIndex

  // Find the block whose offset contains this bytePos
  for (const [block, offsetIndex] of bstMap) {
    const offset = offsetIndex * BLOCK_SIZE
    if (bytePos >= offset && bytePos < offset + BLOCK_SIZE) {
      const byteIndex = bytePos - offset
      const index = byteIndex * 8 + originalBitIndex
      return block * FLAG_DIVISOR + index
    }
  }

  throw new Error(`Byte position ${bytePos} not found in any known block`)
}

/**
 * Compares two Uint8Arrays and returns all bit-level differences.
 *
 * Arrays of different lengths are supported — missing bytes in the shorter
 * array are treated as `0`.
 *
 * @param a - The original Uint8Array.
 * @param b - The Uint8Array to compare against.
 * @returns An array of {@link BitDifference} objects, one per differing bit.
 *
 * @example
 * const a = new Uint8Array([0b00001111, 0b11110000]);
 * const b = new Uint8Array([0b00001111, 0b10110001]);
 *
 * const diffs = compareUint8Arrays(a, b);
 * // [
 * //   { offset: 1, bitIndex: 0, oldBit: 0, newBit: 1 },
 * //   { offset: 1, bitIndex: 6, oldBit: 1, newBit: 0 },
 * // ]
 */
export const compareUint8Arrays = (a: Uint8Array, b: Uint8Array): BitDifference[] => {
  const differences: BitDifference[] = []
  const length = Math.max(a.length, b.length)

  for (let offset = 0; offset < length; offset++) {
    const byteA = offset < a.length ? a[offset] : 0
    const byteB = offset < b.length ? b[offset] : 0

    if (byteA !== byteB) {
      const xor = byteA ^ byteB

      for (let bitIndex = 0; bitIndex < 8; bitIndex++) {
        if (xor & (1 << bitIndex)) {
          differences.push({
            offset,
            bitIndex,
            oldBit: ((byteA >> bitIndex) & 1) as 0 | 1,
            newBit: ((byteB >> bitIndex) & 1) as 0 | 1,
          })
        }
      }
    }
  }

  return differences
}

/**
 * Calculate the map name from 4 bytes.
 * Bytes are in reverse order: [b0, b1, b2, b3] → m{b3}_{b2}_{b1}_{b0}
 *
 * @param bytes - A 4-byte Uint8Array representing the map ID
 * @returns The map name, or undefined if not found
 */
export const getMapNameFromBytes = (bytes: Uint8Array): string | undefined => {
  if (bytes.length !== 4) return undefined

  const id = `m${String(bytes[3]).padStart(2, '0')}_${String(bytes[2]).padStart(2, '0')}_${String(bytes[1]).padStart(2, '0')}_${String(bytes[0]).padStart(2, '0')}`

  const entry = mapNames.find((m) => m.id === id)
  return entry?.name ?? undefined
}

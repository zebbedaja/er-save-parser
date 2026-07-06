import { describe, expect, test } from 'vitest'
import {
  arrayBuffersEqual,
  stringToBytes,
  toHexString,
  trim,
  parseToMap,
  getEventFlagState,
  getEventIdFromPosition,
  getEventFlagOffset,
  compareUint8Arrays,
  getBstMap,
  getMapNameFromBytes,
} from '../src/util'

describe('arrayBuffersEqual', () => {
  test('returns true for identical buffers', () => {
    const buf1 = new Uint8Array([1, 2, 3]).buffer
    const buf2 = new Uint8Array([1, 2, 3]).buffer
    expect(arrayBuffersEqual(buf1, buf2)).toBe(true)
  })

  test('returns false for different content', () => {
    const buf1 = new Uint8Array([1, 2, 3]).buffer
    const buf2 = new Uint8Array([1, 2, 4]).buffer
    expect(arrayBuffersEqual(buf1, buf2)).toBe(false)
  })

  test('returns false for different lengths', () => {
    const buf1 = new Uint8Array([1, 2]).buffer
    const buf2 = new Uint8Array([1, 2, 3]).buffer
    expect(arrayBuffersEqual(buf1, buf2)).toBe(false)
  })

  test('returns true for empty buffers', () => {
    const buf1 = new Uint8Array([]).buffer
    const buf2 = new Uint8Array([]).buffer
    expect(arrayBuffersEqual(buf1, buf2)).toBe(true)
  })
})

describe('stringToBytes', () => {
  test('converts empty string', () => {
    expect(stringToBytes('')).toEqual([])
  })

  test('converts single character', () => {
    expect(stringToBytes('A')).toEqual([65])
  })

  test('converts multi-character string', () => {
    expect(stringToBytes('AB')).toEqual([65, 66])
  })
})

describe('toHexString', () => {
  test('converts empty buffer', () => {
    expect(toHexString(new Uint8Array([]).buffer)).toBe('')
  })

  test('pads single digit hex values', () => {
    expect(toHexString(new Uint8Array([5]).buffer)).toBe('05')
  })

  test('converts multi-byte buffer', () => {
    expect(toHexString(new Uint8Array([255, 0, 16]).buffer)).toBe('ff0010')
  })
})

describe('trim', () => {
  test('removes null characters', () => {
    expect(trim('foo\x00bar\x00')).toBe('foobar')
  })

  test('leaves string without nulls unchanged', () => {
    expect(trim('hello')).toBe('hello')
  })

  test('returns empty string for all nulls', () => {
    expect(trim('\x00\x00\x00')).toBe('')
  })

  test('handles empty string', () => {
    expect(trim('')).toBe('')
  })
})

describe('parseToMap', () => {
  test('parses valid multi-line input', () => {
    const result = parseToMap('1,100\n2,200\n3,300')
    expect(result).toEqual(
      new Map([
        [1, 100],
        [2, 200],
        [3, 300],
      ]),
    )
  })

  test('returns empty map for empty input', () => {
    expect(parseToMap('').size).toBe(0)
  })

  test('skips malformed lines', () => {
    const result = parseToMap('1,100\nbadline\n2,200')
    expect(result).toEqual(
      new Map([
        [1, 100],
        [2, 200],
      ]),
    )
  })

  test('parses single entry', () => {
    const result = parseToMap('42,999')
    expect(result).toEqual(new Map([[42, 999]]))
  })

  test('uses comma as default delimiter', () => {
    const result = parseToMap('1,100\n2,200')
    expect(result).toEqual(
      new Map([
        [1, 100],
        [2, 200],
      ]),
    )
  })

  test('parses with custom semicolon delimiter', () => {
    const result = parseToMap('1;100\n2;200', ';')
    expect(result).toEqual(
      new Map([
        [1, 100],
        [2, 200],
      ]),
    )
  })

  test('parses with custom pipe delimiter', () => {
    const result = parseToMap('1|100|300\n2|200\n3|300', '|')
    expect(result).toEqual(
      new Map([
        [1, 100],
        [2, 200],
        [3, 300],
      ]),
    )
  })
})

describe('getEventFlagState', () => {
  test('returns true when flag bit is set', () => {
    const bstMap = new Map([[0, 0]])
    const eventFlags = new Uint8Array([0x80])
    expect(getEventFlagState(bstMap, eventFlags, 0)).toBe(true)
  })

  test('returns false when flag bit is not set', () => {
    const bstMap = new Map([[0, 0]])
    const eventFlags = new Uint8Array([0x00])
    expect(getEventFlagState(bstMap, eventFlags, 0)).toBe(false)
  })

  test('throws when block is missing from BST', () => {
    const bstMap = new Map<number, number>()
    const eventFlags = new Uint8Array([0x00])
    expect(() => getEventFlagState(bstMap, eventFlags, 0)).toThrow(/not found in BST/)
  })

  test('throws when byte position exceeds buffer', () => {
    const bstMap = new Map([[0, 9999]])
    const eventFlags = new Uint8Array([0x00])
    expect(() => getEventFlagState(bstMap, eventFlags, 0)).toThrow(/exceeds event_flags size/)
  })

  test('checks correct bit position within a byte', () => {
    const bstMap = new Map([[0, 0]])
    const eventFlags = new Uint8Array([0xff])
    for (let i = 0; i < 8; i++) {
      expect(getEventFlagState(bstMap, eventFlags, i)).toBe(true)
    }
  })

  test('handles flags in the second byte', () => {
    const bstMap = new Map([[0, 0]])
    const eventFlags = new Uint8Array([0x00, 0x80])
    expect(getEventFlagState(bstMap, eventFlags, 8)).toBe(true)
    expect(getEventFlagState(bstMap, eventFlags, 0)).toBe(false)
  })
})

describe('getEventFlagOffset', () => {
  test('returns correct bytePos and bitIndex for eventId 0 in block 0', () => {
    const bstMap = new Map([[0, 0]])
    expect(getEventFlagOffset(bstMap, 0)).toEqual({ bytePos: 0, bitIndex: 7 })
  })

  test('bitIndex counts down from 7 to 0 for eventIds 0-7', () => {
    const bstMap = new Map([[0, 0]])
    for (let i = 0; i < 8; i++) {
      const result = getEventFlagOffset(bstMap, i)
      expect(result.bytePos).toBe(0)
      expect(result.bitIndex).toBe(7 - i)
    }
  })

  test('eventId 128 (0x80 hex) maps to bytePos 16, bitIndex 7', () => {
    const bstMap = new Map([[0, 0]])
    expect(getEventFlagOffset(bstMap, 128)).toEqual({ bytePos: 16, bitIndex: 7 })
  })

  test('bytePos increments when crossing byte boundary at eventId 8', () => {
    const bstMap = new Map([[0, 0]])
    expect(getEventFlagOffset(bstMap, 8)).toEqual({ bytePos: 1, bitIndex: 7 })
  })

  test('block offset is applied correctly for cross-block eventIds', () => {
    const bstMap = new Map([[0, 0], [1, 1]])
    const result0 = getEventFlagOffset(bstMap, 0)
    const result1 = getEventFlagOffset(bstMap, 1000)
    expect(result1.bytePos - result0.bytePos).toBe(125)
    expect(result1.bitIndex).toBe(result0.bitIndex)
  })

  test('throws when block is missing from BST', () => {
    const bstMap = new Map<number, number>()
    expect(() => getEventFlagOffset(bstMap, 0)).toThrow(/Event ID 0 \(block 0\) not found in BST/)
  })

  test('throws with correct block number in error message', () => {
    const bstMap = new Map([[0, 0]])
    expect(() => getEventFlagOffset(bstMap, 9999)).toThrow(/Event ID 9999 \(block 9\) not found in BST/)
  })

  test('round-trips with getEventIdFromPosition for all eventIds in block 0', () => {
    const bstMap = new Map([[0, 0]])
    for (let id = 0; id < 1000; id++) {
      const offset = getEventFlagOffset(bstMap, id)
      const roundtrip = getEventIdFromPosition(bstMap, offset.bytePos, offset.bitIndex)
      expect(roundtrip).toBe(id)
    }
  })

  test('returns correct offset with real BST map', () => {
    const bstMap = getBstMap()
    const result = getEventFlagOffset(bstMap, 0)
    expect(result).toEqual({ bytePos: 0, bitIndex: 7 })
  })

  test('round-trips with real BST map for eventId from known position', () => {
    const bstMap = getBstMap()
    const eventId = 2049440800
    const offset = getEventFlagOffset(bstMap, eventId)
    const roundtrip = getEventIdFromPosition(bstMap, offset.bytePos, offset.bitIndex)
    expect(roundtrip).toBe(eventId)
  })
})

describe('getEventIdFromPosition', () => {
  test('throws when bytePos is not found in any block', () => {
    const bstMap = getBstMap()
    // A bytePos far beyond any block in the BST
    expect(() => getEventIdFromPosition(bstMap, 999999, 0)).toThrow(
      /Byte position 999999 not found in any known block/
    )
  })

  test('throws when bytePos falls in gap between blocks', () => {
    // Block 0 covers bytes 0-125, block 1 (offset 200) covers bytes 25000-25125
    // bytePos 200 falls in the gap
    const bstMap = new Map([[0, 0], [1, 200]])
    expect(() => getEventIdFromPosition(bstMap, 200, 0)).toThrow(
      /Byte position 200 not found in any known block/
    )
  })

  test('throws for empty BST map', () => {
    const bstMap = new Map<number, number>()
    expect(() => getEventIdFromPosition(bstMap, 0, 0)).toThrow(
      /Byte position 0 not found in any known block/
    )
  })

  test('throws when bytePos exceeds last block', () => {
    const bstMap = new Map([[0, 0]])
    // Block 0 covers bytes 0-125; 200 is past the block
    expect(() => getEventIdFromPosition(bstMap, 200, 0)).toThrow(
      /Byte position 200 not found in any known block/
    )
  })
})

const bits = (str: string) => new Uint8Array([parseInt(str, 2)])

describe('compareUint8Arrays', () => {
  describe('identical arrays', () => {
    test('returns no differences for identical single-byte arrays', () => {
      expect(compareUint8Arrays(bits('00001111'), bits('00001111'))).toEqual([])
    })

    test('returns no differences for identical multi-byte arrays', () => {
      const a = new Uint8Array([0x00, 0xff, 0xab])
      expect(compareUint8Arrays(a, a)).toEqual([])
    })

    test('returns no differences for two empty arrays', () => {
      expect(compareUint8Arrays(new Uint8Array(), new Uint8Array())).toEqual([])
    })
  })

  describe('single bit changes', () => {
    test('detects a change in bit 0 (LSB)', () => {
      expect(compareUint8Arrays(bits('00000000'), bits('00000001'))).toEqual([{ offset: 0, bitIndex: 0, oldBit: 0, newBit: 1 }])
    })

    test('detects a change in bit 7 (MSB)', () => {
      expect(compareUint8Arrays(bits('00000000'), bits('10000000'))).toEqual([{ offset: 0, bitIndex: 7, oldBit: 0, newBit: 1 }])
    })

    test('detects a change in an inner bit', () => {
      expect(compareUint8Arrays(bits('00000000'), bits('00010000'))).toEqual([{ offset: 0, bitIndex: 4, oldBit: 0, newBit: 1 }])
    })
  })

  describe('multiple bit changes', () => {
    test('detects all changed bits within a single byte', () => {
      expect(compareUint8Arrays(bits('11110000'), bits('10110001'))).toEqual([
        { offset: 0, bitIndex: 0, oldBit: 0, newBit: 1 },
        { offset: 0, bitIndex: 6, oldBit: 1, newBit: 0 },
      ])
    })

    test('detects changes across multiple bytes', () => {
      const a = new Uint8Array([0b00000000, 0b11111111])
      const b = new Uint8Array([0b00000001, 0b11111110])

      expect(compareUint8Arrays(a, b)).toEqual([
        { offset: 0, bitIndex: 0, oldBit: 0, newBit: 1 },
        { offset: 1, bitIndex: 0, oldBit: 1, newBit: 0 },
      ])
    })

    test('reports the correct offset for a change in a later byte', () => {
      const a = new Uint8Array([0x00, 0x00, 0b00000001])
      const b = new Uint8Array([0x00, 0x00, 0b00000000])

      expect(compareUint8Arrays(a, b)).toEqual([{ offset: 2, bitIndex: 0, oldBit: 1, newBit: 0 }])
    })
  })

  describe('arrays of different lengths', () => {
    test('treats missing bytes in the shorter array as 0', () => {
      const a = new Uint8Array([0x00])
      const b = new Uint8Array([0x00, 0b00000001])

      expect(compareUint8Arrays(a, b)).toEqual([{ offset: 1, bitIndex: 0, oldBit: 0, newBit: 1 }])
    })

    test('handles an empty first array', () => {
      expect(compareUint8Arrays(new Uint8Array(), bits('00000001'))).toEqual([{ offset: 0, bitIndex: 0, oldBit: 0, newBit: 1 }])
    })

    test('handles an empty second array', () => {
      expect(compareUint8Arrays(bits('00000001'), new Uint8Array())).toEqual([{ offset: 0, bitIndex: 0, oldBit: 1, newBit: 0 }])
    })
  })
})

describe('getMapNameFromBytes', () => {
  test('returns correct name for known map (Limgrave - Siofra River Well)', () => {
    const bytes = new Uint8Array([0, 37, 45, 60])
    const result = getMapNameFromBytes(bytes)
    expect(result).toBe("Limgrave - Siofra River Well, Mistwood Ruins, Minor Erdtree, Nokron Entrance")
  })

  test('returns correct name for Stormveil Castle', () => {
    const bytes = new Uint8Array([0, 0, 0, 10])
    const result = getMapNameFromBytes(bytes)
    expect(result).toBe("Stormveil Castle")
  })

  test('returns null for unknown map bytes', () => {
    const bytes = new Uint8Array([0, 0, 0, 99])
    const result = getMapNameFromBytes(bytes)
    expect(result).toBe(undefined)
  })

  test('returns null for short array', () => {
    const bytes = new Uint8Array([0, 0, 0])
    const result = getMapNameFromBytes(bytes)
    expect(result).toBe(undefined)
  })

  test('returns null for empty array', () => {
    const bytes = new Uint8Array([])
    const result = getMapNameFromBytes(bytes)
    expect(result).toBe(undefined)
  })
})

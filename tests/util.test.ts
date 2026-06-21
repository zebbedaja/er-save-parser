import { describe, expect, test } from 'vitest'
import {
  arrayBuffersEqual,
  stringToBytes,
  toHexString,
  trim,
  parseToMap,
  getEventFlagState,
  getEventIdFromPosition,
  compareUint8Arrays,
} from '../src/util'
import { bstFile } from '../src/bst-map'

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

describe('getEventIdFromPosition with real bst Map', () => {
  test('returns the correct id value for byte position and bit index', () => {
    const bstMap = parseToMap(bstFile)
    expect(getEventIdFromPosition(bstMap, 153225, 7)).toBe(2049440800)
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

import { describe, expect, test } from 'vitest'
import { parse } from '../src'

describe('parse', () => {
  const BAD_BUFFER = new ArrayBuffer(0x1ba03d0)

  const GOOD_BUFFER_1 = new ArrayBuffer(0x1ba03d0)
  const GOOD_BUFFER_1_VIEW = new Uint8Array(GOOD_BUFFER_1)
  GOOD_BUFFER_1_VIEW.set([0x42, 0x4e, 0x44, 0x34]) // BND4

  const GOOD_BUFFER_2 = new ArrayBuffer(0x1ba03d0)
  const GOOD_BUFFER_2_VIEW = new Uint8Array(GOOD_BUFFER_2)
  GOOD_BUFFER_2_VIEW.set([0x53, 0x4c, 0x32, 0x00]) // SL2\x00

  test('test file type', () => {
    expect(() => parse(BAD_BUFFER)).toThrow(/File type not supported/)
    expect(parse(GOOD_BUFFER_1)).toBeTypeOf('object')
    expect(parse(GOOD_BUFFER_2)).toBeTypeOf('object')
  })
})

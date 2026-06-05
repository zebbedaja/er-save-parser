import { describe, expect, test, vi, afterEach } from 'vitest'
import { createLogger } from '../src/logger'

describe('createLogger', () => {
  let logSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  afterEach(() => {
    logSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })

  test('defaults to error level', () => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const logger = createLogger()

    logger.debug('test')
    logger.info('test')
    logger.warn('test')
    expect(logSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
  })

  test('debug level logs all messages', () => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const logger = createLogger('debug')

    logger.debug('test')
    logger.info('test')
    logger.warn('test')
    logger.error('test')

    expect(logSpy).toHaveBeenCalledWith('[DEBUG] test')
    expect(logSpy).toHaveBeenCalledWith('[INFO] test')
    expect(warnSpy).toHaveBeenCalledWith('[WARN] test')
    expect(errorSpy).toHaveBeenCalledWith('[ERROR] test')
  })

  test('info level suppresses debug', () => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const logger = createLogger('info')

    logger.debug('test')
    logger.info('test')
    logger.error('test')

    expect(logSpy).not.toHaveBeenCalledWith('[DEBUG] test')
    expect(logSpy).toHaveBeenCalledWith('[INFO] test')
  })

  test('warn level suppresses debug and info', () => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const logger = createLogger('warn')

    logger.debug('test')
    logger.info('test')
    logger.warn('test')

    expect(logSpy).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith('[WARN] test')
  })

  test('none level suppresses all output', () => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const logger = createLogger('none')

    logger.debug('test')
    logger.info('test')
    logger.warn('test')
    logger.error('test')

    expect(logSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
  })

  test('warn messages use console.warn', () => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const logger = createLogger('debug')
    logger.warn('test')

    expect(warnSpy).toHaveBeenCalledWith('[WARN] test')
    expect(logSpy).not.toHaveBeenCalledWith('[WARN] test')
  })

  test('error messages use console.error', () => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const logger = createLogger('debug')
    logger.error('test')

    expect(errorSpy).toHaveBeenCalledWith('[ERROR] test')
  })
})

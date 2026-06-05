import type { LogLevel } from './types'

const levelValues: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
}

/**
 * Factory for creating a logger instance with the specified log level threshold.
 *
 * @param level - The minimum log level to output. Defaults to 'error'
 * @returns A logger object with debug, info, warn, and error methods
 */
export function createLogger(level: LogLevel = 'error') {
  const threshold = levelValues[level]

  return {
    debug: (msg: string) => {
      if (levelValues.debug >= threshold) console.log(`[DEBUG] ${msg}`)
    },
    info: (msg: string) => {
      if (levelValues.info >= threshold) console.log(`[INFO] ${msg}`)
    },
    warn: (msg: string) => {
      if (levelValues.warn >= threshold) console.warn(`[WARN] ${msg}`)
    },
    error: (msg: string) => {
      if (levelValues.error >= threshold) console.error(`[ERROR] ${msg}`)
    },
  }
}

import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

/**
 * Log levels supported by Winston
 */
export type Level = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly'

/**
 * Data that can be logged per level
 */
export type LogData = Record<Level, any>

/**
 * A `Logger` is a wrapper around Winston that provides
 * a common interface for logging data.
 *
 * The `Logger` is initialized with a scope, which is
 * the name of the component that is using the logger.
 * A scope could be the service / router which uses a logger
 * for HTTP requests.
 *
 * A logger uses transports to send logs to different
 * destinations. The `Logger` uses a console transport
 * and a file transport by default.
 */
export abstract class Logger<D extends LogData> {
  private logger: winston.Logger

  /**
   * The scope of the logger.
   */
  public readonly scope: string

  constructor(scope: string) {
    const transports: winston.transport[] = [this.consoleTransport]

    this.scope = scope

    if (process.env.NODE_ENV === 'development') {
      transports.push(this.fileTransport)
    }

    this.logger = winston.createLogger({
      transports,
      format: winston.format.combine(winston.format.timestamp(), winston.format.metadata()),
    })
  }

  //* API

  /**
   * Logs a message at the given level.
   *
   * @param message The message to log.
   * @param level The level to log at.
   */
  public log<L extends Level>(message: D[L], level: L) {
    this.logger.log(level, message)
  }

  /**
   * Logs a message at the `info` level.
   *
   * @param message The message to log.
   */
  public info(message: D['info']) {
    this.logger.info(message)
  }

  /**
   * Logs a message at the `error` level.
   *
   * @param message The message to log.
   */
  public error(message: D['error']) {
    this.logger.error(message)
  }

  /**
   * Logs a message at the `warn` level.
   *
   * @param message The message to log.
   */
  public warn(message: D['warn']) {
    this.logger.warn(message)
  }

  //* Protected Methods

  protected abstract format<L extends Level>(data: D[L], level: L): string

  protected formatDuration(nanoseconds: number): string {
    if (nanoseconds === 0) {
      return ''
    }

    const hour = 60 * 60 * 1000 * 1000 * 1000
    const minute = 60 * 1000 * 1000 * 1000
    const second = 1000 * 1000 * 1000
    const millisecond = 1000 * 1000
    const microsecond = 1000

    if (nanoseconds >= hour) {
      return `${Math.floor(nanoseconds / hour)}h${this.formatDuration(nanoseconds % hour)}`
    }

    if (nanoseconds >= minute) {
      return `${Math.floor(nanoseconds / minute)}m${this.formatDuration(nanoseconds % minute)}`
    }

    if (nanoseconds >= second) {
      return `${Math.floor(nanoseconds / second)}s${this.formatDuration(nanoseconds % second)}`
    }

    if (nanoseconds >= millisecond) {
      return `${Math.floor(nanoseconds / millisecond)}ms${this.formatDuration(
        nanoseconds % millisecond,
      )}`
    }

    if (nanoseconds >= microsecond) {
      return `${Math.floor(nanoseconds / microsecond)}µs${this.formatDuration(
        nanoseconds % microsecond,
      )}`
    }

    return `${nanoseconds}ns`
  }

  protected formatMemSize(bytes: number, decimals: number = 2) {
    if (bytes === 0) {
      return '0 B'
    }

    const k = 1000
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${units[i]}`
  }

  //* Private Methods

  private get consoleTransport() {
    return new winston.transports.Console({
      format: winston.format.printf((info) => {
        const level = info.level as Level
        return this.format(info.message, level)
      }),
    })
  }

  private get fileTransport() {
    return new DailyRotateFile({
      datePattern: 'YYYY-MM-DD-HH',
      maxSize: '20m',
      maxFiles: '14d',
      filename: `${this.scope.toLowerCase()}-%DATE%.log`,
      dirname: './log-files',
      format: winston.format.json(),
    })
  }
}

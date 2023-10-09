import winston from 'winston'
import { Level, Logger } from './Logger'

/**
 * A `StandardLogger` is a {@link Logger} that is used to log custom string messages.
 */
export class StandardLogger extends Logger<Record<Level, string>> {
  /**
   * Dafault logger instance.
   * Scoped as `default`.
   */
  public static readonly default = new StandardLogger('default')

  protected format<L extends Level>(data: Record<Level, string>[L], level: L): string {
    const scope = winston.format.colorize().colorize(level, this.scope)
    return `[${scope}] ${data}`
  }
}

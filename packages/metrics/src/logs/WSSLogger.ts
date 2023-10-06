import winston from 'winston'
import { Level, LogData, Logger } from './Logger'

interface WSSData extends LogData {
  warn: {
    message: any
  }
  http: string
  verbose: string
  debug: string
  silly: string
  info: {
    type: 'send' | 'receive'
    data: any
    key: string
    duration: number
  }
  error: string
}

/**
 * A `WSSLogger` is a {@link Logger} that is used to log in- and outgoing websocket messages.
 */
export class WSSLogger extends Logger<WSSData> {
  private colorizer = winston.format.colorize()

  constructor(scope: string) {
    super(scope)

    this.colorizer.addColors({
      red: 'red',
      yellow: 'yellow',
      green: 'green',
    })
  }

  //* Protected Methods

  protected format<L extends Level>(payload: WSSData[L], level: L): string {
    const scope = winston.format.colorize().colorize(level, this.scope)

    if (level === 'info') {
      const data = payload as WSSData['info']
      const duration = this.formatDuration(Math.ceil(data.duration * 1000) * 1000 * 1000)
      const coloredDuration = this.colorizer.colorize(this.durationColor(data.duration), duration)
      const event = data.type === 'send' ? 'Handled (sent)' : 'Handled (recv)'

      return `[${scope}] Web Socket Message - ${event} '${data.key}' in ${coloredDuration}`
    }

    if (level === 'warn') {
      const data = payload as WSSData['warn']
      return `[${scope}] Unhandled Web Socket Message - '${data.message}'`
    }

    if (level === 'error') {
      const data = payload as WSSData['error']
      return `[${scope}] Failed Web Socket Message - '${data}'`
    }

    return `[${scope}] ${payload}`
  }

  //* Private Methods

  private durationColor(duration: number): string {
    if (duration > 0.5) return 'red'
    if (duration > 0.1) return 'yellow'
    return 'green'
  }
}

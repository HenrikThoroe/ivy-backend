import winston from 'winston'
import { HTTPMethod, HTTPMetricData } from '../shared/MetricData'
import { Level, LogData, Logger } from './Logger'

interface HTTPData extends LogData {
  warn: string
  http: string
  verbose: string
  debug: string
  silly: string
  info: Omit<HTTPMetricData, 'app'>
  error: {
    path: string
    method: HTTPMethod
    error: string
  }
}

/**
 * A `HTTPLogger` is a {@link Logger} that is used to log HTTP requests.
 *
 * The logger receives metrics for each HTTP request and logs them.
 * It takes care of formatting the log messages for console output.
 */
export class HTTPLogger extends Logger<HTTPData> {
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

  protected format<L extends Level>(payload: HTTPData[L], level: L): string {
    const scope = winston.format.colorize().colorize(level, this.scope)

    if (level === 'info') {
      const data = payload as HTTPData['info']
      const duration = this.formatDuration(Math.ceil(data.duration * 1000) * 1000 * 1000)
      const size = this.formatMemSize(data.size)
      const code = this.colorizer.colorize(this.statusColor(data.code), data.code.toString())
      const coloredDuration = this.colorizer.colorize(this.durationColor(data.duration), duration)

      return `[${scope}] HTTP Request - ${data.method} ${data.path} (${code}) in ${coloredDuration} (${size})`
    }

    if (level === 'error') {
      const data = payload as HTTPData['error']
      const method = this.colorizer.colorize('yellow', data.method)
      const path = this.colorizer.colorize('yellow', data.path)
      const error = this.colorizer.colorize('red', data.error)

      return `[${scope}] HTTP Request - ${method} ${path} failed with '${error}'`
    }

    return `[${scope}] ${payload}`
  }

  //* Private Methods

  private statusColor(code: number): string {
    if (code >= 500) return 'red'
    if (code >= 400) return 'yellow'
    return 'green'
  }

  private durationColor(duration: number): string {
    if (duration > 0.5) return 'red'
    if (duration > 0.1) return 'yellow'
    return 'green'
  }
}

import { Counter, Histogram, Registry } from 'prom-client'
import { App, HTTPMetricData, MetricData } from '../shared/MetricData'

/**
 * @important Not yet ready for use nor stable.
 */
export interface MetricSink<T extends MetricData> {
  push(metrics: Omit<T, 'app'>): void
}

/**
 * @important Not yet ready for use nor stable.
 */
export abstract class Collector<T extends MetricData> implements MetricSink<T> {
  protected readonly register: Registry

  constructor(register: Registry) {
    this.register = register
  }

  public abstract push(metrics: Omit<T, 'app'>): void
}

/**
 * @important Not yet ready for use nor stable.
 */
export class HTTPCollector extends Collector<HTTPMetricData> {
  private readonly app: App

  private readonly total: Counter<string>

  private readonly duration: Histogram<string>

  private readonly size: Histogram<string>

  constructor(register: Registry, app: App) {
    super(register)
    this.app = app

    this.total = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['code', 'method', 'path', 'app'],
      registers: [register],
    })

    this.duration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['code', 'method', 'path', 'app'],
      registers: [register],
    })

    this.size = new Histogram({
      name: 'http_response_size_bytes',
      help: 'Size of HTTP responses in bytes',
      labelNames: ['code', 'method', 'path', 'app'],
      registers: [register],
    })
  }

  public push(metrics: Omit<HTTPMetricData, 'app'>) {
    const labels = {
      code: metrics.code,
      method: metrics.method,
      path: metrics.path,
      app: this.app,
    }

    this.total.inc(labels)
    this.duration.observe(labels, metrics.duration)
    this.size.observe(labels, metrics.size)
  }
}

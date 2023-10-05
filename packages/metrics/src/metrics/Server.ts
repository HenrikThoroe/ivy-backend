import express from 'express'
import client, { Registry } from 'prom-client'
import { App, HTTPMetricData } from '../shared/MetricData'
import { HTTPCollector, MetricSink } from './Collector'

/**
 * @important Not yet ready for use nor stable.
 */
export class MetricServer {
  private register: Registry

  private app = express()

  private http: HTTPCollector

  constructor(app: App) {
    this.register = new Registry()
    this.http = new HTTPCollector(this.register, app)

    client.collectDefaultMetrics({ register: this.register, labels: { app } })

    this.app.get('/metrics', async (_, res) => {
      try {
        res.set('Content-Type', this.register.contentType)
        res.send(await this.register.metrics())
      } catch (e) {
        res.status(500).send(e)
      }
    })
  }

  public get httpSink(): MetricSink<HTTPMetricData> {
    return this.http
  }

  public listen(port: number | string) {
    this.app.listen(port)
  }
}

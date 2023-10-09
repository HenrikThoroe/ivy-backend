/**
 * App in which collector of the metrics is running.
 */
export type App = 'evc' | 'games' | 'replays' | 'stats' | 'testing'

/**
 * HTTP method of a request.
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/**
 * Shared data collected for all metrics.
 */
export interface MetricData {
  /**
   * App in which collector of the metrics is running.
   */
  app: App
}

/**
 * Data collected per HTTP request.
 */
export interface HTTPMetricData extends MetricData {
  /**
   * HTTP status code.
   */
  code: number

  /**
   * HTTP method.
   */
  method: HTTPMethod

  /**
   * Path of the request.
   *
   * This is the path without the query string
   * and without the base path. The base path may differ
   * based on the environment and the client location.
   *
   * To identify the base path, use the `app` label.
   */
  path: string

  /**
   * Duration of the request in seconds.
   *
   * This is the time between the request being received
   * and the response being sent.
   */
  duration: number

  /**
   * Size of the response in bytes.
   */
  size: number
}

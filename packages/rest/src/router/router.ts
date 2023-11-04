import { Route, RouteConfig, shared } from '@ivy-chess/api-schema'
import { AuthHandler } from 'auth'
import { Router as ExpressRouter, Request, Response } from 'express'
import { HTTPLogger, HTTPMethod } from 'metrics'
import stream from 'stream'
import * as z from 'zod'
import { Result, RouteImpl } from './types'

/**
 * Creates a successful result for the given value.
 *
 * @param value The value to return.
 * @param code The return code of the request. Defaults to 200.
 * @returns A successful result.
 */
function success<T>(value: T, code: number = 200): Result<true, T, never> {
  return { ok: true, code, value }
}

/**
 * Creates a failed result for the given error.
 *
 * @param error The error to return.
 * @param code The return code of the request. Defaults to 500.
 * @returns A failed result.
 */
function failure<T>(error: T, code: number = 500): Result<false, never, T> {
  return { ok: false, code, error }
}

/**
 * Creates a new router for the given schema and implementation.
 *
 * Each endpoint in the schema is mapped to a handler in the implementation.
 * The handler is called with the checked and valid input of the request.
 * The handler can then call the `success` or `failure` functions to return a response.
 * The input of the handler is checked and valid, so the handler can be sure that the input is correct.
 * The types of the arguments are defined by the schema.
 *
 * @example
 * ```ts
 * const myRouter = router(mySchema, {
 *   foo: async ({ body, query, params, auth }, success, failure) => {
 *     const data = doSomething(body, query, params)
 *
 *     if (data.flag) {
 *       return success(data)
 *     }
 *
 *     return failure({ message: 'Something went wrong' }, 404)
 *   }
 * })
 *
 * const app = express()
 * myRouter.mount(app)
 * app.listen(3000)
 * ```
 *
 * @param schema The schema to create a router for.
 * @param impl The implementation of the schema.
 * @returns A new router.
 */
export function router<T extends RouteConfig>(schema: Route<T>, impl: RouteImpl<T>) {
  return new Router(schema, impl)
}

/**
 * A router which attaches handlers to a schema and
 * mounts them to an express router.
 *
 * Use the `router` function to create a new router.
 *
 * @param T The type of the route schema.
 * @param Impl The type of the route implementation.
 */
export class Router<T extends RouteConfig, Impl extends RouteImpl<T>> {
  private readonly impl: Impl
  private readonly router: ExpressRouter
  private readonly schema: Route<T>
  private authHandler?: AuthHandler
  private logger?: HTTPLogger

  constructor(schema: Route<T>, impl: Impl) {
    this.schema = schema
    this.impl = impl
    this.router = ExpressRouter()
    this.mountEndpoints()
  }

  //* API

  /**
   * Attaches the router to an express router.
   *
   * @param router The express router to attach to.
   * @param logger A logger instance which will receive data for each request.
   * @param auth An auth handler to verify authentication.
   * @returns The express router.
   */
  public mount(router: ExpressRouter, logger?: HTTPLogger, auth?: AuthHandler) {
    this.logger = logger
    this.authHandler = auth
    return router.use(this.schema.path, this.router)
  }

  //* Private Methods

  private mountEndpoints() {
    for (const key in this.impl) {
      const handler = this.impl[key]
      const endpoint = this.schema.get(key)
      const expressHandler = this.buildExpressHandler(endpoint, handler)
      const pathHandler = this.buildPathHandler(expressHandler)

      switch (endpoint.method) {
        case 'GET':
          this.router.get(endpoint.path, pathHandler)
          break
        case 'POST':
          this.router.post(endpoint.path, pathHandler)
          break
        case 'PUT':
          this.router.put(endpoint.path, pathHandler)
          break
        case 'DELETE':
          this.router.delete(endpoint.path, pathHandler)
          break
      }
    }
  }

  private buildPathHandler(handler: (req: Request, res: Response) => Promise<void>) {
    return async (req: Request, res: Response) => {
      const start = performance.now()

      try {
        await handler(req, res)
      } catch (e) {
        let message: string
        if (e instanceof z.ZodError) {
          message = e.message
        } else if (e instanceof Error) {
          message = e.message
        } else {
          message = 'Unknown Server Error'
        }

        res.status(500).json({ message })
        this.logger?.error({
          path: req.path,
          method: req.method as HTTPMethod,
          error: message,
        })
      } finally {
        const end = performance.now()
        const duration = (end - start) / 1000
        const size = res.get('Content-Length')

        this.logger?.info({
          code: res.statusCode,
          method: req.method as HTTPMethod,
          size: size ? parseInt(size) : 0,
          duration,
          path: req.path,
        })
      }
    }
  }

  private buildExpressHandler(
    endpoint: T[Extract<keyof T, string>],
    handler: Impl[Extract<keyof Impl, string>],
  ) {
    return async (req: Request, res: Response) => {
      const { query: q, body: b, params: p, files: f } = req

      const parseFiles = () => {
        const files: Record<string, Buffer> = {}

        if (!f) {
          return files
        }

        for (const key of Object.keys(f)) {
          const file = f[key]

          if (Array.isArray(file) && file.length === 1) {
            files[key] = file[0].data
          } else if (!Array.isArray(file)) {
            files[key] = file.data
          }
        }

        return files
      }

      let user: string | undefined
      let session: string | undefined
      let token: string | undefined

      if (endpoint.authenticated) {
        if (!this.authHandler) {
          res.status(500).json({ message: 'Failed to validate request authentication.' })
          return
        }

        const auth = await this.authHandler.isAuthenticated(req)

        if (auth.success) {
          user = auth.user
          session = auth.session
          token = auth.token

          const authorized = await this.authHandler.isAuthorized(user, endpoint)

          if (!authorized) {
            res.status(403).json({
              message: `No authorization to access '${req.method.toUpperCase()} ${req.baseUrl}${
                req.path
              }'`,
            })
            return
          }
        } else {
          const { code, message } = auth
          const payload = endpoint.validateFailure({ message })

          res.status(code).json(payload)

          return
        }
      }

      const query = endpoint.validateQuery(q)
      const body = endpoint.validateBody(b)
      const params = endpoint.validateParams(p)
      const files = endpoint.validateFiles(parseFiles())
      const auth = endpoint.authenticated
        ? { user: user!, session: session!, token: token! }
        : undefined
      const result = await handler({ query, body, params, files, auth }, success, failure)

      if (result.ok) {
        const { code, value } = result
        const payload = endpoint.validateSuccess(value)
        const download = shared.generic.downloadSchema.safeParse(payload)

        if (download.success) {
          const readStream = new stream.PassThrough()
          readStream.end(download.data.data)
          res.set('Content-disposition', 'attachment;filename=' + download.data.name)
          res.set('Content-Type', 'data/octet-stream')
          readStream.pipe(res)
        } else {
          res.status(code).json(payload)
        }
      } else {
        const { code, error } = result
        const payload = endpoint.validateFailure(error)
        res.status(code).json(payload)
      }
    }
  }
}

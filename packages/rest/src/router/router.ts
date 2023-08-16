import { RouteConfig, Route } from '@ivy-chess/api-schema'
import { Result, RouteImpl } from './types'
import { Router as ExpressRouter, Request, Response } from 'express'
import * as z from 'zod'

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
 *   foo: async ({ body, query, params }, success, failure) => {
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
   * @returns The express router.
   */
  public mount(router: ExpressRouter) {
    return router.use(this.schema.path, this.router)
  }

  //* Private Methods

  private mountEndpoints() {
    for (const key in this.impl) {
      const handler = this.impl[key]
      const endpoint = this.schema.get(key)
      const expressHandler = this.buildExpressHandler(endpoint, handler)
      const errorHandler = this.buildErrorHandler(expressHandler)

      switch (endpoint.method) {
        case 'GET':
          this.router.get(endpoint.path, errorHandler(expressHandler))
          break
        case 'POST':
          this.router.post(endpoint.path, errorHandler(expressHandler))
          break
        case 'PUT':
          this.router.put(endpoint.path, errorHandler(expressHandler))
          break
        case 'DELETE':
          this.router.delete(endpoint.path, errorHandler(expressHandler))
          break
      }
    }
  }

  private buildErrorHandler(handler: (req: Request, res: Response) => Promise<void>) {
    return (handler: (req: Request, res: Response) => Promise<void>) => {
      return async (req: Request, res: Response) => {
        try {
          await handler(req, res)
        } catch (e) {
          if (e instanceof z.ZodError) {
            res.status(500).json({ message: e.message })
          } else if (e instanceof Error) {
            res.status(500).json({ message: e.message })
          } else {
            res.status(500).json({ message: 'Unknown Server Error' })
          }
        }
      }
    }
  }

  private buildExpressHandler(
    endpoint: T[Extract<keyof T, string>],
    handler: Impl[Extract<keyof Impl, string>]
  ) {
    return async (req: Request, res: Response) => {
      const { query: q, body: b, params: p } = req
      const query = endpoint.validateQuery(q)
      const body = endpoint.validateBody(b)
      const params = endpoint.validateParams(p)

      const result = await handler({ query, body, params }, success, failure)

      if (result.ok) {
        const { code, value } = result
        const payload = endpoint.validateSuccess(value)
        res.status(code).json(payload)
      } else {
        const { code, error } = result
        const payload = endpoint.validateFailure(error)
        res.status(code).json(payload)
      }
    }
  }
}

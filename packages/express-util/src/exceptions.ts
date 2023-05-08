import { Handler, Request, Response } from 'express'
import { ValidationError } from 'runtypes'

interface AsyncHandler {
  (req: Request, resp: Response, next?: Handler): Promise<void>
}

export function exceptionWrapper(handler: AsyncHandler): Handler {
  return async (req, resp, next) => {
    try {
      await handler(req, resp, next)
    } catch (e) {
      if (e instanceof ValidationError) {
        resp.status(500).json({
          code: e.code,
          message: e.message,
        })
      } else {
        resp.status(500).json({ reason: 'Failed to process request.' })
      }
    }
  }
}

import { Endpoint, RouteConfig } from '@ivy-chess/api-schema'
import * as z from 'zod'

/**
 * The data of an authenticated request if authentication is enabled.
 * Otherwise `undefined`.
 */
type AuthData<A extends boolean> = A extends true ? { session: string; user: string } : undefined

/**
 * The result of a successful request.
 * The return value of the handler is stored as `value`.
 */
interface SuccessResult<T> {
  /**
   * Whether the request was successful.
   */
  ok: true

  /**
   * The return code of the request.
   */
  code: number

  /**
   * The return value of the handler.
   */
  value: T
}

/**
 * The result of a failed request.
 */
interface FailureResult<E> {
  /**
   * Whether the request was successful.
   */
  ok: false

  /**
   * The return code of the request.
   */
  code: number

  /**
   * The error value of the handler.
   */
  error: E
}

/**
 * The result of a request.
 * Either a `SuccessResult` or a `FailureResult`.
 * The `OK` type parameter determines which one.
 *
 * @param OK Whether the request was successful.
 * @param T The return value of the handler.
 * @param E The error value of the handler.
 */
export type Result<OK extends boolean, T, E> = OK extends true ? SuccessResult<T> : FailureResult<E>

/**
 * A function to call if the request was successful.
 *
 * @param value The return value of the handler.
 * @param code The return code of the request.
 * @returns A `Result` with `OK` set to `true`.
 */
export type SuccessHandler<Success> = (
  value: Success,
  code?: number,
) => Result<true, Success, never>

/**
 * A function to call if the request failed.
 *
 * @param value The error value of the handler.
 * @param code The return code of the request.
 * @returns A `Result` with `OK` set to `false`.
 */
export type FailureHandler<Failure> = (
  error: Failure,
  code?: number,
) => Result<false, never, Failure>

/**
 * A generic handler for an endpoint.
 * Defines the call signature of handlers that take the checked and valid input of a request.
 */
interface GenericHandler<
  Query extends z.ZodType,
  Body extends z.ZodType,
  Params extends z.ZodType,
  Files extends string,
  Success extends z.ZodType,
  Failure extends z.ZodType,
  Auth extends boolean,
> {
  /**
   * The call signature of the handler.
   *
   * @param args The checked and valid input of the request.
   * @param success A function to call if the request was successful.
   * @param failure A function to call if the request failed.
   * @returns A promise that resolves to the result of the request.
   */
  (
    args: {
      query: z.infer<Query>
      body: z.infer<Body>
      params: z.infer<Params>
      files: Record<Files, Buffer>
      auth: AuthData<Auth>
    },
    success: SuccessHandler<z.infer<Success>>,
    failure: FailureHandler<z.infer<Failure>>,
  ): Promise<Result<boolean, z.infer<Success>, z.infer<Failure>>>
}

/**
 * The call signature of a handler for a specific endpoint.
 *
 * @param args The checked and valid input of the request.
 * @param success A function to call if the request was successful.
 * @param failure A function to call if the request failed.
 * @returns A promise that resolves to the result of the request.
 */
export type Handler<EP> = EP extends Endpoint<
  infer Query,
  infer Body,
  infer Params,
  infer Files,
  infer Success,
  infer Auth,
  infer Failure
>
  ? GenericHandler<Query, Body, Params, Files, Success, Failure, Auth>
  : never

/**
 * The implementation of a route schema.
 * Maps the keys of the route schema to handlers for the corresponding endpoints.
 */
export type RouteImpl<T extends RouteConfig> = {
  [key in keyof T]: Handler<T[key]>
}

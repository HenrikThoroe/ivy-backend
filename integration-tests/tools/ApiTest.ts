import { Endpoint, Route, RouteConfig, api } from '@ivy-chess/api-schema'
import request from 'supertest'
import { z } from 'zod'

type Params<T> = T extends Endpoint<any, any, infer P, any, any, any> ? z.infer<P> : never

type Query<T> = T extends Endpoint<infer Q, any, any, any, any, any> ? z.infer<Q> : never

type Body<T> = T extends Endpoint<any, infer B, any, any, any, any> ? z.infer<B> : never

type Success<T> = T extends Endpoint<any, any, any, any, infer S, any> ? z.infer<S> : never

type Config<T extends Route<any>> = T extends Route<infer C> ? C : never

type AuthConf = Config<typeof api.auth.authenticationRoute>

type GameConf = Config<typeof api.games.http.gamesRoute>

/**
 * A wrapper around supertest's `Test` class
 * that provides a more type-safe API using the
 * `api-schema` package.
 *
 * Use the static factory methods to create a new
 * instance of this class.
 */
export class ApiTest<T extends RouteConfig, K extends keyof T> {
  private readonly test: request.Test

  private readonly endpoint: T[K]

  private constructor(test: request.Test, endpoint: T[K]) {
    this.test = test
    this.endpoint = endpoint
  }

  //* API

  //? Factories

  /**
   * Creates an API test for an endpoint of the
   * authentication service.
   *
   * @param ep The key of the endpoint to test.
   * @param params The parameters to use in the URL.
   * @returns A new {@link ApiTest}.
   */
  public static auth<K extends keyof AuthConf>(ep: K, params?: Params<AuthConf[K]>) {
    const route = api.auth.authenticationRoute
    const url = ApiTest.buildUrl(process.env.AUTH_PORT, route, ep, params)
    return new ApiTest<AuthConf, K>(ApiTest.base(url, route, ep), route.get(ep))
  }

  /**
   * Creates an API test for an endpoint of the
   * game management service.
   *
   * @param ep The key of the endpoint to test.
   * @param params The parameters to use in the URL.
   * @returns A new {@link ApiTest}.
   */
  public static game<K extends keyof GameConf>(ep: K, params?: Params<GameConf[K]>) {
    const route = api.games.http.gamesRoute
    const url = ApiTest.buildUrl(process.env.GM_PORT, route, ep, params)
    return new ApiTest<GameConf, K>(ApiTest.base(url, route, ep), route.get(ep))
  }

  //? Modifier

  /**
   * Expects the response to have a status code of 200
   * and validates the response body against the success
   * schema of the endpoint.
   *
   * @returns The validated response body.
   */
  public async success(): Promise<Success<T[K]>> {
    const res = await this.test.expect(200)
    let val: Success<T[K]> | undefined

    expect(() => {
      val = this.endpoint.validateSuccess(res.body)
    }).not.toThrow()

    expect(val).toBeDefined()

    return val!
  }

  /**
   * Returns the raw test object.
   * Await this method to get the response.
   *
   * @returns The raw test object.
   */
  public fetch(): request.Test {
    return this.test
  }

  /**
   * Sets the query parameters of the request.
   *
   * @param query The query parameters.
   * @returns A new {@link ApiTest}.
   */
  public query(query: Query<T[K]>) {
    return new ApiTest<T, K>(this.test.query(query), this.endpoint)
  }

  /**
   * Sets the authorization header of the request.
   *
   * @param token The token to use.
   * @returns A new {@link ApiTest}.
   */
  public token(token: string) {
    return new ApiTest<T, K>(this.test.set('Authorization', `Bearer ${token}`), this.endpoint)
  }

  /**
   * Sets the body of the request.
   * Accepts any value.
   *
   * @param data The data to send.
   * @returns A new {@link ApiTest}.
   */
  public rawData(data: any) {
    return new ApiTest<T, K>(this.test.send(data), this.endpoint)
  }

  /**
   * Sets the body of the request.
   * Accepts only values that conform to the schema
   * defined for the endpoint.
   *
   * @param data The data to send.
   * @returns A new {@link ApiTest}.
   */
  public data(data: Body<T[K]>) {
    return new ApiTest<T, K>(this.test.send(data), this.endpoint)
  }

  //* Private Methods

  private static buildUrl<T extends RouteConfig, K extends keyof T>(
    port: string | number,
    schema: Route<T>,
    ep: K,
    params?: Params<T[K]>,
  ) {
    let url = `http://localhost:${port}${schema.path}${schema.get(ep).path}`

    if (url.endsWith('/')) {
      return url.slice(0, -1)
    }

    for (const key in params) {
      url = url.replace(`:${key}`, params[key])
    }

    return url
  }

  private static base<T extends RouteConfig, K extends keyof T>(
    url: string,
    schema: Route<T>,
    ep: K,
  ) {
    switch (schema.get(ep).method) {
      case 'GET':
        return request(url).get('/')
      case 'POST':
        return request(url).post('/')
      case 'PUT':
        return request(url).put('/')
      case 'DELETE':
        return request(url).delete('/')
      default:
        throw new Error('Unknown method.')
    }
  }
}

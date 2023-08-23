import { Endpoint } from './endpoint'

/**
 * A `RouteConfig` is a map of `Endpoint`s
 * used to define a {@link Route}.
 */
export interface RouteConfig {
  [key: string]: Endpoint<any, any, any, any, any>
}

/**
 * Creates a new route.
 *
 * @example
 * ```ts
 * export const fooRoute = route('/foo', {
 *   bar: endpoint('bar', 'GET').success(z.string()),
 *   baz: endpoint('baz', 'POST').body(z.string()).success(z.string()),
 * })
 *
 * // Endpoint with types as defined in the schema
 * const foo = fooRoute.get('bar')
 * ```
 *
 * @see {@link Endpoint}
 * @param path The path of the route.
 * @param children The endpoints of the route.
 * @returns A new route.
 */
export function route<T extends RouteConfig>(path: string, children: T): Route<T> {
  return new Route(path, children)
}

/**
 * A `Route` is a collection of `Endpoint`s
 * which share a common path prefix.
 */
export class Route<T extends RouteConfig> {
  /**
   * The path of the route.
   */
  public readonly path: string

  private readonly children: T

  constructor(name: string, children: T) {
    this.path = name
    this.children = children
  }

  /**
   * Gets an endpoint by name.
   *
   * @param key The name of the endpoint. Has to be a key of the route config.
   * @returns The endpoint.
   */
  public get<K extends keyof T>(key: K): T[K] {
    return this.children[key]
  }

  /**
   * Gets all endpoint names.
   */
  public get keys(): (keyof T)[] {
    return Object.keys(this.children) as (keyof T)[]
  }
}

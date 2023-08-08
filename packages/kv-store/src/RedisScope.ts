import { loadenv } from 'env-util'
import { RedisClientType, SetOptions, createClient } from 'redis'
import { RedisSet } from './RedisSet'
import { RedisBitfield } from './RedisBitfield'

loadenv()

const client: RedisClientType = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
})

export interface SaveOptions {
  expiration?: number
  keepTTL?: boolean
}

export class RedisScope {
  private scope: string[]

  constructor(...scope: string[]) {
    this.scope = scope
  }

  private async isReady() {
    if (!client.isReady) {
      await client.connect()
    }
  }

  private build(key: string) {
    const scope = this.scope.join(':')

    if (scope.length > 0) {
      return `${scope}:${key}`
    }

    return key
  }

  public sub(scope: string) {
    return new RedisScope(...this.scope, scope)
  }

  public up() {
    if (this.scope.length === 0) {
      throw new Error('Cannot go up from root scope.')
    }

    return new RedisScope(...this.scope.slice(0, -1))
  }

  public async save<T>(key: string, value: T, options?: SaveOptions) {
    await this.isReady()

    const opts: SetOptions = {}

    if (options?.expiration !== undefined) {
      opts.EX = options.expiration
    } else if (options?.keepTTL ?? true) {
      opts.KEEPTTL = true
    }

    await client.set(this.build(key), JSON.stringify(value), opts)
  }

  public async fetch<T>(key: string) {
    await this.isReady()

    const value = await client.get(this.build(key))

    if (!value) {
      throw new Error(`Key ${key} does not exist.`)
    }

    return JSON.parse(value) as T
  }

  public async delete(key: string) {
    await this.isReady()
    await client.del(this.build(key))
  }

  public async list() {
    await this.isReady()

    const keys = await client.keys(this.build('*'))
    const inScope = keys.map((key) => key.split(':')[this.scope.length])

    return Array.from(new Set(inScope))
  }

  public async clear() {
    await this.isReady()

    const keys = await client.keys(this.build('*'))
    const tasks = keys.map((key) => client.del(key))

    await Promise.all(tasks)
  }

  public async has(key: string) {
    await this.isReady()
    return client.exists(this.build(key))
  }

  public async asSet(key: string) {
    await this.isReady()
    return new RedisSet(client, this.build(key))
  }

  public async asBitfield(key: string) {
    await this.isReady()
    return new RedisBitfield(client, this.build(key))
  }
}

export const redis = new RedisScope()

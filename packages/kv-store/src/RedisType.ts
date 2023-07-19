import { RedisClientType } from 'redis'

export abstract class RedisType {
  protected client: RedisClientType

  protected key: string

  constructor(client: RedisClientType, key: string) {
    this.client = client
    this.key = key
  }
}

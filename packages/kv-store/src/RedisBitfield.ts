import { RedisType } from './RedisType'

export class RedisBitfield extends RedisType {
  private static readonly encoding = 'i64' as const

  public async set(offset: number, value: number) {
    await this.client.bitField(this.key, [
      {
        operation: 'SET',
        encoding: RedisBitfield.encoding,
        offset: `#${offset}`,
        value,
      },
    ])
  }

  public async get(offset: number) {
    const res = await this.client.bitField(this.key, [
      {
        operation: 'GET',
        encoding: RedisBitfield.encoding,
        offset: `#${offset}`,
      },
    ])

    return res[0]
  }

  public async increment(offset: number, increment: number) {
    await this.client.bitField(this.key, [
      {
        operation: 'INCRBY',
        encoding: RedisBitfield.encoding,
        offset: `#${offset}`,
        increment,
      },
    ])
  }
}

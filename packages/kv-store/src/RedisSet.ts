import { RedisType } from './RedisType'

export class RedisSet extends RedisType {
  public async add(...values: string[]) {
    for (const value of values) {
      await this.client.sAdd(this.key, value)
    }
  }

  public async remove(...values: string[]) {
    for (const value of values) {
      await this.client.sRem(this.key, value)
    }
  }

  public async has(value: string) {
    return await this.client.sIsMember(this.key, value)
  }

  public async size() {
    return await this.client.sCard(this.key)
  }

  public async intersect(other: RedisSet) {
    return await this.client.sInter([this.key, other.key])
  }

  public async values() {
    return await this.client.sMembers(this.key)
  }
}

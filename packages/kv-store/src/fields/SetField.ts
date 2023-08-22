import { Field, MemoryField, RedisField } from './Field'

/**
 * A multi-value field that stores a set of strings.
 */
export interface SetField extends Field {
  /**
   * Reads the set of values.
   */
  read(): Promise<Set<string> | undefined>

  /**
   * Writes a set of values.
   * Will overwrite any existing values.
   *
   * @param value The set of values to write.
   */
  write(value: Set<string>): Promise<void>

  /**
   * Adds a value to the set.
   * If the value already exists, it will be ignored.
   *
   * @param value The value to add.
   */
  add(value: string): Promise<void>

  /**
   * Removes a value from the set.
   * If the value does not exist, it will be ignored.
   *
   * @param value The value to remove.
   */
  remove(value: string): Promise<void>

  /**
   * Checks if a value exists in the set.
   *
   * @param value The value to check.
   */
  has(value: string): Promise<boolean>

  /**
   * Gets the number of values in the set.
   */
  size(): Promise<number>

  /**
   * Gets the intersection of this set with another set.
   *
   * @param other The other set to intersect with.
   */
  intersect(other: SetField): Promise<Set<string>>
}

/**
 * A field that stores a set of strings in memory.
 */
export class MemSetField extends MemoryField<Set<string>> implements SetField {
  public async read(): Promise<Set<string> | undefined> {
    if (this.value) {
      return new Set(this.value)
    }

    return undefined
  }

  public async write(value: Set<string>): Promise<void> {
    if (!value) {
      this.value = undefined
    } else {
      this.value = new Set(value)
    }
  }

  public async add(value: string): Promise<void> {
    this.value?.add(value)
  }

  public async remove(value: string): Promise<void> {
    this.value?.delete(value)
  }

  public async has(value: string): Promise<boolean> {
    return this.value?.has(value) ?? false
  }

  public async size(): Promise<number> {
    return this.value?.size ?? 0
  }

  public async intersect(other: SetField): Promise<Set<string>> {
    const result = new Set<string>()

    for (const value of this.value ?? []) {
      if (await other.has(value)) {
        result.add(value)
      }
    }

    return result
  }
}

/**
 * A field that stores a set of strings in Redis.
 */
export class RedisSetField extends RedisField implements SetField {
  public async read(): Promise<Set<string> | undefined> {
    const client = await this.client()
    const values = await client.sMembers(this.key)

    if (values.length === 0) {
      return undefined
    }

    return new Set(values)
  }

  public async write(value: Set<string>): Promise<void> {
    const client = await this.client()

    await this.erase()

    for (const item of value) {
      await this.add(item)
    }
  }

  public async add(value: string): Promise<void> {
    const client = await this.client()
    await client.sAdd(this.key, value)
  }

  public async remove(value: string): Promise<void> {
    const client = await this.client()
    await client.sRem(this.key, value)
  }

  public async has(value: string): Promise<boolean> {
    const client = await this.client()
    return await client.sIsMember(this.key, value)
  }

  public async size(): Promise<number> {
    const client = await this.client()
    return await client.sCard(this.key)
  }

  public async intersect(other: SetField): Promise<Set<string>> {
    const client = await this.client()
    const result = await client.sInter([this.key, other.key])

    return new Set(result)
  }
}

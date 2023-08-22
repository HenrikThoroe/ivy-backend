import { SetOptions } from 'redis'
import { SaveOptions } from '../RedisScope'
import { safeClient } from '../redis/client'

/**
 * Options when writing to any field
 * for the first time.
 */
export interface FieldSaveOptions {
  /**
   * The number of seconds until the field expires.
   * Aftwerwards, the field will be erased.
   *
   * Only usable with Redis fields.
   */
  expiration: number
}

/**
 * A field is a wrapper around a key in a store
 * that points to a value.
 *
 * Fields can be persisted using Redis or
 * stored ephemerally in memory.
 */
export abstract class Field {
  /**
   * The key of the field.
   * This key denotes the path to the field
   * in the store.
   */
  public readonly key: string

  constructor(key: string) {
    this.key = key
  }

  /**
   * Checks if the field contains an underlying value.
   */
  public abstract exists(): Promise<boolean>

  /**
   * Erases the underlying value.
   */
  public abstract erase(): Promise<void>
}

/**
 * A field that is persisted in Redis.
 */
export abstract class RedisField extends Field {
  public async exists(): Promise<boolean> {
    const client = await this.client()
    const exists = await client.exists(this.key)

    return exists > 0
  }

  public async erase(): Promise<void> {
    const client = await this.client()
    await client.del(this.key)
  }

  /**
   * Creates a Redis client that is already connected.
   *
   * @returns A connected Redis client.
   */
  protected async client() {
    return await safeClient()
  }

  /**
   * Creates the options for a Redis SET command.
   * If expiration is not provided, the TTL
   * will be kept.
   *
   * @param opts The options to use when saving.
   * @returns The options for a Redis SET command.
   */
  protected createSetOptions(opts?: Partial<SaveOptions>): SetOptions {
    const ttl = opts?.expiration
    const keepTTL = opts?.expiration ? undefined : (true as const)
    const res: SetOptions = {}

    if (ttl !== undefined) {
      res.EX = ttl
    } else if (keepTTL !== undefined) {
      res.KEEPTTL = keepTTL
    }

    return res
  }
}

/**
 * A field that is persisted in memory.
 */
export abstract class MemoryField<T> extends Field {
  private static readonly memory: Record<string, any> = {}

  /**
   * All keys that are currently stored in memory.
   */
  public static get keys(): string[] {
    return Object.keys(MemoryField.memory).filter((key) => MemoryField.memory[key] !== undefined)
  }

  public async exists(): Promise<boolean> {
    return this.value !== undefined
  }

  public async erase(): Promise<void> {
    this.value = undefined
  }

  /**
   * The value of the field.
   */
  protected get value(): T | undefined {
    return MemoryField.memory[this.key]
  }

  /**
   * Sets the value of the field.
   */
  protected set value(value: T | undefined) {
    MemoryField.memory[this.key] = value
  }
}

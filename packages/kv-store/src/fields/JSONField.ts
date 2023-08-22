import { z } from 'zod'
import { Field, FieldSaveOptions, MemoryField, RedisField } from './Field'

/**
 * A field that stores a JSON value,
 * which is validated against a Zod schema.
 */
export interface JSONField<T extends z.ZodType> extends Field {
  /**
   * Reads the value of the field.
   */
  read(): Promise<z.infer<T> | undefined>

  /**
   * Writes a value to the field.
   *
   * @param value The value to write.
   * @param options The options to use when saving.
   */
  write(value: z.infer<T>, options?: Partial<FieldSaveOptions>): Promise<void>

  /**
   * Updates the value if it exists, by calling the updater function.
   * The updater function receives the current value of the field,
   * and returns a partial value that will be merged with the current value.
   *
   * @param updater The function that updates the value.
   */
  update(updater: (val: z.infer<T>) => Partial<z.infer<T>>): Promise<void>
}

/**
 * A field that stores a JSON value in memory.
 * Does not perform any validation, as
 * the value is ephemeral.
 */
export class MemJSONField<T extends z.ZodType>
  extends MemoryField<z.infer<T>>
  implements JSONField<T>
{
  constructor(key: string, _: T) {
    super(key)
  }

  public async read() {
    return this.value
  }

  public async write(value: z.infer<T>) {
    this.value = value
  }

  public async update(updater: (val: z.infer<T>) => Partial<z.infer<T>>) {
    if (this.value) {
      this.write({ ...this.value, ...updater(this.value) })
    }
  }
}

/**
 * A field that stores a JSON value in Redis using
 * Redis strings.
 */
export class RedisJSONField<T extends z.ZodType> extends RedisField implements JSONField<T> {
  private readonly schema: T

  constructor(key: string, schema: T) {
    super(key)
    this.schema = schema
  }

  public async read() {
    const client = await this.client()
    const value = await client.get(this.key)

    if (value === null) {
      return undefined
    }

    return this.schema.parse(JSON.parse(value))
  }

  public async write(value: z.infer<T>, options?: Partial<FieldSaveOptions>) {
    const client = await this.client()
    const parsed = this.schema.parse(value)
    const serialized = JSON.stringify(parsed)

    await client.set(this.key, serialized, this.createSetOptions(options))
  }

  public async update(updater: (val: z.infer<T>) => Partial<z.infer<T>>) {
    const value = await this.read()

    if (value) {
      await this.write({ ...value, ...updater(value) })
    }
  }
}

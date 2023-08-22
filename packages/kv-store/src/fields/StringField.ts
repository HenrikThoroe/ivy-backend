import { Field, FieldSaveOptions, MemoryField, RedisField } from './Field'

/**
 * Basic field to store strings in a store.
 */
export interface StringField extends Field {
  /**
   * Reads the value of the field.
   */
  read(): Promise<string | undefined>

  /**
   * Writes a value to the field.
   * Will overwrite any existing value.
   *
   * @param value The value to write.
   * @param options The options to use when saving.
   */
  write(value: string, options?: Partial<FieldSaveOptions>): Promise<void>
}

/**
 * A field that stores a string in memory.
 * Will ignore any expiration options.
 */
export class MemStringField extends MemoryField<string> implements StringField {
  public async read() {
    return this.value
  }

  public async write(value: string) {
    this.value = value
  }
}

/**
 * A field that stores a string in Redis using
 * Redis strings.
 */
export class RedisStringField extends RedisField implements StringField {
  public async read() {
    const client = await this.client()
    const value = await client.get(this.key)

    if (value === null) {
      return undefined
    }

    return value
  }

  public async write(value: string, options?: Partial<FieldSaveOptions>) {
    const client = await this.client()
    await client.set(this.key, value, this.createSetOptions(options))
  }
}

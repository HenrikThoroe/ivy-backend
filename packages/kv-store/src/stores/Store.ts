import { z } from 'zod'
import {
  BitSetField,
  BitSetFieldConfig,
  MemBitSetField,
  RedisBitSetField,
} from '../fields/BitSetField'
import { MemoryField } from '../fields/Field'
import { JSONField, MemJSONField, RedisJSONField } from '../fields/JSONField'
import { MemSetField, RedisSetField, SetField } from '../fields/SetField'
import { MemStringField, RedisStringField, StringField } from '../fields/StringField'
import { safeClient } from '../redis/client'

/**
 * The type of persistence to use for a store.
 * Memory stores are ephemeral.
 */
export type Persistence = 'memory' | 'redis'

/**
 * The type of a field in a store.
 */
export type FieldType =
  | 'string'
  | 'set'
  | z.ZodType
  | DynamicStore<FieldType>
  | StaticStore<Schema>
  | BitSetFieldConfig

/**
 * The schema of a static store.
 */
export type Schema = {
  [key: string]: FieldType
}

/**
 * The value associated with a field type.
 */
export type Value<T extends FieldType> = T extends 'string'
  ? StringField
  : T extends z.ZodType
  ? JSONField<T>
  : T extends DynamicStore<infer U>
  ? DynamicStore<U>
  : T extends StaticStore<infer U>
  ? StaticStore<U>
  : T extends 'set'
  ? SetField
  : T extends BitSetFieldConfig
  ? BitSetField
  : never

/**
 * A store is an abstract layer above {@link Field}s.
 * It provides a way to group fields together and
 * to create nested stores.
 *
 * Stores can use different persistence mechanisms.
 */
export abstract class Store {
  private readonly name: string

  private readonly path: string[]

  private readonly persistence: Persistence

  constructor(name: string, persistence: Persistence, path: string[] = []) {
    this.name = name
    this.path = path
    this.persistence = persistence
  }

  //* API

  /**
   * Lists all keys in the store.
   * Ignores any keys that are nested in sub-stores.
   *
   * Field keys have commonly the format `group1:group2:...:name`.
   * From these keys only `name` would be returned.
   *
   * Keys that do not refer to a field directly but rather create
   * a scope for nested stores are returned as well.
   *
   * @returns A duplicate free list of keys in the store.
   */
  public async keys(): Promise<string[]> {
    if (this.persistence === 'redis') {
      const client = await safeClient()
      const keys = await client.keys(this.buildKey('*'))

      return this.keysInScope(keys)
    }

    return this.keysInScope(MemoryField.keys)
  }

  //* Shared Internal API

  protected readSet(name: string): SetField {
    if (this.persistence === 'redis') {
      return new RedisSetField(this.buildKey(name))
    }

    return new MemSetField(this.buildKey(name))
  }

  protected readString(name: string): StringField {
    if (this.persistence === 'redis') {
      return new RedisStringField(this.buildKey(name))
    }

    return new MemStringField(this.buildKey(name))
  }

  protected readJSON<T extends z.ZodType>(name: string, schema: T): JSONField<T> {
    if (this.persistence === 'redis') {
      return new RedisJSONField(this.buildKey(name), schema)
    }

    return new MemJSONField(this.buildKey(name), schema)
  }

  protected readBitSet(name: string, config: BitSetFieldConfig): BitSetField {
    if (this.persistence === 'redis') {
      return new RedisBitSetField(this.buildKey(name), config)
    }

    return new MemBitSetField(this.buildKey(name), config)
  }

  protected readDynamicStore<T extends FieldType>(name: string, fieldType: T): DynamicStore<T> {
    return new DynamicStore(name, fieldType, this.persistence, [...this.path, this.name])
  }

  protected readStaticStore<T extends Schema>(name: string, schema: T): StaticStore<T> {
    return new StaticStore(name, schema, this.persistence, [...this.path, this.name])
  }

  protected read<T extends FieldType>(name: string, type: T): Value<T> {
    if (type === 'string') {
      return this.readString(name) as Value<T>
    }

    if (type === 'set') {
      return this.readSet(name) as Value<T>
    }

    if (type instanceof BitSetFieldConfig) {
      return this.readBitSet(name, type) as Value<T>
    }

    if (type instanceof DynamicStore) {
      return this.readDynamicStore(name, type.type) as Value<T>
    }

    if (type instanceof StaticStore) {
      return this.readStaticStore(name, type.schema) as Value<T>
    }

    return this.readJSON(name, type) as Value<T>
  }

  //* Private Methods

  private buildKey(name: string) {
    return [...this.path, this.name, name].join(':')
  }

  private keysInScope(all: string[]) {
    const prefix = this.buildKey('')
    const inScope = all.filter((key) => key.startsWith(prefix))
    const withoutScope = inScope.map((key) => key.replace(prefix, ''))
    const withoutSubScope = withoutScope.map((key) => (key.includes(':') ? key.split(':')[0] : key))
    const withoutDuplicates = [...new Set(withoutSubScope)]

    return withoutDuplicates
  }
}

//* Concrete Stores

/**
 * A `DynamicStore` is a {@link Store} that contains
 * any key but restricts the values for each key to
 * a single type.
 *
 * All fields are therefore guranteed to be of the same type,
 * but there's no gurantee for the existence of any key.
 */
export class DynamicStore<T extends FieldType> extends Store {
  /**
   * The shared type of all fields in the store.
   */
  public readonly type: T

  constructor(name: string, type: T, persistence: Persistence = 'memory', path: string[] = []) {
    super(name, persistence, path)
    this.type = type
  }

  /**
   * Creates a new dynamic store that uses Redis as
   * persistence mechanism.
   *
   * @param name The name of the store.
   * @param type The type of the store fields.
   * @returns A new dynamic store.
   */
  public static redis<T extends FieldType>(name: string, type: T) {
    return new DynamicStore(name, type, 'redis')
  }

  /**
   * Returns the value for the given key.
   *
   * @param name The name of the field.
   * @returns The value of the field.
   */
  public take(name: string): Value<T> {
    return this.read(name, this.type)
  }
}

/**
 * A `StaticStore` is a {@link Store} that contains
 * a fixed set of keys where each key can have a
 * different type.
 */
export class StaticStore<S extends Schema> extends Store {
  /**
   * The schema of the store.
   */
  public readonly schema: S

  constructor(name: string, schema: S, persistence: Persistence = 'memory', path: string[] = []) {
    super(name, persistence, path)
    this.schema = schema
  }

  /**
   * Creates a new static store that uses Redis as
   * persistence mechanism.
   *
   * @param name The name of the store.
   * @param schema The schema of the store.
   * @returns A new static store.
   */
  public static redis<S extends Schema>(name: string, schema: S) {
    return new StaticStore(name, schema, 'redis')
  }

  /**
   * Returns the value for the given key.
   *
   * @param name The name of the field.
   * @returns The value of the field.
   */
  public take<K extends Extract<keyof S, string>>(name: K): Value<S[K]> {
    return this.read(name, this.schema[name])
  }
}

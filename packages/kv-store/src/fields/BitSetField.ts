import { Field, MemoryField, RedisField } from './Field'

type Length = 2 | 4 | 8 | 16 | 32 | 64

type Encoding = `i${Length}`

/**
 * The configuration for a {@link BitSetField}.
 */
export class BitSetFieldConfig {
  public length: Length

  constructor(length: Length) {
    this.length = length
  }
}

/**
 * A field that stores a set of bit strings.
 */
export interface BitSetField extends Field {
  /**
   * Reads the value at the given offset.
   *
   * @param offset The offset of the value.
   */
  read(offset: number): Promise<number | undefined>

  /**
   * Writes the given value at the given offset.
   * If the offset is larger than the current length
   * of the bit set, the bit set will be extended
   * with zeros.
   *
   * @param offset The offset of the value.
   * @param value The value to write.
   */
  write(offset: number, value: number): Promise<void>

  /**
   * Increments the value at the given offset by the
   * given value. If the offset is larger than the
   * current length of the bit set, the bit set will
   * be extended with zeros.
   *
   * If the value at the given offset did not yet exists,
   * it will be set to the given value.
   *
   * @param offset The offset of the value.
   * @param value The value to increment by.
   */
  increment(offset: number, value: number): Promise<number | undefined>

  /**
   * Returns the sum of all values in the given range.
   *
   * @param start The inclusive start of the range.
   * @param end The exclusive end of the range.
   */
  sum(start: number, end: number): Promise<number>
}

/**
 * A {@link BitSetField} that stores a set of bit strings in memory.
 */
export class MemBitSetField extends MemoryField<number[]> implements BitSetField {
  constructor(key: string, _: BitSetFieldConfig) {
    super(key)
  }

  public async read(offset: number): Promise<number | undefined> {
    if (!this.value || this.value.length <= offset) {
      return undefined
    }

    return this.value[offset]
  }

  public async write(offset: number, value: number): Promise<void> {
    if (!this.value) {
      this.value = Array.from({ length: offset + 1 }, () => 0)
    }

    if (this.value.length <= offset) {
      this.value = [
        ...this.value,
        ...Array.from({ length: offset - this.value.length + 1 }, () => 0),
      ]
    }

    this.value[offset] = value
  }

  public async increment(offset: number, value: number): Promise<number> {
    const current = await this.read(offset)
    const next = current ? current + value : value

    await this.write(offset, next)
    return next
  }

  public async sum(start: number, end: number): Promise<number> {
    if (start >= end || start < 0) {
      return 0
    }

    let sum = 0

    for (let i = start; i < end; i++) {
      const val = await this.read(i)
      sum += val ?? 0
    }

    return sum
  }
}

/**
 * A {@link BitSetField} that stores a set of bit strings in Redis.
 * Uses Redis native bit field operations.
 */
export class RedisBitSetField extends RedisField implements BitSetField {
  private readonly encoding: Encoding

  constructor(key: string, config: BitSetFieldConfig) {
    super(key)
    this.encoding = `i${config.length}`
  }

  public async read(offset: number): Promise<number | undefined> {
    const client = await this.client()
    const res = await client.bitField(this.key, [
      {
        operation: 'GET',
        encoding: this.encoding,
        offset: `#${offset}`,
      },
    ])

    if (res.length !== 1 || res[0] == null) {
      return undefined
    }

    return res[0]
  }

  public async write(offset: number, value: number): Promise<void> {
    const client = await this.client()
    await client.bitField(this.key, [
      {
        operation: 'SET',
        encoding: this.encoding,
        offset: `#${offset}`,
        value,
      },
    ])
  }

  public async increment(offset: number, value: number): Promise<number | undefined> {
    const client = await this.client()
    const res = await client.bitField(this.key, [
      {
        operation: 'INCRBY',
        encoding: this.encoding,
        offset: `#${offset}`,
        increment: value,
      },
    ])

    if (res.length !== 1 || res[0] == null) {
      return undefined
    }

    return res[0]
  }

  public async sum(start: number, end: number): Promise<number> {
    if (start >= end || start < 0) {
      return 0
    }

    let sum = 0

    for (let i = start; i < end; i++) {
      const val = await this.read(i)
      sum += val ?? 0
    }

    return sum
  }
}

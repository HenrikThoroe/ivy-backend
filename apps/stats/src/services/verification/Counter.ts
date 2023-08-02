import { RedisBitfield } from 'kv-store'

type Field = 'win' | 'draw' | 'defeat'

type FieldRecord<T> = Record<Field, T>

export class Counter {
  private readonly counter: RedisBitfield

  private readonly offsets: FieldRecord<number> = {
    win: 0,
    draw: 1,
    defeat: 2,
  }

  constructor(counter: RedisBitfield) {
    this.counter = counter
  }

  public async get(field: Field) {
    const val = await this.counter.get(this.offsets[field])
    return val ?? 0
  }

  public async increment(field: Field, increment: number) {
    await this.counter.increment(this.offsets[field], increment)
  }
}

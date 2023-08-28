import { z } from 'zod'
import { Sender } from './Sender'
import { Receiver } from './Receiver'

/**
 * ChannelSchema is a map of job names to zod schemas.
 */
export type ChannelSchema = {
  [key: string]: z.ZodType
}

type Cache<T extends ChannelSchema> = {
  sender?: Sender<T>
  receiver?: Receiver<T>
}

/**
 * Factory is used to create {@link Sender} and {@link Receiver} instances
 * for a given channel schema and name.
 */
export class Factory<T extends ChannelSchema> {
  private readonly schema: T
  private readonly id: string
  private cache: Cache<T>

  constructor(id: string, schema: T) {
    this.schema = schema
    this.id = id
    this.cache = {}
  }

  /**
   * Creates a {@link Sender} instance for the channel.
   * If a sender instance already exists, it is returned from cache.
   *
   * @returns A {@link Sender} instance.
   */
  public sender() {
    if (!this.cache.sender) {
      this.cache.sender = new Sender(this.schema, this.id)
    }

    return this.cache.sender!
  }

  /**
   * Creates a {@link Receiver} instance for the channel.
   * If a receiver instance already exists, it is returned from cache.
   *
   * @returns A {@link Receiver} instance.
   */
  public receiver() {
    if (!this.cache.receiver) {
      this.cache.receiver = new Receiver(this.schema, this.id)
    }

    return this.cache.receiver!
  }

  /**
   * Closes the underlying bullmq queue and worker.
   * If a sender or receiver instance exists, it is closed and removed from cache.
   */
  public async close() {
    if (this.cache.sender) {
      await this.cache.sender.close()
    }

    if (this.cache.receiver) {
      await this.cache.receiver.close()
    }

    this.cache = {}
  }
}

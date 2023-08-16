import { Queue } from 'bullmq'
import { z } from 'zod'
import { ChannelSchema } from './Factory'

/**
 * Sender is used to send messages through bullmq message queues.
 * A sender is always bound 1-1 with a {@link Queue} instance.
 */
export class Sender<T extends ChannelSchema> {
  private readonly schema: T
  private readonly queue: Queue

  constructor(schema: T, id: string) {
    this.send = this.send.bind(this)
    this.schema = schema
    this.queue = new Queue(id, {
      connection: {
        host: process.env.REDIS_HOST!,
        port: +process.env.REDIS_PORT!,
      },
    })
  }

  /**
   * Closes the underlying bullmq queue.
   */
  public async close() {
    await this.queue.close()
  }

  /**
   * Sends a message through the queue.
   * The message is validated against the schema before being sent.
   * If validation fails, the message is ignored.
   *
   * @param job The name of the job to send.
   * @param data The data to send.
   */
  public async send(job: Extract<keyof T, string>, data: z.infer<T[typeof job]>) {
    const validated = this.schema[job].safeParse(data)

    if (validated.success) {
      await this.queue.add(job, validated.data)
    }
  }
}

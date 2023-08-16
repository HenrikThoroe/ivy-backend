import { Worker, Job } from 'bullmq'
import { z } from 'zod'
import { ChannelSchema } from './Factory'

type Handler<T> = (data: T) => Promise<void>

type Handlers<T extends ChannelSchema> = Partial<
  Record<Extract<keyof T, string>, Handler<z.infer<T[keyof T]>>>
>

/**
 * Receiver is used to receive messages from bullmq {@link Worker}.
 * A receiver is always bound 1-1 with a {@link Worker} instance.
 */
export class Receiver<T extends ChannelSchema> {
  private readonly schema: T
  private readonly worker: Worker
  private readonly handlers: Handlers<T> = {}

  constructor(schema: T, id: string) {
    this.handle = this.handle.bind(this)
    this.schema = schema
    this.worker = new Worker(id, async (job) => await this.handle(job), {
      connection: {
        host: process.env.REDIS_HOST!,
        port: +process.env.REDIS_PORT!,
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    })
  }

  /**
   * Registers a handler for a job.
   * If a handler is already registered for the job, it is overwritten.
   * A handler is only called when the job data is valid.
   *
   * @param job The name of the job to register a handler for.
   * @param handler The handler to register.
   */
  public on<K extends keyof T>(job: Extract<K, string>, handler: Handler<z.infer<T[K]>>) {
    this.handlers[job] = handler
  }

  /**
   * Closes the underlying bullmq worker.
   */
  public async close() {
    await this.worker.close()
  }

  private async handle(job: Job) {
    if (!Object.keys(this.schema).includes(job.name)) {
      return
    }

    const key = job.name as Extract<keyof T, string>
    const validated = this.schema[key].safeParse(job.data)

    if (!validated.success) {
      return
    }

    const handler = this.handlers[key]

    if (handler) {
      await handler(validated.data)
    }
  }
}

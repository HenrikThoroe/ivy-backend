import { IOSchema, InSchema, OutSchema, api } from '@ivy-chess/api-schema'
import { WebSocket } from 'ws'
import { z } from 'zod'
import { Environment } from './Environment'
import { sleep } from './sleep'

const playerInterface = api.games.ws.playerInterface

type GMPlayerApi = WSApiTest<typeof playerInterface.input, typeof playerInterface.output>

/**
 * A wrapper around the `WebSocket` class
 * that provides a more type-safe API using the
 * `api-schema` package.
 *
 * Use the static factory methods to create a new
 * instance of this class.
 *
 * Allows for synchronizing WS based API calls and validating
 * responses.
 */
export class WSApiTest<I extends InSchema, O extends OutSchema> {
  private readonly socket: WebSocket

  private readonly schema: IOSchema<I, O>

  private messageHandler?: (data: string) => Promise<void>

  private readonly messageQueue: string[] = []

  constructor(socket: WebSocket, schema: IOSchema<I, O>) {
    this.socket = socket
    this.schema = schema

    this.socket.on('message', async (data) => {
      this.messageQueue.push(data.toString())
      this.checkForMessage()
    })

    Environment.addSocket(socket)
  }

  //* API

  /**
   * A factory method for creating a new {@link WSApiTest} for the game manager player API.
   *
   * @returns A new {@link WSApiTest}.
   */
  public static async gameManagerPlayer(): Promise<GMPlayerApi> {
    const socket = new WebSocket(`ws://localhost:${process.env.GM_WSS_PORT}`)
    const ws = new WSApiTest(socket, playerInterface)

    return new Promise((resolve) => {
      socket.once('open', () => {
        resolve(ws)
      })
    })
  }

  /**
   * Closes the socket and
   * asserts that all messages have been handled.
   */
  public exit() {
    expect(this.messageQueue).toHaveLength(0)
    this.socket.close()
  }

  /**
   * Asserts that the socket is connected.
   * Before checking the connection state,
   * the method will wait for the given timeout.
   *
   * @param timeout The timeout to wait for in milliseconds.
   * @returns Whether the socket is connected.
   */
  public async isConnected(timeout: number = 30) {
    await sleep(timeout)
    return this.socket.readyState === WebSocket.OPEN
  }

  /**
   * Sends a message to the server.
   * The message will be validated against the
   * input schema of the endpoint.
   *
   * @param _ The key of the endpoint to send the message to.
   * @param message The message to send.
   */
  public send<K extends keyof I>(_: K, message: z.infer<I[K]>) {
    this.socket.send(JSON.stringify(message))
  }

  /**
   * Expects a message from the server.
   *
   * When a message is expected, the next message received by the
   * socket, will be validated against the output schema of the
   * endpoint.
   *
   * If another message is already expecetd and not yet handled,
   * the test will fail.
   *
   * If there are already received messages, that have not yet been
   * handled, the first message in the buffer will be taken, validated
   * and then removed from the buffer.
   *
   * @param key The key of the expeceted message.
   * @returns A promise for the validated message when received.
   *          Will first resolve when the message is received and otherwise block when awaited.
   */
  public async expect<K extends Extract<keyof O, string>>(key: K) {
    expect(this.messageHandler).toBeUndefined()

    if (this.messageHandler) {
      throw new Error('Cannot expect message while another is being handled')
    }

    return new Promise<z.infer<O[K]>>((resolve) => {
      this.messageHandler = async (data) => {
        const schema = this.schema.output[key]
        const json = JSON.parse(data)
        const res = schema.safeParse(json)

        expect(res.success).toBe(true)

        if (!res.success) {
          throw new Error(`Received invalid message "${JSON.stringify(json)}" for key "${key}"`)
        }

        resolve(res.data)
      }

      this.checkForMessage()
    })
  }

  //* Private Methods

  private async checkForMessage() {
    if (this.messageQueue.length === 0 || !this.messageHandler) {
      return
    }

    await this.messageHandler(this.messageQueue.shift()!)
    this.messageHandler = undefined
  }
}

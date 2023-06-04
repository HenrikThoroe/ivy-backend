import WebSocket, { RawData } from 'ws'

type Event<T> = 'close' | 'data' | Acceptor<T>

type EventData<T extends Event<any>> = T extends 'close'
  ? void
  : T extends 'data'
  ? RawData
  : T extends Acceptor<infer U>
  ? U
  : never

interface Acceptor<T> {
  check(obj: any): T
}

interface Handler<T> {
  (data: T): Promise<void>
}

interface TypedHandler<T> {
  acceptor: Acceptor<T>
  handler: Handler<T>
}

export class WSClient<State> {
  private socket: WebSocket

  private disconnectHandler?: Handler<void>

  private dataHandler?: Handler<RawData>

  private typedDataHandlers: TypedHandler<any>[] = []

  public state: State

  constructor(socket: WebSocket, state: State) {
    this.socket = socket
    this.state = state

    this.socket.on('message', async (msg) => {
      if (this.dataHandler) {
        await this.dataHandler(msg)
      }

      if (this.typedDataHandlers.length > 0) {
        const json = JSON.parse(msg.toString())

        for (const { acceptor, handler } of this.typedDataHandlers) {
          try {
            const obj = acceptor.check(json)
            await handler(obj)
          } catch {
            continue
          }
        }
      }
    })

    this.socket.on('close', () => {
      if (this.disconnectHandler) {
        this.disconnectHandler()
      }
    })
  }

  public on<T, E extends Event<T>>(event: E, handler: Handler<EventData<E>>) {
    if (event === 'close') {
      this.disconnectHandler = handler as Handler<void>
    } else if (event === 'data') {
      this.dataHandler = handler as Handler<RawData>
    } else {
      this.typedDataHandlers.push({
        acceptor: event,
        handler: handler as Handler<any>,
      })
    }
  }

  public send<T>(data: T) {
    this.socket.send(JSON.stringify(data))
  }

  public close() {
    this.socket.close()
  }
}

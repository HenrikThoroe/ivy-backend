import { createServer } from 'http'
import WebSocket from 'ws'
import { WSClient } from './Client'

type Event = 'connection' | 'shutdown'

type Handler<Event, State> = Event extends 'connection'
  ? ConnectionHandler<State>
  : Event extends 'shutdown'
  ? ShutdownHandler
  : never

interface ConnectionHandler<State> {
  (client: WSClient<State>): Promise<void>
}

interface ShutdownHandler {
  (): Promise<void>
}

export class WSServer<State> {
  private http = createServer()
  private initState: () => State
  private onConnect?: ConnectionHandler<State>
  private onShutdown?: ShutdownHandler

  constructor(initState: () => State) {
    this.initState = initState
    const wss = new WebSocket.Server({ server: this.http })

    wss.on('connection', async (socket) => {
      if (!this.onConnect) {
        socket.close()
        return
      }

      const client = new WSClient(socket, this.initState())
      await this.onConnect(client)
    })

    wss.on('close', async () => {
      if (this.onShutdown) {
        await this.onShutdown()
      }
    })
  }

  public on<T extends Event>(event: T, handler: Handler<T, State>) {
    if (event === 'connection') {
      this.onConnect = handler as ConnectionHandler<State>
    }

    if (event === 'shutdown') {
      this.onShutdown = handler as ShutdownHandler
    }
  }

  public listen(port: number | string) {
    this.http.listen(port)
  }

  public close() {
    this.http.close()
  }
}

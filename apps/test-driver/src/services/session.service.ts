import {
  Game,
  Move,
  MoveInfo,
  Replay,
  ReplayLog,
  TestDriver,
  TestSuite,
  create,
  createReplay,
  encode,
  move,
  register,
} from '@ivy-chess/model'
import { v4 as uuidv4 } from 'uuid'
import { ClientState } from '../router/driver.routes'
import { CRUD, CRUDStore } from 'express-util'
import { WSClient } from 'wss'
import { Static } from 'runtypes'
import { GameDataBody, LogDataBody, MoveInfoBody } from '../controller/driver.types'
import { Queue } from 'bullmq'
import { parseFENMove } from '@ivy-chess/model/src/game/coding/fen_parsing'
import { queueName } from 'com'

const replayQueue = new Queue(queueName('replay', 'save'), {
  connection: {
    host: process.env.REDIS_HOST!,
    port: +process.env.REDIS_PORT!,
  },
})

const logQueue = new Queue(queueName('replay-log', 'save'), {
  connection: {
    host: process.env.REDIS_HOST!,
    port: +process.env.REDIS_PORT!,
  },
})

export class TestClient extends CRUD {
  public readonly ws: WSClient<ClientState>
  public readonly driver: TestDriver
  public static store = new CRUDStore<TestClient>()
  public session?: Session

  constructor(ws: WSClient<ClientState>, driver: TestDriver) {
    super(TestClient.store)
    this.ws = ws
    this.driver = driver
    this.save()
  }

  public get id() {
    return this.ws.state.id
  }
}

export class Session extends CRUD {
  private readonly _id: string
  private suite: TestSuite
  private remaining: number
  private driverCount: number

  public static store = new CRUDStore<Session>()

  constructor(suite: TestSuite, driverCount: number) {
    super(Session.store)
    this._id = uuidv4()
    this.suite = suite
    this.remaining = suite.iterations
    this.driverCount = driverCount
    this.save()
  }

  //* API

  public start() {
    const clients = this.selectDrivers(this.driverCount, this.driverCount)
    clients.forEach((c) => this.requestGame(c))
  }

  public remove(client: TestClient) {
    client.session = undefined

    if (this.remaining > 0) {
      const min = this.driverCount === 1 ? 1 : 0

      try {
        this.selectDrivers(1, min).forEach((c) => this.requestGame(c))
      } catch {
        return true
      }

      return this.driverCount === 0
    }

    return true
  }

  public report(
    client: TestClient,
    games: Static<typeof GameDataBody>[],
    logs: Static<typeof LogDataBody>[]
  ) {
    this.remaining -= games.length

    for (const [index, game] of games.entries()) {
      const logData: Static<typeof LogDataBody> = index < logs.length ? logs[index] : [[], []]

      try {
        const [replay, log] = this.validateGame(client.driver, game, logData)

        replayQueue.add('save', replay)
        logQueue.add('save', log)
      } catch (err) {
        continue
      }
    }

    if (this.remaining <= 0) {
      client.session = undefined
      return true
    } else {
      this.requestGame(client)
    }

    return false
  }

  public get id() {
    return this._id
  }

  public toJSON() {
    return {
      id: this.id,
      suite: this.suite,
      remaining: this.remaining,
    }
  }

  //* Private

  private validateGame(
    driver: TestDriver,
    data: Static<typeof GameDataBody>,
    logs: Static<typeof LogDataBody>
  ): [Replay, ReplayLog] {
    const game = create({
      timeback: 0,
      timeout: Infinity,
    })

    register(game, 'white')
    register(game, 'black')

    const whiteIndex = this.getWhiteIndex(game, data)
    const blackIndex = (whiteIndex + 1) % 2
    const moveInfo = this.applyMoves(game, data)

    const isActive = game.state !== 'expired'
    const hasNoWinner = game.winner === undefined || game.reason === undefined
    const hasInvalidReason = game.reason === 'time' || game.reason === 'resignation'

    if (isActive || hasNoWinner || hasInvalidReason) {
      throw new Error(`Invalid game data. Game did not end in expired state.`)
    }

    const replay = createReplay({
      driver,
      engines: {
        white: this.suite.engines[whiteIndex],
        black: this.suite.engines[blackIndex],
      },
      result: {
        winner: game.winner!,
        reason: game.reason! as any,
      },
      history: moveInfo,
    })

    const log = {
      replay: replay.id,
      white: {
        messages: logs[whiteIndex],
      },
      black: {
        messages: logs[blackIndex],
      },
    }

    return [replay, log]
  }

  private getWhiteIndex(game: Game, data: Static<typeof GameDataBody>) {
    if (data[1].length > 0) {
      const move = parseFENMove(data[1][0].move)

      if (move !== 'nullmove') {
        const idx = move[0]
        const pos = game.board.positions[idx]

        if (pos.piece?.color === 'white') {
          return 1
        }
      }
    }

    return 0
  }

  private applyMoves(game: Game, data: Static<typeof GameDataBody>): MoveInfo[] {
    let colorIdx = this.getWhiteIndex(game, data)
    const numMoves = data[0].length + data[1].length
    const res: MoveInfo[] = []

    for (let i = 0; i < numMoves; i++) {
      const mv = data[colorIdx][Math.floor(i / 2)]

      if (mv) {
        move(game, mv.move)
        res.push(this.parseMoveInfo(game, mv, game.history[game.history.length - 1]))
      } else {
        throw new Error(
          `Invalid game data. Missing move for color ${colorIdx === 0 ? 'white' : 'black'}`
        )
      }

      if (game.state === 'expired') {
        break
      }

      colorIdx = ++colorIdx % 2
    }

    return res
  }

  private parseMoveInfo(game: Game, info: Static<typeof MoveInfoBody>, move: Move): MoveInfo {
    if (info === undefined) {
      console.log(info, move)
    }

    return {
      move,
      fen: encode(game.board),
      details: {
        depth: info.depth,
        selDepth: info.selDepth,
        time: info.time,
        nodes: info.nodes,
        pv: info.pv,
        multiPv: info.multiPv,
        score: info.score,
        currentMove: info.currentMove,
        currentMoveNumber: info.currentMoveNumber,
        hashFull: info.hashFull,
        nps: info.nps,
        tbHits: info.tbhits,
        sbhits: info.sbhits,
        cpuLoad: info.cpuload,
        string: info.string,
        refutation: info.refutation,
        currline: info.currline,
      },
    }
  }

  private requestGame(client: TestClient) {
    const batch = Math.min(100, Math.ceil(this.suite.iterations / (10 * this.driverCount)))

    client.ws.send({
      key: 'start',
      session: this.id,
      suite: this.suite,
      recommendedBatchSize: batch,
    })
  }

  private selectDrivers(count: number, min: number = 1): TestClient[] {
    const clients: TestClient[] = []

    for (const client of TestClient.store.list()) {
      if (client.session === undefined) {
        client.session = this
        clients.push(client)
      }

      if (clients.length === count) {
        break
      }
    }

    if (clients.length < min) {
      clients.forEach((c) => (c.session = undefined))
      throw new Error(
        `Not enough drivers available. Requested ${count}, available ${clients.length}`
      )
    }

    return clients
  }
}

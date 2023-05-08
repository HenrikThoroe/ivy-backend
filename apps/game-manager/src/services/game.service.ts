import { Color, create, Game, GameConfig, move, register, resign } from 'model'
import { createClient } from 'redis'

const client = createClient()
const scope = 'game'

async function save(game: Game, expiration?: number) {
  const json = JSON.stringify(game)
  const buffer = Buffer.from(json)
  const encoded = buffer.toString('base64')

  await client.set(
    `${scope}:${game.id}`,
    encoded,
    expiration ? { EX: expiration } : { KEEPTTL: true }
  )
}

export function getPlayerColor(game: Game, player: string): Color {
  if (game.players.black === player) {
    return 'black'
  }

  if (game.players.white === player) {
    return 'white'
  }

  throw Error(`Player with id ${player} is not part of the given game.`)
}

export function getOpponent(game: Game, player: string) {
  if (game.players.black === player) {
    return game.players.white
  }

  if (game.players.white === player) {
    return game.players.black
  }

  throw Error(`Player with id ${player} is not part of the given game.`)
}

export async function createGame(config: GameConfig) {
  if (!client.isReady) {
    await client.connect()
  }

  const game = create(config)
  const offset = 60 * 60 * 24
  const expiration = (config.timeout / 1000) * 6 + offset

  await save(game, expiration)

  return game
}

export async function performMove(gameId: string, player: string, mv: string) {
  if (!client.isReady) {
    await client.connect()
  }

  const gameData = await client.get(`${scope}:${gameId}`)

  if (!gameData) {
    throw Error(`Could not find game id.`)
  }

  const game: Game = JSON.parse(Buffer.from(gameData, 'base64').toString('utf-8'))

  if (game.players[game.board.next] !== player) {
    throw Error(`Player with id ${player} is not eligable to move for ${game.board.next}`)
  }

  move(game, mv)

  game.lastRequest = Date.now()

  await save(game)

  return game
}

export async function registerPlayer(gameId: string, color?: Color) {
  if (!client.isReady) {
    await client.connect()
  }

  const gameData = await client.get(`${scope}:${gameId}`)

  if (!gameData) {
    throw Error(`Could not find game id.`)
  }

  const game: Game = JSON.parse(Buffer.from(gameData, 'base64').toString('utf-8'))
  const id = register(game, color)

  await save(game)
  return { id, game }
}

export async function retrieveGame(id: string) {
  if (!client.isReady) {
    await client.connect()
  }

  const gameData = await client.get(`${scope}:${id}`)

  if (!gameData) {
    throw Error(`Could not find game id.`)
  }

  return JSON.parse(Buffer.from(gameData, 'base64').toString('utf-8'))
}

export async function resignGame(gameId: string, player: string) {
  const game = await retrieveGame(gameId)
  const color = getPlayerColor(game, player)
  resign(game, color)
  await save(game)
  return game
}

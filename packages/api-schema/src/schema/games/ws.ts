import { z } from 'zod'
import { colorSchema, gameStateSchema } from '../../shared/game'
import { io } from '../../types/io'

/**
 * Schema of the game web socket interface.
 */
export const gameInterface = io(
  {
    state: z.object({
      command: z.literal('game-state'),
      game: z.string().nonempty(),
      player: z.string().nonempty(),
    }),
    register: z.object({
      command: z.literal('register'),
      game: z.string().nonempty(),
      color: colorSchema.optional(),
    }),
    checkIn: z.object({
      command: z.literal('check-in'),
      game: z.string().nonempty(),
      player: z.string().nonempty(),
    }),
    move: z.object({
      command: z.literal('move'),
      game: z.string().nonempty(),
      player: z.string().nonempty(),
      move: z.string().nonempty(),
    }),
    resign: z.object({
      command: z.literal('resign'),
      game: z.string().nonempty(),
      player: z.string().nonempty(),
    }),
    ping: z.object({
      command: z.literal('ping'),
    }),
  },
  {
    pong: z.object({
      key: z.literal('pong'),
    }),
    state: z.object({
      key: z.literal('game-state'),
      playerColor: colorSchema,
      moves: z.array(z.string().nonempty()),
      state: gameStateSchema,
      time: z.object({
        white: z.number(),
        black: z.number(),
      }),
      winner: colorSchema.or(z.literal('draw')).optional(),
      reason: z.string().optional(),
    }),
    playerInfo: z.object({
      key: z.literal('player-info'),
      game: z.string().nonempty(),
      player: z.string().nonempty(),
      color: colorSchema,
    }),
    moveRequest: z.object({
      key: z.literal('move-request'),
      playerColor: colorSchema,
      moves: z.array(z.string().nonempty()),
      time: z.object({
        white: z.number(),
        black: z.number(),
      }),
    }),
    error: z.object({
      key: z.literal('error'),
      message: z.string(),
    }),
  },
)

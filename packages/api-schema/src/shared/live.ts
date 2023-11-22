import { LiveGame, LiveGameEvent, Player } from '@ivy-chess/model'
import { z } from 'zod'
import { colorSchema, gameSchema } from './game'
import { uciLogSchema } from './replay'

/**
 * Schema for {@link LiveGameEvent}.
 */
export const liveGameEventSchema = z.object({
  type: z.enum(['connect', 'disconnect', 'message', 'create']),
  message: z.string(),
  timestamp: z.number().positive(),
}) satisfies z.ZodType<LiveGameEvent>

/**
 * Schema for {@link Player}.
 */
export const liveGamePlayerSchema = z.object({
  id: z.string().uuid(),
  connected: z.boolean(),
  type: z.enum(['human', 'engine']),
  color: colorSchema,
  logs: uciLogSchema.optional(),
  time: z.number().int().positive().optional(),
}) satisfies z.ZodSchema<Player>

/**
 * Schema for {@link LiveGame}.
 */
export const liveGameSchema = z.object({
  game: gameSchema,
  id: z.string().uuid(),
  events: z.array(liveGameEventSchema),
  isActive: z.boolean(),
  players: z.object({
    white: liveGamePlayerSchema,
    black: liveGamePlayerSchema,
  }),
}) satisfies z.ZodSchema<LiveGame>

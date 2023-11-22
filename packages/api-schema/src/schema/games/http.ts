import { z } from 'zod'
import { liveGameSchema } from '../../shared/live'
import { contributorRoles, visitorRoles } from '../../shared/user'
import { endpoint } from '../../types/endpoint'
import { route } from '../../types/route'

/**
 * Schema for creating a new player.
 */
export const playerCreateSchema = z.object({
  type: z.enum(['human', 'engine']),
  time: z.number().int().positive().optional(),
})

/**
 * Schema for creating a new game.
 */
export const createSchema = z.object({
  time: z.number().int().positive().optional(),
  timeback: z.number().int().positive().optional(),
  players: z.object({
    white: playerCreateSchema,
    black: playerCreateSchema,
  }),
})

/**
 * Schema for the game management API.
 */
export const gamesRoute = route('/games', {
  create: endpoint('/', 'POST')
    .access(...contributorRoles)
    .body(createSchema)
    .success(liveGameSchema),
  list: endpoint('/', 'GET')
    .access(...visitorRoles)
    .success(z.array(z.string())),
  get: endpoint('/:id', 'GET')
    .access(...visitorRoles)
    .params(z.object({ id: z.string() }))
    .success(liveGameSchema),
})

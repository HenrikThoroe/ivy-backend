import { z } from 'zod'
import { replayLogSchema, replaySchema, replayStatsSchema } from '../../shared/replay'
import { visitorRoles } from '../../shared/user'
import { endpoint } from '../../types/endpoint'
import { route } from '../../types/route'

/**
 * Schema for filter options.
 * Filter options are passed to the `all` endpoint as query
 * and are used to filter result of replays.
 */
export const filterOptionsSchema = z.object({
  engine: z.string().optional(),
  winner: z.enum(['white', 'black', 'draw']).optional(),
  date: z.coerce.date().optional(),
  since: z.coerce.date().optional(),
  age: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
})

/**
 * Schema for the replay API.
 */
export const replayRoute = route('/replays', {
  all: endpoint('/', 'GET')
    .access(...visitorRoles)
    .query(filterOptionsSchema)
    .success(z.array(z.string())),
  get: endpoint('/:id', 'GET')
    .access(...visitorRoles)
    .params(z.object({ id: z.string() }))
    .success(replaySchema),
  analysis: endpoint('/:id/analysis', 'GET')
    .access(...visitorRoles)
    .params(z.object({ id: z.string() }))
    .success(replayStatsSchema),
  logs: endpoint('/:id/logs', 'GET')
    .access(...visitorRoles)
    .params(z.object({ id: z.string() }))
    .success(replayLogSchema),
})

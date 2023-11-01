import { z } from 'zod'
import { withIdSchema } from '../../shared/generic'
import { contributorRoles } from '../../shared/user'
import { endpoint } from '../../types/endpoint'
import { route } from '../../types/route'

/**
 * Schema for game creation options.
 */
export const createSchema = z.object({
  timeback: z.number().int().nonnegative(),
  timeout: z
    .number()
    .int()
    .min(100)
    .max(24 * 60 * 60 * 1000),
})

/**
 * Schema for the game management API.
 */
export const gamesRoute = route('/games', {
  create: endpoint('/', 'POST')
    .access(...contributorRoles)
    .body(createSchema)
    .success(withIdSchema),
})

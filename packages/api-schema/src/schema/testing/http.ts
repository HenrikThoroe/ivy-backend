import { z } from 'zod'
import { withIdSchema } from '../../shared/generic'
import { testDriverSchema } from '../../shared/replay'
import { suiteSchema } from '../../shared/test'
import { contributorRoles, visitorRoles } from '../../shared/user'
import { endpoint } from '../../types/endpoint'
import { route } from '../../types/route'

/**
 * Schema for test sesisons.
 */
export const testSessionSchema = z.object({
  id: z.string().uuid(),
  suite: suiteSchema,
  remaining: z.number().int().nonnegative(),
})

/**
 * Schema for driver API of the testing service.
 */
export const driverRoute = route('/drivers', {
  all: endpoint('/', 'GET')
    .access(...visitorRoles)
    .success(z.array(testDriverSchema)),
  get: endpoint('/:id', 'GET')
    .access(...visitorRoles)
    .params(z.object({ id: z.string().nonempty() }))
    .success(testDriverSchema),
})

/**
 * Schema for sessions API of the testing service.
 */
export const sessionsRoute = route('/sessions', {
  all: endpoint('/', 'GET')
    .access(...visitorRoles)
    .success(z.array(testSessionSchema)),
  create: endpoint('/', 'POST')
    .access(...contributorRoles)
    .body(z.object({ suite: z.string().nonempty(), driver: z.number().int().positive() }))
    .success(testSessionSchema),
  get: endpoint('/:id', 'GET')
    .access(...visitorRoles)
    .params(withIdSchema)
    .success(testSessionSchema),
  delete: endpoint('/:id', 'DELETE')
    .access(...contributorRoles)
    .params(withIdSchema)
    .success(withIdSchema),
})

/**
 * Schema for test suites API of the testing service.
 */
export const testSuitesRoute = route('/suites', {
  all: endpoint('/', 'GET')
    .access(...visitorRoles)
    .success(z.array(z.string().uuid())),
  create: endpoint('/', 'POST')
    .access(...contributorRoles)
    .body(suiteSchema.omit({ id: true }))
    .success(withIdSchema),
  get: endpoint('/:id', 'GET')
    .access(...visitorRoles)
    .params(withIdSchema)
    .success(suiteSchema),
  delete: endpoint('/:id', 'DELETE')
    .access(...contributorRoles)
    .params(withIdSchema)
    .success(withIdSchema),
})

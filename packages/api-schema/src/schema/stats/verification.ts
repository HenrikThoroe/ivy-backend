import { z } from 'zod'
import { engineTestConfigSchema } from '../../shared/engine'
import { withIdSchema } from '../../shared/generic'
import {
  verificationGroupSchema,
  verificationGroupStateSchema,
  verificationGroupWithoutIdSchema,
  verificationResultSchema,
} from '../../shared/stats'
import { contributorRoles, visitorRoles } from '../../shared/user'
import { endpoint } from '../../types/endpoint'
import { route } from '../../types/route'

/**
 * Schema for stats verification groups API.
 */
export const verificationRoute = route('/verification', {
  create: endpoint('/groups', 'POST')
    .access(...contributorRoles)
    .body(verificationGroupWithoutIdSchema)
    .success(verificationGroupSchema),
  all: endpoint('/groups', 'GET')
    .access(...visitorRoles)
    .success(z.array(verificationGroupSchema)),
  get: endpoint('/groups/:id', 'GET')
    .access(...visitorRoles)
    .params(withIdSchema)
    .success(verificationGroupSchema),
  delete: endpoint('/groups/:id', 'DELETE')
    .access(...contributorRoles)
    .params(withIdSchema)
    .success(withIdSchema),
  state: endpoint('/groups/:id/state', 'GET')
    .access(...visitorRoles)
    .params(withIdSchema)
    .success(verificationGroupStateSchema),
  result: endpoint('/groups/:id/result', 'GET')
    .access(...visitorRoles)
    .params(withIdSchema)
    .success(verificationResultSchema),
  addNode: endpoint('/groups/:id/nodes', 'POST')
    .access(...contributorRoles)
    .params(withIdSchema)
    .body(z.object({ node: engineTestConfigSchema }))
    .success(verificationGroupSchema),
  removeNode: endpoint('/groups/:id/nodes/:node', 'DELETE')
    .access(...contributorRoles)
    .params(withIdSchema)
    .body(z.object({ node: engineTestConfigSchema }))
    .success(verificationGroupSchema),
})

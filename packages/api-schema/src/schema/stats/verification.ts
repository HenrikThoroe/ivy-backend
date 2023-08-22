import { z } from 'zod'
import { engineTestConfigSchema } from '../../shared/engine'
import { withIdSchema } from '../../shared/generic'
import {
  verificationGroupSchema,
  verificationGroupStateSchema,
  verificationGroupWithoutIdSchema,
  verificationResultSchema,
} from '../../shared/stats'
import { endpoint } from '../../types/endpoint'
import { route } from '../../types/route'

/**
 * Schema for stats verification groups API.
 */
export const verificationRoute = route('/verification', {
  create: endpoint('groups', 'POST')
    .body(verificationGroupWithoutIdSchema)
    .success(verificationGroupSchema),
  all: endpoint('groups', 'GET').success(z.array(verificationGroupSchema)),
  get: endpoint('groups/:id', 'GET').params(withIdSchema).success(verificationGroupSchema),
  delete: endpoint('groups/:id', 'DELETE').params(withIdSchema).success(withIdSchema),
  state: endpoint('groups/:id/state', 'GET')
    .params(withIdSchema)
    .success(verificationGroupStateSchema),
  result: endpoint('groups/:id/result', 'GET')
    .params(withIdSchema)
    .success(verificationResultSchema),
  addNode: endpoint('groups/:id/nodes', 'POST')
    .params(withIdSchema)
    .body(z.object({ node: engineTestConfigSchema }))
    .success(verificationGroupSchema),
  removeNode: endpoint('groups/:id/nodes/:node', 'DELETE')
    .params(withIdSchema)
    .body(z.object({ node: engineTestConfigSchema }))
    .success(verificationGroupSchema),
})

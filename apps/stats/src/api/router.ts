import { api } from '@ivy-chess/api-schema'
import { router } from 'rest'
import { VerificationManager } from '../service/VerificationManager'
import { requestReplays } from './messages'

const manager = new VerificationManager()

/**
 * The router for the verification service.
 */
export const verificationRouter = router(api.stats.verification.verificationRoute, {
  all: async ({}, success, _) => {
    const verifications = await manager.all()
    return success(verifications.map((v) => v.group))
  },

  create: async ({ body }, success, _) => {
    const verification = await manager.create(body)
    await requestReplays(verification.group)
    return success(verification.group)
  },

  delete: async ({ params: { id } }, success, _) => {
    const verification = await manager.verify(id)
    await verification.erase()
    return success({ id })
  },

  get: async ({ params: { id } }, success, _) => {
    const verification = await manager.verify(id)
    await requestReplays(verification.group)
    return success(verification.group)
  },

  state: async ({ params: { id } }, success, _) => {
    const verification = await manager.verify(id)
    await requestReplays(verification.group)
    return success(await verification.state())
  },

  result: async ({ params: { id } }, success, failure) => {
    const verification = await manager.verify(id)
    const result = await verification.result()

    await requestReplays(verification.group)

    if (!result) {
      return failure({ message: 'Verification is not complete.' })
    }

    return success(result)
  },

  addNode: async ({ params: { id }, body }, success, _) => {
    const verification = await manager.verify(id)

    await verification.add(body.node)
    await requestReplays(verification.group)
    return success(verification.group)
  },

  removeNode: async ({ params: { id }, body }, success, _) => {
    const verification = await manager.verify(id)
    await verification.remove(body.node)
    return success(verification.group)
  },
})

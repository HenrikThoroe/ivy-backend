import { api } from '@ivy-chess/api-schema'
import { router } from 'rest'
import { EngineStore } from '../service/EngineStore'

/**
 * Router for the engine version control API.
 */
export const engineRouter = router(api.evc.engineVersioningRoute, {
  all: async ({}, success, _) => {
    const ids = await EngineStore.all()
    const configs = await Promise.all(ids.map((id) => new EngineStore(id).config()))

    return success(configs)
  },

  get: async ({ params: { id } }, success, _) => {
    const store = new EngineStore(id)
    const config = await store.config()

    return success(config)
  },

  create: async ({ body, files }, success, _) => {
    const store = new EngineStore(body.name)

    await store.init()
    await store.add(
      { capabilities: body.capabilities, os: body.os, arch: body.arch },
      body.version,
      files.engine,
    )

    return success(await store.config())
  },

  delete: async ({ params: { id, engine } }, success, _) => {
    const store = new EngineStore(engine)
    const config = await store.remove(id)

    if (config.variations.length === 0) {
      await store.delete()
    }

    return success({ success: true })
  },

  getVersion: async ({ params: { name, version } }, success, failure) => {
    const store = new EngineStore(name)

    try {
      return success(await store.variation(version))
    } catch (e) {
      if (e instanceof Error) {
        return failure({ message: e.message }, 404)
      }

      throw e
    }
  },

  download: async ({ params: { engine, id } }, success, _) => {
    const store = new EngineStore(engine)
    return success({
      name: engine,
      data: await store.binary(id),
    })
  },
})

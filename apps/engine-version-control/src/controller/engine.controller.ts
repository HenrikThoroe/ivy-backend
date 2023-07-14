import { Request, Response } from 'express'
import { compareVersions, decodeVersion } from '@ivy-chess/model'
import { pipe } from '../services/storage.service'
import {
  addFlavour,
  removeInstance,
  retrieveAllConfigs,
  retrieveConfig,
} from '../services/versioning.service'
import { CreateBody, VersionFetchBody } from './engine.types'

export async function handleFetchAll(request: Request, response: Response) {
  const configs = await retrieveAllConfigs()

  response.json(configs)
}

export async function handleFetchConfig(request: Request, response: Response) {
  const id = request.params.id

  try {
    const config = await retrieveConfig(id)

    response.json(config)
  } catch {
    response.status(404).send('Requested engine is not available.')
  }
}

export async function handleCreate(request: Request, response: Response) {
  const body = CreateBody.check(request.body)

  if (!request.files) {
    response.status(400).json('Please provide an engine binary attached as an file upload.')
    return
  }

  const fileKey = 'engine'
  const upload = request.files[fileKey]
  let data: Buffer

  if (Array.isArray(upload) && upload.length !== 1) {
    response.status(400).json('Please provide exacly one file to be stored as the engine.')
    return
  }

  if (Array.isArray(upload)) {
    data = upload[0].data
  } else {
    data = upload.data
  }

  const flavour = {
    os: body.os,
    arch: body.arch,
    capabilities: body.capabilities?.split(',').map((c) => c.trim().toLowerCase()) ?? [],
  }

  const version = decodeVersion(body.version)
  await addFlavour(body.name, version, flavour, data)

  response.send()
}

export async function handleFetchVersion(request: Request, response: Response) {
  const body = VersionFetchBody.check(request.params)
  const config = await retrieveConfig(body.name)
  const version = decodeVersion(body.version)
  const variation = config.variations.find((v) => compareVersions(v.version, version))

  response.json(variation)
}

export async function handleDownload(request: Request, response: Response) {
  const id = request.params.id
  const engine = request.params.engine

  await pipe(engine, id, response)
}

export async function handleDelete(request: Request, response: Response) {
  const id = request.params.id
  const engine = request.params.engine
  const removedEngine = await removeInstance(engine, id)

  response.json({
    removedEngine,
  })
}

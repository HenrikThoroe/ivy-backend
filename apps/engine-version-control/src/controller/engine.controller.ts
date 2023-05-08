import { Request, Response } from 'express'
import { EngineConfig, encodeVersion, getVersionPath } from 'model'
import { pipe } from '../services/storage.service'
import { pushVersion, retrieveAllConfigs, retrieveConfig } from '../services/versioning.service'
import { CreateBody, DownloadBody } from './engine.types'

function stripEngineConfig(config: EngineConfig) {
  return {
    name: config.name,
    versions: config.versions.map((v) => ({
      id: encodeVersion(v, false),
      path: getVersionPath(v, config.name),
    })),
  }
}

export async function handleFetchAll(request: Request, response: Response) {
  const configs = await retrieveAllConfigs()
  const body = configs.map(stripEngineConfig)

  response.json(body)
}

export async function handleFetchConfig(request: Request, response: Response) {
  const id = request.params.id

  try {
    const config = await retrieveConfig(id)

    response.json(stripEngineConfig(config))
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

  await pushVersion(body.name, body.increment, data)
  response.send()
}

export async function handleFetchVersion(request: Request, response: Response) {
  const body = DownloadBody.check(request.params)
  let key = body.version

  if (body.version === 'latest') {
    const config = await retrieveConfig(body.name)

    if (config.versions.length === 0) {
      response.status(404).send('The requested engine has no uploaded versions yet.')
      return
    }

    const latest = config.versions[config.versions.length - 1]

    key = encodeVersion(latest)
  }

  await pipe(body.name, key, response)
}

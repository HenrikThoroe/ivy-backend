import { Request, Response } from 'express'
import { CreateBody } from './suite.types'
import { v4 as uuid } from 'uuid'
import { TestSuite } from 'model'
import { redis } from 'kv-store'

const scope = redis.sub('test').sub('suite')

export async function handleSuitCreation(req: Request, res: Response) {
  const body = CreateBody.check(req.body)
  const id = uuid()
  const suite: TestSuite = {
    id,
    ...body,
  }

  await scope.save(id, suite)
  res.json({ id })
}

export async function handleSuitDeletion(req: Request, res: Response) {
  const id = req.params.id

  try {
    await scope.delete(id)
    res.json({ id })
  } catch {
    res.status(404).json({ reason: `Test suit with id ${id} does not exist.` })
  }
}

export async function handleSuitFetch(req: Request, res: Response) {
  const id = req.params.id
  const suite: TestSuite = await scope.fetch(id)

  if (!suite) {
    res.status(404).json({ reason: `Test suit with id ${id} does not exist.` })
    return
  }

  res.json(suite)
}

export async function handleSuitList(req: Request, res: Response) {
  const suites = await scope.list()
  res.json(suites)
}

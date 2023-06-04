import { Request, Response } from 'express'
import { CreateBody } from './session.types'
import { redis } from 'kv-store'
import { TestSuite } from 'model'
import { Session } from '../services/session.service'

const suiteScope = redis.sub('test').sub('suite')

export async function handleSessionCreate(req: Request, resp: Response) {
  const body = CreateBody.check(req.body)
  const suite: TestSuite = await suiteScope.fetch(body.suite)
  const session = new Session(suite, body.driver)

  try {
    session.start()
  } catch (e) {
    session.delete()

    console.error(e)

    if (e instanceof Error) {
      resp.status(400).json({ reason: e.message })
    } else {
      resp.status(400).json({ reason: 'Failed to start session.' })
    }

    return
  }

  resp.json(session.toJSON())
}

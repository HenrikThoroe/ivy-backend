import { Request, Response } from 'express'
import { createGame } from '../services/game.service'
import { CreateBody } from './management.types'

export async function handleGameCreation(request: Request, response: Response) {
  const data = CreateBody.check(request.body)
  const game = await createGame({ timeout: data.timeout })

  response.json({ id: game.id })
}

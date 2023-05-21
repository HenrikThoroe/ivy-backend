import { Router } from 'express'
import { exceptionWrapper } from 'express-util'
import { handleSessionCreate } from '../controller/session.controller'
import { Session } from '../services/session.service'

export const sessionRouter = Router()

sessionRouter.get('/', (_, res) => res.json(Session.store.list().map((s) => s.toJSON())))
sessionRouter.post('/', exceptionWrapper(handleSessionCreate))

sessionRouter.get('/:id', (req, res) => {
  const id = req.params.id
  const session = Session.store.fetch(id)

  if (session) {
    res.json(session.toJSON())
  } else {
    res.status(404).json({ reason: `Session with id ${id} does not exist.` })
  }
})

sessionRouter.delete('/:id', (req, res) => {
  const id = req.params.id
  const session = Session.store.fetch(id)

  if (session) {
    session.delete()
    res.json({ id })
  } else {
    res.status(404).json({ reason: `Session with id ${id} does not exist.` })
  }
})

import Router from 'express'
import {
  handleCreate,
  handleFetchAll,
  handleFetchConfig,
  handleFetchVersion,
} from '../controller/engine.controller'
import { exceptionWrapper } from 'express-util'

export const engineRouter = Router()

engineRouter.get('/', exceptionWrapper(handleFetchAll))
engineRouter.get('/:id', exceptionWrapper(handleFetchConfig))
engineRouter.get('/:name/:version', exceptionWrapper(handleFetchVersion))

engineRouter.post('/', exceptionWrapper(handleCreate))

import { Router } from 'express'
import { exceptionWrapper } from 'express-util'
import {
  handleGroupCreation,
  handleGroupFetch,
  handleGroupNodeAdd,
  handleGroupResultFetch,
  handleGroupStateFetch,
  handleGroupsFetch,
} from '../controller/api.controller'

export const verificationGroupRouter = Router()

verificationGroupRouter.get('/groups', exceptionWrapper(handleGroupsFetch))
verificationGroupRouter.post('/groups', exceptionWrapper(handleGroupCreation))
verificationGroupRouter.get('/groups/:id', exceptionWrapper(handleGroupFetch))
verificationGroupRouter.get('/groups/:id/state', exceptionWrapper(handleGroupStateFetch))
verificationGroupRouter.get('/groups/:id/result', exceptionWrapper(handleGroupResultFetch))
verificationGroupRouter.post('/groups/:id/nodes', exceptionWrapper(handleGroupNodeAdd))

import { Router } from 'express'
import { exceptionWrapper } from 'express-util'
import {
  handleGroupCreation,
  handleGroupDelete,
  handleGroupFetch,
  handleGroupNodeAdd,
  handleGroupNodeDelete,
  handleGroupResultFetch,
  handleGroupStateFetch,
  handleGroupsFetch,
} from '../controller/api.controller'

export const verificationGroupRouter = Router()

verificationGroupRouter.get('/groups', exceptionWrapper(handleGroupsFetch))
verificationGroupRouter.post('/groups', exceptionWrapper(handleGroupCreation))
verificationGroupRouter.get('/groups/:id', exceptionWrapper(handleGroupFetch))
verificationGroupRouter.delete('/groups/:id', exceptionWrapper(handleGroupDelete))
verificationGroupRouter.get('/groups/:id/state', exceptionWrapper(handleGroupStateFetch))
verificationGroupRouter.get('/groups/:id/result', exceptionWrapper(handleGroupResultFetch))
verificationGroupRouter.post('/groups/:id/nodes', exceptionWrapper(handleGroupNodeAdd))
verificationGroupRouter.delete('/groups/:id/nodes', exceptionWrapper(handleGroupNodeDelete))

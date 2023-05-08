import { Router } from 'express'
import { exceptionWrapper } from 'express-util'
import { handleGameCreation } from '../controller/management.controller'

export const managementRouter = Router()

managementRouter.post('/', exceptionWrapper(handleGameCreation))

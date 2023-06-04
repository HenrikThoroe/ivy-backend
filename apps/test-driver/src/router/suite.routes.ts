import { Router } from 'express'
import { exceptionWrapper } from 'express-util'
import {
  handleSuitCreation,
  handleSuitDeletion,
  handleSuitFetch,
  handleSuitList,
} from '../controller/suite.controller'

export const suiteRouter = Router()

suiteRouter.post('/', exceptionWrapper(handleSuitCreation))
suiteRouter.delete('/:id', exceptionWrapper(handleSuitDeletion))
suiteRouter.get('/:id', exceptionWrapper(handleSuitFetch))
suiteRouter.get('/', exceptionWrapper(handleSuitList))

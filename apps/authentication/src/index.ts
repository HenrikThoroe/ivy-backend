import { AuthFactory } from 'auth'
import cors from 'cors'
import { loadenv } from 'env-util'
import express from 'express'
import helmet from 'helmet'
import { HTTPLogger } from 'metrics'
import { authRouter } from './api/router'

loadenv()

const app = express()
const logger = new HTTPLogger('auth')
const factory = process.env.NODE_ENV === 'test' ? AuthFactory.local : AuthFactory.supabase
const { handler } = factory({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_KEY!,
  secret: process.env.JWT_SECRET!,
  issuer: process.env.JWT_ISSUER!,
})

app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
authRouter.mount(app, logger, handler)
app.listen(process.env.AUTH_PORT)

import { AuthFactory } from 'auth'
import cors from 'cors'
import { loadenv } from 'env-util'
import express from 'express'
import fileUpload from 'express-fileupload'
import helmet from 'helmet'
import { HTTPLogger } from 'metrics'
import { engineRouter } from './api/router'

loadenv()

const app = express()
const logger = new HTTPLogger('Engines')
const maxFileSize = 100 * 1024 * 1024

const { handler } = AuthFactory.supabase({
  url: process.env.SUPABASE_URL!,
  key: process.env.SUPABASE_KEY!,
  secret: process.env.JWT_SECRET!,
  issuer: process.env.JWT_ISSUER!,
})

const uploadConf = fileUpload({
  limits: {
    files: 1,
    fileSize: maxFileSize,
  },
})

app.use(helmet())
app.use(cors())
app.use(uploadConf)
engineRouter.mount(app, logger, handler)
app.listen(process.env.EVC_PORT)

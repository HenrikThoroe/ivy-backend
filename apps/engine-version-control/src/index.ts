import loadenv from './util/loadenv'

loadenv()

import express from 'express'
import { engineRouter } from './routes/engine.route'
import fileUpload from 'express-fileupload'
import helmet from 'helmet'

const app = express()
const maxFileSize = 100 * 1024 * 1024

app.use(helmet())
app.use(
  fileUpload({
    limits: {
      files: 1,
      fileSize: maxFileSize,
    },
  })
)

app.use('/engines', engineRouter)

app.listen(process.env.EVC_PORT)

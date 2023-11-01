import { decodeVersion } from '@ivy-chess/model'
import { z } from 'zod'
import { engineConfigSchema, engineNameSchema, engineVariationSchema } from '../../shared/engine'
import { downloadSchema } from '../../shared/generic'
import { endpoint } from '../../types/endpoint'
import { route } from '../../types/route'

const transformVersion = (arg: string, ctx: z.RefinementCtx) => {
  try {
    return decodeVersion(arg)
  } catch (e) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Version parameter is not a valid version.',
    })
    return z.NEVER
  }
}

export const createSchema = z.object({
  name: engineNameSchema,
  version: z.string().transform(transformVersion),
  os: z.string().nonempty(),
  arch: z.string().nonempty(),
  capabilities: z
    .string()
    .optional()
    .transform((arg) => (arg ? arg.split(',').map((c) => c.trim().toLowerCase()) : [])),
})

/**
 * Schema for the engine version control API.
 */
export const engineVersioningRoute = route('/engines', {
  all: endpoint('/', 'GET').unprotected().success(z.array(engineConfigSchema)),
  create: endpoint('/', 'POST').body(createSchema).files(['engine']).success(engineConfigSchema),
  get: endpoint('/:id', 'GET')
    .unprotected()
    .params(z.object({ id: z.string().nonempty() }))
    .success(engineConfigSchema),
  download: endpoint('/bin/:engine/:id', 'GET')
    .unprotected()
    .params(z.object({ engine: engineNameSchema, id: z.string().nonempty() }))
    .success(downloadSchema),
  delete: endpoint('/:engine/:id', 'DELETE')
    .params(
      z.object({
        engine: engineNameSchema,
        id: z.string().nonempty(),
      }),
    )
    .success(z.object({ success: z.boolean() })),
  getVersion: endpoint('/:name/:version', 'GET')
    .params(
      z.object({
        name: engineNameSchema,
        version: z.string().transform(transformVersion),
      }),
    )
    .success(engineVariationSchema),
})

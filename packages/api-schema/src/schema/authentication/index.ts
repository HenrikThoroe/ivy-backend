import { z } from 'zod'
import { userSchema, visitorRoles } from '../../shared/user'
import { endpoint } from '../../types/endpoint'
import { route } from '../../types/route'

/**
 * Schema for credentials sent back to the client.
 */
export const credentialsSchema = z.object({
  jwt: z.string().nonempty(),
  refreshToken: z.string().nonempty(),
})

/**
 * Schema for the authentication API.
 */
export const authenticationRoute = route('/auth', {
  signIn: endpoint('/signin', 'POST')
    .unprotected()
    .body(
      z.object({
        email: z.string().email(),
        password: z.string().nonempty(),
      }),
    )
    .success(credentialsSchema),
  signUp: endpoint('/signup', 'POST')
    .unprotected()
    .body(
      z.object({
        email: z.string().email(),
        username: z.string().nonempty(),
        password: z.string().nonempty(),
      }),
    )
    .success(
      z.object({
        credentials: credentialsSchema.optional(),
        user: userSchema,
      }),
    ),
  signOut: endpoint('/signout', 'POST')
    .access(...visitorRoles)
    .success(z.object({ success: z.boolean() })),
  refresh: endpoint('/refresh', 'POST')
    .access(...visitorRoles)
    .body(credentialsSchema.omit({ jwt: true }))
    .success(credentialsSchema),
  profile: endpoint('/profile', 'GET')
    .access(...visitorRoles)
    .success(userSchema),
})

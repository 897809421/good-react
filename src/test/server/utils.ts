import * as jose from 'jose'
import { omit } from 'lodash'
import { RestRequest, createResponseComposition, context } from 'msw'

import { JWT_SECRET } from '@/config'
import storage from '@/utils/storage'

import { db } from './db'

const isTesting = import.meta.env.MODE === 'test'

export const delayedResponse = createResponseComposition(undefined, [
  context.delay(isTesting ? 0 : 1000),
])

export const sanitizeUser = (user: any) => omit(user, ['password', 'iat'])

export const hash = (str: string) => {
  let hash = 5381
  let i = str.length

  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i)
  }
  return String(hash >>> 0)
}

export function requireAuth(request: RestRequest) {
  try {
    const encodeToken = request.headers.get('authorization')
    if (!encodeToken) {
      throw new Error('没有权限')
    }

    const decodeToken = jose.decodeJwt(encodeToken) as { id: string }

    const user = db.user.findFirst({
      where: {
        id: {
          equals: decodeToken.id,
        },
      },
    })

    if (!user) {
      throw Error('未授权的用户！')
    }

    return sanitizeUser(user)
  } catch (err: any) {
    storage.clearToken()
    throw new Error(err)
  }
}

export async function authenticate({ email, password }: { email: string; password: string }) {
  const user = db.user.findFirst({
    where: {
      email: {
        equals: email,
      },
    },
  })

  if (user?.password === hash(password)) {
    const sanitizedUser = sanitizeUser(user)

    const secret = new TextEncoder().encode(JWT_SECRET)
    const alg = 'HS256'
    const encodedToken = await new jose.SignJWT(sanitizedUser)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setIssuer('urn:example:issuer')
      .setAudience('urn:example:audience')
      .setExpirationTime('2h')
      .sign(secret)

    return { user: sanitizedUser, jwt: encodedToken }
  }

  const error = new Error('无效的用户名或者密码！')
  throw error
}

export function requireAdmin(user: any) {
  if (user.role !== 'ADMIN') {
    throw Error('Unauthorized')
  }
}

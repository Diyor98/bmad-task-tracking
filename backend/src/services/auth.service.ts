import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/AppError.js'

const BCRYPT_ROUNDS = 12
const JWT_SECRET = process.env.JWT_SECRET!

function signToken(userId: string, email: string): string {
  const expiresIn = (process.env.JWT_EXPIRY || '7d') as string & jwt.SignOptions['expiresIn']
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn })
}

export const authService = {
  async register(name: string, email: string, password: string) {
    email = email.toLowerCase().trim()
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      throw new AppError('CONFLICT', 409, 'An account with this email already exists')
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)
    try {
      const user = await prisma.user.create({
        data: { name, email, password: hashedPassword },
        select: { id: true, name: true, email: true },
      })
      const token = signToken(user.id, user.email)
      return { user, token }
    } catch (err) {
      const prismaErr = err as { code?: string; constructor?: { name?: string } }
      if (prismaErr.constructor?.name === 'PrismaClientKnownRequestError' && prismaErr.code === 'P2002') {
        throw new AppError('CONFLICT', 409, 'An account with this email already exists')
      }
      throw err
    }
  },

  async login(email: string, password: string) {
    email = email.toLowerCase().trim()
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new AppError('UNAUTHORIZED', 401, 'Email or password incorrect')
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      throw new AppError('UNAUTHORIZED', 401, 'Email or password incorrect')
    }

    const token = signToken(user.id, user.email)
    return {
      user: { id: user.id, name: user.name, email: user.email },
      token,
    }
  },
}

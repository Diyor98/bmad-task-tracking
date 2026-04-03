import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { AppError } from '../lib/AppError'

const BCRYPT_ROUNDS = 12

function signToken(userId: string, email: string): string {
  const expiresIn = (process.env.JWT_EXPIRY || '7d') as string & jwt.SignOptions['expiresIn']
  return jwt.sign({ userId, email }, process.env.JWT_SECRET!, { expiresIn })
}

export const authService = {
  async register(name: string, email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      throw new AppError('CONFLICT', 409, 'An account with this email already exists')
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true },
    })

    const token = signToken(user.id, user.email)
    return { user, token }
  },

  async login(email: string, password: string) {
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

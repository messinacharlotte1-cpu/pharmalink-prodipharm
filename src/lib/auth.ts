/**
 * NextAuth.js v5 Configuration
 * Secure authentication with credentials provider
 */

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import { loginSchema } from './validations'
import { encrypt } from './encryption'

const prisma = new PrismaClient()

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // Validate input
          const parsed = loginSchema.safeParse(credentials)
          if (!parsed.success) {
            console.log('Validation failed:', parsed.error.issues)
            return null
          }

          const { email, password } = parsed.data

          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          })

          if (!user) {
            console.log('User not found:', email)
            return null
          }

          // Check if user is active
          if (!user.isActive) {
            console.log('User account is disabled:', email)
            return null
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(password, user.passwordHash)
          if (!passwordMatch) {
            console.log('Invalid password for user:', email)
            return null
          }

          // Update last login time
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })

          // Log successful login
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'login',
              entityType: 'User',
              entityId: user.id,
              details: JSON.stringify({ email: user.email }),
            },
          })

          // Return user without sensitive data
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar ?? undefined,
            region: user.region ?? undefined,
            country: user.country ?? undefined,
            phone: user.phone ?? undefined,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add user info to token on initial sign in
      if (user) {
        token.id = user.id
        token.role = user.role
        token.avatar = user.avatar
        token.region = user.region
        token.country = user.country
      }
      return token
    },
    async session({ session, token }) {
      // Add token info to session
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.avatar = token.avatar as string | undefined
        session.user.region = token.region as string | undefined
        session.user.country = token.country as string | undefined
      }
      return session
    },
    async signIn({ user, account }) {
      // Only allow credentials provider
      if (account?.provider !== 'credentials') {
        return false
      }
      return true
    },
  },
  pages: {
    signIn: '/', // Custom sign-in page
    error: '/', // Error page
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
    updateAge: 1 * 60 * 60, // Update every hour
  },
  jwt: {
    maxAge: 8 * 60 * 60, // 8 hours
  },
  cookies: {
    sessionToken: {
      name: 'pharmalink-session',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
})

// Type extensions for NextAuth
declare module 'next-auth' {
  interface User {
    id: string
    role: string
    avatar?: string
    region?: string
    country?: string
  }
  interface Session {
    user: User & {
      id: string
      role: string
      avatar?: string
      region?: string
      country?: string
    }
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string
    role: string
    avatar?: string
    region?: string
    country?: string
  }
}

/**
 * Helper function to check if user has required role
 */
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}

/**
 * Helper function to check if user owns a resource
 */
export function isOwner(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId
}

/**
 * Password hashing utility
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Password verification utility
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

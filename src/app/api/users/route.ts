/**
 * Users API Route
 * - GET: List users (admin only)
 * - POST: Create user (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth, hashPassword } from '@/lib/auth'
import { createUserSchema, sanitizeObject } from '@/lib/validations'

const prisma = new PrismaClient()

/**
 * GET /api/users
 * List all users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Check authorization - only admins can list users
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''

    // Build filter
    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }
    if (role) {
      where.role = role
    }

    // Get users
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          region: true,
          country: true,
          phone: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ])

    // Log access
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'login', // Using login as a general access action
        entityType: 'User',
        details: JSON.stringify({ action: 'list_users', page, limit }),
      },
    })

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error listing users:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users
 * Create a new user (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Check authorization - only admins can create users
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    // Parse and validate input
    const body = await request.json()
    const sanitized = sanitizeObject(body)
    const parsed = createUserSchema.safeParse(sanitized)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { name, email, password, role, phone, region, country } = parsed.data

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        phone: phone || null,
        region: region || null,
        country: country || 'Cameroun',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        region: true,
        country: true,
        phone: true,
        createdAt: true,
      },
    })

    // Log creation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'create_user',
        entityType: 'User',
        entityId: user.id,
        details: JSON.stringify({ email: user.email, role: user.role }),
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

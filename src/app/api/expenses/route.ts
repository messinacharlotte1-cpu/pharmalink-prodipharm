/**
 * Expenses API Route
 * - GET: List expenses (filtered by role)
 * - POST: Create expense
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/lib/auth'
import { createExpenseSchema, approveExpenseSchema, sanitizeObject } from '@/lib/validations'

const prisma = new PrismaClient()

/**
 * GET /api/expenses
 * List expenses with role-based filtering
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''

    // Build filter based on role
    const where: Record<string, unknown> = {}
    
    // DMs can only see their own expenses
    if (session.user.role === 'dm') {
      where.dmId = session.user.id
    }
    // Supervisors can see expenses in their region
    else if (session.user.role === 'superviseur') {
      where.dm = {
        region: session.user.region,
      }
    }

    // Add filters
    if (status) {
      where.status = status
    }
    if (type) {
      where.type = type
    }

    // Get expenses
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          dm: {
            select: {
              id: true,
              name: true,
              region: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.expense.count({ where }),
    ])

    return NextResponse.json({
      expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error listing expenses:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/expenses
 * Create a new expense
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

    // Check authorization - only admins and DMs can create expenses
    if (!['admin', 'dm'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    // Parse and validate input
    const body = await request.json()
    const sanitized = sanitizeObject(body)
    const parsed = createExpenseSchema.safeParse(sanitized)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const {
      type,
      amount,
      currency,
      date,
      description,
      receiptUrl,
    } = parsed.data

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        dmId: session.user.id,
        type,
        amount,
        currency,
        date: new Date(date),
        description,
        receiptUrl,
        status: 'pending',
      },
      include: {
        dm: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Log creation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'create_expense',
        entityType: 'Expense',
        entityId: expense.id,
        details: JSON.stringify({ 
          type, 
          amount,
          currency,
          date: expense.date 
        }),
      },
    })

    return NextResponse.json({ expense }, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

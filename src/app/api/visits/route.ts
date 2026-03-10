/**
 * Visits API Route
 * - GET: List visits (filtered by role)
 * - POST: Create visit
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/lib/auth'
import { createVisitSchema, sanitizeObject } from '@/lib/validations'

const prisma = new PrismaClient()

/**
 * GET /api/visits
 * List visits with role-based filtering
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build filter based on role
    const where: Record<string, unknown> = {}
    
    // DMs can only see their own visits
    if (session.user.role === 'dm') {
      where.dmId = session.user.id
    }
    // Supervisors can see visits in their region
    else if (session.user.role === 'superviseur') {
      where.dm = {
        region: session.user.region,
      }
    }

    // Add filters
    if (status) {
      where.status = status
    }
    if (startDate) {
      where.date = { gte: new Date(startDate) }
    }
    if (endDate) {
      where.date = { ...where.date as object, lte: new Date(endDate) }
    }

    // Get visits
    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        include: {
          hcp: {
            select: {
              id: true,
              name: true,
              specialty: true,
              facility: true,
              city: true,
            },
          },
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
      prisma.visit.count({ where }),
    ])

    return NextResponse.json({
      visits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error listing visits:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/visits
 * Create a new visit
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

    // Check authorization - only admins and DMs can create visits
    if (!['admin', 'dm'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    // Parse and validate input
    const body = await request.json()
    const sanitized = sanitizeObject(body)
    const parsed = createVisitSchema.safeParse(sanitized)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const {
      hcpId,
      date,
      duration,
      status,
      products,
      feedback,
      orderValue,
      coordinatesLat,
      coordinatesLng,
    } = parsed.data

    // Verify HCP exists
    const hcp = await prisma.hCP.findUnique({
      where: { id: hcpId },
    })

    if (!hcp) {
      return NextResponse.json(
        { error: 'Professionnel de santé non trouvé' },
        { status: 404 }
      )
    }

    // DMs can only create visits for their own HCPs
    if (session.user.role === 'dm' && hcp.dmId !== session.user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé - ce professionnel n\'est pas assigné à votre compte' },
        { status: 403 }
      )
    }

    // Create visit
    const visit = await prisma.visit.create({
      data: {
        hcpId,
        dmId: session.user.role === 'dm' ? session.user.id : body.dmId || hcp.dmId,
        date: new Date(date),
        duration,
        status,
        products: products ? JSON.stringify(products) : null,
        feedback,
        orderValue,
        coordinatesLat,
        coordinatesLng,
      },
      include: {
        hcp: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
      },
    })

    // Log creation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'create_visit',
        entityType: 'Visit',
        entityId: visit.id,
        details: JSON.stringify({ 
          hcpId, 
          date: visit.date,
          status: visit.status 
        }),
      },
    })

    return NextResponse.json({ visit }, { status: 201 })
  } catch (error) {
    console.error('Error creating visit:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

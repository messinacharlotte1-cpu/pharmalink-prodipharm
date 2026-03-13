/**
 * HCP (Healthcare Professional) API Route
 * - GET: List HCPs (filtered by role)
 * - POST: Create HCP (admin or DM)
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/lib/auth'
import { createHCPSchema, sanitizeObject } from '@/lib/validations'
import { encrypt, decrypt } from '@/lib/encryption'

const prisma = new PrismaClient()

/**
 * Encrypt sensitive HCP data
 */
function encryptHCPData(data: { phone: string; email?: string | null }) {
  return {
    phone: encrypt(data.phone),
    email: data.email ? encrypt(data.email) : null,
  }
}

/**
 * Decrypt sensitive HCP data
 */
function decryptHCPData(hcp: Record<string, unknown>) {
  return {
    ...hcp,
    phone: hcp.phone ? decrypt(hcp.phone as string) : '',
    email: hcp.email ? decrypt(hcp.email as string) : null,
  }
}

/**
 * GET /api/hcps
 * List HCPs with role-based filtering
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
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const city = searchParams.get('city') || ''

    // Build filter based on role
    const where: Record<string, unknown> = {}
    
    // DMs can only see their own HCPs
    if (session.user.role === 'dm') {
      where.dmId = session.user.id
    }
    // Supervisors can see HCPs in their region
    else if (session.user.role === 'superviseur') {
      where.dm = {
        region: session.user.region,
      }
    }
    // Admins and other roles can see all HCPs

    // Add search filters
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { facility: { contains: search } },
        { specialty: { contains: search } },
      ]
    }
    if (category) {
      where.category = category
    }
    if (city) {
      where.city = city
    }

    // Get HCPs
    const [hcps, total] = await Promise.all([
      prisma.hCP.findMany({
        where,
        include: {
          dm: {
            select: {
              id: true,
              name: true,
              email: true,
              region: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.hCP.count({ where }),
    ])

    // Decrypt sensitive data
    const decryptedHCPs = hcps.map(hcp => {
      const plainHcp = hcp as unknown as Record<string, unknown>
      return decryptHCPData(plainHcp)
    })

    return NextResponse.json({
      hcps: decryptedHCPs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error listing HCPs:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/hcps
 * Create a new HCP
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

    // Check authorization - only admins and DMs can create HCPs
    if (!['admin', 'dm'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    // Parse and validate input
    const body = await request.json()
    const sanitized = sanitizeObject(body)
    const parsed = createHCPSchema.safeParse(sanitized)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const {
      name,
      specialty,
      facility,
      address,
      city,
      country,
      phone,
      email,
      category,
      visitFrequency,
      coordinatesLat,
      coordinatesLng,
    } = parsed.data

    // Determine dmId: DMs can only create HCPs for themselves
    const dmId = session.user.role === 'dm' 
      ? session.user.id 
      : body.dmId || session.user.id

    // Verify dmId exists if provided by admin
    if (session.user.role === 'admin' && body.dmId) {
      const dm = await prisma.user.findUnique({
        where: { id: body.dmId, role: 'dm' },
      })
      if (!dm) {
        return NextResponse.json(
          { error: 'Délégué médical non trouvé' },
          { status: 404 }
        )
      }
    }

    // Encrypt sensitive data
    const encryptedData = encryptHCPData({ phone, email })

    // Create HCP
    const hcp = await prisma.hCP.create({
      data: {
        name,
        specialty,
        facility,
        address: address || null,
        city,
        country,
        phone: encryptedData.phone,
        email: encryptedData.email,
        category,
        visitFrequency,
        coordinatesLat,
        coordinatesLng,
        dmId,
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
        action: 'create_hcp',
        entityType: 'HCP',
        entityId: hcp.id,
        details: JSON.stringify({ name: hcp.name, dmId }),
      },
    })

    // Decrypt for response
    const plainHcp = hcp as unknown as Record<string, unknown>
    const decryptedHcp = decryptHCPData(plainHcp)

    return NextResponse.json({ hcp: decryptedHcp }, { status: 201 })
  } catch (error) {
    console.error('Error creating HCP:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

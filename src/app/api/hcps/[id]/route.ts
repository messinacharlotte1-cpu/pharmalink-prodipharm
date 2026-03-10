/**
 * Individual HCP API Route
 * - GET: Get HCP by ID
 * - PUT: Update HCP
 * - DELETE: Delete HCP
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/lib/auth'
import { updateHCPSchema, sanitizeObject } from '@/lib/validations'
import { encrypt, decrypt } from '@/lib/encryption'

const prisma = new PrismaClient()

interface RouteParams {
  params: Promise<{ id: string }>
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
 * GET /api/hcps/[id]
 * Get HCP by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verify authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get HCP
    const hcp = await prisma.hCP.findUnique({
      where: { id },
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
    })

    if (!hcp) {
      return NextResponse.json(
        { error: 'Professionnel de santé non trouvé' },
        { status: 404 }
      )
    }

    // Check authorization
    // DMs can only access their own HCPs
    if (session.user.role === 'dm' && hcp.dmId !== session.user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    // Decrypt sensitive data
    const plainHcp = hcp as unknown as Record<string, unknown>
    const decryptedHcp = decryptHCPData(plainHcp)

    return NextResponse.json({ hcp: decryptedHcp })
  } catch (error) {
    console.error('Error getting HCP:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/hcps/[id]
 * Update HCP
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verify authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get existing HCP
    const existingHCP = await prisma.hCP.findUnique({
      where: { id },
    })

    if (!existingHCP) {
      return NextResponse.json(
        { error: 'Professionnel de santé non trouvé' },
        { status: 404 }
      )
    }

    // Check authorization
    // DMs can only update their own HCPs
    if (session.user.role === 'dm' && existingHCP.dmId !== session.user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    // Only admins and DMs can update HCPs
    if (!['admin', 'dm'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    // Parse and validate input
    const body = await request.json()
    const sanitized = sanitizeObject(body)
    const parsed = updateHCPSchema.safeParse(sanitized)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = { ...parsed.data }

    // Encrypt sensitive data if provided
    const encryptedData: Record<string, unknown> = {}
    if (parsed.data.phone) {
      encryptedData.phone = encrypt(parsed.data.phone)
    }
    if (parsed.data.email !== undefined) {
      encryptedData.email = parsed.data.email ? encrypt(parsed.data.email) : null
    }

    // Admin can change dmId
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
      updateData.dmId = body.dmId
    }

    // Update HCP
    const hcp = await prisma.hCP.update({
      where: { id },
      data: {
        ...updateData,
        ...encryptedData,
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

    // Log update
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'update_hcp',
        entityType: 'HCP',
        entityId: hcp.id,
        details: JSON.stringify({ name: hcp.name }),
      },
    })

    // Decrypt for response
    const plainHcp = hcp as unknown as Record<string, unknown>
    const decryptedHcp = decryptHCPData(plainHcp)

    return NextResponse.json({ hcp: decryptedHcp })
  } catch (error) {
    console.error('Error updating HCP:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/hcps/[id]
 * Delete HCP
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verify authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get existing HCP
    const existingHCP = await prisma.hCP.findUnique({
      where: { id },
    })

    if (!existingHCP) {
      return NextResponse.json(
        { error: 'Professionnel de santé non trouvé' },
        { status: 404 }
      )
    }

    // Check authorization
    // DMs can only delete their own HCPs
    if (session.user.role === 'dm' && existingHCP.dmId !== session.user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    // Only admins and DMs can delete HCPs
    if (!['admin', 'dm'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    // Delete HCP
    await prisma.hCP.delete({
      where: { id },
    })

    // Log deletion
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'delete_hcp',
        entityType: 'HCP',
        entityId: id,
        details: JSON.stringify({ name: existingHCP.name }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting HCP:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

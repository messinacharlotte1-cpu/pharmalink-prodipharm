/**
 * Visit by ID API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { updateVisitSchema } from '@/lib/validations'
import { z } from 'zod'

// GET /api/visits/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const visit = await db.visit.findUnique({
      where: { id },
      include: {
        hcp: {
          select: {
            id: true,
            name: true,
            specialty: true,
            facility: true,
            city: true,
            phone: true,
          },
        },
        dm: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })
    
    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
    }
    
    // DMs can only view their own visits
    if (session.user.role === 'dm' && visit.dmId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    return NextResponse.json({ visit })
  } catch (error) {
    console.error('Get visit error:', error)
    return NextResponse.json({ error: 'Failed to fetch visit' }, { status: 500 })
  }
}

// PUT /api/visits/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const existingVisit = await db.visit.findUnique({ where: { id } })
    
    if (!existingVisit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
    }
    
    // DMs can only update their own visits
    if (session.user.role === 'dm' && existingVisit.dmId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const validatedData = updateVisitSchema.parse(body)
    
    const visit = await db.visit.update({
      where: { id },
      data: {
        date: validatedData.date ? new Date(validatedData.date) : undefined,
        duration: validatedData.duration,
        status: validatedData.status,
        products: validatedData.products ? JSON.stringify(validatedData.products) : undefined,
        feedback: validatedData.feedback,
        orderValue: validatedData.orderValue,
        coordinatesLat: validatedData.coordinatesLat,
        coordinatesLng: validatedData.coordinatesLng,
      },
    })
    
    // Update HCP last visit date if completed (optional feature)
    // if (validatedData.status === 'completed') {
    //   await db.hCP.update({
    //     where: { id: existingVisit.hcpId },
    //     data: { lastVisitDate: new Date() },
    //   })
    // }
    
    // Audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'update',
        entityType: 'Visit',
        entityId: id,
        details: JSON.stringify({ status: validatedData.status }),
      },
    })
    
    return NextResponse.json({ visit })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Update visit error:', error)
    return NextResponse.json({ error: 'Failed to update visit' }, { status: 500 })
  }
}

// DELETE /api/visits/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const existingVisit = await db.visit.findUnique({ where: { id } })
    
    if (!existingVisit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
    }
    
    // DMs can only delete their own visits
    if (session.user.role === 'dm' && existingVisit.dmId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    await db.visit.delete({ where: { id } })
    
    // Audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'delete',
        entityType: 'Visit',
        entityId: id,
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete visit error:', error)
    return NextResponse.json({ error: 'Failed to delete visit' }, { status: 500 })
  }
}

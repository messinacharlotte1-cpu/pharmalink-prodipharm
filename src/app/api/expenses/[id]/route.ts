/**
 * Expense by ID API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { updateExpenseSchema } from '@/lib/validations'
import { z } from 'zod'

// GET /api/expenses/[id]
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
    
    const expense = await db.expense.findUnique({
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
    
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }
    
    // DMs can only view their own expenses
    if (session.user.role === 'dm' && expense.dmId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    return NextResponse.json({ expense })
  } catch (error) {
    console.error('Get expense error:', error)
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 })
  }
}

// PUT /api/expenses/[id] - Update expense (only if pending)
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
    
    const existingExpense = await db.expense.findUnique({ where: { id } })
    
    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }
    
    // DMs can only update their own pending expenses
    if (session.user.role === 'dm') {
      if (existingExpense.dmId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (existingExpense.status !== 'pending') {
        return NextResponse.json(
          { error: 'Cannot update processed expense' },
          { status: 400 }
        )
      }
    }
    
    const body = await request.json()
    const validatedData = updateExpenseSchema.parse(body)
    
    const expense = await db.expense.update({
      where: { id },
      data: {
        type: validatedData.type,
        amount: validatedData.amount,
        currency: validatedData.currency,
        date: validatedData.date ? new Date(validatedData.date) : undefined,
        description: validatedData.description,
        receiptUrl: validatedData.receiptUrl,
      },
    })
    
    // Audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'update',
        entityType: 'Expense',
        entityId: id,
      },
    })
    
    return NextResponse.json({ expense })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Update expense error:', error)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

// DELETE /api/expenses/[id] - Delete expense (only if pending)
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
    
    const existingExpense = await db.expense.findUnique({ where: { id } })
    
    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }
    
    // DMs can only delete their own pending expenses
    if (session.user.role === 'dm') {
      if (existingExpense.dmId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (existingExpense.status !== 'pending') {
        return NextResponse.json(
          { error: 'Cannot delete processed expense' },
          { status: 400 }
        )
      }
    }
    
    await db.expense.delete({ where: { id } })
    
    // Audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'delete',
        entityType: 'Expense',
        entityId: id,
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete expense error:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}

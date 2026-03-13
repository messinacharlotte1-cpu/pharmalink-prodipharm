/**
 * Expense Approval API Route
 * Admin/Comptabilite/Superviseur only
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { approveExpenseSchema } from '@/lib/validations'
import { z } from 'zod'

// POST /api/expenses/approve - Approve or reject expense
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    
    // Only admin, comptabilite, and superviseur can approve expenses
    const allowedRoles = ['admin', 'comptabilite', 'superviseur']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }
    
    const body = await request.json()
    const { expenseId, status, rejectionReason } = body
    
    if (!expenseId) {
      return NextResponse.json({ error: 'ID dépense requis' }, { status: 400 })
    }
    
    const validatedData = approveExpenseSchema.parse({ status, rejectionReason })
    
    const expense = await db.expense.findUnique({
      where: { id: expenseId },
      include: { dm: { select: { name: true } } }
    })
    
    if (!expense) {
      return NextResponse.json({ error: 'Dépense non trouvée' }, { status: 404 })
    }
    
    if (expense.status !== 'pending') {
      return NextResponse.json(
        { error: 'Dépense déjà traitée' },
        { status: 400 }
      )
    }
    
    const updatedExpense = await db.expense.update({
      where: { id: expenseId },
      data: {
        status: validatedData.status,
        rejectionReason: validatedData.rejectionReason,
        approvedBy: session.user.id,
        approvedAt: new Date(),
      },
    })
    
    // Audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: validatedData.status === 'approved' ? 'approve_expense' : 'reject_expense',
        entityType: 'Expense',
        entityId: expenseId,
        details: JSON.stringify({
          amount: expense.amount,
          type: expense.type,
          dmName: expense.dm?.name,
        }),
      },
    })
    
    return NextResponse.json({ expense: updatedExpense })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Approve expense error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

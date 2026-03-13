/**
 * Input Validation Schemas using Zod
 * All server-side validation for API endpoints
 */

import { z } from 'zod'

// ============================================
// User Validation Schemas
// ============================================

export const userRoleSchema = z.enum(['dm', 'superviseur', 'comptabilite', 'marketing', 'admin'])

export const loginSchema = z.object({
  email: z.string()
    .email('Email invalide')
    .max(255, 'Email trop long'),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(128, 'Mot de passe trop long'),
})

export const createUserSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom est trop long')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom contient des caractères invalides'),
  email: z.string()
    .email('Email invalide')
    .max(255, 'Email trop long'),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(128, 'Mot de passe trop long')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial'),
  role: userRoleSchema,
  phone: z.string()
    .regex(/^\+?[0-9\s]{8,20}$/, 'Numéro de téléphone invalide')
    .optional()
    .or(z.literal('')),
  region: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
})

export const updateUserSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom est trop long')
    .optional(),
  phone: z.string()
    .regex(/^\+?[0-9\s]{8,20}$/, 'Numéro de téléphone invalide')
    .optional()
    .or(z.literal('')),
  region: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(128, 'Mot de passe trop long')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial'),
})

// ============================================
// HCP (Healthcare Professional) Validation Schemas
// ============================================

export const hcpCategorySchema = z.enum(['A', 'B', 'C'])

export const createHCPSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(200, 'Le nom est trop long'),
  specialty: z.string()
    .min(2, 'La spécialité doit contenir au moins 2 caractères')
    .max(100, 'Spécialité trop long'),
  facility: z.string()
    .min(2, 'L\'établissement doit contenir au moins 2 caractères')
    .max(200, 'Nom d\'établissement trop long'),
  address: z.string().max(500).optional().or(z.literal('')),
  city: z.string()
    .min(2, 'La ville doit contenir au moins 2 caractères')
    .max(100, 'Nom de ville trop long'),
  country: z.string().max(100).default('Cameroun'),
  phone: z.string()
    .min(8, 'Numéro de téléphone invalide')
    .max(30, 'Numéro de téléphone trop long'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  category: hcpCategorySchema.default('C'),
  visitFrequency: z.number().int().min(1).max(52).default(8),
  coordinatesLat: z.number().min(-90).max(90).optional(),
  coordinatesLng: z.number().min(-180).max(180).optional(),
})

export const updateHCPSchema = createHCPSchema.partial()

// ============================================
// Visit Validation Schemas
// ============================================

export const visitStatusSchema = z.enum(['planned', 'completed', 'cancelled'])

export const createVisitSchema = z.object({
  hcpId: z.string().min(1, 'HCP requis'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Date invalide'),
  duration: z.number().int().min(0).max(480).default(0),
  status: visitStatusSchema.default('planned'),
  products: z.array(z.string()).optional(),
  feedback: z.string().max(2000).optional(),
  orderValue: z.number().min(0).optional(),
  coordinatesLat: z.number().min(-90).max(90).optional(),
  coordinatesLng: z.number().min(-180).max(180).optional(),
})

export const updateVisitSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Date invalide').optional(),
  duration: z.number().int().min(0).max(480).optional(),
  status: visitStatusSchema.optional(),
  products: z.array(z.string()).optional(),
  feedback: z.string().max(2000).optional(),
  orderValue: z.number().min(0).optional(),
  coordinatesLat: z.number().min(-90).max(90).optional(),
  coordinatesLng: z.number().min(-180).max(180).optional(),
})

export const validateVisitSchema = z.object({
  validated: z.boolean(),
  rejectionReason: z.string().max(500).optional(),
})

// ============================================
// Expense Validation Schemas
// ============================================

export const expenseTypeSchema = z.enum(['fuel', 'accommodation', 'meal', 'transport', 'other'])
export const expenseStatusSchema = z.enum(['pending', 'approved', 'rejected'])

export const createExpenseSchema = z.object({
  type: expenseTypeSchema,
  amount: z.number().positive('Le montant doit être positif').max(100000000),
  currency: z.string().length(3).default('XAF'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Date invalide'),
  description: z.string().max(500).optional(),
  receiptUrl: z.string().url().optional(),
})

export const updateExpenseSchema = createExpenseSchema.partial()

export const approveExpenseSchema = z.object({
  status: z.literal('approved').or(z.literal('rejected')),
  rejectionReason: z.string().max(500).optional(),
})

// ============================================
// Audit Log Validation
// ============================================

export const auditActionSchema = z.enum([
  'login',
  'logout',
  'login_failed',
  'password_change',
  'create_user',
  'update_user',
  'delete_user',
  'create_hcp',
  'update_hcp',
  'delete_hcp',
  'create_visit',
  'update_visit',
  'validate_visit',
  'create_expense',
  'approve_expense',
  'reject_expense',
])

export const createAuditLogSchema = z.object({
  action: auditActionSchema,
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  ipAddress: z.string().max(45).optional(),
  userAgent: z.string().max(500).optional(),
  details: z.string().optional(),
})

// ============================================
// Pagination & Filter Schemas
// ============================================

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

export const dateRangeSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Date invalide').optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Date invalide').optional(),
})

// ============================================
// Sanitization Utilities
// ============================================

/**
 * Sanitize string input by removing potential XSS vectors
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized as T
}

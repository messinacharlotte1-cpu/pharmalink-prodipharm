// ============================================
// ANIMATION VARIANTS & UTILITIES - PharmaLink
// ============================================

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Class name utility for tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Animation Variants
export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
}

export const slideInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } }
}

// Animated Counter Component
export function AnimatedCounter({ value, duration = 1 }: { value: string; duration?: number }) {
  const [displayValue, setDisplayValue] = useState('0')
  const animationRef = useRef<number | undefined>(undefined)
  const startTimeRef = useRef<number | undefined>(undefined)
  
  useEffect(() => {
    const numericMatch = value.match(/^([\d.]+)(.*)$/)
    
    if (!numericMatch) {
      const timer = setTimeout(() => setDisplayValue(value), 0)
      return () => clearTimeout(timer)
    }
    
    const targetValue = parseFloat(numericMatch[1])
    const suffix = numericMatch[2]
    
    if (isNaN(targetValue)) {
      const timer = setTimeout(() => setDisplayValue(value), 0)
      return () => clearTimeout(timer)
    }
    
    const animate = (currentTime: number) => {
      if (!startTimeRef.current) startTimeRef.current = currentTime
      const progress = Math.min((currentTime - startTimeRef.current) / (duration * 1000), 1)
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = targetValue * easeOutQuart
      
      if (targetValue >= 1000) {
        setDisplayValue(Math.floor(currentValue).toLocaleString() + suffix)
      } else if (targetValue >= 100) {
        setDisplayValue(Math.floor(currentValue) + suffix)
      } else if (targetValue >= 10) {
        setDisplayValue(currentValue.toFixed(0) + suffix)
      } else {
        setDisplayValue(currentValue.toFixed(1) + suffix)
      }
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      startTimeRef.current = undefined
    }
  }, [value, duration])
  
  return <span>{displayValue}</span>
}

// Animated Progress Bar
export function AnimatedProgressBar({ percent, delay = 0 }: { percent: number; delay?: number }) {
  const [width, setWidth] = useState(0)
  
  useEffect(() => {
    const timer = setTimeout(() => setWidth(percent), delay * 1000)
    return () => clearTimeout(timer)
  }, [percent, delay])
  
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <motion.div 
        className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 1, delay, ease: "easeOut" }}
      />
    </div>
  )
}

// Format currency
export function formatCurrency(amount: number, currency = 'XAF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Format date
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Format datetime
export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Generate unique ID
export function generateId(prefix = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Role Labels
export const ROLE_LABELS: Record<string, string> = {
  dm: 'Délégué Médical',
  superviseur: 'Superviseur',
  comptabilite: 'Comptabilité',
  marketing: 'Marketing',
  admin: 'Administrateur'
}

// Module Labels
export const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord',
  geolocation: 'Géolocalisation',
  crm: 'CRM Médical',
  accounting: 'Notes de frais',
  marketing: 'Marketing',
  analytics: 'Analytics',
  settings: 'Paramètres',
  hcp: 'Prof. de Santé',
  planning: 'Planning',
  budget: 'Budgets',
  reports: 'Rapports',
  rh: 'RH',
  payroll: 'Paie',
  'my-space': 'Mon espace',
  messages: 'Messagerie',
  stocks: 'Stocks & Produits',
  sales: 'Ventes',
  regulatory: 'Affaires Réglementaires',
  laboratories: 'Laboratoires'
}

// CSV Export Utilities
export function downloadCSV(content: string, filename: string): void {
  const bom = '\uFEFF'
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function parseCSVImport(content: string, delimiter = ';'): Record<string, string>[] {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''))
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    rows.push(row)
  }

  return rows
}

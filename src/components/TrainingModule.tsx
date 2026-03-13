'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, BookOpen, Play, CheckCircle, Clock, AlertTriangle,
  Plus, Edit, Trash2, Users, Calendar, Award, BarChart3, FileText,
  Video, File, ChevronRight, ChevronDown, X, Send, Bell, BellRing,
  User, Search, Filter, Download, Upload, ExternalLink, RefreshCw,
  Star, Target, Timer, Check, ArrowRight, Pause, RotateCcw,
  ClipboardCheck, Sparkles, TrendingUp, Eye, MoreVertical, Settings, UserPlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'

// ============================================
// TRAINING TYPES
// ============================================

type TrainingStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue'
type TrainingPriority = 'low' | 'medium' | 'high' | 'mandatory'
type ContentType = 'video' | 'document' | 'quiz' | 'scorm' | 'link'

interface TrainingContent {
  id: string
  title: string
  type: ContentType
  duration: number // in minutes
  url?: string
  description?: string
  order: number
  isRequired: boolean
}

interface TrainingModule_ {
  id: string
  title: string
  description: string
  contents: TrainingContent[]
  order: number
}

interface Training {
  id: string
  title: string
  description: string
  category: string
  priority: TrainingPriority
  modules: TrainingModule_[]
  thumbnail?: string
  duration: number // total duration in minutes
  assignedTo: string[] // user IDs
  assignedBy: string
  assignedAt: string
  dueDate?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  certificateEnabled: boolean
  passingScore?: number // for quizzes
}

interface UserTrainingProgress {
  id: string
  trainingId: string
  userId: string
  userName: string
  status: TrainingStatus
  startedAt?: string
  completedAt?: string
  lastAccessedAt?: string
  progress: number // percentage
  currentModuleId?: string
  currentContentId?: string
  completedContents: string[]
  quizScores: Record<string, number>
  timeSpent: number // in minutes
  remindersSent: number
  lastReminderAt?: string
  certificateUrl?: string
}

interface TrainingReminder {
  id: string
  trainingId: string
  trainingTitle: string
  userId: string
  userName: string
  type: 'not_started' | 'in_progress' | 'overdue' | 'due_soon'
  message: string
  sentAt: string
  isRead: boolean
}

interface TrainingCategory {
  id: string
  name: string
  description: string
  color: string
  icon: string
}

// ============================================
// SAMPLE DATA
// ============================================

const trainingCategories: TrainingCategory[] = [
  { id: 'cat1', name: 'Conformité Réglementaire', description: 'Formations sur les réglementations pharmaceutiques', color: '#0EA5E9', icon: 'FileText' },
  { id: 'cat2', name: 'Vente & Commercial', description: 'Techniques de vente et argumentation', color: '#10B981', icon: 'TrendingUp' },
  { id: 'cat3', name: 'Produits', description: 'Connaissance des produits pharmaceutiques', color: '#8B5CF6', icon: 'Package' },
  { id: 'cat4', name: 'Sécurité', description: 'Sécurité au travail et bonnes pratiques', color: '#EF4444', icon: 'Shield' },
  { id: 'cat5', name: 'Compétences Techniques', description: 'Outils et logiciels métier', color: '#F59E0B', icon: 'Settings' },
]

const sampleTrainings: Training[] = [
  {
    id: 'train1',
    title: 'Bonnes Pratiques de Distribution (BPD)',
    description: 'Formation obligatoire sur les bonnes pratiques de distribution des produits pharmaceutiques. Cette formation couvre les exigences réglementaires, les procédures de stockage, de transport et de traçabilité.',
    category: 'cat1',
    priority: 'mandatory',
    modules: [
      {
        id: 'mod1',
        title: 'Introduction aux BPD',
        description: 'Présentation générale des Bonnes Pratiques de Distribution',
        order: 1,
        contents: [
          { id: 'c1', title: 'Présentation BPD - Introduction', type: 'video', duration: 15, order: 1, isRequired: true },
          { id: 'c2', title: 'Document de référence BPD', type: 'document', duration: 30, order: 2, isRequired: true },
          { id: 'c3', title: 'Quiz Module 1', type: 'quiz', duration: 10, order: 3, isRequired: true },
        ]
      },
      {
        id: 'mod2',
        title: 'Procédures de Stockage',
        description: 'Les exigences de stockage des produits pharmaceutiques',
        order: 2,
        contents: [
          { id: 'c4', title: 'Vidéo Stockage', type: 'video', duration: 20, order: 1, isRequired: true },
          { id: 'c5', title: 'Guide de stockage', type: 'document', duration: 25, order: 2, isRequired: true },
        ]
      },
      {
        id: 'mod3',
        title: 'Quiz Final',
        description: 'Évaluation finale de la formation',
        order: 3,
        contents: [
          { id: 'c6', title: 'Examen Final BPD', type: 'quiz', duration: 30, order: 1, isRequired: true },
        ]
      }
    ],
    duration: 130,
    assignedTo: ['u1', 'u5', 'u6', 'u7'],
    assignedBy: 'admin',
    assignedAt: '2025-03-01T10:00:00Z',
    dueDate: '2025-03-31T23:59:59Z',
    createdBy: 'admin',
    createdAt: '2025-02-15T10:00:00Z',
    updatedAt: '2025-02-15T10:00:00Z',
    isActive: true,
    certificateEnabled: true,
    passingScore: 70
  },
  {
    id: 'train2',
    title: 'Techniques de Vente Pharmaceutique',
    description: 'Maîtrisez les techniques de vente et d\'argumentation pour les produits pharmaceutiques. Apprenez à construire des relations durables avec les professionnels de santé.',
    category: 'cat2',
    priority: 'high',
    modules: [
      {
        id: 'mod4',
        title: 'Fondamentaux de la Vente',
        description: 'Les bases de la vente professionnelle',
        order: 1,
        contents: [
          { id: 'c7', title: 'Introduction à la vente', type: 'video', duration: 25, order: 1, isRequired: true },
          { id: 'c8', title: 'Les 7 étapes de la vente', type: 'document', duration: 20, order: 2, isRequired: true },
        ]
      },
      {
        id: 'mod5',
        title: 'Argumentation Produit',
        description: 'Présenter efficacement vos produits',
        order: 2,
        contents: [
          { id: 'c9', title: 'Techniques d\'argumentation', type: 'video', duration: 30, order: 1, isRequired: true },
          { id: 'c10', title: 'Étude de cas pratiques', type: 'document', duration: 45, order: 2, isRequired: false },
        ]
      }
    ],
    duration: 120,
    assignedTo: ['u1', 'u2', 'u5'],
    assignedBy: 'admin',
    assignedAt: '2025-03-05T14:00:00Z',
    dueDate: '2025-04-15T23:59:59Z',
    createdBy: 'admin',
    createdAt: '2025-03-01T10:00:00Z',
    updatedAt: '2025-03-01T10:00:00Z',
    isActive: true,
    certificateEnabled: true,
    passingScore: 60
  },
  {
    id: 'train3',
    title: 'Nouveaux Produits 2025',
    description: 'Formation sur les nouveaux produits lancés en 2025. Découvrez les caractéristiques, indications et contre-indications de nos dernières innovations.',
    category: 'cat3',
    priority: 'medium',
    modules: [
      {
        id: 'mod6',
        title: 'Présentation des Nouveautés',
        description: 'Vue d\'ensemble des nouveaux produits',
        order: 1,
        contents: [
          { id: 'c11', title: 'Catalogue Nouveautés 2025', type: 'document', duration: 45, order: 1, isRequired: true },
          { id: 'c12', title: 'Vidéo de présentation', type: 'video', duration: 35, order: 2, isRequired: true },
        ]
      }
    ],
    duration: 80,
    assignedTo: ['u1', 'u2', 'u5', 'u6', 'u7'],
    assignedBy: 'marketing',
    assignedAt: '2025-03-10T09:00:00Z',
    createdBy: 'marketing',
    createdAt: '2025-03-08T10:00:00Z',
    updatedAt: '2025-03-08T10:00:00Z',
    isActive: true,
    certificateEnabled: false
  }
]

const sampleProgress: UserTrainingProgress[] = [
  {
    id: 'prog1',
    trainingId: 'train1',
    userId: 'u1',
    userName: 'Jean Moussombi',
    status: 'completed',
    startedAt: '2025-03-02T09:00:00Z',
    completedAt: '2025-03-05T16:30:00Z',
    lastAccessedAt: '2025-03-05T16:30:00Z',
    progress: 100,
    completedContents: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'],
    quizScores: { 'c3': 85, 'c6': 92 },
    timeSpent: 125,
    remindersSent: 0,
    certificateUrl: '/certificates/train1-u1.pdf'
  },
  {
    id: 'prog2',
    trainingId: 'train1',
    userId: 'u5',
    userName: 'Pierre Kamga',
    status: 'in_progress',
    startedAt: '2025-03-03T14:00:00Z',
    lastAccessedAt: '2025-03-12T10:00:00Z',
    progress: 45,
    currentModuleId: 'mod2',
    currentContentId: 'c4',
    completedContents: ['c1', 'c2', 'c3'],
    quizScores: { 'c3': 78 },
    timeSpent: 55,
    remindersSent: 2,
    lastReminderAt: '2025-03-10T09:00:00Z'
  },
  {
    id: 'prog3',
    trainingId: 'train1',
    userId: 'u6',
    userName: 'Marie Tchinda',
    status: 'not_started',
    progress: 0,
    completedContents: [],
    quizScores: {},
    timeSpent: 0,
    remindersSent: 3,
    lastReminderAt: '2025-03-11T08:00:00Z'
  },
  {
    id: 'prog4',
    trainingId: 'train1',
    userId: 'u7',
    userName: 'Paul Nguema',
    status: 'in_progress',
    startedAt: '2025-03-08T11:00:00Z',
    lastAccessedAt: '2025-03-13T09:00:00Z',
    progress: 20,
    currentModuleId: 'mod1',
    currentContentId: 'c2',
    completedContents: ['c1'],
    quizScores: {},
    timeSpent: 25,
    remindersSent: 1,
    lastReminderAt: '2025-03-12T14:00:00Z'
  },
  {
    id: 'prog5',
    trainingId: 'train2',
    userId: 'u1',
    userName: 'Jean Moussombi',
    status: 'in_progress',
    startedAt: '2025-03-10T15:00:00Z',
    lastAccessedAt: '2025-03-12T11:00:00Z',
    progress: 60,
    currentModuleId: 'mod5',
    currentContentId: 'c9',
    completedContents: ['c7', 'c8'],
    quizScores: {},
    timeSpent: 45,
    remindersSent: 0
  },
  {
    id: 'prog6',
    trainingId: 'train3',
    userId: 'u1',
    userName: 'Jean Moussombi',
    status: 'not_started',
    progress: 0,
    completedContents: [],
    quizScores: {},
    timeSpent: 0,
    remindersSent: 1,
    lastReminderAt: '2025-03-12T08:00:00Z'
  }
]

const sampleReminders: TrainingReminder[] = [
  {
    id: 'rem1',
    trainingId: 'train1',
    trainingTitle: 'Bonnes Pratiques de Distribution (BPD)',
    userId: 'u6',
    userName: 'Marie Tchinda',
    type: 'not_started',
    message: 'Vous n\'avez pas encore commencé la formation "Bonnes Pratiques de Distribution". La date limite approche!',
    sentAt: '2025-03-11T08:00:00Z',
    isRead: false
  },
  {
    id: 'rem2',
    trainingId: 'train1',
    trainingTitle: 'Bonnes Pratiques de Distribution (BPD)',
    userId: 'u5',
    userName: 'Pierre Kamga',
    type: 'in_progress',
    message: 'Votre formation "Bonnes Pratiques de Distribution" est en cours. Continuez pour la terminer avant la date limite!',
    sentAt: '2025-03-10T09:00:00Z',
    isRead: true
  },
  {
    id: 'rem3',
    trainingId: 'train3',
    trainingTitle: 'Nouveaux Produits 2025',
    userId: 'u1',
    userName: 'Jean Moussombi',
    type: 'not_started',
    message: 'Une nouvelle formation "Nouveaux Produits 2025" vous attend!',
    sentAt: '2025-03-12T08:00:00Z',
    isRead: false
  }
]

const STATUS_CONFIG: Record<TrainingStatus, { label: string; color: string; bgColor: string }> = {
  'not_started': { label: 'Non commencé', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  'in_progress': { label: 'En cours', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'completed': { label: 'Terminé', color: 'text-green-600', bgColor: 'bg-green-100' },
  'overdue': { label: 'En retard', color: 'text-red-600', bgColor: 'bg-red-100' }
}

const PRIORITY_CONFIG: Record<TrainingPriority, { label: string; color: string }> = {
  'low': { label: 'Basse', color: 'bg-gray-500' },
  'medium': { label: 'Moyenne', color: 'bg-yellow-500' },
  'high': { label: 'Haute', color: 'bg-orange-500' },
  'mandatory': { label: 'Obligatoire', color: 'bg-red-500' }
}

const CONTENT_TYPE_ICONS: Record<ContentType, React.ElementType> = {
  'video': Video,
  'document': FileText,
  'quiz': ClipboardCheck,
  'scorm': File,
  'link': ExternalLink
}

// ============================================
// MAIN COMPONENT
// ============================================

interface TrainingModuleProps {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export default function TrainingModule({ user }: TrainingModuleProps) {
  // State
  const [trainings, setTrainings] = useState<Training[]>(sampleTrainings)
  const [userProgress, setUserProgress] = useState<UserTrainingProgress[]>(sampleProgress)
  const [reminders, setReminders] = useState<TrainingReminder[]>(sampleReminders)
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null)
  const [selectedProgress, setSelectedProgress] = useState<UserTrainingProgress | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'admin' | 'stats'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<TrainingStatus | 'all'>('all')
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [showContentModal, setShowContentModal] = useState(false)
  
  // Form states
  const [newTraining, setNewTraining] = useState<Partial<Training>>({
    title: '',
    description: '',
    category: 'cat1',
    priority: 'medium',
    modules: [],
    isActive: true,
    certificateEnabled: false
  })
  
  const { toast } = useToast()

  // Check if user is admin or supervisor
  const isAdmin = user.role === 'admin' || user.role === 'superviseur'

  // Get user's trainings
  const getUserTrainings = useCallback(() => {
    return trainings.filter(t => t.assignedTo.includes(user.id) || isAdmin)
  }, [trainings, user.id, isAdmin])

  // Get user's progress for a training
  const getUserProgress = useCallback((trainingId: string) => {
    return userProgress.find(p => p.trainingId === trainingId && p.userId === user.id)
  }, [userProgress, user.id])

  // Get unread reminders count
  const unreadReminders = reminders.filter(r => r.userId === user.id && !r.isRead)

  // Calculate training statistics
  const getTrainingStats = useCallback(() => {
    const userTrainings = getUserTrainings()
    const total = userTrainings.length
    const completed = userTrainings.filter(t => {
      const progress = getUserProgress(t.id)
      return progress?.status === 'completed'
    }).length
    const inProgress = userTrainings.filter(t => {
      const progress = getUserProgress(t.id)
      return progress?.status === 'in_progress'
    }).length
    const notStarted = userTrainings.filter(t => {
      const progress = getUserProgress(t.id)
      return !progress || progress?.status === 'not_started'
    }).length
    const overdue = userTrainings.filter(t => {
      const progress = getUserProgress(t.id)
      return progress?.status === 'overdue' || (t.dueDate && new Date(t.dueDate) < new Date() && progress?.status !== 'completed')
    }).length

    return { total, completed, inProgress, notStarted, overdue }
  }, [getUserTrainings, getUserProgress])

  // Start a training
  const handleStartTraining = (training: Training) => {
    const existingProgress = getUserProgress(training.id)
    
    if (!existingProgress) {
      const newProgress: UserTrainingProgress = {
        id: `prog-${Date.now()}`,
        trainingId: training.id,
        userId: user.id,
        userName: user.name,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        progress: 0,
        currentModuleId: training.modules[0]?.id,
        currentContentId: training.modules[0]?.contents[0]?.id,
        completedContents: [],
        quizScores: {},
        timeSpent: 0,
        remindersSent: 0
      }
      setUserProgress([...userProgress, newProgress])
    } else {
      setUserProgress(userProgress.map(p => 
        p.trainingId === training.id && p.userId === user.id
          ? { ...p, status: 'in_progress', lastAccessedAt: new Date().toISOString() }
          : p
      ))
    }
    
    setSelectedTraining(training)
    setSelectedProgress(getUserProgress(training.id) || existingProgress || null)
    setViewMode('detail')
    
    toast({ title: 'Formation démarrée', description: `Vous avez commencé "${training.title}"` })
  }

  // Complete a content
  const handleCompleteContent = (contentId: string) => {
    if (!selectedTraining || !selectedProgress) return
    
    const newCompletedContents = [...selectedProgress.completedContents, contentId]
    
    // Calculate total contents
    const totalContents = selectedTraining.modules.reduce((sum, m) => sum + m.contents.length, 0)
    const progress = Math.round((newCompletedContents.length / totalContents) * 100)
    
    // Find next content
    let nextContent: TrainingContent | null = null
    let nextModule: TrainingModule_ | null = null
    
    for (const module of selectedTraining.modules) {
      for (const content of module.contents) {
        if (!newCompletedContents.includes(content.id)) {
          nextContent = content
          nextModule = module
          break
        }
      }
      if (nextContent) break
    }
    
    const isCompleted = progress === 100
    
    const updatedProgress: UserTrainingProgress = {
      ...selectedProgress,
      status: isCompleted ? 'completed' : 'in_progress',
      completedAt: isCompleted ? new Date().toISOString() : undefined,
      lastAccessedAt: new Date().toISOString(),
      progress,
      currentModuleId: nextModule?.id,
      currentContentId: nextContent?.id,
      completedContents: newCompletedContents,
      timeSpent: selectedProgress.timeSpent + 5
    }
    
    setUserProgress(userProgress.map(p => 
      p.id === selectedProgress.id ? updatedProgress : p
    ))
    setSelectedProgress(updatedProgress)
    
    if (isCompleted) {
      toast({ 
        title: '🎉 Félicitations!', 
        description: `Vous avez terminé la formation "${selectedTraining.title}"`,
        duration: 5000
      })
    }
  }

  // Send reminder
  const handleSendReminder = (userId: string, trainingId: string) => {
    const training = trainings.find(t => t.id === trainingId)
    const progress = userProgress.find(p => p.trainingId === trainingId && p.userId === userId)
    
    if (!training || !progress) return
    
    const reminder: TrainingReminder = {
      id: `rem-${Date.now()}`,
      trainingId,
      trainingTitle: training.title,
      userId,
      userName: progress.userName,
      type: progress.status === 'not_started' ? 'not_started' : 'in_progress',
      message: progress.status === 'not_started' 
        ? `Rappel: Vous n'avez pas encore commencé la formation "${training.title}".`
        : `Rappel: Votre formation "${training.title}" est en cours. Continuez pour la terminer!`,
      sentAt: new Date().toISOString(),
      isRead: false
    }
    
    setReminders([...reminders, reminder])
    
    // Update progress reminders count
    setUserProgress(userProgress.map(p => 
      p.id === progress.id 
        ? { ...p, remindersSent: p.remindersSent + 1, lastReminderAt: new Date().toISOString() }
        : p
    ))
    
    toast({ title: 'Rappel envoyé', description: `Rappel envoyé à ${progress.userName}` })
  }

  // Create new training
  const handleCreateTraining = () => {
    if (!newTraining.title || !newTraining.description) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' })
      return
    }
    
    const training: Training = {
      id: `train-${Date.now()}`,
      title: newTraining.title,
      description: newTraining.description,
      category: newTraining.category || 'cat1',
      priority: newTraining.priority || 'medium',
      modules: newTraining.modules || [],
      duration: newTraining.modules?.reduce((sum, m) => 
        sum + m.contents.reduce((cs, c) => cs + c.duration, 0), 0) || 0,
      assignedTo: [],
      assignedBy: user.id,
      assignedAt: new Date().toISOString(),
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      certificateEnabled: newTraining.certificateEnabled || false,
      passingScore: newTraining.passingScore
    }
    
    setTrainings([...trainings, training])
    setShowCreateModal(false)
    setNewTraining({
      title: '',
      description: '',
      category: 'cat1',
      priority: 'medium',
      modules: [],
      isActive: true,
      certificateEnabled: false
    })
    
    toast({ title: 'Formation créée', description: `La formation "${training.title}" a été créée` })
  }

  // Filter trainings
  const filteredTrainings = getUserTrainings().filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory
    const matchesStatus = filterStatus === 'all' || getUserProgress(t.id)?.status === filterStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`
    if (hours > 0) return `${hours}h`
    return `${mins}min`
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    })
  }

  // Stats
  const stats = getTrainingStats()

  // Render list view
  const renderListView = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-gray-500">Terminées</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Play className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-sm text-gray-500">En cours</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">{stats.notStarted}</p>
              <p className="text-sm text-gray-500">Non commencées</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              <p className="text-sm text-gray-500">En retard</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reminders Banner */}
      {unreadReminders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <BellRing className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900">Vous avez {unreadReminders.length} rappel(s) non lu(s)</p>
                <p className="text-sm text-amber-700">Des formations nécessitent votre attention</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => setShowReminderModal(true)}
            >
              Voir les rappels
            </Button>
          </div>
        </motion.div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher une formation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="all">Toutes catégories</option>
          {trainingCategories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as TrainingStatus | 'all')}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="all">Tous statuts</option>
          <option value="not_started">Non commencé</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminé</option>
          <option value="overdue">En retard</option>
        </select>
        {isAdmin && (
          <Button onClick={() => setShowCreateModal(true)} className="bg-sky-500 hover:bg-sky-600">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle formation
          </Button>
        )}
      </div>

      {/* Training Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTrainings.map((training, index) => {
          const progress = getUserProgress(training.id)
          const category = trainingCategories.find(c => c.id === training.category)
          const isOverdue = training.dueDate && new Date(training.dueDate) < new Date() && progress?.status !== 'completed'
          
          return (
            <motion.div
              key={training.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all cursor-pointer ${
                isOverdue ? 'border-red-300' : ''
              }`}
              onClick={() => {
                setSelectedTraining(training)
                setSelectedProgress(progress || null)
                setViewMode('detail')
              }}
            >
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={`${PRIORITY_CONFIG[training.priority].color} text-white text-xs`}>
                    {PRIORITY_CONFIG[training.priority].label}
                  </Badge>
                  {progress && (
                    <Badge className={`${STATUS_CONFIG[progress.status].bgColor} ${STATUS_CONFIG[progress.status].color}`}>
                      {STATUS_CONFIG[progress.status].label}
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 line-clamp-2">{training.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{training.description}</p>
              </div>
              
              {/* Progress */}
              <div className="p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Progression</span>
                  <span className="text-sm font-semibold text-gray-900">{progress?.progress || 0}%</span>
                </div>
                <Progress value={progress?.progress || 0} className="h-2" />
              </div>
              
              {/* Footer */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDuration(training.duration)}
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {training.modules.length} modules
                  </div>
                </div>
                {training.dueDate && (
                  <div className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    {isOverdue ? 'En retard - ' : 'Échéance: '}
                    {formatDate(training.dueDate)}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {filteredTrainings.length === 0 && (
        <div className="text-center py-12">
          <GraduationCap className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Aucune formation trouvée</p>
        </div>
      )}
    </div>
  )

  // Render detail view
  const renderDetailView = () => {
    if (!selectedTraining) return null
    
    const progress = selectedProgress || getUserProgress(selectedTraining.id)
    const category = trainingCategories.find(c => c.id === selectedTraining.category)
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setViewMode('list')}>
            <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
            Retour
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{selectedTraining.title}</h2>
            <p className="text-gray-500">{category?.name} • {formatDuration(selectedTraining.duration)}</p>
          </div>
          {progress?.status === 'completed' && selectedTraining.certificateEnabled && (
            <Button className="bg-green-500 hover:bg-green-600">
              <Award className="h-4 w-4 mr-2" />
              Télécharger certificat
            </Button>
          )}
        </div>

        {/* Progress Card */}
        {progress && progress.status !== 'not_started' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Votre progression</p>
                  <p className="text-3xl font-bold text-sky-600">{progress.progress}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Temps passé</p>
                  <p className="text-lg font-semibold">{formatDuration(progress.timeSpent)}</p>
                </div>
              </div>
              <Progress value={progress.progress} className="h-3" />
              <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {progress.completedContents.length} contenus terminés
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <BookOpen className="h-4 w-4" />
                  {selectedTraining.modules.reduce((s, m) => s + m.contents.length, 0)} total
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modules */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Modules de formation</h3>
          
          {selectedTraining.modules.map((module, moduleIndex) => (
            <Card key={module.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold">
                    {moduleIndex + 1}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    {module.description && (
                      <CardDescription>{module.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {module.contents.map((content, contentIndex) => {
                    const ContentIcon = CONTENT_TYPE_ICONS[content.type]
                    const isCompleted = progress?.completedContents.includes(content.id)
                    const isCurrent = progress?.currentContentId === content.id
                    
                    return (
                      <div
                        key={content.id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          isCompleted ? 'bg-green-50' : isCurrent ? 'bg-sky-50 border border-sky-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {isCompleted ? <Check className="h-4 w-4" /> : <ContentIcon className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isCompleted ? 'text-green-700' : 'text-gray-900'}`}>
                            {content.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {content.type === 'video' ? 'Vidéo' : 
                             content.type === 'document' ? 'Document' :
                             content.type === 'quiz' ? 'Quiz' : content.type}
                            {' • '}{formatDuration(content.duration)}
                            {content.isRequired && ' • Obligatoire'}
                          </p>
                        </div>
                        {!isCompleted && progress?.status !== 'completed' && (
                          <Button
                            size="sm"
                            className="bg-sky-500 hover:bg-sky-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!progress || progress.status === 'not_started') {
                                handleStartTraining(selectedTraining)
                              }
                              setTimeout(() => handleCompleteContent(content.id), 500)
                            }}
                          >
                            {progress?.status === 'not_started' ? 'Commencer' : 'Marquer terminé'}
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Due Date Warning */}
        {selectedTraining.dueDate && progress?.status !== 'completed' && (
          <div className={`p-4 rounded-lg ${
            new Date(selectedTraining.dueDate) < new Date() 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-amber-50 border border-amber-200'
          }`}>
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-5 w-5 ${
                new Date(selectedTraining.dueDate) < new Date() ? 'text-red-600' : 'text-amber-600'
              }`} />
              <div>
                <p className={`font-medium ${
                  new Date(selectedTraining.dueDate) < new Date() ? 'text-red-700' : 'text-amber-700'
                }`}>
                  {new Date(selectedTraining.dueDate) < new Date() 
                    ? 'Cette formation est en retard!' 
                    : `Date limite: ${formatDate(selectedTraining.dueDate)}`}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(selectedTraining.dueDate) < new Date()
                    ? 'Veuillez terminer cette formation dès que possible.'
                    : `Il vous reste ${Math.ceil((new Date(selectedTraining.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} jours.`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render admin view
  const renderAdminView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Gestion des formations</h2>
        <Button onClick={() => setShowCreateModal(true)} className="bg-sky-500 hover:bg-sky-600">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle formation
        </Button>
      </div>

      {/* Training Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium text-gray-500">Formation</th>
                <th className="text-left p-4 font-medium text-gray-500">Catégorie</th>
                <th className="text-left p-4 font-medium text-gray-500">Priorité</th>
                <th className="text-left p-4 font-medium text-gray-500">Assignée à</th>
                <th className="text-left p-4 font-medium text-gray-500">Progression</th>
                <th className="text-left p-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trainings.map(training => {
                const category = trainingCategories.find(c => c.id === training.category)
                const progressList = userProgress.filter(p => p.trainingId === training.id)
                const completedCount = progressList.filter(p => p.status === 'completed').length
                
                return (
                  <tr key={training.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{training.title}</p>
                        <p className="text-sm text-gray-500">{formatDuration(training.duration)}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{category?.name}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={`${PRIORITY_CONFIG[training.priority].color} text-white`}>
                        {PRIORITY_CONFIG[training.priority].label}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex -space-x-2">
                        {training.assignedTo.slice(0, 4).map((userId, i) => (
                          <Avatar key={userId} className="h-8 w-8 border-2 border-white">
                            <AvatarFallback className="text-xs">
                              {userId.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {training.assignedTo.length > 4 && (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium border-2 border-white">
                            +{training.assignedTo.length - 4}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="w-24">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{completedCount}/{training.assignedTo.length}</span>
                        </div>
                        <Progress value={(completedCount / training.assignedTo.length) * 100} className="h-2" />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedTraining(training)
                          setShowAssignModal(true)
                        }}>
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Progress by User */}
      <Card>
        <CardHeader>
          <CardTitle>Suivi par employé</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-500">Employé</th>
                <th className="text-left p-3 font-medium text-gray-500">Formation</th>
                <th className="text-left p-3 font-medium text-gray-500">Statut</th>
                <th className="text-left p-3 font-medium text-gray-500">Progression</th>
                <th className="text-left p-3 font-medium text-gray-500">Rappels</th>
                <th className="text-left p-3 font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {userProgress.map(prog => {
                const training = trainings.find(t => t.id === prog.trainingId)
                if (!training) return null
                
                return (
                  <tr key={prog.id} className="border-b">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{prog.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{prog.userName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{training.title}</td>
                    <td className="p-3">
                      <Badge className={`${STATUS_CONFIG[prog.status].bgColor} ${STATUS_CONFIG[prog.status].color}`}>
                        {STATUS_CONFIG[prog.status].label}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="w-24">
                        <Progress value={prog.progress} className="h-2" />
                        <span className="text-xs text-gray-500">{prog.progress}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Bell className="h-4 w-4 text-gray-400" />
                        <span className={prog.remindersSent > 2 ? 'text-red-600 font-medium' : ''}>
                          {prog.remindersSent}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSendReminder(prog.userId, prog.trainingId)}
                        disabled={prog.status === 'completed'}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Rappeler
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-sky-500" />
            Formation
          </h2>
        </div>
        <nav className="flex-1 p-2">
          <button
            onClick={() => setViewMode('list')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-sky-50 text-sky-600' : 'hover:bg-gray-50'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            Mes formations
          </button>
          <button
            onClick={() => setShowReminderModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50"
          >
            <Bell className="h-5 w-5" />
            Rappels
            {unreadReminders.length > 0 && (
              <Badge className="bg-red-500 text-white ml-auto">{unreadReminders.length}</Badge>
            )}
          </button>
          <button
            onClick={() => setViewMode('stats')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              viewMode === 'stats' ? 'bg-sky-50 text-sky-600' : 'hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            Statistiques
          </button>
          {isAdmin && (
            <>
              <div className="border-t my-2" />
              <button
                onClick={() => setViewMode('admin')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  viewMode === 'admin' ? 'bg-sky-50 text-sky-600' : 'hover:bg-gray-50'
                }`}
              >
                <Settings className="h-5 w-5" />
                Administration
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {viewMode === 'list' && renderListView()}
        {viewMode === 'detail' && renderDetailView()}
        {viewMode === 'admin' && renderAdminView()}
        {viewMode === 'stats' && (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Statistiques détaillées à venir</p>
          </div>
        )}
      </div>

      {/* Create Training Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle formation</DialogTitle>
            <DialogDescription>
              Créez une nouvelle formation pour vos employés.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Titre *</Label>
              <Input
                value={newTraining.title}
                onChange={(e) => setNewTraining({ ...newTraining, title: e.target.value })}
                placeholder="Titre de la formation"
              />
            </div>
            <div>
              <Label>Description *</Label>
              <textarea
                value={newTraining.description}
                onChange={(e) => setNewTraining({ ...newTraining, description: e.target.value })}
                placeholder="Description de la formation"
                className="w-full min-h-[100px] p-2 border rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Catégorie</Label>
                <select
                  value={newTraining.category}
                  onChange={(e) => setNewTraining({ ...newTraining, category: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  {trainingCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Priorité</Label>
                <select
                  value={newTraining.priority}
                  onChange={(e) => setNewTraining({ ...newTraining, priority: e.target.value as TrainingPriority })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="mandatory">Obligatoire</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newTraining.certificateEnabled}
                  onChange={(e) => setNewTraining({ ...newTraining, certificateEnabled: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Certificat à la fin</span>
              </label>
            </div>
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
              <p className="text-sm text-sky-700">
                <strong>Note:</strong> Après création, vous pourrez ajouter des modules et des contenus à cette formation.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Annuler</Button>
            <Button onClick={handleCreateTraining} className="bg-sky-500 hover:bg-sky-600">
              Créer la formation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reminders Modal */}
      <Dialog open={showReminderModal} onOpenChange={setShowReminderModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Rappels de formation</DialogTitle>
            <DialogDescription>
              Formations nécessitant votre attention
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
            {reminders.filter(r => r.userId === user.id).map(reminder => (
              <div
                key={reminder.id}
                className={`p-3 rounded-lg border ${reminder.isRead ? 'bg-gray-50' : 'bg-amber-50 border-amber-200'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    reminder.type === 'not_started' ? 'bg-gray-200' : 'bg-amber-200'
                  }`}>
                    <Bell className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{reminder.trainingTitle}</p>
                    <p className="text-sm text-gray-600">{reminder.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(reminder.sentAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {reminders.filter(r => r.userId === user.id).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>Aucun rappel</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setReminders(reminders.map(r => ({ ...r, isRead: true })))
              setShowReminderModal(false)
            }}>
              Marquer tout comme lu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

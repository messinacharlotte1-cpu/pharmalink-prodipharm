'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Users, Video, Phone, Calendar, MessageSquare, FileText, Settings,
  ChevronRight, ChevronDown, Plus, Search, Hash, Lock, Mic, MicOff,
  Video as VideoIcon, VideoOff, PhoneOff, MonitorUp, UserPlus, Send,
  Paperclip, Smile, MoreHorizontal, Pin, Reply, Trash2, Edit, AtSign,
  Bold, Italic, Underline, List, Link2, Image, Clock, Star, Check, X,
  User, Bell, HelpCircle, Store, Sparkles, Download, Share2, Bookmark,
  Moon, Sun, Filter, Layout, Info, Hand, UsersRound, Clipboard, FileCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import VideoCallModal from '@/components/VideoCallModal'

// ============================================
// TEAMS TYPES
// ============================================

type PresenceStatus = 'online' | 'away' | 'busy' | 'dnd' | 'offline'
type ChannelType = 'public' | 'private' | 'direct'
type NavItemType = 'activity' | 'chat' | 'teams' | 'calendar' | 'calls' | 'files'

interface TeamMember {
  id: string
  userId: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'admin' | 'member'
  presence: PresenceStatus
  statusMessage?: string
}

interface TeamChannel {
  id: string
  teamId: string
  name: string
  description?: string
  type: ChannelType
  unreadCount?: number
  isPinned?: boolean
  createdBy?: string
  createdAt?: string
}

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: string
  reactions?: { emoji: string; count: number; users: string[] }[]
  isPinned?: boolean
  isBookmarked?: boolean
  replies?: ChatMessage[]
  attachments?: MessageAttachment[]
  isEdited?: boolean
  replyTo?: { id: string; senderName: string; content: string }
}

interface MessageAttachment {
  id: string
  name: string
  type: string
  size: number
  url: string
}

interface DirectMessage {
  id: string
  participants: TeamMember[]
  lastMessage?: ChatMessage
  unreadCount?: number
  isPinned?: boolean
}

interface Meeting {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  organizerId: string
  organizerName: string
  participants: { id: string; name: string; email: string }[]
  teamId?: string
  channelId?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  isRecurring?: boolean
  meetingLink?: string
}

interface Team {
  id: string
  name: string
  description?: string
  members: TeamMember[]
  channels: TeamChannel[]
  owner: string
  avatar?: string
  createdAt: string
}

interface SharedFile {
  id: string
  name: string
  type: string
  size: number
  uploadedBy: string
  uploadedAt: string
  teamId?: string
  channelId?: string
  url: string
}

interface ActivityItem {
  id: string
  type: 'message' | 'mention' | 'reaction' | 'file' | 'meeting' | 'team'
  content: string
  timestamp: string
  userId: string
  userName: string
  teamId?: string
  channelId?: string
  isRead?: boolean
}

// ============================================
// SAMPLE DATA
// ============================================

const sampleMembers: TeamMember[] = [
  { id: 'tm1', userId: 'u1', name: 'Jean Moussombi', email: 'jean@prodipharm.com', role: 'owner', presence: 'online', statusMessage: 'Disponible' },
  { id: 'tm2', userId: 'u5', name: 'Pierre Kamga', email: 'pierre@prodipharm.com', role: 'admin', presence: 'busy', statusMessage: 'En réunion' },
  { id: 'tm3', userId: 'dm1', name: 'Marie Dupont', email: 'marie@prodipharm.com', role: 'member', presence: 'online' },
  { id: 'tm4', userId: 'u2', name: 'Marie Ngono', email: 'marie.ngono@prodipharm.com', role: 'owner', presence: 'away', statusMessage: 'De retour dans 30 min' },
  { id: 'tm5', userId: 'u6', name: 'Marie Tchinda', email: 'marie.tchinda@prodipharm.com', role: 'member', presence: 'offline' },
  { id: 'tm6', userId: 'u7', name: 'Paul Nguema', email: 'paul@prodipharm.com', role: 'member', presence: 'dnd', statusMessage: 'En concentration' },
]

const sampleTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Équipe Réglementaire',
    description: 'Affaires réglementaires et AMM',
    members: sampleMembers.slice(0, 3),
    channels: [
      { id: 'ch1', teamId: 'team-1', name: 'Général', type: 'public', unreadCount: 3, description: 'Discussions générales de l\'équipe', createdBy: 'u1', createdAt: '2025-01-15' },
      { id: 'ch2', teamId: 'team-1', name: 'AMM Cameroun', type: 'public', description: 'Dossiers AMM pour le Cameroun', createdBy: 'u5', createdAt: '2025-01-20' },
      { id: 'ch3', teamId: 'team-1', name: 'Urgences', type: 'private', isPinned: true, description: 'Canal pour les urgences uniquement', createdBy: 'u1', createdAt: '2025-01-10' },
    ],
    owner: 'u1',
    createdAt: '2025-01-10'
  },
  {
    id: 'team-2',
    name: 'Équipe Commerciale',
    description: 'Force de vente',
    members: sampleMembers.slice(3, 5),
    channels: [
      { id: 'ch4', teamId: 'team-2', name: 'Général', type: 'public', unreadCount: 5, description: 'Discussions générales', createdBy: 'u2', createdAt: '2025-01-12' },
      { id: 'ch5', teamId: 'team-2', name: 'Visites terrain', type: 'public', description: 'Comptes-rendus de visites', createdBy: 'u2', createdAt: '2025-01-18' },
    ],
    owner: 'u2',
    createdAt: '2025-01-12'
  }
]

const sampleMessages: ChatMessage[] = [
  {
    id: 'm1',
    senderId: 'u5',
    senderName: 'Pierre Kamga',
    content: 'Bonjour à tous ! J\'ai besoin de votre avis sur le dossier AMM pour le Cameroun. Le dossier CTD est presque prêt, mais j\'aurais besoin de vos retours sur la partie qualité.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    reactions: [{ emoji: '👍', count: 2, users: ['u1', 'dm1'] }],
    isPinned: true
  },
  {
    id: 'm2',
    senderId: 'u1',
    senderName: 'Jean Moussombi',
    content: 'Je regarde ça tout de suite Pierre. Le dossier CTD est prêt. Je te propose une réunion demain matin pour en discuter.',
    timestamp: new Date(Date.now() - 3000000).toISOString(),
    replyTo: { id: 'm1', senderName: 'Pierre Kamga', content: 'Bonjour à tous ! J\'ai besoin de votre avis...' }
  },
  {
    id: 'm3',
    senderId: 'dm1',
    senderName: 'Marie Dupont',
    content: 'Parfait ! J\'ai aussi préparé les documents complémentaires pour la soumission. Je les joins au message.',
    timestamp: new Date(Date.now() - 2400000).toISOString(),
    reactions: [{ emoji: '🎉', count: 1, users: ['u5'] }],
    attachments: [
      { id: 'att1', name: 'Document_AMM_Cameroun.pdf', type: 'application/pdf', size: 2456000, url: '/files/amm.pdf' }
    ]
  },
  {
    id: 'm4',
    senderId: 'u5',
    senderName: 'Pierre Kamga',
    content: 'Excellent travail Marie ! Je vais examiner les documents et vous reviens rapidement.',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    reactions: [{ emoji: '💪', count: 2, users: ['u1', 'dm1'] }]
  },
]

const sampleDirectMessages: DirectMessage[] = [
  {
    id: 'dm1',
    participants: [sampleMembers[0], sampleMembers[1]],
    lastMessage: {
      id: 'dm-m1',
      senderId: 'u5',
      senderName: 'Pierre Kamga',
      content: 'Tu as un moment pour discuter du dossier ?',
      timestamp: new Date(Date.now() - 600000).toISOString()
    },
    unreadCount: 1
  },
  {
    id: 'dm2',
    participants: [sampleMembers[0], sampleMembers[2]],
    lastMessage: {
      id: 'dm-m2',
      senderId: 'dm1',
      senderName: 'Marie Dupont',
      content: 'Les documents sont prêts.',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  }
]

const sampleMeetings: Meeting[] = [
  {
    id: 'meet1',
    title: 'Revue AMM Cameroun',
    description: 'Réunion de suivi du dossier AMM pour le Cameroun',
    startTime: new Date(Date.now() + 3600000).toISOString(),
    endTime: new Date(Date.now() + 7200000).toISOString(),
    organizerId: 'u1',
    organizerName: 'Jean Moussombi',
    participants: [
      { id: 'u5', name: 'Pierre Kamga', email: 'pierre@prodipharm.com' },
      { id: 'dm1', name: 'Marie Dupont', email: 'marie@prodipharm.com' }
    ],
    teamId: 'team-1',
    channelId: 'ch2',
    status: 'scheduled',
    meetingLink: 'https://meet.pharmalink.com/amm-cameroun'
  },
  {
    id: 'meet2',
    title: 'Point commercial hebdomadaire',
    description: 'Revue des performances de la semaine',
    startTime: new Date(Date.now() + 86400000).toISOString(),
    endTime: new Date(Date.now() + 90000000).toISOString(),
    organizerId: 'u2',
    organizerName: 'Marie Ngono',
    participants: sampleMembers.slice(3).map(m => ({ id: m.userId, name: m.name, email: m.email })),
    teamId: 'team-2',
    status: 'scheduled',
    isRecurring: true
  }
]

const sampleSharedFiles: SharedFile[] = [
  { id: 'f1', name: 'Procedure_AMM_Cameroun.pdf', type: 'application/pdf', size: 2456000, uploadedBy: 'Pierre Kamga', uploadedAt: new Date(Date.now() - 86400000).toISOString(), teamId: 'team-1', channelId: 'ch2', url: '/files/procedure.pdf' },
  { id: 'f2', name: 'Rapport_Visite_Fevrier.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 156000, uploadedBy: 'Marie Ngono', uploadedAt: new Date(Date.now() - 172800000).toISOString(), teamId: 'team-2', url: '/files/rapport.xlsx' },
  { id: 'f3', name: 'Presentation_Qualite.pptx', type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: 5670000, uploadedBy: 'Jean Moussombi', uploadedAt: new Date(Date.now() - 259200000).toISOString(), teamId: 'team-1', url: '/files/presentation.pptx' },
]

const sampleActivities: ActivityItem[] = [
  { id: 'act1', type: 'mention', content: 'Pierre Kamga vous a mentionné dans #AMM Cameroun', timestamp: new Date(Date.now() - 300000).toISOString(), userId: 'u5', userName: 'Pierre Kamga', teamId: 'team-1', channelId: 'ch2', isRead: false },
  { id: 'act2', type: 'reaction', content: 'Marie Dupont a réagi à votre message', timestamp: new Date(Date.now() - 600000).toISOString(), userId: 'dm1', userName: 'Marie Dupont', isRead: false },
  { id: 'act3', type: 'meeting', content: 'Réunion "Revue AMM Cameroun" dans 1 heure', timestamp: new Date(Date.now() - 900000).toISOString(), userId: 'u1', userName: 'Jean Moussombi', isRead: true },
]

const PRESENCE_CONFIG: Record<PresenceStatus, { label: string; color: string }> = {
  'online': { label: 'Disponible', color: 'bg-green-500' },
  'away': { label: 'Absent', color: 'bg-yellow-500' },
  'busy': { label: 'Occupé', color: 'bg-red-500' },
  'dnd': { label: 'Ne pas déranger', color: 'bg-red-600' },
  'offline': { label: 'Hors ligne', color: 'bg-gray-400' }
}

const EMOJI_OPTIONS = ['👍', '👎', '😄', '🎉', '❤️', '🚀', '👀', '💪', '🙏', '✅']

// ============================================
// MAIN COMPONENT
// ============================================

interface TeamsModuleProps {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export default function TeamsModule({ user }: TeamsModuleProps) {
  // Navigation State
  const [activeNav, setActiveNav] = useState<NavItemType>('teams')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<TeamChannel | null>(null)
  const [selectedDirectMessage, setSelectedDirectMessage] = useState<DirectMessage | null>(null)
  
  // Data State
  const [teams, setTeams] = useState<Team[]>(sampleTeams)
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    'ch1': sampleMessages,
    'ch2': [],
    'ch3': [],
    'ch4': [],
    'ch5': []
  })
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>(sampleDirectMessages)
  const [meetings, setMeetings] = useState<Meeting[]>(sampleMeetings)
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>(sampleSharedFiles)
  const [activities, setActivities] = useState<ActivityItem[]>(sampleActivities)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPresence, setCurrentPresence] = useState<PresenceStatus>('online')
  const [statusMessage, setStatusMessage] = useState('')
  
  // UI State
  const [showNewTeamModal, setShowNewTeamModal] = useState(false)
  const [showNewChannelModal, setShowNewChannelModal] = useState(false)
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false)
  const [showPresenceMenu, setShowPresenceMenu] = useState(false)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null)
  const [activeCall, setActiveCall] = useState<{ roomName: string; displayName: string; isAudioOnly?: boolean } | null>(null)
  const [expandedTeams, setExpandedTeams] = useState<string[]>(['team-1', 'team-2'])
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showMeetingDetails, setShowMeetingDetails] = useState(false)
  
  // Form State
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDesc, setNewTeamDesc] = useState('')
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDesc, setNewChannelDesc] = useState('')
  const [newChannelPrivate, setNewChannelPrivate] = useState(false)
  const [newMeetingTitle, setNewMeetingTitle] = useState('')
  const [newMeetingDesc, setNewMeetingDesc] = useState('')
  const [newMeetingDate, setNewMeetingDate] = useState('')
  const [newMeetingTime, setNewMeetingTime] = useState('')
  const [newMeetingDuration, setNewMeetingDuration] = useState('60')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedChannel])

  // Handlers
  const toggleTeamExpanded = (teamId: string) => {
    setExpandedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    )
  }

  const getCurrentChannelMessages = useCallback(() => {
    if (!selectedChannel) return []
    return messages[selectedChannel.id] || []
  }, [selectedChannel, messages])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChannel) return
    
    const message: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      content: newMessage,
      timestamp: new Date().toISOString(),
      replyTo: replyingTo ? { id: replyingTo.id, senderName: replyingTo.senderName, content: replyingTo.content.substring(0, 50) + '...' } : undefined
    }
    
    setMessages(prev => ({
      ...prev,
      [selectedChannel.id]: [...(prev[selectedChannel.id] || []), message]
    }))
    setNewMessage('')
    setReplyingTo(null)
    
    // Simulate response for demo
    setTimeout(() => {
      const responses = [
        "D'accord, je note ça !",
        "Merci pour l'information.",
        "Je vais regarder et je reviens vers toi.",
        "Très bien, on en discute en réunion.",
        "Excellente idée !"
      ]
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      const randomMember = selectedTeam?.members.find(m => m.userId !== user.id)
      
      if (randomMember) {
        const responseMessage: ChatMessage = {
          id: `m-${Date.now()}-resp`,
          senderId: randomMember.userId,
          senderName: randomMember.name,
          content: randomResponse,
          timestamp: new Date().toISOString()
        }
        setMessages(prev => ({
          ...prev,
          [selectedChannel.id]: [...(prev[selectedChannel.id] || []), responseMessage]
        }))
      }
    }, 2000)
  }

  const handleEditMessage = (message: ChatMessage) => {
    setEditingMessage(message)
    setNewMessage(message.content)
    setShowMessageMenu(null)
    messageInputRef.current?.focus()
  }

  const handleSaveEdit = () => {
    if (!editingMessage || !selectedChannel || !newMessage.trim()) return
    
    setMessages(prev => ({
      ...prev,
      [selectedChannel.id]: prev[selectedChannel.id]?.map(m => 
        m.id === editingMessage.id 
          ? { ...m, content: newMessage, isEdited: true }
          : m
      ) || []
    }))
    setEditingMessage(null)
    setNewMessage('')
  }

  const handleDeleteMessage = (messageId: string) => {
    if (!selectedChannel) return
    
    setMessages(prev => ({
      ...prev,
      [selectedChannel.id]: prev[selectedChannel.id]?.filter(m => m.id !== messageId) || []
    }))
    setShowMessageMenu(null)
    toast({ title: 'Message supprimé', description: 'Le message a été supprimé' })
  }

  const handlePinMessage = (message: ChatMessage) => {
    if (!selectedChannel) return
    
    setMessages(prev => ({
      ...prev,
      [selectedChannel.id]: prev[selectedChannel.id]?.map(m => 
        m.id === message.id 
          ? { ...m, isPinned: !m.isPinned }
          : m
      ) || []
    }))
    setShowMessageMenu(null)
    toast({ 
      title: message.isPinned ? 'Message désépinglé' : 'Message épinglé',
      description: message.isPinned ? 'Le message a été désépinglé' : 'Le message a été épinglé'
    })
  }

  const handleAddReaction = (messageId: string, emoji: string) => {
    if (!selectedChannel) return
    
    setMessages(prev => ({
      ...prev,
      [selectedChannel.id]: prev[selectedChannel.id]?.map(m => {
        if (m.id !== messageId) return m
        
        const reactions = m.reactions || []
        const existingReaction = reactions.find(r => r.emoji === emoji)
        
        if (existingReaction) {
          if (existingReaction.users.includes(user.id)) {
            // Remove user's reaction
            const newUsers = existingReaction.users.filter(u => u !== user.id)
            if (newUsers.length === 0) {
              return { ...m, reactions: reactions.filter(r => r.emoji !== emoji) }
            }
            return {
              ...m,
              reactions: reactions.map(r => 
                r.emoji === emoji 
                  ? { ...r, count: newUsers.length, users: newUsers }
                  : r
              )
            }
          } else {
            // Add user's reaction
            return {
              ...m,
              reactions: reactions.map(r => 
                r.emoji === emoji 
                  ? { ...r, count: r.count + 1, users: [...r.users, user.id] }
                  : r
              )
            }
          }
        } else {
          // New reaction
          return {
            ...m,
            reactions: [...reactions, { emoji, count: 1, users: [user.id] }]
          }
        }
      }) || []
    }))
    setShowEmojiPicker(null)
  }

  const handleStartCall = (isVideo: boolean) => {
    const callRoom = {
      roomName: `call-${Date.now()}`,
      displayName: selectedChannel?.name || selectedDirectMessage?.participants.map(p => p.name).join(' & ') || 'Appel',
      isAudioOnly: !isVideo
    }
    setActiveCall(callRoom)
    setShowVideoCall(true)
  }

  const handleEndCall = () => {
    setShowVideoCall(false)
    setActiveCall(null)
  }

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return
    
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: newTeamName,
      description: newTeamDesc,
      members: [{ 
        id: `tm-${Date.now()}`, 
        userId: user.id, 
        name: user.name, 
        email: user.email, 
        role: 'owner', 
        presence: 'online' 
      }],
      channels: [{ 
        id: `ch-${Date.now()}`, 
        teamId: `team-${Date.now()}`, 
        name: 'Général', 
        type: 'public',
        description: 'Canal général de l\'équipe',
        createdBy: user.id,
        createdAt: new Date().toISOString()
      }],
      owner: user.id,
      createdAt: new Date().toISOString()
    }
    
    setTeams([...teams, newTeam])
    setMessages(prev => ({ ...prev, [newTeam.channels[0].id]: [] }))
    setNewTeamName('')
    setNewTeamDesc('')
    setShowNewTeamModal(false)
    toast({ title: 'Équipe créée', description: `L'équipe "${newTeamName}" a été créée avec succès` })
  }

  const handleCreateChannel = () => {
    if (!newChannelName.trim() || !selectedTeam) return
    
    const newChannel: TeamChannel = {
      id: `ch-${Date.now()}`,
      teamId: selectedTeam.id,
      name: newChannelName,
      description: newChannelDesc,
      type: newChannelPrivate ? 'private' : 'public',
      createdBy: user.id,
      createdAt: new Date().toISOString()
    }
    
    setTeams(teams.map(t => 
      t.id === selectedTeam.id 
        ? { ...t, channels: [...t.channels, newChannel] }
        : t
    ))
    setMessages(prev => ({ ...prev, [newChannel.id]: [] }))
    setNewChannelName('')
    setNewChannelDesc('')
    setNewChannelPrivate(false)
    setShowNewChannelModal(false)
    toast({ title: 'Canal créé', description: `Le canal "${newChannelName}" a été créé` })
  }

  const handleCreateMeeting = () => {
    if (!newMeetingTitle.trim() || !newMeetingDate || !newMeetingTime) return
    
    const startDateTime = new Date(`${newMeetingDate}T${newMeetingTime}`)
    const endDateTime = new Date(startDateTime.getTime() + parseInt(newMeetingDuration) * 60000)
    
    const newMeeting: Meeting = {
      id: `meet-${Date.now()}`,
      title: newMeetingTitle,
      description: newMeetingDesc,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      organizerId: user.id,
      organizerName: user.name,
      participants: selectedTeam?.members.map(m => ({ id: m.userId, name: m.name, email: m.email })) || [],
      teamId: selectedTeam?.id,
      channelId: selectedChannel?.id,
      status: 'scheduled',
      meetingLink: `https://meet.pharmalink.com/${Date.now().toString(36)}`
    }
    
    setMeetings([...meetings, newMeeting])
    setNewMeetingTitle('')
    setNewMeetingDesc('')
    setNewMeetingDate('')
    setNewMeetingTime('')
    setNewMeetingDuration('60')
    setShowNewMeetingModal(false)
    toast({ title: 'Réunion créée', description: `La réunion "${newMeetingTitle}" a été planifiée` })
  }

  const handleJoinMeeting = (meeting: Meeting) => {
    setActiveCall({
      roomName: meeting.id,
      displayName: meeting.title
    })
    setShowVideoCall(true)
    setShowMeetingDetails(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !selectedChannel) return
    
    Array.from(files).forEach(file => {
      const newFile: SharedFile = {
        id: `f-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedBy: user.name,
        uploadedAt: new Date().toISOString(),
        teamId: selectedTeam?.id,
        channelId: selectedChannel.id,
        url: URL.createObjectURL(file)
      }
      
      setSharedFiles(prev => [...prev, newFile])
      
      // Also send a message about the file
      const message: ChatMessage = {
        id: `m-${Date.now()}`,
        senderId: user.id,
        senderName: user.name,
        content: `📁 Fichier partagé: ${file.name}`,
        timestamp: new Date().toISOString(),
        attachments: [{
          id: newFile.id,
          name: file.name,
          type: file.type,
          size: file.size,
          url: newFile.url
        }]
      }
      
      setMessages(prev => ({
        ...prev,
        [selectedChannel.id]: [...(prev[selectedChannel.id] || []), message]
      }))
    })
    
    toast({ title: 'Fichier partagé', description: `${files.length} fichier(s) partagé(s)` })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleStatusChange = (status: PresenceStatus) => {
    setCurrentPresence(status)
    setShowPresenceMenu(false)
    toast({ title: 'Statut mis à jour', description: `Vous êtes maintenant ${PRESENCE_CONFIG[status].label.toLowerCase()}` })
  }

  const handleAddMember = (email: string) => {
    if (!selectedTeam || !email.trim()) return
    
    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      userId: `u-${Date.now()}`,
      name: email.split('@')[0],
      email: email,
      role: 'member',
      presence: 'offline'
    }
    
    setTeams(teams.map(t => 
      t.id === selectedTeam.id 
        ? { ...t, members: [...t.members, newMember] }
        : t
    ))
    
    toast({ title: 'Membre ajouté', description: `${email} a été ajouté à l'équipe` })
    setShowAddMemberModal(false)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'À l\'instant'
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`
    if (diff < 86400000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatMeetingTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR', { 
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    })
  }

  // Filter teams by search
  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.channels.some(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Get upcoming meetings
  const upcomingMeetings = meetings
    .filter(m => new Date(m.startTime) > new Date() && m.status === 'scheduled')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  // Render Activity View
  const renderActivityView = () => (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Activité</h2>
      <div className="space-y-3">
        {activities.map(activity => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-4 rounded-lg border ${activity.isRead ? 'bg-white' : 'bg-sky-50 border-sky-200'}`}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-sky-500 text-white">
                  {activity.userName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-gray-900">{activity.content}</p>
                <p className="text-xs text-gray-500 mt-1">{formatTime(activity.timestamp)}</p>
              </div>
              {!activity.isRead && (
                <div className="w-2 h-2 rounded-full bg-sky-500" />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )

  // Render Chat View (Direct Messages)
  const renderChatView = () => (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="h-14 bg-white border-b px-4 flex items-center justify-between shrink-0">
        <h3 className="font-semibold">Messages directs</h3>
        <Button size="sm" variant="outline" onClick={() => toast({ title: 'Nouvelle conversation', description: 'Fonctionnalité à venir' })}>
          <Plus className="h-4 w-4 mr-1" />
          Nouveau
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {directMessages.map(dm => (
          <button
            key={dm.id}
            onClick={() => {
              setSelectedDirectMessage(dm)
              setSelectedChannel(null)
            }}
            className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
              selectedDirectMessage?.id === dm.id ? 'bg-sky-100' : 'hover:bg-gray-100'
            }`}
          >
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-sky-500 text-white">
                  {dm.participants.find(p => p.userId !== user.id)?.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                PRESENCE_CONFIG[dm.participants.find(p => p.userId !== user.id)?.presence || 'offline'].color
              }`} />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-medium truncate">
                {dm.participants.filter(p => p.userId !== user.id).map(p => p.name).join(', ')}
              </p>
              <p className="text-sm text-gray-500 truncate">{dm.lastMessage?.content}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">{dm.lastMessage ? formatTime(dm.lastMessage.timestamp) : ''}</p>
              {dm.unreadCount && dm.unreadCount > 0 && (
                <Badge className="bg-sky-500 text-white text-xs mt-1">{dm.unreadCount}</Badge>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  // Render Calendar View
  const renderCalendarView = () => (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Calendrier</h2>
        <Button onClick={() => setShowNewMeetingModal(true)} className="bg-sky-500 hover:bg-sky-600">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle réunion
        </Button>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Réunions à venir</h3>
        {upcomingMeetings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune réunion planifiée</p>
          </div>
        ) : (
          upcomingMeetings.map(meeting => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-white rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { setSelectedMeeting(meeting); setShowMeetingDetails(true) }}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-sky-600">
                      {new Date(meeting.startTime).getDate()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(meeting.startTime).toLocaleDateString('fr-FR', { month: 'short' })}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{meeting.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatMeetingTime(meeting.startTime)} - {formatMeetingTime(meeting.endTime)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{meeting.participants.length + 1} participants</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">
                    {meeting.status === 'scheduled' ? 'Planifiée' : meeting.status}
                  </Badge>
                  {meeting.isRecurring && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      Récurrente
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )

  // Render Calls View
  const renderCallsView = () => (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-xl font-semibold mb-6">Appels</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Button 
          onClick={() => {
            setActiveCall({ roomName: `call-${Date.now()}`, displayName: 'Nouvel appel', isAudioOnly: false })
            setShowVideoCall(true)
          }}
          className="h-24 flex-col gap-2 bg-sky-500 hover:bg-sky-600"
        >
          <Video className="h-8 w-8" />
          <span>Nouvel appel vidéo</span>
        </Button>
        <Button 
          onClick={() => {
            setActiveCall({ roomName: `call-${Date.now()}`, displayName: 'Nouvel appel', isAudioOnly: true })
            setShowVideoCall(true)
          }}
          variant="outline"
          className="h-24 flex-col gap-2 border-sky-300 text-sky-600 hover:bg-sky-50"
        >
          <Phone className="h-8 w-8" />
          <span>Nouvel appel audio</span>
        </Button>
      </div>

      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Appels récents</h3>
      <div className="space-y-2">
        <div className="p-4 bg-white rounded-lg border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-sky-500 text-white">P</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">Pierre Kamga</p>
              <p className="text-sm text-gray-500">Appel vidéo • Hier, 14:30</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="text-sky-600">
              <Video className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="text-sky-600">
              <Phone className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  // Render Files View
  const renderFilesView = () => (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Fichiers partagés</h2>
        <Button onClick={() => fileInputRef.current?.click()} className="bg-sky-500 hover:bg-sky-600">
          <Upload className="h-4 w-4 mr-2" />
          Importer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sharedFiles.map(file => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Par {file.uploadedBy} • {formatTime(file.uploadedAt)}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-1" />
                Télécharger
              </Button>
              <Button size="sm" variant="ghost">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-60px)] bg-white overflow-hidden">
      {/* ==================== LEFT APP BAR (Microsoft Teams style - Sky Blue) ==================== */}
      <div className="w-16 bg-[#1e3a5f] flex flex-col items-center py-4 shrink-0">
        {/* User Avatar */}
        <div className="relative mb-6 cursor-pointer" onClick={() => setShowPresenceMenu(!showPresenceMenu)}>
          <Avatar className="h-10 w-10 border-2 border-transparent hover:border-sky-300 transition-colors">
            <AvatarFallback className="bg-gradient-to-br from-sky-400 to-cyan-500 text-white font-semibold">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1e3a5f] ${PRESENCE_CONFIG[currentPresence].color}`} />
          
          {/* Presence Menu */}
          {showPresenceMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute left-14 top-0 bg-white rounded-lg shadow-xl border p-3 z-50 min-w-[220px]"
            >
              <div className="mb-3 pb-3 border-b">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-sky-400 to-cyan-500 text-white">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              </div>
              {Object.entries(PRESENCE_CONFIG).map(([status, config]) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status as PresenceStatus)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 ${
                    currentPresence === status ? 'bg-sky-50' : ''
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${config.color}`} />
                  <span className="text-sm">{config.label}</span>
                  {currentPresence === status && (
                    <Check className="h-4 w-4 text-sky-500 ml-auto" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Navigation Icons */}
        <nav className="flex flex-col gap-2">
          {[
            { id: 'activity' as NavItemType, icon: Activity, label: 'Activité', badge: activities.filter(a => !a.isRead).length },
            { id: 'chat' as NavItemType, icon: MessageSquare, label: 'Chat', badge: directMessages.reduce((sum, dm) => sum + (dm.unreadCount || 0), 0) },
            { id: 'teams' as NavItemType, icon: Users, label: 'Équipes' },
            { id: 'calendar' as NavItemType, icon: Calendar, label: 'Calendrier', badge: upcomingMeetings.length },
            { id: 'calls' as NavItemType, icon: Phone, label: 'Appels' },
            { id: 'files' as NavItemType, icon: FileText, label: 'Fichiers' },
          ].map(nav => (
            <button
              key={nav.id}
              onClick={() => setActiveNav(nav.id)}
              className={`relative w-12 h-12 flex items-center justify-center rounded-lg transition-all group ${
                activeNav === nav.id 
                  ? 'bg-sky-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-[#2d4a6f]'
              }`}
              title={nav.label}
            >
              <nav.icon className="h-6 w-6" />
              {/* Active indicator */}
              {activeNav === nav.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
              )}
              {/* Badge */}
              {nav.badge && nav.badge > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {nav.badge}
                </div>
              )}
              {/* Tooltip */}
              <span className="absolute left-16 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                {nav.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Bottom Icons */}
        <div className="mt-auto flex flex-col gap-2">
          <button className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2d4a6f] rounded-lg transition-colors">
            <Store className="h-6 w-6" />
          </button>
          <button className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2d4a6f] rounded-lg transition-colors">
            <HelpCircle className="h-6 w-6" />
          </button>
          <button className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2d4a6f] rounded-lg transition-colors">
            <Settings className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* ==================== TEAMS SIDEBAR (Sky Blue theme) ==================== */}
      <div className="w-64 bg-gradient-to-b from-[#0ea5e9] to-[#0284c7] flex flex-col shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold">
              {activeNav === 'teams' ? 'Équipes' : 
               activeNav === 'chat' ? 'Messages' :
               activeNav === 'activity' ? 'Activité' :
               activeNav === 'calendar' ? 'Calendrier' :
               activeNav === 'calls' ? 'Appels' : 'Fichiers'}
            </h2>
            {(activeNav === 'teams' || activeNav === 'chat') && (
              <button 
                onClick={() => activeNav === 'teams' ? setShowNewTeamModal(true) : toast({ title: 'Nouveau message' })}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <Input
              placeholder="Rechercher"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/10 border-0 text-white placeholder:text-white/50 focus-visible:ring-white/30"
            />
          </div>
        </div>

        {/* Content based on active nav */}
        {activeNav === 'teams' && (
          <div className="flex-1 overflow-y-auto">
            {filteredTeams.map(team => (
              <div key={team.id} className="border-b border-white/10">
                {/* Team Header */}
                <button
                  onClick={() => toggleTeamExpanded(team.id)}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                    selectedTeam?.id === team.id ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <ChevronRight className={`h-4 w-4 text-white/70 transition-transform ${
                    expandedTeams.includes(team.id) ? 'rotate-90' : ''
                  }`} />
                  <div className="w-7 h-7 rounded bg-gradient-to-br from-cyan-300 to-sky-500 flex items-center justify-center text-white text-xs font-semibold">
                    {team.name.charAt(0)}
                  </div>
                  <span className="flex-1 text-white text-sm font-medium truncate">{team.name}</span>
                  <span className="text-white/50 text-xs">{team.channels.length}</span>
                </button>

                {/* Channels */}
                {expandedTeams.includes(team.id) && (
                  <div className="pb-2">
                    {team.channels.map(channel => (
                      <button
                        key={channel.id}
                        onClick={() => { setSelectedTeam(team); setSelectedChannel(channel); setSelectedDirectMessage(null) }}
                        className={`w-full px-4 py-2 flex items-center gap-2 text-left transition-colors ${
                          selectedChannel?.id === channel.id 
                            ? 'bg-white/15 text-white' 
                            : 'text-white/80 hover:bg-white/5 hover:text-white'
                        }`}
                        style={{ paddingLeft: '2.5rem' }}
                      >
                        {channel.type === 'private' ? (
                          <Lock className="h-4 w-4 shrink-0" />
                        ) : (
                          <Hash className="h-4 w-4 shrink-0" />
                        )}
                        <span className="flex-1 text-sm truncate">{channel.name}</span>
                        {channel.unreadCount && channel.unreadCount > 0 && (
                          <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {channel.unreadCount}
                          </Badge>
                        )}
                      </button>
                    ))}
                    {/* Add Channel Button */}
                    <button
                      onClick={() => { setSelectedTeam(team); setShowNewChannelModal(true) }}
                      className="w-full px-4 py-2 flex items-center gap-2 text-left text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                      style={{ paddingLeft: '2.5rem' }}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-sm">Ajouter un canal</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeNav === 'chat' && (
          <div className="flex-1 overflow-y-auto p-2">
            {directMessages.map(dm => (
              <button
                key={dm.id}
                onClick={() => setSelectedDirectMessage(dm)}
                className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                  selectedDirectMessage?.id === dm.id ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-white/20 text-white text-sm">
                      {dm.participants.find(p => p.userId !== user.id)?.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0ea5e9] ${
                    PRESENCE_CONFIG[dm.participants.find(p => p.userId !== user.id)?.presence || 'offline'].color
                  }`} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-white text-sm font-medium truncate">
                    {dm.participants.filter(p => p.userId !== user.id).map(p => p.name).join(', ')}
                  </p>
                  <p className="text-white/60 text-xs truncate">{dm.lastMessage?.content}</p>
                </div>
                {dm.unreadCount && dm.unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white text-xs">{dm.unreadCount}</Badge>
                )}
              </button>
            ))}
          </div>
        )}

        {activeNav === 'calendar' && (
          <div className="flex-1 overflow-y-auto p-2">
            {upcomingMeetings.slice(0, 5).map(meeting => (
              <button
                key={meeting.id}
                onClick={() => { setSelectedMeeting(meeting); setShowMeetingDetails(true) }}
                className="w-full p-3 rounded-lg hover:bg-white/10 text-left mb-2"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-white/70" />
                  <span className="text-white text-sm font-medium">{meeting.title}</span>
                </div>
                <p className="text-white/60 text-xs">
                  {formatMeetingTime(meeting.startTime)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f5f5f7]">
        {activeNav !== 'teams' && activeNav !== 'chat' ? (
          <>
            {activeNav === 'activity' && renderActivityView()}
            {activeNav === 'calendar' && renderCalendarView()}
            {activeNav === 'calls' && renderCallsView()}
            {activeNav === 'files' && renderFilesView()}
          </>
        ) : selectedChannel ? (
          <>
            {/* Channel Header */}
            <div className="h-14 bg-white border-b px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {selectedChannel.type === 'private' ? (
                  <Lock className="h-5 w-5 text-gray-500" />
                ) : (
                  <Hash className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedChannel.name}</h3>
                  {selectedChannel.description && (
                    <p className="text-xs text-gray-500">{selectedChannel.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartCall(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm font-medium"
                >
                  <Video className="h-4 w-4" />
                  Appel vidéo
                </button>
                <button
                  onClick={() => handleStartCall(false)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Phone className="h-4 w-4" />
                  Appel
                </button>
                <button 
                  onClick={() => setShowRightPanel(!showRightPanel)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Users className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Channel Welcome */}
              <div className="text-center py-8 border-b">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center">
                  {selectedChannel.type === 'private' ? (
                    <Lock className="h-8 w-8 text-white" />
                  ) : (
                    <Hash className="h-8 w-8 text-white" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Bienvenue dans #{selectedChannel.name}</h2>
                <p className="text-gray-500">C'est le début du canal {selectedChannel.name}.</p>
              </div>

              {/* Pinned Messages */}
              {getCurrentChannelMessages().filter(m => m.isPinned).length > 0 && (
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sky-700 font-medium mb-2">
                    <Pin className="h-4 w-4" />
                    Messages épinglés
                  </div>
                  {getCurrentChannelMessages().filter(m => m.isPinned).map(msg => (
                    <div key={msg.id} className="text-sm text-gray-700 pl-6">
                      <span className="font-medium">{msg.senderName}:</span> {msg.content.substring(0, 100)}...
                    </div>
                  ))}
                </div>
              )}

              {/* Messages */}
              {getCurrentChannelMessages().map((message, i) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex gap-3 hover:bg-white/50 -mx-4 px-4 py-2 rounded-lg group ${
                    message.isPinned ? 'bg-sky-50/50' : ''
                  }`}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-sky-500 text-white">
                      {message.senderName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    {/* Reply indicator */}
                    {message.replyTo && (
                      <div className="mb-1 pl-2 border-l-2 border-gray-300 text-xs text-gray-500">
                        <span className="font-medium">{message.replyTo.senderName}</span>: {message.replyTo.content}
                      </div>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-900">{message.senderName}</span>
                      <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
                      {message.isEdited && (
                        <span className="text-xs text-gray-400">(modifié)</span>
                      )}
                    </div>
                    <p className="text-gray-700 mt-0.5">{message.content}</p>
                    
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map(att => (
                          <div key={att.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                            <FileText className="h-5 w-5 text-sky-500" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{att.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(att.size)}</p>
                            </div>
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {message.reactions.map((reaction, ri) => (
                          <button
                            key={ri}
                            onClick={() => handleAddReaction(message.id, reaction.emoji)}
                            className={`px-2 py-1 rounded-full border text-sm transition-colors ${
                              reaction.users.includes(user.id) 
                                ? 'bg-sky-100 border-sky-300' 
                                : 'bg-white hover:border-sky-300'
                            }`}
                          >
                            {reaction.emoji} <span className="text-gray-500">{reaction.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Hover Actions */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white rounded-lg border shadow-sm p-1 -mt-4 transition-opacity">
                    <button 
                      onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                      className="p-1.5 hover:bg-gray-100 rounded"
                    >
                      <Smile className="h-4 w-4 text-gray-500" />
                    </button>
                    <button 
                      onClick={() => setReplyingTo(message)}
                      className="p-1.5 hover:bg-gray-100 rounded"
                    >
                      <Reply className="h-4 w-4 text-gray-500" />
                    </button>
                    <button 
                      onClick={() => handlePinMessage(message)}
                      className="p-1.5 hover:bg-gray-100 rounded"
                    >
                      <Pin className={`h-4 w-4 ${message.isPinned ? 'text-sky-500' : 'text-gray-500'}`} />
                    </button>
                    <button 
                      onClick={() => handleEditMessage(message)}
                      className="p-1.5 hover:bg-gray-100 rounded"
                    >
                      <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button 
                      onClick={() => handleDeleteMessage(message.id)}
                      className="p-1.5 hover:bg-gray-100 rounded"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                    
                    {/* Emoji Picker */}
                    {showEmojiPicker === message.id && (
                      <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-xl border p-2 z-50 flex gap-1">
                        {EMOJI_OPTIONS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleAddReaction(message.id, emoji)}
                            className="p-1 hover:bg-gray-100 rounded text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            <div className="p-4 bg-white border-t shrink-0">
              {/* Reply indicator */}
              {replyingTo && (
                <div className="flex items-center justify-between bg-sky-50 px-3 py-2 rounded-t-lg border-b">
                  <div className="flex items-center gap-2 text-sm text-sky-700">
                    <Reply className="h-4 w-4" />
                    Répondre à <span className="font-medium">{replyingTo.senderName}</span>
                  </div>
                  <button onClick={() => setReplyingTo(null)}>
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              )}
              {/* Edit indicator */}
              {editingMessage && (
                <div className="flex items-center justify-between bg-yellow-50 px-3 py-2 rounded-t-lg border-b">
                  <div className="flex items-center gap-2 text-sm text-yellow-700">
                    <Edit className="h-4 w-4" />
                    Modifier le message
                  </div>
                  <button onClick={() => { setEditingMessage(null); setNewMessage('') }}>
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              )}
              <div className="bg-white border rounded-lg overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center gap-1 px-3 py-2 border-b bg-gray-50">
                  <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600"><Bold className="h-4 w-4" /></button>
                  <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600"><Italic className="h-4 w-4" /></button>
                  <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600"><Underline className="h-4 w-4" /></button>
                  <div className="w-px h-5 bg-gray-300 mx-1" />
                  <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600"><List className="h-4 w-4" /></button>
                  <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600"><Link2 className="h-4 w-4" /></button>
                  <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600"><AtSign className="h-4 w-4" /></button>
                  <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600"><Image className="h-4 w-4" /></button>
                </div>
                
                {/* Input */}
                <div className="flex items-end gap-2 p-3">
                  <textarea
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        if (editingMessage) {
                          handleSaveEdit()
                        } else {
                          handleSendMessage()
                        }
                      }
                    }}
                    placeholder={`Écrire un message dans #${selectedChannel.name}`}
                    className="flex-1 resize-none border-0 focus:ring-0 text-sm outline-none min-h-[40px] max-h-[120px]"
                    rows={1}
                  />
                  <div className="flex items-center gap-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                      <Smile className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={editingMessage ? handleSaveEdit : handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-full text-white transition-colors"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : selectedDirectMessage ? (
          /* Direct Message View */
          <>
            <div className="h-14 bg-white border-b px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-sky-500 text-white">
                    {selectedDirectMessage.participants.find(p => p.userId !== user.id)?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedDirectMessage.participants.filter(p => p.userId !== user.id).map(p => p.name).join(', ')}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {PRESENCE_CONFIG[selectedDirectMessage.participants.find(p => p.userId !== user.id)?.presence || 'offline'].label}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartCall(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm font-medium"
                >
                  <Video className="h-4 w-4" />
                  Appel vidéo
                </button>
                <button
                  onClick={() => handleStartCall(false)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Phone className="h-4 w-4" />
                  Appel
                </button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Conversation avec {selectedDirectMessage.participants.filter(p => p.userId !== user.id).map(p => p.name).join(', ')}</p>
                <p className="text-sm mt-2">Envoyez un message pour démarrer la conversation</p>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center">
                <Users className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Bienvenue dans Teams</h2>
              <p className="text-gray-500 mb-6">
                Sélectionnez une équipe et un canal pour commencer à collaborer avec vos collègues.
              </p>
              <Button onClick={() => setShowNewTeamModal(true)} className="bg-sky-500 hover:bg-sky-600">
                <Plus className="h-4 w-4 mr-2" />
                Créer une équipe
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ==================== RIGHT PANEL (Members) ==================== */}
      {selectedChannel && selectedTeam && showRightPanel && (
        <div className="w-72 bg-white border-l flex flex-col shrink-0">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Membres ({selectedTeam.members.length})</h3>
            <Button size="sm" variant="ghost" onClick={() => setShowAddMemberModal(true)}>
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {(['online', 'away', 'busy', 'dnd', 'offline'] as PresenceStatus[]).map(status => {
              const members = selectedTeam.members.filter(m => m.presence === status)
              if (members.length === 0) return null
              
              return (
                <div key={status} className="mb-4">
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {PRESENCE_CONFIG[status].label} ({members.length})
                  </div>
                  {members.map(member => (
                    <button
                      key={member.id}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${PRESENCE_CONFIG[member.presence].color}`} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                        {member.statusMessage && (
                          <p className="text-xs text-gray-500 truncate">{member.statusMessage}</p>
                        )}
                      </div>
                      {member.role === 'owner' && (
                        <Badge variant="outline" className="text-xs">Propriétaire</Badge>
                      )}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ==================== MODALS ==================== */}
      
      {/* New Team Modal */}
      <Dialog open={showNewTeamModal} onOpenChange={setShowNewTeamModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer une équipe</DialogTitle>
            <DialogDescription>
              Créez une équipe pour collaborer avec vos collègues.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nom de l'équipe</Label>
              <Input 
                placeholder="Ex: Équipe Marketing" 
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="mt-1.5" 
              />
            </div>
            <div>
              <Label>Description (optionnel)</Label>
              <Input 
                placeholder="Description de l'équipe" 
                value={newTeamDesc}
                onChange={(e) => setNewTeamDesc(e.target.value)}
                className="mt-1.5" 
              />
            </div>
            <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-sky-500 flex items-center justify-center text-white font-semibold">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Confidentialité</p>
                <p className="text-xs text-gray-500">Privé - Sur invitation uniquement</p>
              </div>
            </div>
            <Button 
              className="w-full bg-sky-500 hover:bg-sky-600"
              onClick={handleCreateTeam}
              disabled={!newTeamName.trim()}
            >
              Créer l'équipe
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Channel Modal */}
      <Dialog open={showNewChannelModal} onOpenChange={setShowNewChannelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un canal</DialogTitle>
            <DialogDescription>
              Les canaux organisent les conversations par thème.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nom du canal</Label>
              <Input 
                placeholder="Ex: annonces-générales" 
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="mt-1.5" 
              />
            </div>
            <div>
              <Label>Description (optionnel)</Label>
              <Input 
                placeholder="Description du canal" 
                value={newChannelDesc}
                onChange={(e) => setNewChannelDesc(e.target.value)}
                className="mt-1.5" 
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="private-channel"
                checked={newChannelPrivate}
                onChange={(e) => setNewChannelPrivate(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="private-channel" className="cursor-pointer">
                Canal privé (accès restreint)
              </Label>
            </div>
            <Button 
              className="w-full bg-sky-500 hover:bg-sky-600"
              onClick={handleCreateChannel}
              disabled={!newChannelName.trim()}
            >
              Créer le canal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Meeting Modal */}
      <Dialog open={showNewMeetingModal} onOpenChange={setShowNewMeetingModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Planifier une réunion</DialogTitle>
            <DialogDescription>
              Créez une réunion et invitez vos collègues.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Titre de la réunion</Label>
              <Input 
                placeholder="Ex: Revue hebdomadaire" 
                value={newMeetingTitle}
                onChange={(e) => setNewMeetingTitle(e.target.value)}
                className="mt-1.5" 
              />
            </div>
            <div>
              <Label>Description (optionnel)</Label>
              <Input 
                placeholder="Ordre du jour, objectifs..." 
                value={newMeetingDesc}
                onChange={(e) => setNewMeetingDesc(e.target.value)}
                className="mt-1.5" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={newMeetingDate}
                  onChange={(e) => setNewMeetingDate(e.target.value)}
                  className="mt-1.5" 
                />
              </div>
              <div>
                <Label>Heure</Label>
                <Input 
                  type="time" 
                  value={newMeetingTime}
                  onChange={(e) => setNewMeetingTime(e.target.value)}
                  className="mt-1.5" 
                />
              </div>
            </div>
            <div>
              <Label>Durée</Label>
              <select 
                value={newMeetingDuration}
                onChange={(e) => setNewMeetingDuration(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 heure</option>
                <option value="90">1h30</option>
                <option value="120">2 heures</option>
              </select>
            </div>
            <Button 
              className="w-full bg-sky-500 hover:bg-sky-600"
              onClick={handleCreateMeeting}
              disabled={!newMeetingTitle.trim() || !newMeetingDate || !newMeetingTime}
            >
              Planifier la réunion
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meeting Details Modal */}
      <Dialog open={showMeetingDetails} onOpenChange={setShowMeetingDetails}>
        <DialogContent className="sm:max-w-md">
          {selectedMeeting && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMeeting.title}</DialogTitle>
                <DialogDescription>{selectedMeeting.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock className="h-5 w-5 text-sky-500" />
                  <span>
                    {formatMeetingTime(selectedMeeting.startTime)} - {formatMeetingTime(selectedMeeting.endTime)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Users className="h-5 w-5 text-sky-500" />
                  <span>{selectedMeeting.participants.length + 1} participants</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Video className="h-5 w-5 text-sky-500" />
                  <span>Organisé par {selectedMeeting.organizerName}</span>
                </div>
                <div className="border-t pt-4">
                  <Label className="text-sm text-gray-500">Participants</Label>
                  <div className="mt-2 space-y-2">
                    {selectedMeeting.participants.map(p => (
                      <div key={p.id} className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-sky-100 text-sky-600 text-xs">
                            {p.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-sky-500 hover:bg-sky-600"
                    onClick={() => handleJoinMeeting(selectedMeeting)}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Rejoindre
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Ajouter au calendrier
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Member Modal */}
      <Dialog open={showAddMemberModal} onOpenChange={setShowAddMemberModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un membre</DialogTitle>
            <DialogDescription>
              Invitez un collègue à rejoindre l'équipe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Adresse email</Label>
              <Input 
                placeholder="collegue@prodipharm.com" 
                id="member-email"
                className="mt-1.5" 
              />
            </div>
            <Button 
              className="w-full bg-sky-500 hover:bg-sky-600"
              onClick={() => {
                const email = (document.getElementById('member-email') as HTMLInputElement)?.value
                handleAddMember(email)
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter à l'équipe
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Call Modal */}
      {showVideoCall && activeCall && (
        <VideoCallModal
          roomName={activeCall.roomName}
          userName={user.name}
          userEmail={user.email}
          displayName={activeCall.displayName}
          onClose={handleEndCall}
          isAudioOnly={activeCall.isAudioOnly}
        />
      )}
    </div>
  )
}

// Missing import fix
function Upload(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

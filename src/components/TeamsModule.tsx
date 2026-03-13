'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Users, Video, Phone, Calendar, MessageSquare, FileText, Settings,
  ChevronRight, ChevronDown, Plus, Search, Hash, Lock, Mic, MicOff,
  Video as VideoIcon, VideoOff, PhoneOff, MonitorUp, UserPlus, Send,
  Paperclip, Smile, MoreHorizontal, Pin, Reply, Trash2, Edit, AtSign,
  Bold, Italic, Underline, List, Link2, Image, Clock, Star, Check, X,
  User, Bell, HelpCircle, Store, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
}

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  reactions?: { emoji: string; count: number }[]
  isPinned?: boolean
  replies?: ChatMessage[]
}

interface Team {
  id: string
  name: string
  description?: string
  members: TeamMember[]
  channels: TeamChannel[]
  owner: string
}

// ============================================
// SAMPLE DATA
// ============================================

const sampleTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Équipe Réglementaire',
    description: 'Affaires réglementaires et AMM',
    members: [
      { id: 'tm1', userId: 'u1', name: 'Jean Moussombi', email: 'jean@prodipharm.com', role: 'owner', presence: 'online' },
      { id: 'tm2', userId: 'u5', name: 'Pierre Kamga', email: 'pierre@prodipharm.com', role: 'admin', presence: 'busy', statusMessage: 'En réunion' },
      { id: 'tm3', userId: 'dm1', name: 'Marie Dupont', email: 'marie@prodipharm.com', role: 'member', presence: 'online' },
    ],
    channels: [
      { id: 'ch1', teamId: 'team-1', name: 'Général', type: 'public', unreadCount: 3 },
      { id: 'ch2', teamId: 'team-1', name: 'AMM Cameroun', type: 'public' },
      { id: 'ch3', teamId: 'team-1', name: 'Urgences', type: 'private', isPinned: true },
    ],
    owner: 'u1'
  },
  {
    id: 'team-2',
    name: 'Équipe Commerciale',
    description: 'Force de vente',
    members: [
      { id: 'tm4', userId: 'u2', name: 'Marie Ngono', email: 'marie.ngono@prodipharm.com', role: 'owner', presence: 'online' },
      { id: 'tm5', userId: 'u6', name: 'Marie Tchinda', email: 'marie.tchinda@prodipharm.com', role: 'member', presence: 'offline' },
    ],
    channels: [
      { id: 'ch4', teamId: 'team-2', name: 'Général', type: 'public', unreadCount: 5 },
      { id: 'ch5', teamId: 'team-2', name: 'Visites terrain', type: 'public' },
    ],
    owner: 'u2'
  }
]

const sampleMessages: ChatMessage[] = [
  {
    id: 'm1',
    senderId: 'u5',
    senderName: 'Pierre Kamga',
    content: 'Bonjour à tous ! J\'ai besoin de votre avis sur le dossier AMM pour le Cameroun.',
    timestamp: '2025-03-01T09:30:00',
    reactions: [{ emoji: '👍', count: 2 }]
  },
  {
    id: 'm2',
    senderId: 'u1',
    senderName: 'Jean Moussombi',
    content: 'Je regarde ça tout de suite Pierre. Le dossier CTD est prêt.',
    timestamp: '2025-03-01T09:35:00'
  },
  {
    id: 'm3',
    senderId: 'dm1',
    senderName: 'Marie Dupont',
    content: 'Voici le document que vous demandiez. N\'hésitez pas si vous avez des questions.',
    timestamp: '2025-03-01T09:40:00',
    reactions: [{ emoji: '🎉', count: 1 }]
  },
]

const PRESENCE_CONFIG: Record<PresenceStatus, { label: string; color: string }> = {
  'online': { label: 'Disponible', color: 'bg-green-500' },
  'away': { label: 'Absent', color: 'bg-yellow-500' },
  'busy': { label: 'Occupé', color: 'bg-red-500' },
  'dnd': { label: 'Ne pas déranger', color: 'bg-red-600' },
  'offline': { label: 'Hors ligne', color: 'bg-gray-400' }
}

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
  
  // Data State
  const [teams, setTeams] = useState<Team[]>(sampleTeams)
  const [messages, setMessages] = useState<ChatMessage[]>(sampleMessages)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPresence, setCurrentPresence] = useState<PresenceStatus>('online')
  
  // UI State
  const [showNewTeamModal, setShowNewTeamModal] = useState(false)
  const [showNewChannelModal, setShowNewChannelModal] = useState(false)
  const [showPresenceMenu, setShowPresenceMenu] = useState(false)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [activeCall, setActiveCall] = useState<{ roomName: string; displayName: string } | null>(null)
  const [expandedTeams, setExpandedTeams] = useState<string[]>(['team-1', 'team-2'])
  const [showRightPanel, setShowRightPanel] = useState(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handlers
  const toggleTeamExpanded = (teamId: string) => {
    setExpandedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    )
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    
    const message: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      content: newMessage,
      timestamp: new Date().toISOString()
    }
    
    setMessages([...messages, message])
    setNewMessage('')
  }

  const handleStartCall = (isVideo: boolean) => {
    const callRoom = {
      roomName: `call-${Date.now()}`,
      displayName: selectedChannel?.name || 'Appel'
    }
    setActiveCall(callRoom)
    setShowVideoCall(true)
  }

  const handleEndCall = () => {
    setShowVideoCall(false)
    setActiveCall(null)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  // Filter teams by search
  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.channels.some(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex h-[calc(100vh-60px)] bg-white overflow-hidden">
      {/* ==================== LEFT APP BAR (Microsoft Teams style) ==================== */}
      <div className="w-16 bg-[#292929] flex flex-col items-center py-4 shrink-0">
        {/* User Avatar */}
        <div className="relative mb-6 cursor-pointer" onClick={() => setShowPresenceMenu(!showPresenceMenu)}>
          <Avatar className="h-10 w-10 border-2 border-transparent hover:border-purple-400 transition-colors">
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#292929] ${PRESENCE_CONFIG[currentPresence].color}`} />
          
          {/* Presence Menu */}
          {showPresenceMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute left-14 top-0 bg-white rounded-lg shadow-xl border p-2 z-50 min-w-[180px]"
            >
              {Object.entries(PRESENCE_CONFIG).map(([status, config]) => (
                <button
                  key={status}
                  onClick={() => { setCurrentPresence(status as PresenceStatus); setShowPresenceMenu(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 ${
                    currentPresence === status ? 'bg-purple-50' : ''
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${config.color}`} />
                  <span className="text-sm">{config.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Navigation Icons */}
        <nav className="flex flex-col gap-2">
          {[
            { id: 'activity' as NavItemType, icon: Activity, label: 'Activité' },
            { id: 'chat' as NavItemType, icon: MessageSquare, label: 'Chat' },
            { id: 'teams' as NavItemType, icon: Users, label: 'Équipes' },
            { id: 'calendar' as NavItemType, icon: Calendar, label: 'Calendrier' },
            { id: 'calls' as NavItemType, icon: Phone, label: 'Appels' },
            { id: 'files' as NavItemType, icon: FileText, label: 'Fichiers' },
          ].map(nav => (
            <button
              key={nav.id}
              onClick={() => setActiveNav(nav.id)}
              className={`relative w-12 h-12 flex items-center justify-center rounded-lg transition-all group ${
                activeNav === nav.id 
                  ? 'bg-[#4b1a74] text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-[#3d3d3d]'
              }`}
              title={nav.label}
            >
              <nav.icon className="h-6 w-6" />
              {/* Active indicator */}
              {activeNav === nav.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
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
          <button className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#3d3d3d] rounded-lg transition-colors">
            <Store className="h-6 w-6" />
          </button>
          <button className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#3d3d3d] rounded-lg transition-colors">
            <HelpCircle className="h-6 w-6" />
          </button>
          <button className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#3d3d3d] rounded-lg transition-colors">
            <Settings className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* ==================== TEAMS SIDEBAR ==================== */}
      <div className="w-64 bg-[#4b1a74] flex flex-col shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold">Équipes</h2>
            <button 
              onClick={() => setShowNewTeamModal(true)}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
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

        {/* Teams List */}
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
                <div className="w-7 h-7 rounded bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
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
                      onClick={() => { setSelectedTeam(team); setSelectedChannel(channel) }}
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
                    onClick={() => setShowNewChannelModal(true)}
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
      </div>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f5f5f7]">
        {selectedChannel ? (
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
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#6264a7] text-white rounded-lg hover:bg-[#4b1a74] transition-colors text-sm font-medium"
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#6264a7] to-[#4b1a74] flex items-center justify-center">
                  {selectedChannel.type === 'private' ? (
                    <Lock className="h-8 w-8 text-white" />
                  ) : (
                    <Hash className="h-8 w-8 text-white" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Bienvenue dans #{selectedChannel.name}</h2>
                <p className="text-gray-500">C'est le début du canal {selectedChannel.name}.</p>
              </div>

              {/* Messages */}
              {messages.map((message, i) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex gap-3 hover:bg-white/50 -mx-4 px-4 py-2 rounded-lg group"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-[#6264a7] text-white">
                      {message.senderName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-900">{message.senderName}</span>
                      <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
                    </div>
                    <p className="text-gray-700 mt-0.5">{message.content}</p>
                    
                    {/* Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {message.reactions.map((reaction, ri) => (
                          <button
                            key={ri}
                            className="px-2 py-1 bg-white rounded-full border text-sm hover:border-purple-300 transition-colors"
                          >
                            {reaction.emoji} <span className="text-gray-500">{reaction.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Hover Actions */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white rounded-lg border shadow-sm p-1 -mt-4 transition-opacity">
                    <button className="p-1.5 hover:bg-gray-100 rounded"><Smile className="h-4 w-4 text-gray-500" /></button>
                    <button className="p-1.5 hover:bg-gray-100 rounded"><Reply className="h-4 w-4 text-gray-500" /></button>
                    <button className="p-1.5 hover:bg-gray-100 rounded"><Pin className="h-4 w-4 text-gray-500" /></button>
                    <button className="p-1.5 hover:bg-gray-100 rounded"><MoreHorizontal className="h-4 w-4 text-gray-500" /></button>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            <div className="p-4 bg-white border-t shrink-0">
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
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <button className="p-1.5 hover:bg-gray-200 rounded text-gray-600"><Image className="h-4 w-4" alt="" /></button>
                </div>
                
                {/* Input */}
                <div className="flex items-end gap-2 p-3">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Écrire un message dans #{selectedChannel.name}"
                    className="flex-1 resize-none border-0 focus:ring-0 text-sm outline-none min-h-[40px] max-h-[120px]"
                    rows={1}
                  />
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                      <Smile className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2 bg-[#6264a7] hover:bg-[#4b1a74] disabled:bg-gray-200 disabled:cursor-not-allowed rounded-full text-white transition-colors"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#6264a7] to-[#4b1a74] flex items-center justify-center">
                <Users className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Bienvenue dans Teams</h2>
              <p className="text-gray-500 mb-6">
                Sélectionnez une équipe et un canal pour commencer à collaborer avec vos collègues.
              </p>
              <Button onClick={() => setShowNewTeamModal(true)} className="bg-[#6264a7] hover:bg-[#4b1a74]">
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
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Membres ({selectedTeam.members.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {(['online', 'away', 'busy', 'offline'] as PresenceStatus[]).map(status => {
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
      {showNewTeamModal && (
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
                <Input placeholder="Ex: Équipe Marketing" id="new-team-name" className="mt-1.5" />
              </div>
              <div>
                <Label>Description (optionnel)</Label>
                <Input placeholder="Description de l'équipe" id="new-team-desc" className="mt-1.5" />
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#f5f5f7] rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-[#6264a7] flex items-center justify-center text-white font-semibold">
                  ?
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Confidentialité</p>
                  <p className="text-xs text-gray-500">Privé - Sur invitation uniquement</p>
                </div>
              </div>
              <Button 
                className="w-full bg-[#6264a7] hover:bg-[#4b1a74]"
                onClick={() => {
                  const name = (document.getElementById('new-team-name') as HTMLInputElement)?.value
                  if (name) {
                    const newTeam: Team = {
                      id: `team-${Date.now()}`,
                      name,
                      members: [{ id: `tm-${Date.now()}`, userId: user.id, name: user.name, email: user.email, role: 'owner', presence: 'online' }],
                      channels: [{ id: `ch-${Date.now()}`, teamId: `team-${Date.now()}`, name: 'Général', type: 'public' }],
                      owner: user.id
                    }
                    setTeams([...teams, newTeam])
                    setShowNewTeamModal(false)
                    toast({ title: 'Équipe créée', description: `L'équipe "${name}" a été créée` })
                  }
                }}
              >
                Créer l'équipe
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* New Channel Modal */}
      {showNewChannelModal && (
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
                <Input placeholder="Ex: annonces-générales" id="new-channel-name" className="mt-1.5" />
              </div>
              <div>
                <Label>Description (optionnel)</Label>
                <Input placeholder="Description du canal" id="new-channel-desc" className="mt-1.5" />
              </div>
              <Button 
                className="w-full bg-[#6264a7] hover:bg-[#4b1a74]"
                onClick={() => {
                  const name = (document.getElementById('new-channel-name') as HTMLInputElement)?.value
                  if (name && selectedTeam) {
                    const newChannel: TeamChannel = {
                      id: `ch-${Date.now()}`,
                      teamId: selectedTeam.id,
                      name,
                      type: 'public'
                    }
                    setTeams(teams.map(t => 
                      t.id === selectedTeam.id 
                        ? { ...t, channels: [...t.channels, newChannel] }
                        : t
                    ))
                    setShowNewChannelModal(false)
                    toast({ title: 'Canal créé', description: `Le canal "${name}" a été créé` })
                  }
                }}
              >
                Créer le canal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Video Call Modal */}
      {showVideoCall && activeCall && (
        <VideoCallModal
          roomName={activeCall.roomName}
          userName={user.name}
          userEmail={user.email}
          displayName={activeCall.displayName}
          onClose={handleEndCall}
        />
      )}
    </div>
  )
}

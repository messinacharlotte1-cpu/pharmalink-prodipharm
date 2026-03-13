'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, MonitorUp, Users, MessageSquare, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface VideoCallModalProps {
  roomName: string
  userName: string
  userEmail?: string
  displayName: string
  onClose: () => void
  onStartCall?: () => void
  isAudioOnly?: boolean
}

export default function VideoCallModal({
  roomName,
  userName,
  userEmail,
  displayName,
  onClose,
  onStartCall,
  isAudioOnly = false
}: VideoCallModalProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<any>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(isAudioOnly)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [participantCount, setParticipantCount] = useState(1)
  const [callDuration, setCallDuration] = useState(0)
  const [token, setToken] = useState<string | null>(null)
  const [domain, setDomain] = useState<string>('meet.jit.si')

  const fullRoomName = `PharmaLink-${roomName}-${Date.now().toString(36)}`

  const cleanup = useCallback(() => {
    if (apiRef.current) {
      try {
        apiRef.current.executeCommand('hangup')
        apiRef.current.dispose()
      } catch (e) {
        console.error('Error during cleanup:', e)
      }
      apiRef.current = null
    }
    if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
    }
  }, [])

  const handleEndCall = useCallback(() => {
    cleanup()
    onClose()
  }, [cleanup, onClose])

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('/api/video/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: fullRoomName,
            userName,
            userEmail,
            isModerator: true
          })
        })

        if (response.ok) {
          const data = await response.json()
          setToken(data.token)
          setDomain(data.domain || 'meet.jit.si')
        }
      } catch (err) {
        console.error('Failed to fetch video token:', err)
      }
    }

    fetchToken()
  }, [fullRoomName, userName, userEmail])

  useEffect(() => {
    if (!jitsiContainerRef.current || !domain) return

    let mounted = true

    const loadJitsi = async () => {
      try {
        if (!mounted) return
        setIsLoading(true)
        setError(null)

        const script = document.createElement('script')
        script.src = `https://${domain}/external_api.js`
        script.async = true
        
        script.onload = () => {
          if (!mounted || !jitsiContainerRef.current || !(window as any).JitsiMeetExternalAPI) {
            setError('Impossible de charger Jitsi Meet')
            setIsLoading(false)
            return
          }

          const options: any = {
            roomName: fullRoomName,
            parentNode: jitsiContainerRef.current,
            width: '100%',
            height: '100%',
            userInfo: {
              displayName: userName,
              email: userEmail
            },
            configOverwrite: {
              startWithAudioMuted: false,
              startWithVideoMuted: isAudioOnly,
              startWithScreenSharing: false,
              enableWelcomePage: false,
              enablePrejoinPage: true,
              disableDeepLinking: true,
            },
            interfaceConfigOverwrite: {
              SHOW_JITSI_WATERMARK: false,
              SHOW_WATERMARK_FOR_GUESTS: false,
              DEFAULT_BACKGROUND: '#1a1a2e',
              DEFAULT_LOCAL_DISPLAY_NAME: userName,
              MOBILE_APP_PROMO: false,
              SHOW_CHROME_EXTENSION_BANNER: false,
              ENABLE_FEEDBACK_ANIMATION: true,
              SHOW_BRAND_WATERMARK: false,
              SHOW_POWERED_BY: false,
            }
          }

          if (token) {
            options.jwt = token
          }

          const api = new (window as any).JitsiMeetExternalAPI(domain, options)
          apiRef.current = api

          api.on('videoConferenceJoined', () => {
            if (!mounted) return
            setIsConnected(true)
            setIsLoading(false)
            onStartCall?.()
            
            durationIntervalRef.current = setInterval(() => {
              setCallDuration(prev => prev + 1)
            }, 1000)
          })

          api.on('videoConferenceLeft', () => {
            if (!mounted) return
            handleEndCall()
          })

          api.on('participantJoined', () => {
            if (!mounted) return
            setParticipantCount(api.getNumberOfParticipants())
          })

          api.on('participantLeft', () => {
            if (!mounted) return
            setParticipantCount(api.getNumberOfParticipants())
          })

          api.on('audioMuteStatusChanged', (data: any) => {
            if (!mounted) return
            setIsMuted(data.muted)
          })

          api.on('videoMuteStatusChanged', (data: any) => {
            if (!mounted) return
            setIsVideoOff(data.muted)
          })

          api.on('screenSharingStatusChanged', (data: any) => {
            if (!mounted) return
            setIsScreenSharing(data.on)
          })

          api.on('readyToClose', () => {
            if (!mounted) return
            handleEndCall()
          })

          api.on('errorOccurred', (errorData: any) => {
            if (!mounted) return
            console.error('Jitsi error:', errorData)
            setError(`Erreur de connexion: ${errorData.message || 'Erreur inconnue'}`)
            setIsLoading(false)
          })
        }

        script.onerror = () => {
          if (!mounted) return
          setError('Impossible de charger le service de vidéoconférence')
          setIsLoading(false)
        }

        document.head.appendChild(script)
      } catch (err: any) {
        if (!mounted) return
        console.error('Jitsi initialization error:', err)
        setError(`Erreur: ${err.message}`)
        setIsLoading(false)
      }
    }

    loadJitsi()

    return () => {
      mounted = false
      cleanup()
    }
  }, [domain, fullRoomName, userName, userEmail, token, isAudioOnly, onStartCall, handleEndCall, cleanup])

  const toggleMute = useCallback(() => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleAudio')
    }
  }, [])

  const toggleVideo = useCallback(() => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleVideo')
    }
  }, [])

  const toggleScreenShare = useCallback(() => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleShareScreen')
    }
  }, [])

  const toggleChat = useCallback(() => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleChat')
      setShowChat(!showChat)
    }
  }, [showChat])

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const copyInviteLink = useCallback(() => {
    const inviteUrl = `https://${domain}/${fullRoomName}`
    navigator.clipboard.writeText(inviteUrl)
  }, [domain, fullRoomName])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full h-full flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0c4a6e] to-[#0369a1] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white font-medium">{displayName}</span>
              </div>
              <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                <Users className="h-3 w-3 mr-1" />
                {participantCount}
              </Badge>
              <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                {formatDuration(callDuration)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={copyInviteLink} className="text-white hover:bg-white/10">
                Inviter
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleEndCall} className="text-white hover:bg-red-500/20">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Video Area */}
          <div className="flex-1 relative bg-gray-900">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-white text-lg">Connexion à la réunion...</p>
                  <p className="text-gray-400 text-sm mt-2">Vérification audio/vidéo</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                <Card className="max-w-md mx-4">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                      <X className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Erreur de connexion</h3>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={onClose}>Fermer</Button>
                      <Button onClick={() => window.location.reload()}>Réessayer</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div ref={jitsiContainerRef} className="w-full h-full" />
          </div>

          {/* Controls */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-4">
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={toggleMute}
                size="lg"
                className={`rounded-full w-14 h-14 ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>

              <Button
                onClick={toggleVideo}
                size="lg"
                className={`rounded-full w-14 h-14 ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                {isVideoOff ? <VideoOff className="h-6 w-6" /> : <VideoIcon className="h-6 w-6" />}
              </Button>

              <Button
                onClick={handleEndCall}
                size="lg"
                className="rounded-full w-16 h-14 bg-red-500 hover:bg-red-600"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>

              <Button
                onClick={toggleScreenShare}
                size="lg"
                className={`rounded-full w-14 h-14 ${isScreenSharing ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                <MonitorUp className="h-6 w-6" />
              </Button>

              <Button
                onClick={toggleChat}
                size="lg"
                className={`rounded-full w-14 h-14 ${showChat ? 'bg-sky-500 hover:bg-sky-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                <MessageSquare className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

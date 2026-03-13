import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const JITSI_APP_ID = process.env.JITSI_APP_ID || 'pharmalink'
const JITSI_APP_SECRET = process.env.JITSI_APP_SECRET || ''
const JITSI_DOMAIN = process.env.JITSI_DOMAIN || 'meet.jit.si'

interface JwtPayload {
  context: {
    user: {
      name: string
      email: string
      avatar?: string
    }
    group?: string
  }
  aud: string
  iss: string
  sub: string
  room: string
  exp: number
  nbf: number
}

function base64urlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function createJwtSignature(payload: string, secret: string): string {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  return signature
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomName, userName, userEmail, isModerator = false } = body

    if (!roomName) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      )
    }

    if (!JITSI_APP_SECRET) {
      const roomUrl = `https://${JITSI_DOMAIN}/${roomName}`
      return NextResponse.json({
        success: true,
        roomUrl,
        roomName,
        domain: JITSI_DOMAIN,
        token: null,
        message: 'Using public Jitsi server. For production, configure JITSI_APP_SECRET.'
      })
    }

    const now = Math.floor(Date.now() / 1000)
    const exp = now + 3600

    const header = {
      alg: 'HS256',
      typ: 'JWT'
    }

    const payload: JwtPayload = {
      context: {
        user: {
          name: userName || 'Guest',
          email: userEmail || '',
        },
        group: isModerator ? 'moderators' : 'participants'
      },
      aud: 'jitsi',
      iss: JITSI_APP_ID,
      sub: JITSI_DOMAIN,
      room: roomName,
      exp: exp,
      nbf: now - 10
    }

    const encodedHeader = base64urlEncode(JSON.stringify(header))
    const encodedPayload = base64urlEncode(JSON.stringify(payload))
    const signature = createJwtSignature(`${encodedHeader}.${encodedPayload}`, JITSI_APP_SECRET)
    
    const token = `${encodedHeader}.${encodedPayload}.${signature}`

    const roomUrl = `https://${JITSI_DOMAIN}/${roomName}`

    return NextResponse.json({
      success: true,
      roomUrl,
      roomName,
      domain: JITSI_DOMAIN,
      token,
      expiresAt: new Date(exp * 1000).toISOString()
    })

  } catch (error) {
    console.error('Video token generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate video token' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const roomName = searchParams.get('room')

  if (!roomName) {
    return NextResponse.json(
      { error: 'Room name is required' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    domain: JITSI_DOMAIN,
    roomName,
    roomUrl: `https://${JITSI_DOMAIN}/${roomName}`,
    features: {
      audio: true,
      video: true,
      screenSharing: true,
      chat: true,
      recording: false,
      liveStreaming: false
    }
  })
}

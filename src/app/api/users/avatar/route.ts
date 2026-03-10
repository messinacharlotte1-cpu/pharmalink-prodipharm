/**
 * Avatar Upload API Route
 * Handles user profile picture uploads
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    // Get user ID from session cookie (simplified for dev)
    const sessionCookie = request.cookies.get('pharmalink-session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File | null
    const userId = formData.get('userId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur manquant' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Formats acceptés: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux. Taille maximum: 5MB' },
        { status: 400 }
      )
    }

    // Read file content
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const fileName = `avatar_${userId}_${timestamp}_${randomString}.${fileExtension}`

    // Ensure avatars directory exists
    const avatarsDir = path.join(process.cwd(), 'public', 'avatars')
    if (!existsSync(avatarsDir)) {
      await mkdir(avatarsDir, { recursive: true })
    }

    // Write file to public/avatars directory
    const filePath = path.join(avatarsDir, fileName)
    await writeFile(filePath, buffer)

    // Avatar URL path
    const avatarUrl = `/avatars/${fileName}`

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Avatar mis à jour avec succès',
      avatar: avatarUrl,
      user: updatedUser
    })

  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement de l\'avatar' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('pharmalink-session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur manquant' },
        { status: 400 }
      )
    }

    // Remove avatar from database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Avatar supprimé avec succès',
      user: updatedUser
    })

  } catch (error) {
    console.error('Avatar delete error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'avatar' },
      { status: 500 }
    )
  }
}

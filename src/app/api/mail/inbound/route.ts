import { NextRequest, NextResponse } from 'next/server';

// Interface pour les emails entrants de Resend
interface InboundEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  reply_to?: string;
  headers?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content_type: string;
    size: number;
    content: string; // base64 encoded
  }>;
}

// Stockage temporaire des emails (en production, utiliser une base de données)
// Les emails sont stockés dans localStorage côté client et synchronisés via cet API
const emailStore: Map<string, InboundEmail[]> = new Map();

export async function POST(request: NextRequest) {
  try {
    // Vérifier le secret du webhook si configuré
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${webhookSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    
    console.log('[INBOUND EMAIL] Received:', JSON.stringify(body, null, 2));

    // Parser l'email entrant de Resend
    const email: InboundEmail = {
      id: body.id || `inbound-${Date.now()}`,
      from: body.from || body.envelope?.from || '',
      to: body.to?.[0] || body.envelope?.to?.[0] || '',
      subject: body.subject || '(Sans objet)',
      html: body.html || undefined,
      text: body.text || undefined,
      reply_to: body.reply_to || undefined,
      headers: body.headers || undefined,
      attachments: body.attachments || undefined,
    };

    // Valider l'email
    if (!email.from || !email.to) {
      return NextResponse.json(
        { error: 'Missing required fields: from, to' },
        { status: 400 }
      );
    }

    // Extraire le domaine et l'utilisateur destinataire
    const toEmail = email.to.toLowerCase();
    const toDomain = toEmail.split('@')[1];
    const toUser = toEmail.split('@')[0];

    console.log(`[INBOUND EMAIL] To: ${toEmail}, From: ${email.from}, Subject: ${email.subject}`);

    // Vérifier que le domaine est configuré pour notre application
    const configuredDomain = process.env.EMAIL_DOMAIN || 'pharmalink.prodipharm.com';
    if (toDomain && toDomain !== configuredDomain && process.env.NODE_ENV === 'production') {
      console.log(`[INBOUND EMAIL] Domain mismatch: ${toDomain} !== ${configuredDomain}`);
      // En développement, on accepte tous les domaines
    }

    // Mapper l'adresse email à un utilisateur
    // En production, chercher dans la base de données
    const userMapping: Record<string, string> = {
      'support': 'admin',
      'contact': 'admin',
      'info': 'admin',
      'ventes': 'marketing',
      'sales': 'marketing',
      'marketing': 'marketing',
      'comptabilite': 'comptabilite',
      'finance': 'comptabilite',
      'rh': 'rh',
      'hr': 'rh',
    };

    // Déterminer le destinataire final
    let recipientId = userMapping[toUser] || 'dm'; // Par défaut, les DMs reçoivent les emails
    let recipientEmail = toEmail;

    // Stocker l'email pour récupération ultérieure
    const emailWithMetadata = {
      ...email,
      recipientId,
      recipientEmail,
      receivedAt: new Date().toISOString(),
      status: 'unread' as const,
      priority: detectPriority(email.subject, email.text || email.html || ''),
    };

    // Ajouter au store
    const existingEmails = emailStore.get(recipientEmail) || [];
    emailStore.set(recipientEmail, [emailWithMetadata, ...existingEmails]);

    // Log de réception
    console.log(`[INBOUND EMAIL] Stored for ${recipientEmail}, total emails: ${emailStore.get(recipientEmail)?.length}`);

    // Notification (en production, envoyer une notification push ou WebSocket)
    // await sendNotification(recipientId, emailWithMetadata);

    return NextResponse.json({
      success: true,
      message: 'Email received and stored',
      emailId: email.id,
      recipient: recipientEmail,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[INBOUND EMAIL] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// GET pour récupérer les emails stockés
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const recipientEmail = searchParams.get('email');
  const since = searchParams.get('since'); // ISO date string

  if (recipientEmail) {
    let emails = emailStore.get(recipientEmail) || [];
    
    // Filtrer par date si spécifié
    if (since) {
      const sinceDate = new Date(since);
      emails = emails.filter(e => new Date(e.receivedAt) > sinceDate);
    }

    return NextResponse.json({
      success: true,
      emails,
      count: emails.length,
    });
  }

  // Retourner tous les emails (pour admin)
  const allEmails: InboundEmail[] = [];
  emailStore.forEach((emails) => {
    allEmails.push(...emails);
  });

  return NextResponse.json({
    success: true,
    emails: allEmails.sort((a, b) => 
      new Date((b as any).receivedAt).getTime() - new Date((a as any).receivedAt).getTime()
    ),
    total: allEmails.length,
    recipients: Array.from(emailStore.keys()),
  });
}

// DELETE pour supprimer un email
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const emailId = searchParams.get('id');

  if (!emailId) {
    return NextResponse.json(
      { error: 'Email ID required' },
      { status: 400 }
    );
  }

  let deleted = false;
  emailStore.forEach((emails, recipient) => {
    const index = emails.findIndex(e => e.id === emailId);
    if (index !== -1) {
      emails.splice(index, 1);
      emailStore.set(recipient, emails);
      deleted = true;
    }
  });

  if (deleted) {
    return NextResponse.json({
      success: true,
      message: 'Email deleted',
    });
  }

  return NextResponse.json(
    { error: 'Email not found' },
    { status: 404 }
  );
}

// Détecter la priorité basée sur le contenu
function detectPriority(subject: string, content: string): 'normal' | 'important' | 'urgent' {
  const urgentKeywords = ['urgent', 'emergency', 'critique', 'immédiat', 'asap', 'important', 'immédiatement'];
  const importantKeywords = ['important', 'attention', 'priorité', 'priority', 'requise', 'requis'];

  const combinedText = `${subject} ${content}`.toLowerCase();

  for (const keyword of urgentKeywords) {
    if (combinedText.includes(keyword)) {
      return 'urgent';
    }
  }

  for (const keyword of importantKeywords) {
    if (combinedText.includes(keyword)) {
      return 'important';
    }
  }

  return 'normal';
}

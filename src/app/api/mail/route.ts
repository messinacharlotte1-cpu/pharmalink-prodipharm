import { NextRequest, NextResponse } from 'next/server';

interface EmailRequest {
  to: string;
  toName: string;
  from: string;
  fromName: string;
  subject: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
}

// Configuration pour l'adresse d'envoi vérifiée
// Avec Resend, vous devez utiliser une adresse vérifiée
// En développement, utilisez onboarding@resend.dev
const VERIFIED_SENDER_EMAIL = process.env.VERIFIED_SENDER_EMAIL || 'onboarding@resend.dev';
const VERIFIED_SENDER_NAME = process.env.VERIFIED_SENDER_NAME || 'PharmaLink';

// Fonction pour envoyer un email via un service externe
async function sendEmailViaService(emailData: EmailRequest): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Option 1: Utiliser Resend (si configuré)
    if (process.env.RESEND_API_KEY) {
      // Avec Resend, on utilise l'adresse vérifiée comme expéditeur
      // Et on met l'expéditeur original dans reply-to et le corps de l'email
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${VERIFIED_SENDER_NAME} <${VERIFIED_SENDER_EMAIL}>`,
          to: [emailData.to],
          reply_to: emailData.from,
          subject: `[PharmaLink] ${emailData.subject}`,
          html: formatEmailHtml(emailData),
          text: formatEmailText(emailData),
          headers: {
            'X-Priority': emailData.priority === 'urgent' ? '1' : emailData.priority === 'important' ? '2' : '3',
          },
          tags: [
            { name: 'category', value: 'pharmalink_message' },
            { name: 'priority', value: emailData.priority },
          ],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [RESEND] Email envoyé avec succès:', result.id);
        return { success: true, messageId: result.id };
      } else {
        const error = await response.json();
        console.error('❌ [RESEND] Erreur:', JSON.stringify(error, null, 2));

        // Messages d'erreur personnalisés selon le type d'erreur
        let errorMessage = error.message || error.error?.message || 'Erreur Resend';

        // Erreur de mode test - email restreint au propriétaire du compte
        if (error.statusCode === 403 && errorMessage.includes('testing emails')) {
          const emailMatch = errorMessage.match(/\(([^)]+@[^)]+)\)/);
          const ownerEmail = emailMatch ? emailMatch[1] : 'votre adresse email';
          errorMessage = `Mode test Resend : Vous ne pouvez envoyer des emails qu'à ${ownerEmail}. Pour envoyer à d'autres destinataires, vérifiez votre domaine sur resend.com/domains`;
        }

        // Erreur de domaine non vérifié
        if (error.statusCode === 403 && errorMessage.includes('verify a domain')) {
          errorMessage = 'Domaine non vérifié. Veuillez vérifier votre domaine sur resend.com/domains pour envoyer des emails.';
        }

        return {
          success: false,
          error: errorMessage
        };
      }
    }

    // Option 2: Utiliser SendGrid (si configuré)
    if (process.env.SENDGRID_API_KEY) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: emailData.to, name: emailData.toName }],
              subject: emailData.subject,
            },
          ],
          from: { email: emailData.from, name: emailData.fromName },
          content: [
            { type: 'text/plain', value: emailData.content },
            { type: 'text/html', value: formatEmailHtml(emailData) },
          ],
        }),
      });

      if (response.ok) {
        return { success: true, messageId: `sg-${Date.now()}` };
      } else {
        const error = await response.json();
        return { success: false, error: error.errors?.[0]?.message || 'Erreur SendGrid' };
      }
    }

    // Option 3: Utiliser Mailgun (si configuré)
    if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      const formData = new FormData();
      formData.append('from', `${emailData.fromName} <${emailData.from}>`);
      formData.append('to', emailData.to);
      formData.append('subject', emailData.subject);
      formData.append('text', emailData.content);
      formData.append('html', formatEmailHtml(emailData));

      const response = await fetch(`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, messageId: result.id };
      } else {
        const error = await response.json();
        return { success: false, error: error.message || 'Erreur Mailgun' };
      }
    }

    // Option 4: Webhook personnalisé (pour intégration avec votre propre service)
    if (process.env.EMAIL_WEBHOOK_URL) {
      const response = await fetch(process.env.EMAIL_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EMAIL_WEBHOOK_SECRET || ''}`,
        },
        body: JSON.stringify({
          to: emailData.to,
          toName: emailData.toName,
          from: emailData.from,
          fromName: emailData.fromName,
          subject: emailData.subject,
          content: emailData.content,
          html: formatEmailHtml(emailData),
          priority: emailData.priority,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        return { success: true, messageId: `webhook-${Date.now()}` };
      } else {
        return { success: false, error: 'Erreur Webhook' };
      }
    }

    // Mode développement : Simuler l'envoi
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [DEV MODE] Email simulé envoyé:');
      console.log('  To:', emailData.to);
      console.log('  From:', emailData.from);
      console.log('  Subject:', emailData.subject);
      console.log('  Priority:', emailData.priority);
      
      // Simuler un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { success: true, messageId: `dev-${Date.now()}` };
    }

    // Aucun service configuré
    return { 
      success: false, 
      error: 'Aucun service d\'envoi d\'email configuré. Veuillez configurer RESEND_API_KEY, SENDGRID_API_KEY, MAILGUN_API_KEY ou EMAIL_WEBHOOK_URL.' 
    };
  } catch (error: any) {
    console.error('Erreur envoi email:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}

// Fonction pour formater le contenu texte brut de l'email
function formatEmailText(emailData: EmailRequest): string {
  const priorityLabels = {
    normal: 'Normal',
    important: 'Important',
    urgent: 'Urgent',
  };

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                 PHARMA LINK - Prodipharm
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📨 NOUVEAU MESSAGE

De: ${emailData.fromName} <${emailData.from}>
À: ${emailData.toName} <${emailData.to}>
Priorité: ${priorityLabels[emailData.priority]}
Objet: ${emailData.subject}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${emailData.content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Pour répondre à ce message, utilisez la fonction "Répondre" 
   de votre client email ou connectez-vous à PharmaLink.

📍 Prodipharm Cameroon
📧 support@prodipharm.com
© ${new Date().getFullYear()} Tous droits réservés.
`.trim();
}

// Fonction pour formater le contenu HTML de l'email
function formatEmailHtml(emailData: EmailRequest): string {
  const priorityColors = {
    normal: '#3b82f6',
    important: '#f59e0b',
    urgent: '#ef4444',
  };

  const priorityLabels = {
    normal: 'Normal',
    important: 'Important',
    urgent: 'Urgent',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailData.subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📧 PharmaLink</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0;">Plateforme de communication Prodipharm</p>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <!-- Info expéditeur -->
    <div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid ${priorityColors[emailData.priority]};">
      <p style="margin: 0; font-size: 14px; color: #1e293b;">
        <strong>📨 De:</strong> ${emailData.fromName} &lt;${emailData.from}&gt;
      </p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #1e293b;">
        <strong>👤 À:</strong> ${emailData.toName} &lt;${emailData.to}&gt;
      </p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #1e293b;">
        <strong>⚡ Priorité:</strong> <span style="color: ${priorityColors[emailData.priority]}; font-weight: 600;">${priorityLabels[emailData.priority]}</span>
      </p>
    </div>
    
    <!-- Sujet -->
    <h2 style="margin: 0 0 20px; font-size: 20px; color: #1e293b; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px;">
      ${emailData.subject}
    </h2>
    
    <!-- Contenu -->
    <div style="white-space: pre-wrap; font-size: 15px; color: #374151; line-height: 1.8; background: #fafafa; padding: 20px; border-radius: 8px;">
${emailData.content}
    </div>
    
    <!-- Bouton réponse -->
    <div style="margin-top: 25px; text-align: center;">
      <a href="mailto:${emailData.from}?subject=Re: ${emailData.subject}" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        ↩️ Répondre à ${emailData.fromName}
      </a>
    </div>
    
    <!-- Note -->
    <div style="margin-top: 30px; padding: 15px; background: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe;">
      <p style="margin: 0; font-size: 13px; color: #1e40af;">
        💡 <strong>Conseil:</strong> Utilisez le bouton "Répondre" de votre client email pour répondre directement à ${emailData.fromName}.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">
        Cet email a été envoyé via la plateforme <strong>PharmaLink</strong> de Prodipharm.
      </p>
      <p style="font-size: 12px; color: #94a3b8; margin: 10px 0 0;">
        © ${new Date().getFullYear()} Prodipharm Cameroon. Tous droits réservés.
      </p>
    </div>
  </div>
  
  <div style="background: #f1f5f9; padding: 15px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
    <p style="font-size: 11px; color: #64748b; margin: 0;">
      📍 Douala, Cameroun | 📧 support@prodipharm.com
    </p>
  </div>
</body>
</html>
  `.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation des données
    const { to, toName, from, fromName, subject, content, priority } = body as EmailRequest;
    
    if (!to || !from || !subject || !content) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes. Destinataire, expéditeur, objet et contenu sont requis.' },
        { status: 400 }
      );
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to) || !emailRegex.test(from)) {
      return NextResponse.json(
        { success: false, error: 'Adresse email invalide.' },
        { status: 400 }
      );
    }

    // Envoyer l'email
    const result = await sendEmailViaService({
      to,
      toName: toName || to.split('@')[0],
      from,
      fromName: fromName || from.split('@')[0],
      subject,
      content,
      priority: priority || 'normal',
    });

    if (result.success) {
      // Log de l'envoi (pour audit)
      console.log(`[EMAIL SENT] ${new Date().toISOString()} | To: ${to} | From: ${from} | Subject: ${subject} | MessageID: ${result.messageId}`);
      
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'Email envoyé avec succès',
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error(`[EMAIL FAILED] ${new Date().toISOString()} | To: ${to} | Error: ${result.error}`);
      
      return NextResponse.json(
        { success: false, error: result.error || 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erreur API mail:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors du traitement de la requête' },
      { status: 500 }
    );
  }
}

// GET pour vérifier le statut du service
export async function GET() {
  const services = {
    resend: !!process.env.RESEND_API_KEY,
    sendgrid: !!process.env.SENDGRID_API_KEY,
    mailgun: !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN),
    webhook: !!process.env.EMAIL_WEBHOOK_URL,
  };

  const anyServiceConfigured = Object.values(services).some(Boolean);
  
  return NextResponse.json({
    status: anyServiceConfigured ? 'configured' : 'not_configured',
    environment: process.env.NODE_ENV,
    services: {
      resend: services.resend ? 'configured' : 'not_configured',
      sendgrid: services.sendgrid ? 'configured' : 'not_configured',
      mailgun: services.mailgun ? 'configured' : 'not_configured',
      webhook: services.webhook ? 'configured' : 'not_configured',
    },
    message: anyServiceConfigured 
      ? 'Service d\'envoi d\'email configuré'
      : process.env.NODE_ENV === 'development'
        ? 'Mode développement - emails simulés'
        : 'Aucun service d\'envoi d\'email configuré. Configurez RESEND_API_KEY, SENDGRID_API_KEY, MAILGUN_API_KEY ou EMAIL_WEBHOOK_URL.',
  });
}

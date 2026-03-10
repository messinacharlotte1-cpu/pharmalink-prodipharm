import { NextRequest, NextResponse } from 'next/server';

// Templates d'emails prédéfinis
const emailTemplates = [
  {
    id: 'welcome',
    name: 'Bienvenue',
    category: 'onboarding',
    subject: 'Bienvenue sur PharmaLink',
    content: `Bonjour {recipient_name},

Bienvenue sur PharmaLink, la plateforme de gestion pharmaceutique de Prodipharm !

Votre compte a été créé avec succès. Vous pouvez maintenant accéder à toutes les fonctionnalités de notre plateforme.

Pour commencer :
1. Complétez votre profil
2. Explorez les modules disponibles
3. Configurez vos préférences de notification

Si vous avez des questions, n'hésitez pas à contacter notre équipe de support.

Cordialement,
L'équipe PharmaLink`,
    variables: ['recipient_name'],
  },
  {
    id: 'visit_reminder',
    name: 'Rappel de visite',
    category: 'planning',
    subject: 'Rappel : Visite prévue le {visit_date}',
    content: `Bonjour {recipient_name},

Ceci est un rappel pour votre visite programmée :

📅 Date : {visit_date}
🕐 Heure : {visit_time}
📍 Lieu : {visit_location}
👤 Contact : {contact_name}

Objet de la visite : {visit_purpose}

Veuillez confirmer votre disponibilité ou nous contacter si vous souhaitez reporter.

Cordialement,
{sender_name}
Prodipharm`,
    variables: ['recipient_name', 'visit_date', 'visit_time', 'visit_location', 'contact_name', 'visit_purpose', 'sender_name'],
  },
  {
    id: 'order_confirmation',
    name: 'Confirmation de commande',
    category: 'sales',
    subject: 'Confirmation de commande #{order_number}',
    content: `Cher/Chère {recipient_name},

Nous avons bien reçu votre commande #{order_number}.

📦 Détails de la commande :
{order_details}

💰 Montant total : {total_amount} XAF
🚚 Livraison prévue : {delivery_date}

Mode de paiement : {payment_method}

Pour toute question concernant votre commande, n'hésitez pas à nous contacter.

Merci de votre confiance !

Cordialement,
L'équipe commerciale
Prodipharm`,
    variables: ['recipient_name', 'order_number', 'order_details', 'total_amount', 'delivery_date', 'payment_method'],
  },
  {
    id: 'invoice_reminder',
    name: 'Relance facture',
    category: 'accounting',
    subject: 'Rappel : Facture #{invoice_number} en attente',
    content: `Bonjour {recipient_name},

Nous vous rappelons que la facture #{invoice_number} est en attente de règlement.

📋 Détails :
- Numéro de facture : {invoice_number}
- Montant dû : {amount} XAF
- Date d'échéance : {due_date}
- Jours de retard : {days_overdue}

Nous vous prions de bien vouloir régulariser cette situation dans les meilleurs délais.

En cas de règlement déjà effectué, nous vous prions de ne pas tenir compte de ce message.

Pour toute question, contactez notre service comptabilité.

Cordialement,
Service Comptabilité
Prodipharm`,
    variables: ['recipient_name', 'invoice_number', 'amount', 'due_date', 'days_overdue'],
  },
  {
    id: 'meeting_invitation',
    name: 'Invitation réunion',
    category: 'meetings',
    subject: 'Invitation : {meeting_title} le {meeting_date}',
    content: `Bonjour {recipient_name},

Vous êtes invité(e) à participer à la réunion suivante :

📋 Titre : {meeting_title}
📅 Date : {meeting_date}
🕐 Heure : {meeting_time}
📍 Lieu : {meeting_location}
🔗 Lien : {meeting_link}

Ordre du jour :
{agenda}

Participants : {participants}

Veuillez confirmer votre présence.

Cordialement,
{sender_name}`,
    variables: ['recipient_name', 'meeting_title', 'meeting_date', 'meeting_time', 'meeting_location', 'meeting_link', 'agenda', 'participants', 'sender_name'],
  },
  {
    id: 'product_promotion',
    name: 'Promotion produit',
    category: 'marketing',
    subject: '🎯 Nouvelle promotion : {product_name}',
    content: `Cher/Chère partenaire,

Nous sommes heureux de vous annoncer notre nouvelle promotion !

🎁 PRODUIT : {product_name}
💰 PRIX PROMO : {promo_price} XAF (au lieu de {original_price} XAF)
📉 RÉDUCTION : {discount}%
⏰ VALIDITÉ : Du {start_date} au {end_date}

{product_description}

Conditions de l'offre :
{conditions}

Pour commander, contactez-nous dès maintenant !

Cordialement,
L'équipe Marketing
Prodipharm`,
    variables: ['product_name', 'promo_price', 'original_price', 'discount', 'start_date', 'end_date', 'product_description', 'conditions'],
  },
  {
    id: 'product_availability',
    name: 'Disponibilité produit',
    category: 'stock',
    subject: '✅ Produit disponible : {product_name}',
    content: `Bonjour {recipient_name},

Bonne nouvelle ! Le produit que vous attendiez est maintenant disponible :

📦 Produit : {product_name}
🏷️ Référence : {product_reference}
📊 Stock disponible : {stock_quantity} unités
💰 Prix unitaire : {unit_price} XAF

{product_notes}

Pour passer commande, cliquez sur le lien ci-dessous ou contactez directement votre commercial.

Stock limité - Ne tardez pas !

Cordialement,
Service Commercial
Prodipharm`,
    variables: ['recipient_name', 'product_name', 'product_reference', 'stock_quantity', 'unit_price', 'product_notes'],
  },
  {
    id: 'appointment_request',
    name: 'Demande de rendez-vous',
    category: 'crm',
    subject: 'Demande de rendez-vous - {requester_name}',
    content: `Bonjour,

Une nouvelle demande de rendez-vous a été reçue :

👤 Demandeur : {requester_name}
📧 Email : {requester_email}
📞 Téléphone : {requester_phone}
🏢 Établissement : {establishment}

📅 Créneaux souhaités :
{preferred_slots}

📝 Motif :
{reason}

Veuillez répondre à cette demande dans les plus brefs délais.

Cordialement,
Système PharmaLink`,
    variables: ['requester_name', 'requester_email', 'requester_phone', 'establishment', 'preferred_slots', 'reason'],
  },
  {
    id: 'training_invitation',
    name: 'Invitation formation',
    category: 'hr',
    subject: 'Invitation à la formation : {training_title}',
    content: `Bonjour {recipient_name},

Vous êtes invité(e) à participer à une session de formation :

📚 Formation : {training_title}
📅 Date : {training_date}
🕐 Durée : {duration}
📍 Lieu : {location}
👤 Formateur : {trainer}

Objectifs :
{objectives}

Programme :
{program}

Cette formation est obligatoire/optionnelle.

Veuillez confirmer votre participation avant le {registration_deadline}.

Cordialement,
Service RH
Prodipharm`,
    variables: ['recipient_name', 'training_title', 'training_date', 'duration', 'location', 'trainer', 'objectives', 'program', 'registration_deadline'],
  },
  {
    id: 'password_reset',
    name: 'Réinitialisation mot de passe',
    category: 'security',
    subject: 'Réinitialisation de votre mot de passe',
    content: `Bonjour {recipient_name},

Vous avez demandé la réinitialisation de votre mot de passe PharmaLink.

Pour créer un nouveau mot de passe, cliquez sur le lien ci-dessous :
{reset_link}

Ce lien est valide pendant 24 heures.

Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email. Votre mot de passe actuel reste inchangé.

Pour toute question, contactez notre support.

Cordialement,
Support Technique
PharmaLink`,
    variables: ['recipient_name', 'reset_link'],
  },
];

// GET pour lister les templates
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const id = searchParams.get('id');

  if (id) {
    const template = emailTemplates.find(t => t.id === id);
    if (template) {
      return NextResponse.json({
        success: true,
        template,
      });
    }
    return NextResponse.json(
      { success: false, error: 'Template not found' },
      { status: 404 }
    );
  }

  let filteredTemplates = emailTemplates;
  if (category) {
    filteredTemplates = emailTemplates.filter(t => t.category === category);
  }

  // Grouper par catégorie
  const grouped = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, typeof emailTemplates>);

  return NextResponse.json({
    success: true,
    templates: filteredTemplates,
    grouped,
    categories: [...new Set(emailTemplates.map(t => t.category))],
  });
}

// POST pour utiliser un template avec des variables
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, variables } = body;

    const template = emailTemplates.find(t => t.id === templateId);
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Remplacer les variables dans le sujet et le contenu
    let subject = template.subject;
    let content = template.content;

    for (const [key, value] of Object.entries(variables || {})) {
      const placeholder = `{${key}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      content = content.replace(new RegExp(placeholder, 'g'), String(value));
    }

    // Vérifier s'il reste des variables non remplacées
    const unreplacedSubject = subject.match(/\{[^}]+\}/g);
    const unreplacedContent = content.match(/\{[^}]+\}/g);
    const unreplacedVariables = [...new Set([...(unreplacedSubject || []), ...(unreplacedContent || [])])];

    return NextResponse.json({
      success: true,
      template: {
        ...template,
        subject,
        content,
      },
      unreplacedVariables: unreplacedVariables.length > 0 ? unreplacedVariables : undefined,
    });

  } catch (error: any) {
    console.error('Error processing template:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

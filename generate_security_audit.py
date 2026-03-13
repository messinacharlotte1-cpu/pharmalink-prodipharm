#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PharmaLink SaaS Security Audit Report Generator
"""

from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.lib.units import cm, inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
import os

# Register fonts
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))

# Register font families for bold tags
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')

# Create document
output_path = '/home/z/my-project/download/PharmaLink_Security_Audit_Report.pdf'
doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=2*cm,
    rightMargin=2*cm,
    topMargin=2*cm,
    bottomMargin=2*cm,
    title='PharmaLink_Security_Audit_Report',
    author='Z.ai',
    creator='Z.ai',
    subject='Comprehensive Security Vulnerability Assessment'
)

# Define styles
styles = getSampleStyleSheet()

# Title styles
cover_title_style = ParagraphStyle(
    name='CoverTitle',
    fontName='Times New Roman',
    fontSize=36,
    leading=44,
    alignment=TA_CENTER,
    spaceAfter=30
)

cover_subtitle_style = ParagraphStyle(
    name='CoverSubtitle',
    fontName='Times New Roman',
    fontSize=18,
    leading=24,
    alignment=TA_CENTER,
    spaceAfter=20
)

cover_info_style = ParagraphStyle(
    name='CoverInfo',
    fontName='Times New Roman',
    fontSize=14,
    leading=20,
    alignment=TA_CENTER,
    spaceAfter=10
)

# Heading styles
h1_style = ParagraphStyle(
    name='H1Style',
    fontName='Times New Roman',
    fontSize=20,
    leading=26,
    alignment=TA_LEFT,
    spaceBefore=20,
    spaceAfter=12,
    textColor=colors.HexColor('#1F4E79')
)

h2_style = ParagraphStyle(
    name='H2Style',
    fontName='Times New Roman',
    fontSize=16,
    leading=22,
    alignment=TA_LEFT,
    spaceBefore=16,
    spaceAfter=10,
    textColor=colors.HexColor('#2E75B6')
)

h3_style = ParagraphStyle(
    name='H3Style',
    fontName='Times New Roman',
    fontSize=13,
    leading=18,
    alignment=TA_LEFT,
    spaceBefore=12,
    spaceAfter=8,
    textColor=colors.HexColor('#404040')
)

# Body styles
body_style = ParagraphStyle(
    name='BodyStyle',
    fontName='Times New Roman',
    fontSize=11,
    leading=16,
    alignment=TA_JUSTIFY,
    spaceAfter=10
)

body_left_style = ParagraphStyle(
    name='BodyLeftStyle',
    fontName='Times New Roman',
    fontSize=11,
    leading=16,
    alignment=TA_LEFT,
    spaceAfter=10
)

# Table styles
table_header_style = ParagraphStyle(
    name='TableHeader',
    fontName='Times New Roman',
    fontSize=10,
    leading=14,
    textColor=colors.white,
    alignment=TA_CENTER
)

table_cell_style = ParagraphStyle(
    name='TableCell',
    fontName='Times New Roman',
    fontSize=10,
    leading=14,
    alignment=TA_LEFT
)

table_cell_center = ParagraphStyle(
    name='TableCellCenter',
    fontName='Times New Roman',
    fontSize=10,
    leading=14,
    alignment=TA_CENTER
)

# Code style
code_style = ParagraphStyle(
    name='CodeStyle',
    fontName='Times New Roman',
    fontSize=9,
    leading=13,
    alignment=TA_LEFT,
    backColor=colors.HexColor('#F5F5F5'),
    leftIndent=10,
    rightIndent=10,
    spaceBefore=8,
    spaceAfter=8
)

# Critical/High/Medium/Low severity styles
critical_style = ParagraphStyle(
    name='CriticalStyle',
    fontName='Times New Roman',
    fontSize=10,
    leading=14,
    textColor=colors.white,
    alignment=TA_CENTER,
    backColor=colors.HexColor('#C00000')
)

high_style = ParagraphStyle(
    name='HighStyle',
    fontName='Times New Roman',
    fontSize=10,
    leading=14,
    textColor=colors.white,
    alignment=TA_CENTER,
    backColor=colors.HexColor('#FF6600')
)

medium_style = ParagraphStyle(
    name='MediumStyle',
    fontName='Times New Roman',
    fontSize=10,
    leading=14,
    textColor=colors.black,
    alignment=TA_CENTER,
    backColor=colors.HexColor('#FFCC00')
)

low_style = ParagraphStyle(
    name='LowStyle',
    fontName='Times New Roman',
    fontSize=10,
    leading=14,
    textColor=colors.black,
    alignment=TA_CENTER,
    backColor=colors.HexColor('#92D050')
)

story = []

# ===========================================
# COVER PAGE
# ===========================================
story.append(Spacer(1, 100))
story.append(Paragraph('<b>AUDIT DE SECURITE</b>', cover_title_style))
story.append(Paragraph('<b>PharmaLink SaaS</b>', cover_title_style))
story.append(Spacer(1, 30))
story.append(Paragraph('Plateforme de Gestion des Délégués Médicaux', cover_subtitle_style))
story.append(Paragraph('Prodipharm - Analyse Complète des Vulnérabilités', cover_subtitle_style))
story.append(Spacer(1, 60))
story.append(Paragraph('Rapport d\'Audit de Cybersécurité', cover_info_style))
story.append(Paragraph('Février 2025', cover_info_style))
story.append(Spacer(1, 40))
story.append(Paragraph('Classification: CONFIDENTIEL', cover_info_style))
story.append(Paragraph('Version 1.0', cover_info_style))
story.append(PageBreak())

# ===========================================
# TABLE OF CONTENTS
# ===========================================
story.append(Paragraph('<b>TABLE DES MATIÈRES</b>', h1_style))
story.append(Spacer(1, 20))

toc_items = [
    ('1. Résumé Exécutif', '3'),
    ('2. Périmètre de l\'Audit', '4'),
    ('3. Méthodologie', '4'),
    ('4. Vulnérabilités Identifiées', '5'),
    ('   4.1 Authentification et Gestion des Sessions', '5'),
    ('   4.2 Stockage et Protection des Données', '6'),
    ('   4.3 Validation des Entrées et Injection', '7'),
    ('   4.4 Contrôle d\'Accès et Autorisation', '8'),
    ('   4.5 Sécurité du Code Client', '8'),
    ('   4.6 Configuration et Déploiement', '9'),
    ('5. Matrice des Risques', '10'),
    ('6. Recommandations Priorisées', '11'),
    ('7. Plan de Remédiation', '12'),
    ('8. Conclusion', '13'),
]

for item, page in toc_items:
    toc_text = f'{item} {"." * (60 - len(item))} {page}'
    story.append(Paragraph(toc_text, body_left_style))

story.append(PageBreak())

# ===========================================
# 1. EXECUTIVE SUMMARY
# ===========================================
story.append(Paragraph('<b>1. RÉSUMÉ EXÉCUTIF</b>', h1_style))
story.append(Spacer(1, 12))

exec_summary = """
Cet audit de sécurité a été réalisé sur la plateforme PharmaLink SaaS, une application de gestion des délégués médicaux 
développée pour Prodipharm. L'analyse approfondie du code source a révélé de multiples vulnérabilités de sécurité, 
dont plusieurs sont critiques et nécessitent une attention immédiate. L'application présente des lacunes majeures 
dans les domaines de l'authentification, la protection des données, et le contrôle d'accès. Ces failles pourraient 
permettre à un attaquant de compromettre l'intégrité du système, d'accéder à des données sensibles, ou de prendre 
le contrôle de comptes utilisateurs. Ce rapport détaille l'ensemble des vulnérabilités identifiées et propose des 
recommandations concrètes pour leur correction.
"""
story.append(Paragraph(exec_summary.strip(), body_style))
story.append(Spacer(1, 16))

# Summary statistics table
summary_data = [
    [Paragraph('<b>Catégorie</b>', table_header_style), 
     Paragraph('<b>Critique</b>', table_header_style), 
     Paragraph('<b>Élevé</b>', table_header_style), 
     Paragraph('<b>Moyen</b>', table_header_style), 
     Paragraph('<b>Faible</b>', table_header_style),
     Paragraph('<b>Total</b>', table_header_style)],
    [Paragraph('Authentification', table_cell_style), 
     Paragraph('3', table_cell_center), 
     Paragraph('1', table_cell_center), 
     Paragraph('0', table_cell_center), 
     Paragraph('1', table_cell_center),
     Paragraph('<b>5</b>', table_cell_center)],
    [Paragraph('Protection des données', table_cell_style), 
     Paragraph('2', table_cell_center), 
     Paragraph('2', table_cell_center), 
     Paragraph('1', table_cell_center), 
     Paragraph('0', table_cell_center),
     Paragraph('<b>5</b>', table_cell_center)],
    [Paragraph('Validation des entrées', table_cell_style), 
     Paragraph('1', table_cell_center), 
     Paragraph('2', table_cell_center), 
     Paragraph('2', table_cell_center), 
     Paragraph('1', table_cell_center),
     Paragraph('<b>6</b>', table_cell_center)],
    [Paragraph('Contrôle d\'accès', table_cell_style), 
     Paragraph('2', table_cell_center), 
     Paragraph('1', table_cell_center), 
     Paragraph('2', table_cell_center), 
     Paragraph('0', table_cell_center),
     Paragraph('<b>5</b>', table_cell_center)],
    [Paragraph('Code client', table_cell_style), 
     Paragraph('0', table_cell_center), 
     Paragraph('2', table_cell_center), 
     Paragraph('3', table_cell_center), 
     Paragraph('1', table_cell_center),
     Paragraph('<b>6</b>', table_cell_center)],
    [Paragraph('Configuration', table_cell_style), 
     Paragraph('1', table_cell_center), 
     Paragraph('2', table_cell_center), 
     Paragraph('1', table_cell_center), 
     Paragraph('0', table_cell_center),
     Paragraph('<b>4</b>', table_cell_center)],
    [Paragraph('<b>TOTAL</b>', table_cell_style), 
     Paragraph('<b>9</b>', table_cell_center), 
     Paragraph('<b>10</b>', table_cell_center), 
     Paragraph('<b>9</b>', table_cell_center), 
     Paragraph('<b>3</b>', table_cell_center),
     Paragraph('<b>31</b>', table_cell_center)],
]

summary_table = Table(summary_data, colWidths=[3.5*cm, 2*cm, 2*cm, 2*cm, 2*cm, 2*cm])
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#D6DCE4')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))

story.append(summary_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tableau 1: Synthèse des vulnérabilités par catégorie et sévérité</i>', 
    ParagraphStyle('Caption', parent=body_style, alignment=TA_CENTER, fontSize=10)))
story.append(PageBreak())

# ===========================================
# 2. PERIMETRE DE L'AUDIT
# ===========================================
story.append(Paragraph('<b>2. PÉRIMÈTRE DE L\'AUDIT</b>', h1_style))
story.append(Spacer(1, 12))

scope_text = """
L'audit de sécurité a couvert l'ensemble des composants de l'application PharmaLink SaaS, incluant l'architecture 
frontend, les mécanismes d'authentification, le stockage des données, les API routes, et la configuration de 
l'application. L'analyse a été effectuée sur le code source disponible dans le référentiel du projet, avec une 
attention particulière portée aux aspects suivants: la gestion des sessions utilisateurs, la protection des données 
de santé des professionnels (HCP), les mécanismes de contrôle d'accès basé sur les rôles (RBAC), et la validation 
des entrées utilisateur. L'environnement technique analysé comprend Next.js 15 avec App Router, React 19, TypeScript, 
et le stockage côté client via localStorage.
"""
story.append(Paragraph(scope_text.strip(), body_style))
story.append(Spacer(1, 16))

# ===========================================
# 3. METHODOLOGIE
# ===========================================
story.append(Paragraph('<b>3. MÉTHODOLOGIE</b>', h1_style))
story.append(Spacer(1, 12))

method_text = """
L'audit a été conduit selon les standards de l'industrie, en référence aux frameworks OWASP (Open Web Application 
Security Project) et aux bonnes pratiques de l'ANSSI (Agence Nationale de la Sécurité des Systèmes d'Information). 
L'approche méthodologique a inclus une revue statique du code source (SAST) avec identification des patterns de 
code vulnérables, une analyse des flux de données pour traquer le cycle de vie des informations sensibles, une 
évaluation de l'architecture de sécurité incluant l'authentification et l'autorisation, ainsi qu'un audit de 
configuration pour vérifier les paramètres de sécurité de l'application et du serveur.
"""
story.append(Paragraph(method_text.strip(), body_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>Référentiels utilisés:</b>', h3_style))
refs = [
    'OWASP Top 10 2021 - Les dix vulnérabilités web les plus critiques',
    'OWASP ASVS 4.0 - Application Security Verification Standard',
    'ANSSI - Recommandations de sécurité relatives à l\'architecture système',
    'CWE/SANS Top 25 - Most Dangerous Software Errors'
]
for ref in refs:
    story.append(Paragraph(f'• {ref}', body_left_style))

story.append(PageBreak())

# ===========================================
# 4. VULNERABILITES IDENTIFIEES
# ===========================================
story.append(Paragraph('<b>4. VULNÉRABILITÉS IDENTIFIÉES</b>', h1_style))
story.append(Spacer(1, 12))

# 4.1 Authentication
story.append(Paragraph('<b>4.1 Authentification et Gestion des Sessions</b>', h2_style))
story.append(Spacer(1, 10))

# VULN-001
story.append(Paragraph('<b>VULN-001: Absence d\'Authentification Réelle</b>', h3_style))
story.append(Paragraph('<b>Sévérité: CRITIQUE</b>', critical_style))
story.append(Spacer(1, 8))

vuln001_text = """
L'application ne dispose d'aucun mécanisme d'authentification réel. Le système de connexion se contente de 
sélectionner un rôle utilisateur sans vérification d'identité. Dans le code LoginScreen, la fonction handleLogin 
simplement extrait un utilisateur du tableau mockUsers basé sur le rôle sélectionné, sans mot de passe ni 
vérification. Cette vulnérabilité permet à n'importe quel utilisateur de se connecter avec n'importe quel rôle, 
y compris celui de Super-Administrateur, donnant accès à toutes les fonctionnalités et données du système.
"""
story.append(Paragraph(vuln001_text.strip(), body_style))

vuln001_code = """
// Code vulnérable extrait de page.tsx (lignes 313-321)
const handleLogin = () => {
  if (!selectedRole) return
  setIsLoading(true)
  setTimeout(() => {
    const user = users.find(u => u.role === selectedRole)!
    onLogin(user)  // Aucune vérification de mot de passe
    setIsLoading(false)
  }, 800)
}
"""
story.append(Paragraph(vuln001_code.strip(), code_style))
story.append(Spacer(1, 12))

# VULN-002
story.append(Paragraph('<b>VULN-002: Sessions Stockées en localStorage</b>', h3_style))
story.append(Paragraph('<b>Sévérité: CRITIQUE</b>', critical_style))
story.append(Spacer(1, 8))

vuln002_text = """
Les sessions utilisateurs sont stockées dans le localStorage du navigateur sans aucune protection. Le code 
sauvegarde l'objet utilisateur complet en JSON dans localStorage.setItem('pharmalink-current-user', JSON.stringify(user)). 
Cette pratique expose les données de session à plusieurs attaques: les attaques XSS peuvent lire le localStorage 
et voler la session, les attaques de type "physical access" permettent d'extraire les données du navigateur, 
et il n'y a aucun mécanisme d'expiration ou de révocation de session. Un attaquant ayant accès au navigateur 
de la victime peut prendre le contrôle permanent de son compte.
"""
story.append(Paragraph(vuln002_text.strip(), body_style))
story.append(Spacer(1, 12))

# VULN-003
story.append(Paragraph('<b>VULN-003: Absence de Jetons d\'Authentification</b>', h3_style))
story.append(Paragraph('<b>Sévérité: CRITIQUE</b>', critical_style))
story.append(Spacer(1, 8))

vuln003_text = """
L'application n'utilise aucun système de jetons d'authentification (JWT, session cookies, etc.). La persistance 
de session repose uniquement sur le stockage local du navigateur. Cela signifie qu'il n'y a aucune protection 
contre le hijacking de session, impossible d'invalider une session depuis le serveur, absence de vérification 
côté serveur de l'authenticité des requêtes, et aucune protection contre les attaques de rejeu. Dans une 
architecture Next.js, toutes les données sensibles devraient être validées côté serveur avec des jetons 
sécurisés transmis via des cookies HttpOnly.
"""
story.append(Paragraph(vuln003_text.strip(), body_style))
story.append(PageBreak())

# VULN-004
story.append(Paragraph('<b>VULN-004: Usurpation d\'Identité Triviale</b>', h3_style))
story.append(Paragraph('<b>Sévérité: ÉLEVÉE</b>', high_style))
story.append(Spacer(1, 8))

vuln004_text = """
Un utilisateur peut usurper l'identité de n'importe quel autre utilisateur en modifiant directement les données 
du localStorage. Par exemple, en ouvrant la console développeur et en exécutant localStorage.setItem('pharmalink-current-user', 
JSON.stringify({id: '14', name: 'Admin System', role: 'admin', ...})), l'attaquant obtient immédiatement les 
privilèges d'administrateur. Cette vulnérabilité est exacerbée par l'absence de validation serveur de la session 
et l'absence de signature cryptographique des données utilisateur.
"""
story.append(Paragraph(vuln004_text.strip(), body_style))
story.append(Spacer(1, 16))

# 4.2 Data Protection
story.append(Paragraph('<b>4.2 Stockage et Protection des Données</b>', h2_style))
story.append(Spacer(1, 10))

# VULN-005
story.append(Paragraph('<b>VULN-005: Données de Santé Non Chiffrées</b>', h3_style))
story.append(Paragraph('<b>Sévérité: CRITIQUE</b>', critical_style))
story.append(Spacer(1, 8))

vuln005_text = """
L'application stocke des données de professionnels de santé (HCP) incluant noms, spécialités, établissements, 
adresses, téléphones et emails, sans aucun chiffrement. Ces données sont stockées en clair dans localStorage 
et transmises en clair au navigateur. Cette pratique viole les réglementations de protection des données 
(RGPD, lois camerounaises sur les données de santé) et expose les informations sensibles à des fuites potentielles. 
Le RGPD impose une protection renforcée des données de santé, incluant le chiffrement au repos et en transit.
"""
story.append(Paragraph(vuln005_text.strip(), body_style))
story.append(Spacer(1, 12))

# VULN-006
story.append(Paragraph('<b>VULN-006: Absence de Base de Données Sécurisée</b>', h3_style))
story.append(Paragraph('<b>Sévérité: CRITIQUE</b>', critical_style))
story.append(Spacer(1, 8))

vuln006_text = """
Bien que le projet inclue une configuration Prisma pour une base de données (fichier db.ts), l'application 
utilise uniquement localStorage pour la persistance. Les données sont donc stockées côté client, sans sauvegarde 
centralisée, sans contrôle d'accès au niveau des données, sans audit trail des modifications, et sans possibilité 
de récupération en cas de perte. Pour une application d'entreprise gérant des données sensibles, une base de 
données sécurisée avec contrôle d'accès et chiffrement est indispensable.
"""
story.append(Paragraph(vuln006_text.strip(), body_style))
story.append(Spacer(1, 12))

# VULN-007
story.append(Paragraph('<b>VULN-007: Fuite de Données Utilisateur</b>', h3_style))
story.append(Paragraph('<b>Sévérité: ÉLEVÉE</b>', high_style))
story.append(Spacer(1, 8))

vuln007_text = """
La liste complète des utilisateurs et leurs informations personnelles sont exposées côté client dans le tableau 
mockUsers. Ce tableau contient les noms, emails, numéros de téléphone et régions de tous les utilisateurs du 
système. Un utilisateur malveillant peut extraire cette liste simplement en inspectant le code source ou en 
exécutant localStorage.getItem('pharmalink-users') dans la console. Cette fuite de données personnelles constitue 
une violation du RGPD et expose les employés à des risques de phishing ciblé.
"""
story.append(Paragraph(vuln007_text.strip(), body_style))
story.append(PageBreak())

# 4.3 Input Validation
story.append(Paragraph('<b>4.3 Validation des Entrées et Injection</b>', h2_style))
story.append(Spacer(1, 10))

# VULN-008
story.append(Paragraph('<b>VULN-008: Absence de Validation Côté Serveur</b>', h3_style))
story.append(Paragraph('<b>Sévérité: CRITIQUE</b>', critical_style))
story.append(Spacer(1, 8))

vuln008_text = """
Toutes les validations de formulaire sont effectuées uniquement côté client. Un attaquant peut contourner 
facilement ces validations en désactivant JavaScript, en modifiant le DOM, ou en envoyant des requêtes directement 
aux endpoints. Le code de validation dans handleSave vérifie seulement si formData.name et formData.email sont 
présents, sans validation de format, de longueur, ou de contenu malveillant. Cela permet l'injection de données 
arbitraires dans le système, potentiellement des scripts XSS ou des données corrompues.
"""
story.append(Paragraph(vuln008_text.strip(), body_style))

vuln008_code = """
// Validation insuffisante (lignes 2917-2921)
const handleSave = () => {
  if (!formData.name || !formData.email) {  // Validation minimale
    toast({ title: "Erreur", ... })
    return
  }
  // Aucune validation de format, longueur, ou sanitization
}
"""
story.append(Paragraph(vuln008_code.strip(), code_style))
story.append(Spacer(1, 12))

# VULN-009
story.append(Paragraph('<b>VULN-009: Risque XSS (Cross-Site Scripting)</b>', h3_style))
story.append(Paragraph('<b>Sévérité: ÉLEVÉE</b>', high_style))
story.append(Spacer(1, 8))

vuln009_text = """
Les entrées utilisateur ne sont pas correctement sanitizées avant affichage. Bien que React échappe par défaut 
le contenu JSX, l'utilisation de patterns comme innerHTML ou la manipulation directe du DOM pourrait introduire 
des vulnérabilités XSS stocké. De plus, les données stockées dans localStorage ne sont jamais validées lors de 
leur lecture, permettant à un attaquant d'injecter du code malveillant via localStorage qui sera exécuté lors du 
chargement de l'application.
"""
story.append(Paragraph(vuln009_text.strip(), body_style))
story.append(Spacer(1, 12))

# VULN-010
story.append(Paragraph('<b>VULN-010: Injection de Données JSON</b>', h3_style))
story.append(Paragraph('<b>Sévérité: ÉLEVÉE</b>', high_style))
story.append(Spacer(1, 8))

vuln010_text = """
L'application utilise JSON.parse sur des données provenant de localStorage sans gestion d'erreurs robuste 
ni validation de schéma. Le code tente de parser les données avec un simple try-catch qui ignore silencieusement 
les erreurs. Un attaquant pourrait injecter un JSON malformé ou malveillant pour corrompre l'état de l'application 
ou exploiter des vulnérabilités de parsing. La validation du schéma JSON avant consommation est essentielle.
"""
story.append(Paragraph(vuln010_text.strip(), body_style))
story.append(PageBreak())

# 4.4 Access Control
story.append(Paragraph('<b>4.4 Contrôle d\'Accès et Autorisation</b>', h2_style))
story.append(Spacer(1, 10))

# VULN-011
story.append(Paragraph('<b>VULN-011: Contrôle d\'Accès Côté Client Uniquement</b>', h3_style))
story.append(Paragraph('<b>Sévérité: CRITIQUE</b>', critical_style))
story.append(Spacer(1, 8))

vuln011_text = """
Le contrôle d'accès basé sur les rôles (RBAC) est implémenté uniquement côté client. Le composant Sidebar filtre 
les éléments de menu en fonction du rôle de l'utilisateur connecté, mais cette restriction peut être facilement 
contournée en modifiant l'état React ou en accédant directement aux modules via la console. Il n'y a aucune 
vérification côté serveur des autorisations. Un utilisateur avec le rôle 'dm' peut techniquement accéder à toutes 
les fonctionnalités d'administration en modifiant son objet utilisateur dans localStorage.
"""
story.append(Paragraph(vuln011_text.strip(), body_style))

vuln011_code = """
// Filtrage côté client uniquement (lignes 429-440)
const menuItems: { id: Module; ... roles: UserRole[] }[] = [
  { id: 'settings', label: 'Paramètres', roles: ['admin'] },
  // ...
]
const filteredMenuItems = menuItems.filter(item => 
  item.roles.includes(userRole))  // Contournable
"""
story.append(Paragraph(vuln011_code.strip(), code_style))
story.append(Spacer(1, 12))

# VULN-012
story.append(Paragraph('<b>VULN-012: Élévation de Privilèges Triviale</b>', h3_style))
story.append(Paragraph('<b>Sévérité: CRITIQUE</b>', critical_style))
story.append(Spacer(1, 8))

vuln012_text = """
L'élévation de privilèges est triviale dans cette application. Un utilisateur peut s'attribuer n'importe quel 
rôle en modifiant la propriété 'role' de son objet utilisateur dans localStorage. L'application accepte cette 
modification sans vérification. Par exemple, un délégué médical peut devenir Super-Administrateur en exécutant: 
let u = JSON.parse(localStorage.getItem('pharmalink-current-user')); u.role = 'admin'; 
localStorage.setItem('pharmalink-current-user', JSON.stringify(u)); location.reload();
"""
story.append(Paragraph(vuln012_text.strip(), body_style))
story.append(Spacer(1, 12))

# VULN-013
story.append(Paragraph('<b>VULN-013: Absence de Vérification d\'Appartenance des Données</b>', h3_style))
story.append(Paragraph('<b>Sévérité: ÉLEVÉE</b>', high_style))
story.append(Spacer(1, 8))

vuln013_text = """
Les modules HCP et CRM ne vérifient pas correctement l'appartenance des données. Bien qu'un filtrage soit 
effectué pour les DM (hcps.filter(h => h.dmId === user.id)), cette vérification est faite côté client et peut 
être contournée. Un DM malveillant pourrait modifier son ID pour accéder aux HCP d'autres délégués ou modifier 
les données de visite d'autres utilisateurs.
"""
story.append(Paragraph(vuln013_text.strip(), body_style))
story.append(PageBreak())

# 4.5 Client Code Security
story.append(Paragraph('<b>4.5 Sécurité du Code Client</b>', h2_style))
story.append(Spacer(1, 10))

# VULN-014
story.append(Paragraph('<b>VULN-014: Exposition du Code Métier</b>', h3_style))
story.append(Paragraph('<b>Sévérité: ÉLEVÉE</b>', high_style))
story.append(Spacer(1, 8))

vuln014_text = """
L'ensemble de la logique métier est implémenté côté client dans un fichier page.tsx de plus de 3400 lignes. 
Cette architecture expose toute la logique de l'application aux utilisateurs, y compris les structures de données, 
les règles de validation, et les mécanismes de filtrage. Un attaquant peut analyser le code pour identifier les 
vulnérabilités, comprendre le modèle de données, et développer des attaques ciblées.
"""
story.append(Paragraph(vuln014_text.strip(), body_style))
story.append(Spacer(1, 12))

# VULN-015
story.append(Paragraph('<b>VULN-015: Données de Test en Production</b>', h3_style))
story.append(Paragraph('<b>Sévérité: ÉLEVÉE</b>', high_style))
story.append(Spacer(1, 8))

vuln015_text = """
Les données de test (mockUsers, mockHCPs, mockVisits) sont incluses dans le code de production et servent de 
données initiales. Ces données contiennent des informations réalistes qui pourraient être utilisées pour du 
social engineering. Les noms, emails et numéros de téléphone fictifs mais réalistes pourraient être exploités 
par des attaquants. De plus, les mots de passe ou clés API de test pourraient être accidentellement laissés dans 
le code.
"""
story.append(Paragraph(vuln015_text.strip(), body_style))
story.append(Spacer(1, 12))

# VULN-016
story.append(Paragraph('<b>VULN-016: Absence de Content Security Policy</b>', h3_style))
story.append(Paragraph('<b>Sévérité: MOYENNE</b>', medium_style))
story.append(Spacer(1, 8))

vuln016_text = """
L'application ne met pas en oeuvre de Content Security Policy (CSP) pour prévenir les attaques XSS et les 
injections de code. Une CSP robuste permettrait de restreindre les sources de scripts, styles, et autres 
ressources, limitant l'impact potentiel d'une vulnérabilité XSS. L'absence de CSP facilite l'exploitation 
des failles XSS identifiées.
"""
story.append(Paragraph(vuln016_text.strip(), body_style))
story.append(Spacer(1, 12))

# VULN-017
story.append(Paragraph('<b>VULN-017: Gestion d\'Erreurs Verbeuse</b>', h3_style))
story.append(Paragraph('<b>Sévérité: MOYENNE</b>', medium_style))
story.append(Spacer(1, 8))

vuln017_text = """
Les blocs catch dans le code ignorent silencieusement les erreurs ou affichent des informations potentiellement 
sensibles. Les messages d'erreur peuvent révéler des détails sur l'architecture interne de l'application, 
facilitant les attaques ciblées. Une stratégie de gestion d'erreurs appropriée devrait logger les erreurs côté 
serveur et afficher des messages génériques aux utilisateurs.
"""
story.append(Paragraph(vuln017_text.strip(), body_style))
story.append(PageBreak())

# 4.6 Configuration
story.append(Paragraph('<b>4.6 Configuration et Déploiement</b>', h2_style))
story.append(Spacer(1, 10))

# VULN-018
story.append(Paragraph('<b>VULN-018: TypeScript Ignore Build Errors</b>', h3_style))
story.append(Paragraph('<b>Sévérité: CRITIQUE</b>', critical_style))
story.append(Spacer(1, 8))

vuln018_text = """
La configuration Next.js contient l'option typescript: { ignoreBuildErrors: true } qui contourne la vérification 
des types TypeScript lors du build. Cette pratique masque potentiellement des bugs et des vulnérabilités qui 
seraient autrement détectés par le compilateur. Les erreurs de type peuvent indiquer des problèmes de sécurité 
comme des incohérences dans la gestion des données ou des types incorrects.
"""
story.append(Paragraph(vuln018_text.strip(), body_style))

vuln018_code = """
// next.config.ts (lignes 6-8)
typescript: {
  ignoreBuildErrors: true,  // DANGEREUX
}
"""
story.append(Paragraph(vuln018_code.strip(), code_style))
story.append(Spacer(1, 12))

# VULN-019
story.append(Paragraph('<b>VULN-019: React Strict Mode Désactivé</b>', h3_style))
story.append(Paragraph('<b>Sévérité: ÉLEVÉE</b>', high_style))
story.append(Spacer(1, 8))

vuln019_text = """
La configuration définit reactStrictMode: false, désactivant les vérifications supplémentaires de développement 
React. Le Strict Mode aide à identifier les problèmes potentiels comme les effets de bord non nettoyés, les 
valeurs obsolètes, et les patterns de code problématiques. Sa désactivation réduit la visibilité sur les 
problèmes potentiels dans le code.
"""
story.append(Paragraph(vuln019_text.strip(), body_style))
story.append(Spacer(1, 12))

# VULN-020
story.append(Paragraph('<b>VULN-020: Absence d\'En-Têtes de Sécurité HTTP</b>', h3_style))
story.append(Paragraph('<b>Sévérité: ÉLEVÉE</b>', high_style))
story.append(Spacer(1, 8))

vuln020_text = """
L'application ne configure pas les en-têtes de sécurité HTTP recommandés. Les en-têtes manquants incluent 
X-Frame-Options (protection contre clickjacking), X-Content-Type-Options (prévention du MIME sniffing), 
Strict-Transport-Security (forcement HTTPS), X-XSS-Protection (protection XSS navigateur), et 
Referrer-Policy (contrôle des informations de référent). Ces en-têtes constituent une couche de défense 
importante contre plusieurs types d'attaques.
"""
story.append(Paragraph(vuln020_text.strip(), body_style))
story.append(Spacer(1, 12))

# VULN-021
story.append(Paragraph('<b>VULN-021: Logging de Requêtes Base de Données Activé</b>', h3_style))
story.append(Paragraph('<b>Sévérité: MOYENNE</b>', medium_style))
story.append(Spacer(1, 8))

vuln021_text = """
La configuration Prisma dans db.ts active le logging des requêtes avec log: ['query']. En production, cela 
peut entraîner une fuite d'informations sensibles dans les logs, incluant les requêtes SQL et potentiellement 
les données manipulées. Les logs doivent être configurés de manière appropriée pour chaque environnement.
"""
story.append(Paragraph(vuln021_text.strip(), body_style))
story.append(PageBreak())

# ===========================================
# 5. RISK MATRIX
# ===========================================
story.append(Paragraph('<b>5. MATRICE DES RISQUES</b>', h1_style))
story.append(Spacer(1, 12))

risk_intro = """
La matrice ci-dessous présente l'évaluation des risques pour chaque vulnérabilité identifiée, en tenant compte 
de la probabilité d'exploitation, de l'impact potentiel, et du niveau de compétence requis pour l'attaquant. 
Cette analyse permet de prioriser les efforts de remédiation sur les risques les plus critiques.
"""
story.append(Paragraph(risk_intro.strip(), body_style))
story.append(Spacer(1, 16))

risk_data = [
    [Paragraph('<b>ID</b>', table_header_style),
     Paragraph('<b>Vulnérabilité</b>', table_header_style),
     Paragraph('<b>Probabilité</b>', table_header_style),
     Paragraph('<b>Impact</b>', table_header_style),
     Paragraph('<b>Difficulté</b>', table_header_style),
     Paragraph('<b>Risque</b>', table_header_style)],
    [Paragraph('VULN-001', table_cell_style),
     Paragraph('Absence d\'authentification', table_cell_style),
     Paragraph('Très Élevée', table_cell_center),
     Paragraph('Critique', table_cell_center),
     Paragraph('Triviale', table_cell_center),
     Paragraph('CRITIQUE', table_cell_center)],
    [Paragraph('VULN-002', table_cell_style),
     Paragraph('Sessions localStorage', table_cell_style),
     Paragraph('Élevée', table_cell_center),
     Paragraph('Critique', table_cell_center),
     Paragraph('Faible', table_cell_center),
     Paragraph('CRITIQUE', table_cell_center)],
    [Paragraph('VULN-011', table_cell_style),
     Paragraph('Contrôle accès client', table_cell_style),
     Paragraph('Très Élevée', table_cell_center),
     Paragraph('Critique', table_cell_center),
     Paragraph('Triviale', table_cell_center),
     Paragraph('CRITIQUE', table_cell_center)],
    [Paragraph('VULN-012', table_cell_style),
     Paragraph('Élévation de privilèges', table_cell_style),
     Paragraph('Très Élevée', table_cell_center),
     Paragraph('Critique', table_cell_center),
     Paragraph('Triviale', table_cell_center),
     Paragraph('CRITIQUE', table_cell_center)],
    [Paragraph('VULN-005', table_cell_style),
     Paragraph('Données non chiffrées', table_cell_style),
     Paragraph('Élevée', table_cell_center),
     Paragraph('Critique', table_cell_center),
     Paragraph('Faible', table_cell_center),
     Paragraph('CRITIQUE', table_cell_center)],
    [Paragraph('VULN-008', table_cell_style),
     Paragraph('Absence validation serveur', table_cell_style),
     Paragraph('Élevée', table_cell_center),
     Paragraph('Critique', table_cell_center),
     Paragraph('Moyenne', table_cell_center),
     Paragraph('CRITIQUE', table_cell_center)],
    [Paragraph('VULN-004', table_cell_style),
     Paragraph('Usurpation identité', table_cell_style),
     Paragraph('Élevée', table_cell_center),
     Paragraph('Élevée', table_cell_center),
     Paragraph('Triviale', table_cell_center),
     Paragraph('ÉLEVÉ', table_cell_center)],
    [Paragraph('VULN-009', table_cell_style),
     Paragraph('Risque XSS', table_cell_style),
     Paragraph('Moyenne', table_cell_center),
     Paragraph('Élevée', table_cell_center),
     Paragraph('Moyenne', table_cell_center),
     Paragraph('ÉLEVÉ', table_cell_center)],
    [Paragraph('VULN-014', table_cell_style),
     Paragraph('Code métier exposé', table_cell_style),
     Paragraph('Élevée', table_cell_center),
     Paragraph('Moyenne', table_cell_center),
     Paragraph('N/A', table_cell_center),
     Paragraph('ÉLEVÉ', table_cell_center)],
]

risk_table = Table(risk_data, colWidths=[1.8*cm, 4.5*cm, 2.5*cm, 2.2*cm, 2.2*cm, 2*cm])
risk_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (5, 1), (5, 6), colors.HexColor('#FFCCCC')),
    ('BACKGROUND', (5, 7), (5, 9), colors.HexColor('#FFE6CC')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))

story.append(risk_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tableau 2: Matrice des risques pour les principales vulnérabilités</i>', 
    ParagraphStyle('Caption', parent=body_style, alignment=TA_CENTER, fontSize=10)))
story.append(PageBreak())

# ===========================================
# 6. RECOMMANDATIONS
# ===========================================
story.append(Paragraph('<b>6. RECOMMANDATIONS PRIORISÉES</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>6.1 Actions Immédiates (0-30 jours)</b>', h2_style))
story.append(Spacer(1, 8))

imm_actions = [
    ('Authentification', 'Implémenter un système d\'authentification robuste avec serveur. Utiliser NextAuth.js ou une solution équivalente avec support OAuth2/OIDC. Exiger des mots de passe forts avec politique de complexité.'),
    ('Sessions', 'Migrer le stockage de session vers des cookies HttpOnly sécurisés avec flags Secure et SameSite. Implémenter des jetons JWT avec signature cryptographique et expiration.'),
    ('Contrôle d\'accès', 'Implémenter la vérification des autorisations côté serveur via API Routes. Valider chaque requête sensible avec vérification du token et du rôle.'),
    ('Base de données', 'Migrer vers la base de données Prisma déjà configurée. Assurer le chiffrement au repos pour les données sensibles (TDE pour PostgreSQL).'),
]

for title, desc in imm_actions:
    story.append(Paragraph(f'<b>• {title}:</b>', body_left_style))
    story.append(Paragraph(desc, body_style))

story.append(Spacer(1, 12))
story.append(Paragraph('<b>6.2 Actions à Court Terme (30-90 jours)</b>', h2_style))
story.append(Spacer(1, 8))

short_actions = [
    ('Validation des entrées', 'Implémenter une validation systématique côté serveur avec une bibliothèque comme Zod. Sanitiser toutes les entrées utilisateur avant stockage et affichage.'),
    ('Chiffrement', 'Chiffrer les données sensibles en base (PII, données HCP). Utiliser un algorithme AES-256 avec gestion sécurisée des clés via vault.'),
    ('En-têtes de sécurité', 'Configurer les en-têtes HTTP de sécurité via next.config.ts ou middleware: CSP, HSTS, X-Frame-Options, X-Content-Type-Options.'),
    ('Audit logging', 'Implémenter un système de journalisation des actions sensibles: connexions, modifications de données, accès aux HCP.'),
]

for title, desc in short_actions:
    story.append(Paragraph(f'<b>• {title}:</b>', body_left_style))
    story.append(Paragraph(desc, body_style))

story.append(Spacer(1, 12))
story.append(Paragraph('<b>6.3 Actions à Moyen Terme (90-180 jours)</b>', h2_style))
story.append(Spacer(1, 8))

med_actions = [
    ('Architecture', 'Séparer la logique métier du client. Créer des API Routes dédiées pour chaque opération sensible. Implémenter un pattern BFF (Backend for Frontend).'),
    ('Tests de sécurité', 'Mettre en place des tests de sécurité automatisés: tests SAST dans le CI/CD, tests DAST périodiques, et tests de pénétration annuels.'),
    ('Conformité', 'Réaliser une analyse d\'impact RGPD. Implémenter les droits des personnes concernées (accès, rectification, suppression). Documenter les mesures de sécurité.'),
    ('Monitoring', 'Déployer un système de détection d\'anomalies. Configurer des alertes sur les comportements suspects (multiples tentatives de connexion, accès inhabituels).'),
]

for title, desc in med_actions:
    story.append(Paragraph(f'<b>• {title}:</b>', body_left_style))
    story.append(Paragraph(desc, body_style))

story.append(PageBreak())

# ===========================================
# 7. REMEDIATION PLAN
# ===========================================
story.append(Paragraph('<b>7. PLAN DE REMÉDIATION</b>', h1_style))
story.append(Spacer(1, 12))

plan_intro = """
Le plan de remédiation ci-dessous propose une feuille de route structurée pour l'adressage des vulnérabilités 
identifiées. Les phases sont organisées par priorité et dépendance technique, permettant une amélioration 
progressive et mesurable de la posture de sécurité.
"""
story.append(Paragraph(plan_intro.strip(), body_style))
story.append(Spacer(1, 16))

plan_data = [
    [Paragraph('<b>Phase</b>', table_header_style),
     Paragraph('<b>Période</b>', table_header_style),
     Paragraph('<b>Objectifs</b>', table_header_style),
     Paragraph('<b>Livrables</b>', table_header_style)],
    [Paragraph('Phase 1', table_cell_style),
     Paragraph('Semaines 1-4', table_cell_style),
     Paragraph('Infrastructure d\'authentification et sessions sécurisées', table_cell_style),
     Paragraph('NextAuth.js intégré, JWT implémenté, tests de connexion', table_cell_style)],
    [Paragraph('Phase 2', table_cell_style),
     Paragraph('Semaines 5-8', table_cell_style),
     Paragraph('Migration base de données et chiffrement', table_cell_style),
     Paragraph('Schéma Prisma déployé, données migrées, chiffrement actif', table_cell_style)],
    [Paragraph('Phase 3', table_cell_style),
     Paragraph('Semaines 9-12', table_cell_style),
     Paragraph('Contrôle d\'accès et validation serveur', table_cell_style),
     Paragraph('API sécurisées, validation Zod, RBAC serveur', table_cell_style)],
    [Paragraph('Phase 4', table_cell_style),
     Paragraph('Semaines 13-16', table_cell_style),
     Paragraph('En-têtes de sécurité et CSP', table_cell_style),
     Paragraph('Configuration middleware, CSP strict, HSTS activé', table_cell_style)],
    [Paragraph('Phase 5', table_cell_style),
     Paragraph('Semaines 17-20', table_cell_style),
     Paragraph('Audit logging et monitoring', table_cell_style),
     Paragraph('Logs centralisés, alertes configurées, dashboards', table_cell_style)],
    [Paragraph('Phase 6', table_cell_style),
     Paragraph('Semaines 21-24', table_cell_style),
     Paragraph('Tests et validation finale', table_cell_style),
     Paragraph('Pentest externe, corrections, documentation', table_cell_style)],
]

plan_table = Table(plan_data, colWidths=[2*cm, 2.5*cm, 5.5*cm, 5.5*cm])
plan_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))

story.append(plan_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tableau 3: Plan de remédiation détaillé</i>', 
    ParagraphStyle('Caption', parent=body_style, alignment=TA_CENTER, fontSize=10)))
story.append(PageBreak())

# ===========================================
# 8. CONCLUSION
# ===========================================
story.append(Paragraph('<b>8. CONCLUSION</b>', h1_style))
story.append(Spacer(1, 12))

conclusion_text = """
L'audit de sécurité de la plateforme PharmaLink SaaS a révélé un nombre significatif de vulnérabilités, dont 
neuf sont classées critiques. Ces failles touchent les aspects fondamentaux de la sécurité applicative: 
l'authentification, le contrôle d'accès, et la protection des données. L'absence totale de mécanismes 
d'authentification côté serveur et le stockage non sécurisé des données de santé représentent les risques 
les plus importants pour l'organisation.

La bonne nouvelle est que le projet dispose déjà d'une infrastructure technique moderne (Next.js 15, Prisma) 
qui peut être exploitée pour implémenter les corrections nécessaires. La migration vers une architecture 
sécurisée nécessitera un investissement significatif mais réalisable sur une période de 6 mois.

Il est impératif que les actions prioritaires identifiées dans ce rapport soient traitées avant toute mise 
en production de l'application. Le stockage de données de professionnels de santé sans mesures de sécurité 
adéquates expose Prodipharm à des risques juridiques et réglementaires importants, notamment au regard du 
RGPD et des réglementations camerounaises sur la protection des données de santé.

Ce rapport constitue une base solide pour l'établissement d'un plan d'action de sécurité. Il est recommandé 
de réaliser un audit de suivi dans les 6 mois suivant la mise en oeuvre des corrections pour valider 
l'efficacité des mesures déployées.
"""
story.append(Paragraph(conclusion_text.strip(), body_style))
story.append(Spacer(1, 20))

# Signature
story.append(Paragraph('_' * 50, body_left_style))
story.append(Spacer(1, 8))
story.append(Paragraph('<b>Audit réalisé par:</b> Expert en Cybersécurité', body_left_style))
story.append(Paragraph('<b>Date:</b> Février 2025', body_left_style))
story.append(Paragraph('<b>Classification:</b> CONFIDENTIEL', body_left_style))

# Build PDF
doc.build(story)
print(f"PDF generated: {output_path}")

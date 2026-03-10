#!/usr/bin/env python3
"""
Generate PDF report for AMM Dossier from Regulatory Affairs module.
"""

import json
import sys
import os
import argparse
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# Register fonts
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')

# Status labels
STATUS_LABELS = {
    'a_preparer': 'À préparer',
    'documents_en_attente': 'Documents en attente',
    'documents_recus': 'Documents reçus',
    'dossier_envoye': 'Dossier envoyé',
    'en_cours_evaluation': 'En cours d\'évaluation',
    'demande_complement': 'Demande de complément',
    'amm_obtenue': 'AMM obtenue',
    'amm_refusee': 'AMM refusée'
}

PROCEDURE_LABELS = {
    'AMM': 'Autorisation de Mise sur le Marché',
    'Renouvellement': 'Renouvellement AMM',
    'Variation': 'Variation / Modification'
}

DOCUMENT_TYPE_LABELS = {
    'formulaire_officiel': 'Formulaire officiel rempli',
    'module_1': 'Module 1 (Document administratif)',
    'dossier_ctd': 'Dossier CTD / eCTD',
    'reception_echantillons': 'Réception échantillons (DHL)',
    'reception_email': 'Réception documents par courriel',
    'envoi_autorites': 'Envoi dossier aux autorités',
    'autre': 'Autre document'
}

DOCUMENT_STATUS_LABELS = {
    'recu': 'Reçu',
    'non_recu': 'Non reçu',
    'en_attente': 'En attente'
}

PRIORITY_LABELS = {
    'basse': 'Basse',
    'normale': 'Normale',
    'haute': 'Haute',
    'urgente': 'Urgente'
}


def generate_amm_pdf(dossier_data: dict, output_path: str):
    """Generate a PDF report for an AMM dossier."""
    
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
        title=f"Dossier_AMM_{dossier_data.get('id', 'unknown')}",
        author='Z.ai',
        creator='Z.ai',
        subject=f"Dossier AMM - {dossier_data.get('productName', '')}"
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        name='CustomTitle',
        fontName='Times New Roman',
        fontSize=18,
        leading=22,
        alignment=TA_CENTER,
        spaceAfter=12
    )
    
    heading_style = ParagraphStyle(
        name='CustomHeading',
        fontName='Times New Roman',
        fontSize=14,
        leading=18,
        alignment=TA_LEFT,
        spaceBefore=12,
        spaceAfter=8
    )
    
    subheading_style = ParagraphStyle(
        name='CustomSubheading',
        fontName='Times New Roman',
        fontSize=12,
        leading=16,
        alignment=TA_LEFT,
        spaceBefore=8,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        name='CustomBody',
        fontName='Times New Roman',
        fontSize=10,
        leading=14,
        alignment=TA_LEFT
    )
    
    table_header_style = ParagraphStyle(
        name='TableHeader',
        fontName='Times New Roman',
        fontSize=10,
        leading=12,
        alignment=TA_CENTER,
        textColor=colors.white
    )
    
    table_cell_style = ParagraphStyle(
        name='TableCell',
        fontName='Times New Roman',
        fontSize=9,
        leading=12,
        alignment=TA_LEFT
    )
    
    table_cell_center_style = ParagraphStyle(
        name='TableCellCenter',
        fontName='Times New Roman',
        fontSize=9,
        leading=12,
        alignment=TA_CENTER
    )
    
    story = []
    
    # Title
    story.append(Paragraph('<b>RAPPORT DOSSIER AMM</b>', title_style))
    story.append(Paragraph(f'<b>{dossier_data.get("id", "")}</b>', title_style))
    story.append(Spacer(1, 20))
    
    # Product Info Section
    story.append(Paragraph('<b>1. Informations du Produit</b>', heading_style))
    story.append(Spacer(1, 8))
    
    product_data = [
        [Paragraph('<b>Champ</b>', table_header_style), Paragraph('<b>Valeur</b>', table_header_style)],
        [Paragraph('ID Dossier', table_cell_style), Paragraph(dossier_data.get('id', ''), table_cell_style)],
        [Paragraph('Produit', table_cell_style), Paragraph(dossier_data.get('productName', ''), table_cell_style)],
        [Paragraph('Forme pharmaceutique', table_cell_style), Paragraph(dossier_data.get('pharmaceuticalForm', ''), table_cell_style)],
        [Paragraph('Dosage', table_cell_style), Paragraph(dossier_data.get('dosage', ''), table_cell_style)],
        [Paragraph('Laboratoire', table_cell_style), Paragraph(dossier_data.get('laboratory', ''), table_cell_style)],
    ]
    
    product_table = Table(product_data, colWidths=[5*cm, 10*cm])
    product_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(product_table)
    story.append(Spacer(1, 16))
    
    # Procedure Info Section
    story.append(Paragraph('<b>2. Informations de la Procédure</b>', heading_style))
    story.append(Spacer(1, 8))
    
    procedure_type = dossier_data.get('procedureType', '')
    procedure_label = PROCEDURE_LABELS.get(procedure_type, procedure_type)
    status = dossier_data.get('status', '')
    status_label = STATUS_LABELS.get(status, status)
    priority = dossier_data.get('priority', '')
    priority_label = PRIORITY_LABELS.get(priority, priority)
    
    procedure_data = [
        [Paragraph('<b>Champ</b>', table_header_style), Paragraph('<b>Valeur</b>', table_header_style)],
        [Paragraph('Pays', table_cell_style), Paragraph(dossier_data.get('country', ''), table_cell_style)],
        [Paragraph('Type de procédure', table_cell_style), Paragraph(procedure_label, table_cell_style)],
        [Paragraph('Statut actuel', table_cell_style), Paragraph(status_label, table_cell_style)],
        [Paragraph('Priorité', table_cell_style), Paragraph(priority_label, table_cell_style)],
        [Paragraph('Responsable', table_cell_style), Paragraph(dossier_data.get('responsibleName', ''), table_cell_style)],
        [Paragraph('Date de création', table_cell_style), Paragraph(dossier_data.get('createdAt', ''), table_cell_style)],
        [Paragraph('Dernière mise à jour', table_cell_style), Paragraph(dossier_data.get('updatedAt', ''), table_cell_style)],
    ]
    
    if dossier_data.get('expectedDate'):
        procedure_data.append([Paragraph('Date prévue', table_cell_style), Paragraph(dossier_data.get('expectedDate', ''), table_cell_style)])
    
    if dossier_data.get('ammReference'):
        procedure_data.append([Paragraph('Référence AMM', table_cell_style), Paragraph(dossier_data.get('ammReference', ''), table_cell_style)])
    
    if dossier_data.get('ammDate'):
        procedure_data.append([Paragraph('Date AMM', table_cell_style), Paragraph(dossier_data.get('ammDate', ''), table_cell_style)])
    
    if dossier_data.get('expiryDate'):
        procedure_data.append([Paragraph('Date d\'expiration', table_cell_style), Paragraph(dossier_data.get('expiryDate', ''), table_cell_style)])
    
    procedure_table = Table(procedure_data, colWidths=[5*cm, 10*cm])
    procedure_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(procedure_table)
    story.append(Spacer(1, 16))
    
    # Documents Section
    documents = dossier_data.get('documents', [])
    if documents:
        story.append(Paragraph('<b>3. Documents</b>', heading_style))
        story.append(Spacer(1, 8))
        
        doc_header = [
            Paragraph('<b>Document</b>', table_header_style),
            Paragraph('<b>Type</b>', table_header_style),
            Paragraph('<b>Statut</b>', table_header_style),
            Paragraph('<b>Date</b>', table_header_style)
        ]
        
        doc_rows = [doc_header]
        for document_item in documents:
            doc_type = document_item.get('type', '')
            doc_type_label = DOCUMENT_TYPE_LABELS.get(doc_type, doc_type)
            doc_status = document_item.get('status', '')
            doc_status_label = DOCUMENT_STATUS_LABELS.get(doc_status, doc_status)
            
            doc_rows.append([
                Paragraph(document_item.get('name', ''), table_cell_style),
                Paragraph(doc_type_label, table_cell_style),
                Paragraph(doc_status_label, table_cell_center_style),
                Paragraph(document_item.get('uploadedAt', '-'), table_cell_center_style)
            ])
        
        doc_table = Table(doc_rows, colWidths=[6*cm, 4*cm, 3*cm, 2*cm])
        doc_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(doc_table)
        story.append(Spacer(1, 16))
    
    # History Section
    history = dossier_data.get('history', [])
    if history:
        story.append(Paragraph('<b>4. Historique</b>', heading_style))
        story.append(Spacer(1, 8))
        
        hist_header = [
            Paragraph('<b>Date</b>', table_header_style),
            Paragraph('<b>Action</b>', table_header_style),
            Paragraph('<b>Utilisateur</b>', table_header_style),
            Paragraph('<b>Détails</b>', table_header_style)
        ]
        
        hist_rows = [hist_header]
        for entry in history:
            timestamp = entry.get('timestamp', '')
            if 'T' in timestamp:
                timestamp = timestamp.split('T')[0] + ' ' + timestamp.split('T')[1][:5]
            
            details = ''
            if entry.get('field'):
                old_val = STATUS_LABELS.get(entry.get('oldValue', ''), entry.get('oldValue', ''))
                new_val = STATUS_LABELS.get(entry.get('newValue', ''), entry.get('newValue', ''))
                details = f"{entry.get('field')}: {old_val} → {new_val}"
            
            hist_rows.append([
                Paragraph(timestamp, table_cell_style),
                Paragraph(entry.get('action', ''), table_cell_style),
                Paragraph(entry.get('userName', ''), table_cell_style),
                Paragraph(details, table_cell_style)
            ])
        
        hist_table = Table(hist_rows, colWidths=[3*cm, 4*cm, 3*cm, 5*cm])
        hist_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(hist_table)
        story.append(Spacer(1, 16))
    
    # Notes Section
    notes = dossier_data.get('notes', '')
    if notes:
        story.append(Paragraph('<b>5. Notes</b>', heading_style))
        story.append(Spacer(1, 8))
        story.append(Paragraph(notes, body_style))
        story.append(Spacer(1, 16))
    
    # Authority Response
    authority_response = dossier_data.get('authorityResponse', '')
    if authority_response:
        story.append(Paragraph('<b>6. Réponse des Autorités</b>', heading_style))
        story.append(Spacer(1, 8))
        story.append(Paragraph(authority_response, body_style))
        story.append(Spacer(1, 16))
    
    # Footer
    story.append(Spacer(1, 30))
    story.append(Paragraph(f'<i>Rapport généré le {datetime.now().strftime("%d/%m/%Y à %H:%M")}</i>', 
                          ParagraphStyle(name='Footer', fontName='Times New Roman', fontSize=9, alignment=TA_CENTER, textColor=colors.grey)))
    story.append(Paragraph('<i>PharmaLink - Prodipharm</i>', 
                          ParagraphStyle(name='Footer2', fontName='Times New Roman', fontSize=9, alignment=TA_CENTER, textColor=colors.grey)))
    
    # Build PDF
    doc.build(story)
    print(f"PDF generated: {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate PDF report for AMM Dossier')
    parser.add_argument('--json-file', help='Path to JSON file containing dossier data')
    parser.add_argument('--output', help='Output path for the generated PDF')
    parser.add_argument('json_data', nargs='?', help='JSON data as string (alternative to --json-file)')
    parser.add_argument('output_path', nargs='?', help='Output path (alternative to --output)')
    
    args = parser.parse_args()
    
    # Determine output path
    output = args.output or args.output_path
    if not output:
        print("Error: Output path is required (--output or positional argument)")
        sys.exit(1)
    
    # Load dossier data
    dossier_data = None
    if args.json_file:
        try:
            with open(args.json_file, 'r', encoding='utf-8') as f:
                dossier_data = json.load(f)
        except Exception as e:
            print(f"Error reading JSON file: {str(e)}")
            sys.exit(1)
    elif args.json_data:
        try:
            dossier_data = json.loads(args.json_data)
        except Exception as e:
            print(f"Error parsing JSON data: {str(e)}")
            sys.exit(1)
    else:
        print("Error: Either --json-file or JSON data is required")
        sys.exit(1)
    
    try:
        generate_amm_pdf(dossier_data, output)
    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

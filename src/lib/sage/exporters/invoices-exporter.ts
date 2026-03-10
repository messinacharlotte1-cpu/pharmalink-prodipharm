/**
 * Sage Invoices Exporter
 * Export des factures clients vers Sage Saari
 */

import { Invoice, OrderItem } from '@/types';
import {
  SAGE_INVOICE_FIELDS,
  SAGE_INVOICE_LINE_FIELDS,
  SAGE_TAX_CODES,
  SAGE_JOURNALS,
  SAGE_PAYMENT_TERMS,
} from '../config/sage-fields-config';
import type {
  SageInvoiceExport,
  SageInvoiceLineExport,
  SageExportOptions,
  SageExportResult,
  SageSyncError,
} from '../types/sage-types';

export class SageInvoicesExporter {
  /**
   * Convertit une facture PharmaLink en format Sage
   */
  static mapToSageInvoice(invoice: Invoice): SageInvoiceExport {
    return {
      DO_Piece: invoice.invoiceNumber,
      DO_Date: this.formatDate(invoice.createdAt),
      DO_Echeance: this.formatDate(invoice.dueDate),
      DO_Tiers: invoice.clientId,
      DO_Ref: invoice.orderNumber,
      DO_Journal: SAGE_JOURNALS.sales,
      DO_Libelle: `Facture ${invoice.invoiceNumber} - ${invoice.clientName}`,
      DO_TotalHT: invoice.subtotal - invoice.discount,
      DO_TotalTVA: invoice.tax,
      DO_TotalTTC: invoice.total,
      DO_Devise: 'XAF',
    };
  }

  /**
   * Convertit une ligne de facture en format Sage
   */
  static mapToSageInvoiceLine(
    item: OrderItem,
    invoiceNumber: string,
    lineNumber: number
  ): SageInvoiceLineExport {
    return {
      DO_Piece: invoiceNumber,
      DL_Ligne: lineNumber,
      DL_CodeArticle: item.productId,
      DL_Design: item.productName,
      DL_Qte: item.quantity,
      DL_PrixUnitaire: item.unitPrice,
      DL_Remise: item.discount,
      DL_CodeTVA: SAGE_TAX_CODES.standard,
      DL_MontantHT: item.total,
      DL_MontantTVA: this.calculateTVA(item.total),
      DL_CodeAna: 'VENTES_CAM',
    };
  }

  /**
   * Convertit une facture Sage en ligne CSV (en-tête)
   */
  static invoiceHeaderToCSVRow(invoice: SageInvoiceExport): string {
    const fields = [
      invoice.DO_Piece,
      invoice.DO_Date,
      invoice.DO_Echeance,
      invoice.DO_Tiers,
      '',  // Raison sociale (ajoutée par Sage)
      invoice.DO_Ref || '',
      invoice.DO_Journal,
      invoice.DO_Libelle || '',
      invoice.DO_TotalHT.toString(),
      invoice.DO_TotalTVA.toString(),
      invoice.DO_TotalTTC.toString(),
      invoice.DO_Devise || 'XAF',
    ];

    return fields.map(f => this.escapeCSV(f)).join(';');
  }

  /**
   * Convertit une ligne de facture Sage en ligne CSV
   */
  static invoiceLineToCSVRow(line: SageInvoiceLineExport): string {
    const fields = [
      line.DO_Piece,
      line.DL_Ligne.toString(),
      line.DL_CodeArticle,
      line.DL_Design,
      line.DL_Qte.toString(),
      line.DL_PrixUnitaire.toString(),
      line.DL_Remise?.toString() || '0',
      line.DL_CodeTVA,
      line.DL_MontantHT.toString(),
      line.DL_MontantTVA?.toString() || '0',
      line.DL_CodeAna || '',
    ];

    return fields.map(f => this.escapeCSV(f)).join(';');
  }

  /**
   * Génère l'en-tête CSV pour les factures
   */
  static getCSVHeaders(): { header: string; linesHeader: string } {
    const header = [
      'N° Facture',
      'Date',
      'Échéance',
      'Code tiers',
      'Raison sociale',
      'Référence',
      'Journal',
      'Libellé',
      'Total HT',
      'Total TVA',
      'Total TTC',
      'Devise',
    ].map(h => this.escapeCSV(h)).join(';');

    const linesHeader = [
      'N° Facture',
      'N° Ligne',
      'Code article',
      'Désignation',
      'Quantité',
      'Prix unitaire',
      'Remise %',
      'Code TVA',
      'Montant HT',
      'Montant TVA',
      'Code analytique',
    ].map(h => this.escapeCSV(h)).join(';');

    return { header, linesHeader };
  }

  /**
   * Exporte une liste de factures en CSV
   */
  static exportToCSV(
    invoices: Invoice[],
    options?: Partial<SageExportOptions>
  ): SageExportResult {
    const startTime = Date.now();
    const errors: SageSyncError[] = [];
    const warnings: SageSyncError[] = [];

    // Filtrer les factures
    let filteredInvoices = invoices;
    
    if (options?.dateFrom) {
      filteredInvoices = filteredInvoices.filter(
        i => i.createdAt >= options.dateFrom!
      );
    }
    
    if (options?.dateTo) {
      filteredInvoices = filteredInvoices.filter(
        i => i.createdAt <= options.dateTo!
      );
    }

    // Ne pas exporter les factures annulées ou en brouillon
    if (!options?.includeInactive) {
      filteredInvoices = filteredInvoices.filter(
        i => i.status !== 'cancelled' && i.status !== 'draft'
      );
    }

    // Mapper les factures
    const sageInvoices: SageInvoiceExport[] = [];
    const sageLines: SageInvoiceLineExport[] = [];
    
    filteredInvoices.forEach((invoice, index) => {
      try {
        // Validation
        if (!invoice.invoiceNumber) {
          warnings.push({
            lineNumber: index + 2,
            recordId: invoice.id,
            message: `Facture sans numéro ignorée`,
            severity: 'warning',
          });
          return;
        }

        if (!invoice.clientId) {
          warnings.push({
            lineNumber: index + 2,
            recordId: invoice.id,
            message: `Facture ${invoice.invoiceNumber} sans client ignorée`,
            severity: 'warning',
          });
          return;
        }

        if (!invoice.items || invoice.items.length === 0) {
          warnings.push({
            lineNumber: index + 2,
            recordId: invoice.id,
            message: `Facture ${invoice.invoiceNumber} sans lignes ignorée`,
            severity: 'warning',
          });
          return;
        }

        // Ajouter l'en-tête
        sageInvoices.push(this.mapToSageInvoice(invoice));

        // Ajouter les lignes
        invoice.items.forEach((item, lineIndex) => {
          sageLines.push(
            this.mapToSageInvoiceLine(item, invoice.invoiceNumber, lineIndex + 1)
          );
        });
      } catch (error) {
        errors.push({
          lineNumber: index + 2,
          recordId: invoice.id,
          message: `Erreur de mapping: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          severity: 'error',
        });
      }
    });

    // Générer le contenu CSV
    const { header, linesHeader } = this.getCSVHeaders();
    const headerRows = sageInvoices.map(i => this.invoiceHeaderToCSVRow(i));
    const lineRows = sageLines.map(l => this.invoiceLineToCSVRow(l));

    // Fichier d'en-têtes
    const headerCsv = [header, ...headerRows].join('\n');
    // Fichier de lignes
    const linesCsv = [linesHeader, ...lineRows].join('\n');

    // Contenu combiné (format Sage)
    const csvContent = `${headerCsv}\n\n--- LIGNES ---\n${linesCsv}`;

    // Générer le nom de fichier
    const fileName = `Sage_Factures_${new Date().toISOString().split('T')[0]}.csv`;

    return {
      success: errors.length === 0,
      fileName,
      filePath: `/exports/sage/${fileName}`,
      recordsCount: sageInvoices.length,
      fileSize: Buffer.byteLength(csvContent, 'utf-8'),
      duration: Date.now() - startTime,
      errors,
      warnings,
      downloadUrl: `/api/sage/export/invoices/download?file=${fileName}`,
    };
  }

  /**
   * Génère le contenu CSV pour l'import Sage (format pièce)
   */
  static generateCSVContent(invoices: Invoice[]): string {
    const { header, linesHeader } = this.getCSVHeaders();
    
    const sageInvoices = invoices.map(i => this.mapToSageInvoice(i));
    const headerRows = sageInvoices.map(i => this.invoiceHeaderToCSVRow(i));
    
    const sageLines: SageInvoiceLineExport[] = [];
    invoices.forEach(invoice => {
      invoice.items.forEach((item, lineIndex) => {
        sageLines.push(
          this.mapToSageInvoiceLine(item, invoice.invoiceNumber, lineIndex + 1)
        );
      });
    });
    const lineRows = sageLines.map(l => this.invoiceLineToCSVRow(l));

    // Format Sage : en-têtes suivies des lignes
    let csv = `${header}\n`;
    csv += headerRows.join('\n');
    csv += '\n\n';
    csv += `${linesHeader}\n`;
    csv += lineRows.join('\n');

    return csv;
  }

  /**
   * Génère le contenu au format Sage (fichier d'import)
   */
  static generateSageImportFile(invoices: Invoice[]): string {
    // Format spécifique Sage pour l'import de documents
    let content = '';
    
    invoices.forEach(invoice => {
      // En-tête document
      content += `D;${invoice.invoiceNumber};`;
      content += `${this.formatDate(invoice.createdAt)};`;
      content += `${this.formatDate(invoice.dueDate)};`;
      content += `${invoice.clientId};`;
      content += `${SAGE_JOURNALS.sales};`;
      content += `${invoice.total};`;
      content += `${invoice.tax};`;
      content += `${invoice.subtotal};`;
      content += '\n';
      
      // Lignes document
      invoice.items.forEach((item, index) => {
        content += `L;${invoice.invoiceNumber};`;
        content += `${index + 1};`;
        content += `${item.productId};`;
        content += `${item.productName};`;
        content += `${item.quantity};`;
        content += `${item.unitPrice};`;
        content += `${item.discount || 0};`;
        content += `${item.total};`;
        content += '\n';
      });
    });

    return content;
  }

  /**
   * Exporte les factures par période
   */
  static exportByPeriod(
    invoices: Invoice[],
    period: 'daily' | 'weekly' | 'monthly'
  ): { [period: string]: Invoice[] } {
    const grouped: { [period: string]: Invoice[] } = {};

    invoices.forEach(invoice => {
      const date = new Date(invoice.createdAt);
      let key: string;

      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(invoice);
    });

    return grouped;
  }

  /**
   * Calcule la TVA (19.25% Cameroun)
   */
  private static calculateTVA(amountHT: number): number {
    return Math.round(amountHT * 0.1925);
  }

  /**
   * Formate une date pour Sage (JJ/MM/AAAA)
   */
  private static formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Échappe les caractères spéciaux CSV
   */
  private static escapeCSV(value: string | number): string {
    const str = String(value);
    if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
}

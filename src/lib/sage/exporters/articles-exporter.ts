/**
 * Sage Articles Exporter
 * Export des produits pharmaceutiques vers Sage Saari
 */

import { PharmaProduct } from '@/types';
import {
  SAGE_ARTICLE_FIELDS,
  SAGE_FAMILY_MAPPING,
  SAGE_TAX_CODES,
  SAGE_ACCOUNTS,
  SAGE_UNITS,
} from '../config/sage-fields-config';
import type { SageArticleExport, SageExportOptions, SageExportResult, SageSyncError } from '../types/sage-types';

export class SageArticlesExporter {
  /**
   * Convertit un produit PharmaLink en format Sage
   */
  static mapToSageArticle(product: PharmaProduct): SageArticleExport {
    // Déterminer le compte de vente selon la catégorie
    const salesAccount = this.getSalesAccount(product.category);
    
    // Déterminer le compte d'achat selon la catégorie
    const purchaseAccount = this.getPurchaseAccount(product.category);
    
    // Déterminer le code dépôt depuis la localisation
    const depotCode = this.getDepotCode(product.location);
    
    return {
      AR_Ref: product.code.substring(0, SAGE_ARTICLE_FIELDS.code.maxLength),
      AR_Design: product.name.substring(0, SAGE_ARTICLE_FIELDS.name.maxLength),
      AR_Design2: product.description?.substring(0, SAGE_ARTICLE_FIELDS.name2.maxLength) || undefined,
      FAM_Code: SAGE_FAMILY_MAPPING[product.category] || 'DIVERS',
      SFAM_Code: undefined,
      AR_Unite: SAGE_UNITS.box,
      AR_PrixVen: product.unitPrice,
      AR_CodeTva: SAGE_TAX_CODES.standard,
      AR_CptVente: salesAccount,
      AR_CptAchat: purchaseAccount,
      DE_Code: depotCode,
      AR_StockMin: product.minStock,
      AR_StockMax: product.maxStock,
      AR_CodeAna: 'VENTES_CAM',
    };
  }

  /**
   * Convertit un article Sage en ligne CSV
   */
  static articleToCSVRow(article: SageArticleExport): string {
    const fields = [
      article.AR_Ref,
      article.AR_Design,
      article.AR_Design2 || '',
      article.FAM_Code,
      article.SFAM_Code || '',
      article.AR_Unite,
      article.AR_PrixVen.toString(),
      article.AR_CodeTva,
      article.AR_CptVente,
      article.AR_CptAchat || '',
      article.DE_Code || '',
      article.AR_StockMin?.toString() || '',
      article.AR_StockMax?.toString() || '',
      article.AR_CodeAna || '',
    ];

    return fields.map(f => this.escapeCSV(f)).join(';');
  }

  /**
   * Génère l'en-tête CSV pour les articles
   */
  static getCSVHeader(): string {
    const headers = [
      'Code article',
      'Désignation',
      'Désignation 2',
      'Famille',
      'Sous-famille',
      'Unité',
      'Prix HT',
      'Code TVA',
      'Compte vente',
      'Compte achat',
      'Dépôt',
      'Stock min',
      'Stock max',
      'Code analytique',
    ];

    return headers.map(h => this.escapeCSV(h)).join(';');
  }

  /**
   * Exporte une liste de produits en CSV
   */
  static exportToCSV(
    products: PharmaProduct[],
    options?: Partial<SageExportOptions>
  ): SageExportResult {
    const startTime = Date.now();
    const errors: SageSyncError[] = [];
    const warnings: SageSyncError[] = [];

    // Filtrer les produits si nécessaire
    let filteredProducts = products;
    
    if (!options?.includeInactive) {
      filteredProducts = filteredProducts.filter(p => p.status !== 'out_of_stock');
    }
    
    if (!options?.includeZeroStock) {
      filteredProducts = filteredProducts.filter(p => p.stockQuantity > 0);
    }

    // Mapper les produits
    const articles: SageArticleExport[] = [];
    
    filteredProducts.forEach((product, index) => {
      try {
        // Validation
        if (!product.code) {
          warnings.push({
            lineNumber: index + 2,
            recordId: product.id,
            message: `Produit sans code ignoré: ${product.name}`,
            severity: 'warning',
          });
          return;
        }

        if (!product.name) {
          warnings.push({
            lineNumber: index + 2,
            recordId: product.id,
            message: `Produit sans nom ignoré: ${product.code}`,
            severity: 'warning',
          });
          return;
        }

        articles.push(this.mapToSageArticle(product));
      } catch (error) {
        errors.push({
          lineNumber: index + 2,
          recordId: product.id,
          message: `Erreur de mapping: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          severity: 'error',
        });
      }
    });

    // Générer le contenu CSV
    const header = this.getCSVHeader();
    const rows = articles.map(a => this.articleToCSVRow(a));
    const csvContent = [header, ...rows].join('\n');

    // Générer le nom de fichier
    const fileName = `Sage_Articles_${new Date().toISOString().split('T')[0]}.csv`;

    return {
      success: errors.length === 0,
      fileName,
      filePath: `/exports/sage/${fileName}`,
      recordsCount: articles.length,
      fileSize: Buffer.byteLength(csvContent, 'utf-8'),
      duration: Date.now() - startTime,
      errors,
      warnings,
      downloadUrl: `/api/sage/export/articles/download?file=${fileName}`,
    };
  }

  /**
   * Génère le contenu CSV complet (pour téléchargement)
   */
  static generateCSVContent(products: PharmaProduct[]): string {
    const articles = products.map(p => this.mapToSageArticle(p));
    const header = this.getCSVHeader();
    const rows = articles.map(a => this.articleToCSVRow(a));
    return [header, ...rows].join('\n');
  }

  /**
   * Génère le contenu Excel (format XML pour Excel)
   */
  static generateExcelContent(products: PharmaProduct[]): string {
    const articles = products.map(p => this.mapToSageArticle(p));
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<?mso-application progid="Excel.Sheet"?>\n';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
    xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xml += '<Worksheet ss:Name="Articles">\n';
    xml += '<Table>\n';

    // En-têtes
    xml += '<Row>\n';
    const headers = [
      'Code article', 'Désignation', 'Désignation 2', 'Famille',
      'Sous-famille', 'Unité', 'Prix HT', 'Code TVA', 'Compte vente',
      'Compte achat', 'Dépôt', 'Stock min', 'Stock max', 'Code analytique'
    ];
    headers.forEach(h => {
      xml += `<Cell><Data ss:Type="String">${this.escapeXML(h)}</Data></Cell>\n`;
    });
    xml += '</Row>\n';

    // Données
    articles.forEach(article => {
      xml += '<Row>\n';
      const values = [
        { value: article.AR_Ref, type: 'String' },
        { value: article.AR_Design, type: 'String' },
        { value: article.AR_Design2 || '', type: 'String' },
        { value: article.FAM_Code, type: 'String' },
        { value: article.SFAM_Code || '', type: 'String' },
        { value: article.AR_Unite, type: 'String' },
        { value: article.AR_PrixVen.toString(), type: 'Number' },
        { value: article.AR_CodeTva, type: 'String' },
        { value: article.AR_CptVente, type: 'String' },
        { value: article.AR_CptAchat || '', type: 'String' },
        { value: article.DE_Code || '', type: 'String' },
        { value: article.AR_StockMin?.toString() || '', type: 'Number' },
        { value: article.AR_StockMax?.toString() || '', type: 'Number' },
        { value: article.AR_CodeAna || '', type: 'String' },
      ];
      values.forEach(v => {
        xml += `<Cell><Data ss:Type="${v.type}">${this.escapeXML(v.value)}</Data></Cell>\n`;
      });
      xml += '</Row>\n';
    });

    xml += '</Table>\n';
    xml += '</Worksheet>\n';
    xml += '</Workbook>';

    return xml;
  }

  /**
   * Détermine le compte de vente selon la catégorie
   */
  private static getSalesAccount(category: string): string {
    const mapping: Record<string, string> = {
      'Antalgiques': SAGE_ACCOUNTS.salesMedicines,
      'Antibiotiques': SAGE_ACCOUNTS.salesMedicines,
      'Anti-inflammatoires': SAGE_ACCOUNTS.salesMedicines,
      'Vitamines': SAGE_ACCOUNTS.salesMedicines,
      'Cardiovasculaires': SAGE_ACCOUNTS.salesMedicines,
      'Gastro-entérologie': SAGE_ACCOUNTS.salesMedicines,
      'Dispositifs médicaux': SAGE_ACCOUNTS.salesDevices,
    };

    return mapping[category] || SAGE_ACCOUNTS.salesMedicines;
  }

  /**
   * Détermine le compte d'achat selon la catégorie
   */
  private static getPurchaseAccount(category: string): string {
    const mapping: Record<string, string> = {
      'Antalgiques': SAGE_ACCOUNTS.purchaseMedicines,
      'Antibiotiques': SAGE_ACCOUNTS.purchaseMedicines,
      'Anti-inflammatoires': SAGE_ACCOUNTS.purchaseMedicines,
      'Vitamines': SAGE_ACCOUNTS.purchaseMedicines,
      'Cardiovasculaires': SAGE_ACCOUNTS.purchaseMedicines,
      'Gastro-entérologie': SAGE_ACCOUNTS.purchaseMedicines,
      'Dispositifs médicaux': SAGE_ACCOUNTS.purchaseDevices,
    };

    return mapping[category] || SAGE_ACCOUNTS.purchaseMedicines;
  }

  /**
   * Extrait le code dépôt depuis la localisation
   */
  private static getDepotCode(location?: string): string {
    if (!location) return 'DEPOT_A';

    if (location.includes('Entrepôt A')) return 'DEPOT_A';
    if (location.includes('Entrepôt B')) return 'DEPOT_B';
    if (location.includes('Entrepôt C')) return 'DEPOT_C';
    if (location.includes('Entrepôt D')) return 'DEPOT_D';
    if (location.includes('Zone humide')) return 'DEPOT_C';
    if (location.includes('Stock Distribution')) return 'DEPOT_D';

    return 'DEPOT_A';
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

  /**
   * Échappe les caractères XML
   */
  private static escapeXML(value: string | number): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

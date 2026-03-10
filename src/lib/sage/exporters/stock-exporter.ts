/**
 * Sage Stock Movements Exporter
 * Export des mouvements de stock vers Sage Saari
 */

import { StockMovement } from '@/types';
import {
  SAGE_STOCK_MOVEMENT_FIELDS,
  SAGE_STOCK_MOVEMENT_TYPES,
  SAGE_JOURNALS,
} from '../config/sage-fields-config';
import type {
  SageStockMovementExport,
  SageExportOptions,
  SageExportResult,
  SageSyncError,
} from '../types/sage-types';

export class SageStockExporter {
  /**
   * Convertit un mouvement de stock PharmaLink en format Sage
   */
  static mapToSageMovement(movement: StockMovement): SageStockMovementExport {
    return {
      DO_Piece: movement.reference,
      DO_Date: this.formatDate(movement.date),
      DO_Type: this.getMovementTypeCode(movement.type),
      DL_CodeArticle: movement.productId,
      DL_Design: movement.productName,
      DL_Qte: movement.type === 'exit' || movement.type === 'adjustment' 
        ? -Math.abs(movement.quantity) 
        : Math.abs(movement.quantity),
      DL_PrixUnitaire: 0, // À remplir selon le contexte
      DE_Code: this.getDepotCode(movement.toLocation || movement.fromLocation),
      DE_Emplacement: movement.toLocation || movement.fromLocation,
      DL_Lot: undefined,
      DL_DLC: undefined,
      DL_Motif: movement.reason,
      DO_Ref: movement.reference,
    };
  }

  /**
   * Convertit un mouvement Sage en ligne CSV
   */
  static movementToCSVRow(movement: SageStockMovementExport): string {
    const fields = [
      movement.DO_Piece,
      movement.DO_Date,
      movement.DO_Type,
      movement.DL_CodeArticle,
      movement.DL_Design || '',
      movement.DL_Qte.toString(),
      movement.DL_PrixUnitaire?.toString() || '',
      movement.DE_Code,
      movement.DE_Emplacement || '',
      movement.DL_Lot || '',
      movement.DL_DLC || '',
      movement.DL_Motif || '',
      movement.DO_Ref || '',
    ];

    return fields.map(f => this.escapeCSV(f)).join(';');
  }

  /**
   * Génère l'en-tête CSV pour les mouvements de stock
   */
  static getCSVHeader(): string {
    const headers = [
      'N° Pièce',
      'Date',
      'Type',
      'Code article',
      'Désignation',
      'Quantité',
      'Prix unitaire',
      'Dépôt',
      'Emplacement',
      'N° Lot',
      'DLC',
      'Motif',
      'Référence',
    ];

    return headers.map(h => this.escapeCSV(h)).join(';');
  }

  /**
   * Exporte une liste de mouvements en CSV
   */
  static exportToCSV(
    movements: StockMovement[],
    options?: Partial<SageExportOptions>
  ): SageExportResult {
    const startTime = Date.now();
    const errors: SageSyncError[] = [];
    const warnings: SageSyncError[] = [];

    // Filtrer les mouvements
    let filteredMovements = movements;
    
    if (options?.dateFrom) {
      filteredMovements = filteredMovements.filter(
        m => m.date >= options.dateFrom!
      );
    }
    
    if (options?.dateTo) {
      filteredMovements = filteredMovements.filter(
        m => m.date <= options.dateTo!
      );
    }

    // Mapper les mouvements
    const sageMovements: SageStockMovementExport[] = [];
    
    filteredMovements.forEach((movement, index) => {
      try {
        // Validation
        if (!movement.productId) {
          warnings.push({
            lineNumber: index + 2,
            recordId: movement.id,
            message: `Mouvement sans article ignoré`,
            severity: 'warning',
          });
          return;
        }

        if (!movement.reference) {
          warnings.push({
            lineNumber: index + 2,
            recordId: movement.id,
            message: `Mouvement sans référence ignoré`,
            severity: 'warning',
          });
          return;
        }

        sageMovements.push(this.mapToSageMovement(movement));
      } catch (error) {
        errors.push({
          lineNumber: index + 2,
          recordId: movement.id,
          message: `Erreur de mapping: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          severity: 'error',
        });
      }
    });

    // Générer le contenu CSV
    const header = this.getCSVHeader();
    const rows = sageMovements.map(m => this.movementToCSVRow(m));
    const csvContent = [header, ...rows].join('\n');

    // Générer le nom de fichier
    const fileName = `Sage_Stock_${new Date().toISOString().split('T')[0]}.csv`;

    return {
      success: errors.length === 0,
      fileName,
      filePath: `/exports/sage/${fileName}`,
      recordsCount: sageMovements.length,
      fileSize: Buffer.byteLength(csvContent, 'utf-8'),
      duration: Date.now() - startTime,
      errors,
      warnings,
      downloadUrl: `/api/sage/export/stock/download?file=${fileName}`,
    };
  }

  /**
   * Génère le contenu CSV complet (pour téléchargement)
   */
  static generateCSVContent(movements: StockMovement[]): string {
    const sageMovements = movements.map(m => this.mapToSageMovement(m));
    const header = this.getCSVHeader();
    const rows = sageMovements.map(m => this.movementToCSVRow(m));
    return [header, ...rows].join('\n');
  }

  /**
   * Génère un fichier d'inventaire (état des stocks à une date)
   */
  static generateInventoryFile(
    products: Array<{
      code: string;
      name: string;
      stockQuantity: number;
      unitPrice: number;
      location?: string;
    }>
  ): string {
    const header = [
      'Code article',
      'Désignation',
      'Quantité théorique',
      'Valeur unitaire',
      'Valeur totale',
      'Dépôt',
    ].map(h => this.escapeCSV(h)).join(';');

    const rows = products.map(p => {
      const fields = [
        p.code,
        p.name,
        p.stockQuantity.toString(),
        p.unitPrice.toString(),
        (p.stockQuantity * p.unitPrice).toString(),
        this.getDepotCode(p.location),
      ];
      return fields.map(f => this.escapeCSV(f)).join(';');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Génère un fichier de régularisation de stock
   */
  static generateAdjustmentFile(
    adjustments: Array<{
      productId: string;
      productName: string;
      theoreticalQty: number;
      countedQty: number;
      variance: number;
      unitPrice: number;
      reason: string;
    }>
  ): string {
    const header = this.getCSVHeader();
    
    const rows = adjustments.map((adj, index) => {
      const reference = `ADJ-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(index + 1).padStart(4, '0')}`;
      
      const fields = [
        reference,
        this.formatDate(new Date().toISOString()),
        'A', // Ajustement
        adj.productId,
        adj.productName,
        adj.variance.toString(),
        adj.unitPrice.toString(),
        'DEPOT_A',
        '',
        '',
        '',
        adj.reason,
        '',
      ];
      return fields.map(f => this.escapeCSV(f)).join(';');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Obtient le code type de mouvement Sage
   */
  private static getMovementTypeCode(
    type: 'entry' | 'exit' | 'transfer' | 'adjustment'
  ): string {
    const types: Record<string, string> = {
      entry: SAGE_STOCK_MOVEMENT_TYPES.entry,
      exit: SAGE_STOCK_MOVEMENT_TYPES.exit,
      transfer: SAGE_STOCK_MOVEMENT_TYPES.transfer,
      adjustment: SAGE_STOCK_MOVEMENT_TYPES.adjustment,
    };
    return types[type] || 'E';
  }

  /**
   * Extrait le code dépôt depuis une localisation
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

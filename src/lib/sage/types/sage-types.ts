/**
 * Types pour l'intégration Sage Saari
 * Types de données pour l'export et l'import avec Sage
 */

// ============================================
// Types de base communs
// ============================================

export interface SageConfig {
  // Configuration de connexion API (si disponible)
  apiUrl?: string;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  
  // Configuration d'export fichier
  exportPath: string;
  importPath: string;
  
  // Paramètres généraux
  companyCode: string;
  companyName: string;
  currency: string;
  defaultJournal: string;
  defaultDepot: string;
  
  // Paramètres de synchronisation
  syncEnabled: boolean;
  autoExport: boolean;
  autoImport: boolean;
  exportFrequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  importFrequency: 'daily' | 'weekly' | 'monthly' | 'manual';
}

// ============================================
// Types Articles/Produits
// ============================================

export interface SageArticle {
  // Identification
  code: string;
  name: string;
  name2?: string;
  
  // Classification
  familyCode: string;
  subFamilyCode?: string;
  
  // Unités et prix
  unit: string;
  unitPriceHT: number;
  costPriceHT?: number;
  taxCode: string;
  taxRate: number;
  
  // Comptabilité
  salesAccount: string;
  purchaseAccount?: string;
  analyticCode?: string;
  
  // Stock
  depotCode?: string;
  minStock?: number;
  maxStock?: number;
  currentStock?: number;
  
  // Lots et péremption
  lotNumber?: string;
  expirationDate?: string;
  
  // Métadonnées
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SageArticleExport {
  AR_Ref: string;           // Code article
  AR_Design: string;        // Désignation
  AR_Design2?: string;      // Désignation 2
  FAM_Code: string;         // Code famille
  SFAM_Code?: string;       // Code sous-famille
  AR_Unite: string;         // Unité
  AR_PrixVen: number;       // Prix de vente HT
  AR_CodeTva: string;       // Code TVA
  AR_CptVente: string;      // Compte vente
  AR_CptAchat?: string;     // Compte achat
  DE_Code?: string;         // Code dépôt
  AR_StockMin?: number;     // Stock minimum
  AR_StockMax?: number;     // Stock maximum
  AR_CodeAna?: string;      // Code analytique
}

// ============================================
// Types Tiers (Clients/Fournisseurs)
// ============================================

export interface SageTier {
  // Identification
  code: string;
  name: string;
  
  // Type (0=Client, 1=Fournisseur, 2=Salarié, 3=Autre)
  type: 0 | 1 | 2 | 3;
  
  // Adresse
  address?: string;
  address2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  
  // Coordonnées
  phone?: string;
  fax?: string;
  email?: string;
  
  // Identifiants fiscaux
  siret?: string;
  nif?: string;
  stat?: string;
  
  // Conditions commerciales
  paymentTerms: string;
  creditLimit?: number;
  
  // Comptabilité
  accountCode: string;
  currency?: string;
  
  // Contact
  contactPerson?: string;
  
  // Catégorie
  category?: string;
  
  // Métadonnées
  active: boolean;
  balance?: number;
}

export interface SageClientExport {
  T_Code: string;           // Code tiers
  T_Intitule: string;       // Raison sociale
  T_Adresse?: string;       // Adresse
  T_Adresse2?: string;      // Adresse suite
  T_CodePostal?: string;    // Code postal
  T_Ville?: string;         // Ville
  T_Pays?: string;          // Pays (code ISO)
  T_Telephone?: string;     // Téléphone
  T_Telecopie?: string;     // Fax
  T_Email?: string;         // Email
  T_Siret?: string;         // SIRET
  T_Condition: string;      // Conditions paiement
  T_EncoursMax?: number;    // Encours max
  T_CompteCollectif: string; // Compte collectif
  T_Devise?: string;        // Devise
  T_Contact?: string;       // Contact
  T_Categorie?: string;     // Catégorie
}

export interface SageSupplierImport {
  T_Code: string;
  T_Intitule: string;
  T_Adresse?: string;
  T_Ville?: string;
  T_Pays?: string;
  T_Telephone?: string;
  T_Email?: string;
  T_Contact?: string;
  T_Condition?: string;
  T_CompteCollectif?: string;
}

// ============================================
// Types Documents (Factures/Commandes)
// ============================================

export interface SageInvoice {
  // En-tête
  number: string;
  date: string;
  dueDate: string;
  
  // Tiers
  clientCode: string;
  clientName: string;
  
  // Références
  reference?: string;
  orderNumber?: string;
  deliveryNumber?: string;
  
  // Journal
  journalCode: string;
  label?: string;
  
  // Montants
  totalHT: number;
  totalDiscount: number;
  totalTVA: number;
  totalTTC: number;
  
  // Devise
  currency: string;
  
  // Lignes
  lines: SageInvoiceLine[];
  
  // Échéances
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  amountPaid?: number;
  amountDue?: number;
}

export interface SageInvoiceLine {
  lineNumber: number;
  productCode: string;
  productName: string;
  quantity: number;
  unitPriceHT: number;
  discountPercent?: number;
  taxCode: string;
  taxRate: number;
  amountHT: number;
  amountTVA: number;
  analyticCode?: string;
  lotNumber?: string;
  expirationDate?: string;
}

export interface SageInvoiceExport {
  // En-tête
  DO_Piece: string;         // N° pièce
  DO_Date: string;          // Date
  DO_Echeance: string;      // Échéance
  DO_Tiers: string;         // Code tiers
  DO_Ref?: string;          // Référence
  DO_Journal: string;       // Code journal
  DO_Libelle?: string;      // Libellé
  DO_TotalHT: number;       // Total HT
  DO_TotalTVA: number;      // Total TVA
  DO_TotalTTC: number;      // Total TTC
  DO_Devise?: string;       // Devise
}

export interface SageInvoiceLineExport {
  DO_Piece: string;         // N° pièce
  DL_Ligne: number;         // N° ligne
  DL_CodeArticle: string;   // Code article
  DL_Design: string;        // Désignation
  DL_Qte: number;           // Quantité
  DL_PrixUnitaire: number;  // Prix unitaire
  DL_Remise?: number;       // Remise %
  DL_CodeTVA: string;       // Code TVA
  DL_MontantHT: number;     // Montant HT
  DL_MontantTVA?: number;   // Montant TVA
  DL_CodeAna?: string;      // Code analytique
}

// ============================================
// Types Mouvements de Stock
// ============================================

export interface SageStockMovement {
  // Identification
  reference: string;
  date: string;
  type: 'E' | 'S' | 'T' | 'A'; // Entrée, Sortie, Transfert, Ajustement
  
  // Article
  productCode: string;
  productName?: string;
  quantity: number;
  unitPrice?: number;
  
  // Emplacement
  depotCode: string;
  depotFrom?: string;
  depotTo?: string;
  location?: string;
  
  // Lot
  lotNumber?: string;
  expirationDate?: string;
  
  // Références
  documentRef?: string;
  reason?: string;
  
  // Comptabilité
  accountCode?: string;
  analyticCode?: string;
}

export interface SageStockMovementExport {
  DO_Piece: string;         // N° pièce
  DO_Date: string;          // Date
  DO_Type: string;          // Type (E/S/T/A)
  DL_CodeArticle: string;   // Code article
  DL_Design?: string;       // Désignation
  DL_Qte: number;           // Quantité
  DL_PrixUnitaire?: number; // Prix unitaire
  DE_Code: string;          // Code dépôt
  DE_Emplacement?: string;  // Emplacement
  DL_Lot?: string;          // N° lot
  DL_DLC?: string;          // Date limite
  DL_Motif?: string;        // Motif
  DO_Ref?: string;          // Référence document
}

// ============================================
// Types Paiements
// ============================================

export interface SagePayment {
  // Identification
  number: string;
  date: string;
  
  // Tiers
  clientCode: string;
  clientName?: string;
  
  // Montant
  amount: number;
  currency: string;
  
  // Mode de paiement
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'mobile_money' | 'card';
  bankCode?: string;
  accountNumber?: string;
  reference?: string;
  
  // Lettrage
  invoices: SagePaymentInvoice[];
  
  // Journal
  journalCode: string;
}

export interface SagePaymentInvoice {
  invoiceNumber: string;
  amount: number;
}

export interface SagePaymentExport {
  DO_Piece: string;         // N° règlement
  DO_Date: string;          // Date
  DO_Tiers: string;         // Code tiers
  DO_Montant: number;       // Montant
  DO_Devise?: string;       // Devise
  DO_ModeRegl: string;      // Mode règlement
  DO_Banque?: string;       // Code banque
  DO_Ref?: string;          // Référence
  DO_Journal: string;       // Code journal
}

// ============================================
// Types Écritures Comptables
// ============================================

export interface SageAccountingEntry {
  // Identification
  journalCode: string;
  pieceNumber: string;
  pieceDate: string;
  
  // Ligne
  lineNumber: number;
  accountCode: string;
  auxAccountCode?: string;
  
  // Libellé
  label: string;
  
  // Montants
  debit: number;
  credit: number;
  
  // Références
  reference?: string;
  dueDate?: string;
  
  // Analytique
  analyticCode?: string;
  
  // Lettrage
  matchingCode?: string;
  
  // Devise
  currency?: string;
  amountCurrency?: number;
}

// ============================================
// Types Logs et Synchronisation
// ============================================

export interface SageSyncLog {
  id: string;
  type: 'export' | 'import';
  entity: 'articles' | 'clients' | 'invoices' | 'stock' | 'suppliers' | 'payments';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'partial';
  
  // Fichier
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  
  // Comptage
  recordsTotal?: number;
  recordsProcessed?: number;
  recordsSuccess?: number;
  recordsFailed?: number;
  recordsSkipped?: number;
  
  // Erreurs
  errorMessage?: string;
  errorDetails?: SageSyncError[];
  
  // Timestamps
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  createdBy?: string;
}

export interface SageSyncError {
  lineNumber?: number;
  recordId?: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface SageMapping {
  id: string;
  pharmaLinkType: 'product' | 'client' | 'supplier' | 'invoice' | 'order' | 'payment';
  pharmaLinkId: string;
  sageCode: string;
  sageId?: string;
  lastSyncAt?: string;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Types Résultats Export/Import
// ============================================

export interface SageExportResult {
  success: boolean;
  fileName: string;
  filePath: string;
  recordsCount: number;
  fileSize: number;
  duration: number;
  errors: SageSyncError[];
  warnings: SageSyncError[];
  downloadUrl?: string;
}

export interface SageImportResult {
  success: boolean;
  fileName: string;
  recordsTotal: number;
  recordsImported: number;
  recordsSkipped: number;
  recordsFailed: number;
  duration: number;
  errors: SageSyncError[];
  warnings: SageSyncError[];
  details?: SageImportDetail[];
}

export interface SageImportDetail {
  lineNumber: number;
  action: 'created' | 'updated' | 'skipped' | 'failed';
  recordId?: string;
  message?: string;
}

// ============================================
// Types Événements
// ============================================

export type SageSyncEventType = 
  | 'EXPORT_STARTED'
  | 'EXPORT_COMPLETED'
  | 'EXPORT_FAILED'
  | 'IMPORT_STARTED'
  | 'IMPORT_COMPLETED'
  | 'IMPORT_FAILED'
  | 'SYNC_CONFLICT'
  | 'SYNC_RESOLVED';

export interface SageSyncEvent {
  type: SageSyncEventType;
  timestamp: string;
  entity: string;
  details?: Record<string, unknown>;
  userId?: string;
}

// ============================================
// Types Configuration Export
// ============================================

export interface SageExportOptions {
  // Filtres
  dateFrom?: string;
  dateTo?: string;
  entityIds?: string[];
  status?: string[];
  
  // Format
  format: 'csv' | 'excel' | 'json';
  encoding: 'utf-8' | 'windows-1252' | 'iso-8859-1';
  delimiter: ';' | ',' | '\t';
  includeHeaders: boolean;
  
  // Comportement
  includeInactive?: boolean;
  includeZeroStock?: boolean;
  groupByFamily?: boolean;
  
  // Métadonnées
  exportedBy?: string;
  notes?: string;
}

export interface SageImportOptions {
  // Source
  fileName: string;
  fileContent?: Buffer;
  filePath?: string;
  
  // Comportement
  updateExisting: boolean;
  skipErrors: boolean;
  dryRun: boolean;
  
  // Validation
  validateOnly: boolean;
  strictValidation: boolean;
  
  // Métadonnées
  importedBy?: string;
  notes?: string;
}

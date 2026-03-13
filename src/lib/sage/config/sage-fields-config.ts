/**
 * Sage Saari Fields Configuration
 * Mapping entre les champs PharmaLink et Sage Saari
 */

// Configuration des champs articles Sage
export const SAGE_ARTICLE_FIELDS = {
  code: { sageField: 'AR_Ref', required: true, maxLength: 15 },
  name: { sageField: 'AR_Design', required: true, maxLength: 40 },
  name2: { sageField: 'AR_Design2', required: false, maxLength: 40 },
  family: { sageField: 'FAM_Code', required: true, maxLength: 8 },
  subFamily: { sageField: 'SFAM_Code', required: false, maxLength: 8 },
  unit: { sageField: 'AR_Unite', required: true, maxLength: 3 },
  unitPrice: { sageField: 'AR_PrixVen', required: true, type: 'number' },
  taxCode: { sageField: 'AR_CodeTva', required: true, maxLength: 3 },
  salesAccount: { sageField: 'AR_CptVente', required: true, maxLength: 8 },
  purchaseAccount: { sageField: 'AR_CptAchat', required: false, maxLength: 8 },
  depot: { sageField: 'DE_Code', required: false, maxLength: 8 },
  minStock: { sageField: 'AR_StockMin', required: false, type: 'number' },
  maxStock: { sageField: 'AR_StockMax', required: false, type: 'number' },
  analyticCode: { sageField: 'AR_CodeAna', required: false, maxLength: 15 },
  lotNumber: { sageField: 'AR_Lot', required: false, maxLength: 20 },
  expirationDate: { sageField: 'AR_DLC', required: false, type: 'date' },
} as const;

// Mapping des familles de produits PharmaLink vers Sage
export const SAGE_FAMILY_MAPPING: Record<string, string> = {
  'Antalgiques': 'ANTALG',
  'Antibiotiques': 'ANTIBI',
  'Anti-inflammatoires': 'ANTIINF',
  'Vitamines': 'VITAM',
  'Cardiovasculaires': 'CARDIO',
  'Dispositifs médicaux': 'DISPOMED',
  'Gastro-entérologie': 'GASTRO',
  'Neurologie': 'NEURO',
  'Dermatologie': 'DERMATO',
  'Ophtalmologie': 'OPHTAL',
  'Respiratoire': 'RESPIR',
  'Urologie': 'UROLOG',
} as const;

// Codes TVA Sage pour le Cameroun
export const SAGE_TAX_CODES = {
  standard: 'TVA19',      // 19.25% Taux normal Cameroun
  reduced: 'TVA9',        // 9.5% Taux réduit
  exempt: 'TVA0',         // Exonéré
  export: 'TVAEXP',       // Export
  special: 'TVASPEC',     // Régime spécial
} as const;

// Plan comptable OHADA simplifié pour les articles
export const SAGE_ACCOUNTS = {
  // Comptes de vente (Classe 7)
  salesMedicines: '701000',      // Ventes de médicaments
  salesDevices: '702000',        // Ventes de dispositifs médicaux
  salesServices: '706000',       // Prestations de services
  
  // Comptes d'achat (Classe 6)
  purchaseMedicines: '601000',   // Achats de médicaments
  purchaseDevices: '602000',     // Achats de dispositifs médicaux
  purchaseSupplies: '603000',    // Achats de fournitures
  
  // Comptes de stock (Classe 3)
  stockMedicines: '301000',      // Stocks de médicaments
  stockDevices: '302000',        // Stocks de dispositifs
  stockSupplies: '303000',       // Stocks de fournitures
  
  // Comptes tiers (Classe 4)
  clientAccount: '411000',       // Clients
  supplierAccount: '401000',     // Fournisseurs
  
  // Comptes de TVA
  vatCollected: '442700',        // TVA collectée
  vatDeductible: '445600',       // TVA déductible
} as const;

// Configuration des champs clients/tiers Sage
export const SAGE_CLIENT_FIELDS = {
  code: { sageField: 'T_Code', required: true, maxLength: 17 },
  name: { sageField: 'T_Intitule', required: true, maxLength: 35 },
  address: { sageField: 'T_Adresse', required: false, maxLength: 35 },
  address2: { sageField: 'T_Adresse2', required: false, maxLength: 35 },
  postalCode: { sageField: 'T_CodePostal', required: false, maxLength: 9 },
  city: { sageField: 'T_Ville', required: false, maxLength: 35 },
  country: { sageField: 'T_Pays', required: false, maxLength: 3 },
  phone: { sageField: 'T_Telephone', required: false, maxLength: 21 },
  fax: { sageField: 'T_Telecopie', required: false, maxLength: 21 },
  email: { sageField: 'T_Email', required: false, maxLength: 69 },
  siret: { sageField: 'T_Siret', required: false, maxLength: 14 },
  nif: { sageField: 'T_NIF', required: false, maxLength: 20 },
  paymentTerms: { sageField: 'T_Condition', required: true, maxLength: 3 },
  creditLimit: { sageField: 'T_EncoursMax', required: false, type: 'number' },
  account: { sageField: 'T_CompteCollectif', required: true, maxLength: 8 },
  currency: { sageField: 'T_Devise', required: false, maxLength: 3 },
  contact: { sageField: 'T_Contact', required: false, maxLength: 35 },
  category: { sageField: 'T_Categorie', required: false, maxLength: 3 },
} as const;

// Configuration des champs factures Sage
export const SAGE_INVOICE_FIELDS = {
  number: { sageField: 'DO_Piece', required: true, maxLength: 13 },
  date: { sageField: 'DO_Date', required: true, type: 'date' },
  dueDate: { sageField: 'DO_Echeance', required: true, type: 'date' },
  clientCode: { sageField: 'DO_Tiers', required: true, maxLength: 17 },
  reference: { sageField: 'DO_Ref', required: false, maxLength: 35 },
  journal: { sageField: 'DO_Journal', required: true, maxLength: 3 },
  label: { sageField: 'DO_Libelle', required: false, maxLength: 35 },
  amountHT: { sageField: 'DO_TotalHT', required: true, type: 'number' },
  amountTVA: { sageField: 'DO_TotalTVA', required: true, type: 'number' },
  amountTTC: { sageField: 'DO_TotalTTC', required: true, type: 'number' },
  currency: { sageField: 'DO_Devise', required: false, maxLength: 3 },
} as const;

// Configuration des champs lignes de facture
export const SAGE_INVOICE_LINE_FIELDS = {
  invoiceNumber: { sageField: 'DO_Piece', required: true, maxLength: 13 },
  lineNumber: { sageField: 'DL_Ligne', required: true, type: 'number' },
  productCode: { sageField: 'DL_CodeArticle', required: true, maxLength: 15 },
  productName: { sageField: 'DL_Design', required: true, maxLength: 40 },
  quantity: { sageField: 'DL_Qte', required: true, type: 'number' },
  unitPrice: { sageField: 'DL_PrixUnitaire', required: true, type: 'number' },
  discount: { sageField: 'DL_Remise', required: false, type: 'number' },
  taxCode: { sageField: 'DL_CodeTVA', required: true, maxLength: 3 },
  amountHT: { sageField: 'DL_MontantHT', required: true, type: 'number' },
  amountTVA: { sageField: 'DL_MontantTVA', required: false, type: 'number' },
  analyticCode: { sageField: 'DL_CodeAna', required: false, maxLength: 15 },
} as const;

// Configuration des champs mouvements de stock
export const SAGE_STOCK_MOVEMENT_FIELDS = {
  reference: { sageField: 'DO_Piece', required: true, maxLength: 13 },
  date: { sageField: 'DO_Date', required: true, type: 'date' },
  type: { sageField: 'DO_Type', required: true, maxLength: 1 }, // E, S, T, A
  productCode: { sageField: 'DL_CodeArticle', required: true, maxLength: 15 },
  productName: { sageField: 'DL_Design', required: false, maxLength: 40 },
  quantity: { sageField: 'DL_Qte', required: true, type: 'number' },
  unitPrice: { sageField: 'DL_PrixUnitaire', required: false, type: 'number' },
  depot: { sageField: 'DE_Code', required: true, maxLength: 8 },
  location: { sageField: 'DE_Emplacement', required: false, maxLength: 20 },
  lotNumber: { sageField: 'DL_Lot', required: false, maxLength: 20 },
  expirationDate: { sageField: 'DL_DLC', required: false, type: 'date' },
  reason: { sageField: 'DL_Motif', required: false, maxLength: 35 },
  documentRef: { sageField: 'DO_Ref', required: false, maxLength: 35 },
} as const;

// Types de mouvements de stock Sage
export const SAGE_STOCK_MOVEMENT_TYPES = {
  entry: 'E',       // Entrée
  exit: 'S',        // Sortie
  transfer: 'T',    // Transfert
  adjustment: 'A',  // Régularisation
} as const;

// Unités de mesure Sage
export const SAGE_UNITS = {
  piece: 'PCE',     // Pièce
  box: 'BTE',       // Boîte
  bottle: 'FLA',    // Flacon
  tube: 'TUB',      // Tube
  pack: 'PAQ',      // Paquet
  unit: 'UNI',      // Unité
  kg: 'KG',         // Kilogramme
  liter: 'L',       // Litre
} as const;

// Conditions de paiement Sage
export const SAGE_PAYMENT_TERMS = {
  immediate: '001',      // Comptant
  net15: '015',          // Net 15 jours
  net30: '030',          // Net 30 jours
  net45: '045',          // Net 45 jours
  net60: '060',          // Net 60 jours
  endOfMonth: 'FM',      // Fin de mois
  endOfMonthPlus30: 'FM30', // Fin de mois + 30
  endOfMonthPlus60: 'FM60', // Fin de mois + 60
} as const;

// Codes journaux Sage
export const SAGE_JOURNALS = {
  sales: 'VTE',          // Journal des ventes
  purchases: 'ACH',      // Journal des achats
  bank: 'BQ',            // Journal de banque
  cash: 'CA',            // Journal de caisse
  general: 'OD',         // Opérations diverses
  stock: 'STK',          // Journal de stock
} as const;

// Types de tiers Sage
export const SAGE_TIER_TYPES = {
  client: 0,
  supplier: 1,
  employee: 2,
  other: 3,
} as const;

// Types de clients PharmaLink vers catégories Sage
export const SAGE_CLIENT_CATEGORY_MAPPING: Record<string, string> = {
  'pharmacy': 'PHARM',
  'hospital': 'HOSP',
  'clinic': 'CLIN',
  'health_center': 'CS',
  'other': 'AUTRE',
} as const;

// Dépôts Sage
export const SAGE_DEPOTS = {
  main: 'DEPOT_A',       // Entrepôt principal A
  secondary: 'DEPOT_B',  // Entrepôt secondaire B
  cold: 'DEPOT_C',       // Zone froide
  distribution: 'DEPOT_D', // Zone distribution
} as const;

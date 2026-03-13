# Plan d'Intégration PharmaLink ↔ Sage Saari

## 📋 Résumé Exécutif

Ce document détaille l'architecture d'intégration entre le SaaS **PharmaLink** (Next.js) et le logiciel comptable **Sage Saari** pour les modules "Stocks & Produits" et "Ventes".

---

## 1. Analyse des Données à Synchroniser

### 1.1 Module Stocks - Données à envoyer vers Sage

| Donnée PharmaLink | Champ Sage Saari | Fréquence | Priorité |
|-------------------|------------------|-----------|----------|
| `code` | Code Article | Temps réel | Haute |
| `name` | Désignation | Temps réel | Haute |
| `category` | Famille/Sous-famille | Quotidien | Moyenne |
| `unitPrice` | Prix unitaire HT | Temps réel | Haute |
| `stockQuantity` | Quantité en stock | Quotidien/Clôture | Haute |
| `minStock/maxStock` | Seuils d'alerte | Hebdomadaire | Basse |
| `lotNumber` | N° Lot | Temps réel | Haute |
| `expirationDate` | Date péremption | Temps réel | Haute |
| `supplier` | Fournisseur | Hebdomadaire | Moyenne |
| `location` | Emplacement | Hebdomadaire | Basse |

#### Mouvements de stock à synchroniser :

```typescript
// Interface PharmaLink → Sage
interface StockMovementExport {
  // Identification
  reference: string;        // N° pièce Sage
  date: string;             // Date mouvement
  type: 'entry' | 'exit' | 'transfer' | 'adjustment';
  
  // Article
  productCode: string;      // Code article Sage
  productName: string;      // Désignation
  quantity: number;         // Quantité (+ entrée, - sortie)
  unitPrice: number;        // Prix unitaire
  
  // Emplacement
  depot: string;            // Code dépôt Sage
  locationFrom?: string;    // Emplacement origine
  locationTo?: string;      // Emplacement destination
  
  // Références
  lotNumber?: string;       // N° Lot
  expirationDate?: string;  // Date péremption
  
  // Comptabilité
  accountCode?: string;     // Compte comptable
  analyticCode?: string;    // Code analytique
  
  // Documents liés
  documentRef?: string;     // N° Bon de livraison/Commande
  notes?: string;           // Motif/Commentaire
}
```

### 1.2 Module Ventes - Données à envoyer vers Sage

| Donnée PharmaLink | Champ Sage Saari | Fréquence | Priorité |
|-------------------|------------------|-----------|----------|
| **Clients** | | | |
| `code` | Code Tiers | Temps réel | Haute |
| `name` | Raison sociale | Temps réel | Haute |
| `address/city` | Adresse | Temps réel | Haute |
| `phone/email` | Coordonnées | Temps réel | Moyenne |
| `creditLimit` | Encours autorisé | Hebdomadaire | Moyenne |
| `currentBalance` | Solde client | Quotidien | Haute |
| **Commandes** | | | |
| `orderNumber` | N° Document | Temps réel | Haute |
| `items` | Lignes document | Temps réel | Haute |
| `total` | Montant TTC | Temps réel | Haute |
| **Factures** | | | |
| `invoiceNumber` | N° Facture | Temps réel | Haute |
| `total/tax` | Montants HT/TVA | Temps réel | Haute |
| `dueDate` | Échéance | Temps réel | Haute |
| **Paiements** | | | |
| `paymentNumber` | N° Règlement | Temps réel | Haute |
| `amount` | Montant réglé | Temps réel | Haute |
| `method` | Mode règlement | Temps réel | Haute |

#### Factures à synchroniser :

```typescript
// Interface PharmaLink → Sage
interface InvoiceExport {
  // En-tête facture
  invoiceNumber: string;    // N° Facture Sage
  invoiceDate: string;      // Date facture
  dueDate: string;          // Date échéance
  
  // Client
  clientCode: string;       // Code tiers Sage
  clientName: string;       // Raison sociale
  clientAddress: string;    // Adresse
  clientSIRET?: string;     // SIRET/Identifiant fiscal
  
  // Montants
  subtotal: number;         // Total HT
  discount: number;         // Remise totale
  tax: number;              // TVA
  total: number;            // Total TTC
  amountPaid: number;       // Déjà payé
  amountDue: number;        // Reste à payer
  
  // Lignes de facture
  lines: InvoiceLineExport[];
  
  // Références
  orderNumber?: string;     // N° commande origine
  deliveryNumber?: string;  // N° bon de livraison
  
  // Comptabilité
  journalCode: string;      // Code journal ventes
  accountCode: string;      // Compte client
  
  // Métadonnées
  currency: string;         // Devise (XAF)
  exchangeRate?: number;    // Taux de change
  notes?: string;           // Notes/Commentaires
}

interface InvoiceLineExport {
  lineNumber: number;
  productCode: string;      // Code article Sage
  productName: string;      // Désignation
  quantity: number;
  unitPrice: number;        // Prix unitaire HT
  discount: number;         // Remise ligne (%)
  taxCode: string;          // Code TVA
  taxRate: number;          // Taux TVA (%)
  totalHT: number;          // Total ligne HT
  analyticCode?: string;    // Section analytique
}
```

### 1.3 Données Sage à importer dans PharmaLink

| Donnée Sage | Champ PharmaLink | Fréquence | Priorité |
|-------------|------------------|-----------|----------|
| **Comptes comptables** | | | |
| Plan comptable | Mapping comptes | Initial + MAJ | Haute |
| Journaux | Codes journaux | Initial | Haute |
| **Tiers/Fournisseurs** | | | |
| Nouveaux fournisseurs | Suppliers | Quotidien | Haute |
| MAJ coordonnées | Supplier info | Quotidien | Moyenne |
| Conditions paiement | Payment terms | Hebdomadaire | Moyenne |
| **Articles/Produits** | | | |
| Nouveaux articles | PharmaProduct | Quotidien | Haute |
| MAJ prix d'achat | Cost prices | Quotidien | Haute |
| MAJ nomenclatures | Categories | Hebdomadaire | Basse |
| **Comptabilité** | | | |
| Lettrages | Payment matching | Quotidien | Haute |
| Écritures comptables | Accounting entries | Quotidien | Haute |
| États financiers | Financial reports | Mensuel | Moyenne |

#### Import des fournisseurs :

```typescript
// Interface Sage → PharmaLink
interface SupplierImport {
  code: string;             // Code fournisseur Sage
  name: string;             // Raison sociale
  contactPerson?: string;   // Contact
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  
  // Conditions commerciales
  paymentTerms: string;     // Conditions paiement
  deliveryDays?: number;
  minOrderAmount?: number;
  
  // Comptabilité
  accountCode: string;      // Compte fournisseur
  taxId?: string;           // N° fiscal
  
  // État
  status: 'active' | 'inactive';
  lastOrderDate?: string;
}
```

---

## 2. Méthodes Techniques d'Intégration

### 2.1 Export CSV/Excel formaté pour Sage

**Architecture recommandée :**

```
src/
├── lib/
│   └── sage/
│       ├── exporters/
│       │   ├── articles-exporter.ts
│       │   ├── invoices-exporter.ts
│       │   ├── stock-movements-exporter.ts
│       │   └── clients-exporter.ts
│       ├── importers/
│       │   ├── suppliers-importer.ts
│       │   ├── accounts-importer.ts
│       │   └── products-importer.ts
│       ├── mappers/
│       │   ├── sage-mapper.ts
│       │   └── format-validators.ts
│       └── config/
│           └── sage-fields-config.ts
├── app/
│   └── api/
│       └── sage/
│           ├── export/
│           │   ├── articles/route.ts
│           │   ├── invoices/route.ts
│           │   └── stock/route.ts
│           └── import/
│               └── suppliers/route.ts
```

**Format CSV Sage Articles :**

```csv
Code article;Désignation;Famille;Sous-famille;Unité;Prix HT;TVA;Compte achat;Compte vente;Dépôt;Stock min;Stock max
PRD-001;Paracétamol 500mg;ANTALGIQUES;Antalgiques simples;BTE;2500;19,25;601000;701000;DEPOT_A;1000;10000
PRD-002;Ibuprofène 400mg;ANTALGIQUES;Anti-inflammatoires;BTE;3200;19,25;601000;701000;DEPOT_A;500;5000
```

**Format CSV Sage Factures :**

```csv
N° Facture;Date;Code tiers;Raison sociale;Référence;N° Ligne;Code article;Désignation;Quantité;Prix unitaire;Remise %;Code TVA;Montant HT;Montant TVA;Montant TTC;Échéance
FAC-2025-001;22/02/2025;PHARM-001;Pharmacie du Centre;CMD-2025-001;1;PRD-001;Paracétamol 500mg;100;2500;0;TVA19;250000;48077;298077;10/03/2025
```

### 2.2 Import de fichiers Sage

**Flux d'import :**

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Fichier Sage   │────▶│  Validation &    │────▶│  Mapping vers   │
│  (CSV/Excel)    │     │  Parsing         │     │  modèles PL     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │  Logs & Rapport  │◀────│  Insertion DB   │
                        │  d'import        │     │  PharmaLink     │
                        └──────────────────┘     └─────────────────┘
```

### 2.3 API Sage (si disponible)

**Note :** Sage propose des APIs via :
- **Sage 1000** : API REST avec OAuth2
- **Sage Business Cloud** : API REST complète
- **Sage X3** : Web services SOAP/REST

```typescript
// Configuration API Sage
interface SageApiConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  tenantId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
}

// Service API Sage
class SageApiService {
  private config: SageApiConfig;
  
  async authenticate(): Promise<void>;
  async refreshToken(): Promise<void>;
  
  // Articles
  async getArticles(params: SageQueryParams): Promise<SageArticle[]>;
  async createArticle(article: SageArticle): Promise<SageArticle>;
  async updateArticle(code: string, article: Partial<SageArticle>): Promise<void>;
  
  // Tiers (Clients/Fournisseurs)
  async getTiers(type: 'customer' | 'supplier', params: SageQueryParams): Promise<SageTiers[]>;
  async createTiers(tiers: SageTiers): Promise<SageTiers>;
  
  // Documents
  async createInvoice(invoice: SageInvoice): Promise<SageInvoice>;
  async createPayment(payment: SagePayment): Promise<SagePayment>;
  
  // Stocks
  async getStocks(depotCode?: string): Promise<SageStock[]>;
  async createStockMovement(movement: SageStockMovement): Promise<void>;
}
```

### 2.4 Webhooks pour synchronisation temps réel

**Architecture Webhooks :**

```
┌─────────────────┐                    ┌─────────────────┐
│   PharmaLink    │                    │   Sage Saari    │
│   (Next.js)     │                    │   (On-premise)  │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │  ┌──────────────────────────────────┐│
         │  │         Middleware Layer         ││
         │  └──────────────────────────────────┘│
         │                                      │
         ▼                                      ▼
┌─────────────────┐                    ┌─────────────────┐
│  Webhook Queue  │◀──────────────────▶│   Scheduler &   │
│   (Redis/Bull)  │   Sync Events      │   Cron Jobs     │
└─────────────────┘                    └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Event Logger   │
│  & Monitoring   │
└─────────────────┘
```

**Types d'événements synchronisés :**

```typescript
// Événements PharmaLink → Sage
type PharmaLinkEvent = 
  | { type: 'INVOICE_CREATED'; data: Invoice }
  | { type: 'INVOICE_UPDATED'; data: Invoice }
  | { type: 'PAYMENT_RECEIVED'; data: Payment }
  | { type: 'ORDER_CONFIRMED'; data: Order }
  | { type: 'STOCK_MOVEMENT'; data: StockMovement }
  | { type: 'PRODUCT_CREATED'; data: PharmaProduct }
  | { type: 'CLIENT_CREATED'; data: CommercialClient };

// Événements Sage → PharmaLink
type SageEvent =
  | { type: 'SUPPLIER_CREATED'; data: SupplierImport }
  | { type: 'SUPPLIER_UPDATED'; data: SupplierImport }
  | { type: 'PRODUCT_PRICE_UPDATED'; data: { code: string; newPrice: number } }
  | { type: 'PAYMENT_MATCHED'; data: { invoiceId: string; paymentRef: string } }
  | { type: 'ACCOUNTING_ENTRY_CREATED'; data: AccountingEntry };
```

---

## 3. Structure des Fichiers d'Export pour Sage Saari

### 3.1 Fichier Articles/Produits

**Format Sage 1000 (CSV) :**

| Colonne | Description | Type | Longueur | Obligatoire |
|---------|-------------|------|----------|-------------|
| A | Code article | Texte | 15 | Oui |
| B | Désignation | Texte | 40 | Oui |
| C | Désignation 2 | Texte | 40 | Non |
| D | Code famille | Texte | 8 | Oui |
| E | Code sous-famille | Texte | 8 | Non |
| F | Unité de vente | Texte | 3 | Oui |
| G | Prix de vente HT | Numérique | - | Oui |
| H | Code TVA vente | Texte | 3 | Oui |
| I | Compte vente | Texte | 8 | Oui |
| J | Compte achat | Texte | 8 | Non |
| K | Code dépôt | Texte | 8 | Non |
| L | Stock minimum | Numérique | - | Non |
| M | Stock maximum | Numérique | - | Non |
| N | Code analytique | Texte | 15 | Non |

**Exemple de fichier :**

```csv
"PRD-001";"Paracétamol 500mg - Boîte 100 comprimés";"Antalgique antipyrétique";"ANTALG";"ANTALG_SIMP";"BTE";2500;"TVA19";"701000";"601000";"DEPOT_A";1000;10000;"VENTES_CAM"
"PRD-005";"Amoxicilline 250mg - Boîte 12 gélules";"";"ANTIBI";"ANTIBI_ORAL";"BTE";4500;"TVA19";"701000";"601000";"DEPOT_B";500;4000;"VENTES_CAM"
```

### 3.2 Fichier Factures de Ventes

**Format Sage 1000 (CSV) :**

**En-tête :**

| Colonne | Description | Type | Obligatoire |
|---------|-------------|------|-------------|
| A | N° Facture | Texte | Oui |
| B | Date facture | Date (JJ/MM/AAAA) | Oui |
| C | Code tiers client | Texte | Oui |
| D | Raison sociale | Texte | Oui |
| E | Référence commande | Texte | Non |
| F | Code journal | Texte | Oui |
| G | Libellé | Texte | Non |

**Lignes :**

| Colonne | Description | Type | Obligatoire |
|---------|-------------|------|-------------|
| A | N° Facture | Texte | Oui |
| B | N° Ligne | Numérique | Oui |
| C | Code article | Texte | Oui |
| D | Désignation | Texte | Oui |
| E | Quantité | Numérique | Oui |
| F | Prix unitaire HT | Numérique | Oui |
| G | Remise % | Numérique | Non |
| H | Code TVA | Texte | Oui |
| I | Montant HT | Numérique | Oui |
| J | Montant TVA | Numérique | Oui |
| K | Code analytique | Texte | Non |

### 3.3 Fichier Mouvements de Stock

**Format Sage 1000 (CSV) :**

| Colonne | Description | Type | Obligatoire |
|---------|-------------|------|-------------|
| A | N° Pièce | Texte | Oui |
| B | Date | Date | Oui |
| C | Type mouvement | Texte (E/S/T/A) | Oui |
| D | Code article | Texte | Oui |
| E | Désignation | Texte | Non |
| F | Quantité | Numérique | Oui |
| G | Prix unitaire | Numérique | Pour entrées |
| H | Code dépôt | Texte | Oui |
| I | Emplacement | Texte | Non |
| J | N° Lot | Texte | Non |
| K | Date péremption | Date | Non |
| L | Motif | Texte | Non |
| M | Référence document | Texte | Non |

**Types de mouvement :**
- `E` : Entrée
- `S` : Sortie
- `T` : Transfert
- `A` : Régularisation

### 3.4 Fichier Clients/Tiers

**Format Sage 1000 (CSV) :**

| Colonne | Description | Type | Obligatoire |
|---------|-------------|------|-------------|
| A | Code tiers | Texte | Oui |
| B | Raison sociale | Texte | Oui |
| C | Adresse | Texte | Non |
| D | Code postal | Texte | Non |
| E | Ville | Texte | Non |
| F | Pays | Texte | Non |
| G | Téléphone | Texte | Non |
| H | Fax | Texte | Non |
| I | Email | Texte | Non |
| J | N° SIRET/Identifiant | Texte | Non |
| K | Code conditions paiement | Texte | Oui |
| L | Encours autorisé | Numérique | Non |
| M | Compte collectif | Texte | Oui |
| N | Code devise | Texte | Non |
| O | Contact | Texte | Non |

---

## 4. Plan d'Implémentation

### Phase 1 : Fondations (Semaines 1-2)

#### Semaine 1 : Architecture & Configuration

| Jour | Tâche | Livrable |
|------|-------|----------|
| 1-2 | Création de l'architecture de dossiers | Structure `/lib/sage/` |
| 2-3 | Configuration des mappings de champs | `sage-fields-config.ts` |
| 3-4 | Création des types TypeScript | Types `Sage*` interfaces |
| 4-5 | Mise en place des tests unitaires | Tests de mapping |

**Fichiers à créer :**

```typescript
// /src/lib/sage/config/sage-fields-config.ts
export const SAGE_ARTICLE_FIELDS = {
  code: { sageField: 'AR_Ref', required: true, maxLength: 15 },
  name: { sageField: 'AR_Design', required: true, maxLength: 40 },
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
} as const;

export const SAGE_FAMILY_MAPPING = {
  'Antalgiques': 'ANTALG',
  'Antibiotiques': 'ANTIBI',
  'Anti-inflammatoires': 'ANTIINF',
  'Vitamines': 'VITAM',
  'Cardiovasculaires': 'CARDIO',
  'Dispositifs médicaux': 'DISPOMED',
  'Gastro-entérologie': 'GASTRO',
} as const;

export const SAGE_TAX_CODES = {
  standard: 'TVA19',      // 19.25% Cameroun
  reduced: 'TVA9',        // 9.5%
  exempt: 'TVA0',         // Exonéré
  export: 'TVAEXP',       // Export
} as const;
```

#### Semaine 2 : Export CSV de base

| Jour | Tâche | Livrable |
|------|-------|----------|
| 1-2 | Export des articles/produits | `/api/sage/export/articles` |
| 2-3 | Export des clients | `/api/sage/export/clients` |
| 3-4 | Export des factures | `/api/sage/export/invoices` |
| 4-5 | Export des mouvements de stock | `/api/sage/export/stock` |

**Exemple d'implémentation :**

```typescript
// /src/lib/sage/exporters/articles-exporter.ts
import { PharmaProduct } from '@/types';
import { SAGE_ARTICLE_FIELDS, SAGE_FAMILY_MAPPING, SAGE_TAX_CODES } from '../config/sage-fields-config';

export class SageArticlesExporter {
  /**
   * Convertit un produit PharmaLink en ligne CSV Sage
   */
  static mapToSageRow(product: PharmaProduct): string {
    const fields = [
      product.code,
      product.name,
      '', // Désignation 2
      SAGE_FAMILY_MAPPING[product.category] || 'DIVERS',
      '', // Sous-famille
      'BTE', // Unité
      product.unitPrice.toString(),
      SAGE_TAX_CODES.standard,
      '701000', // Compte vente
      '601000', // Compte achat
      product.location?.split(' - ')[0] || 'DEPOT_A',
      product.minStock.toString(),
      product.maxStock.toString(),
      'VENTES_CAM', // Code analytique
    ];
    
    return fields.map(f => this.escapeCSV(f)).join(';');
  }
  
  /**
   * Génère le fichier CSV complet
   */
  static exportToCSV(products: PharmaProduct[]): string {
    const header = [
      'Code article', 'Désignation', 'Désignation 2', 'Famille',
      'Sous-famille', 'Unité', 'Prix HT', 'Code TVA', 'Compte vente',
      'Compte achat', 'Dépôt', 'Stock min', 'Stock max', 'Code analytique'
    ].join(';');
    
    const rows = products.map(p => this.mapToSageRow(p));
    return [header, ...rows].join('\n');
  }
  
  private static escapeCSV(value: string): string {
    if (value.includes(';') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
```

### Phase 2 : Import & Bidirectionnalité (Semaines 3-4)

#### Semaine 3 : Import de fichiers Sage

| Jour | Tâche | Livrable |
|------|-------|----------|
| 1-2 | Parser CSV/Excel Sage | `SageFileParser` |
| 2-3 | Import des fournisseurs | `/api/sage/import/suppliers` |
| 3-4 | Import des articles | `/api/sage/import/articles` |
| 4-5 | Import des écritures comptables | `/api/sage/import/entries` |

#### Semaine 4 : Synchronisation & Validation

| Jour | Tâche | Livrable |
|------|-------|----------|
| 1-2 | Validation des données importées | Tests d'intégrité |
| 2-3 | Logs et rapports de synchronisation | Dashboard de sync |
| 3-4 | Gestion des conflits | Stratégie de résolution |
| 4-5 | Documentation utilisateur | Guide d'utilisation |

### Phase 3 : Automatisation (Semaines 5-6)

#### Semaine 5 : Jobs planifiés

| Jour | Tâche | Livrable |
|------|-------|----------|
| 1-2 | Mise en place cron jobs | `node-cron` ou `Bull` |
| 2-3 | Export automatique nocturne | Tâches planifiées |
| 3-4 | Import automatique quotidien | Tâches planifiées |
| 4-5 | Notifications par email | Alertes de sync |

#### Semaine 6 : Webhooks & API

| Jour | Tâche | Livrable |
|------|-------|----------|
| 1-2 | Service Webhook sortant | `/api/sage/webhooks` |
| 2-3 | Queue de messages (Redis/Bull) | Gestion des événements |
| 3-4 | Webhook entrant (si Sage API) | Endpoint réception |
| 4-5 | Monitoring & Alerting | Tableau de bord |

### Phase 4 : Tests & Déploiement (Semaines 7-8)

#### Semaine 7 : Tests

- Tests unitaires des mappers
- Tests d'intégration end-to-end
- Tests de charge
- Tests de récupération d'erreur

#### Semaine 8 : Déploiement & Formation

- Déploiement en staging
- Tests utilisateur
- Formation équipe comptabilité
- Déploiement production

---

## 5. Priorisation des Fonctionnalités

### Priorité HAUTE (MVP - Phase 1)

1. ✅ Export des articles/produits vers Sage
2. ✅ Export des factures clients vers Sage
3. ✅ Export des paiements vers Sage
4. ✅ Import des fournisseurs depuis Sage

### Priorité MOYENNE (Phase 2)

5. 🔄 Export des mouvements de stock
6. 🔄 Import des prix d'achat
7. 🔄 Synchronisation des encours clients
8. 🔄 Lettrage automatique des paiements

### Priorité BASSE (Phase 3+)

9. ⏳ Synchronisation temps réel (API/Webhooks)
10. ⏳ Import des écritures comptables
11. ⏳ États financiers consolidés
12. ⏳ Tableau de bord de synchronisation

---

## 6. Architecture Technique Détaillée

### 6.1 Structure des fichiers

```
src/
├── lib/
│   └── sage/
│       ├── index.ts                    # Export principal
│       ├── config/
│       │   ├── sage-fields-config.ts   # Mapping des champs
│       │   ├── sage-accounts.ts        # Plan comptable
│       │   └── sage-constants.ts       # Constantes Sage
│       ├── types/
│       │   ├── sage-article.ts
│       │   ├── sage-invoice.ts
│       │   ├── sage-client.ts
│       │   ├── sage-supplier.ts
│       │   ├── sage-stock.ts
│       │   └── sage-common.ts
│       ├── mappers/
│       │   ├── article-mapper.ts
│       │   ├── invoice-mapper.ts
│       │   ├── client-mapper.ts
│       │   └── stock-mapper.ts
│       ├── exporters/
│       │   ├── base-exporter.ts
│       │   ├── articles-exporter.ts
│       │   ├── invoices-exporter.ts
│       │   ├── clients-exporter.ts
│       │   └── stock-exporter.ts
│       ├── importers/
│       │   ├── base-importer.ts
│       │   ├── suppliers-importer.ts
│       │   ├── articles-importer.ts
│       │   └── payments-importer.ts
│       ├── validators/
│       │   ├── sage-validator.ts
│       │   └── format-validator.ts
│       ├── services/
│       │   ├── sync-service.ts
│       │   ├── export-service.ts
│       │   ├── import-service.ts
│       │   └── webhook-service.ts
│       └── utils/
│           ├── csv-utils.ts
│           ├── date-utils.ts
│           └── encoding-utils.ts
├── app/
│   └── api/
│       └── sage/
│           ├── export/
│           │   ├── route.ts            # Export global
│           │   ├── articles/route.ts
│           │   ├── invoices/route.ts
│           │   ├── clients/route.ts
│           │   └── stock/route.ts
│           ├── import/
│           │   ├── route.ts            # Import global
│           │   ├── suppliers/route.ts
│           │   └── articles/route.ts
│           ├── sync/
│           │   ├── route.ts            # Synchronisation manuelle
│           │   └── status/route.ts     # État de la sync
│           └── webhooks/
│               └── route.ts            # Webhooks entrants
├── components/
│   └── sage/
│       ├── export-button.tsx
│       ├── import-form.tsx
│       ├── sync-dashboard.tsx
│       └── sync-history.tsx
└── hooks/
    └── use-sage-sync.ts
```

### 6.2 Base de données - Tables de synchronisation

```sql
-- Table de log des exports
CREATE TABLE sage_export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,  -- 'articles', 'invoices', 'clients', 'stock'
  file_name VARCHAR(255),
  records_count INTEGER,
  status VARCHAR(20) NOT NULL, -- 'pending', 'completed', 'failed'
  error_message TEXT,
  exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exported_by VARCHAR(255),
  file_path VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de log des imports
CREATE TABLE sage_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255),
  records_count INTEGER,
  records_imported INTEGER,
  records_skipped INTEGER,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  imported_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de mapping des IDs
CREATE TABLE sage_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharma_link_type VARCHAR(50) NOT NULL, -- 'product', 'client', 'supplier'
  pharma_link_id VARCHAR(255) NOT NULL,
  sage_code VARCHAR(50) NOT NULL,
  sage_id VARCHAR(255),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pharma_link_type, pharma_link_id)
);

-- Table de configuration de synchronisation
CREATE TABLE sage_sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 7. Sécurité & Conformité

### 7.1 Mesures de sécurité

- **Chiffrement** : Tous les fichiers exportés sont chiffrés en transit (HTTPS)
- **Authentification** : API sécurisée avec clés API ou OAuth2
- **Audit** : Logs complets de toutes les opérations
- **Validation** : Contrôle d'intégrité des données avant import

### 7.2 Conformité comptable

- Respect du plan comptable OHADA (Afrique francophone)
- Traçabilité des écritures
- Conservation des pièces justificatives
- Piste d'audit complète

---

## 8. Estimation des Coûts

| Phase | Durée | Effort (j/h) | Complexité |
|-------|-------|--------------|------------|
| Phase 1 : Fondations | 2 sem. | 10 j/h | Moyenne |
| Phase 2 : Bidirectionnalité | 2 sem. | 10 j/h | Élevée |
| Phase 3 : Automatisation | 2 sem. | 8 j/h | Élevée |
| Phase 4 : Tests & Déploiement | 2 sem. | 8 j/h | Moyenne |
| **Total** | **8 sem.** | **36 j/h** | - |

---

## 9. Prochaines Étapes

1. **Validation** du plan par les parties prenantes
2. **Configuration** de l'environnement Sage (comptes de test)
3. **Développement** Phase 1 (Export CSV)
4. **Tests** avec données réelles
5. **Déploiement** progressif

---

*Document créé le : Février 2025*
*Version : 1.0*
*Auteur : Équipe PharmaLink*

// User Roles
export type UserRole = 'DM' | 'SUPERVISEUR' | 'COMPTABILITE' | 'MARKETING' | 'SUPER_ADMIN';

// Pharma Product
export interface PharmaProduct {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  unitPrice: number;
  stockQuantity: number;
  minStock: number;
  maxStock: number;
  lotNumber: string;
  expirationDate: string;
  supplier: string;
  location: string;
  status: 'available' | 'low_stock' | 'out_of_stock' | 'expired';
}

// Order Item
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

// Invoice
export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  dueDate: string;
  createdAt: string;
  paidAt?: string;
}

// Stock Movement
export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'entry' | 'exit' | 'transfer' | 'adjustment';
  quantity: number;
  reason: string;
  reference: string;
  fromLocation?: string;
  toLocation?: string;
  date: string;
  userId: string;
  userName: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  region: string;
  phone?: string;
  supervisorId?: string;
  createdAt: Date;
}

// Healthcare Professional
export type HCPCategory = 'A' | 'B' | 'C'; // A: High frequency, B: Medium, C: Low
export type HCPType = 'MEDECIN' | 'PHARMACIEN' | 'INFIRMIER' | 'DENTISTE' | 'AUTRE';

export interface HCP {
  id: string;
  name: string;
  type: HCPType;
  specialty?: string;
  category: HCPCategory;
  address: string;
  city: string;
  region: string;
  country: string;
  phone?: string;
  email?: string;
  latitude: number;
  longitude: number;
  visitFrequency: number; // visits per month
  lastVisitDate?: Date;
  assignedDMId: string;
  notes?: string;
}

// Visit/Report
export type VisitStatus = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
export type VisitType = 'PRESENTIEL' | 'DISTANT' | 'TELEPHONE';

export interface VisitProduct {
  productId: string;
  productName: string;
  quantity: number;
  notes?: string;
}

export interface Visit {
  id: string;
  hcpId: string;
  hcpName: string;
  dmId: string;
  dmName: string;
  date: Date;
  duration: number; // minutes
  status: VisitStatus;
  type: VisitType;
  latitude?: number;
  longitude?: number;
  products: VisitProduct[];
  feedback?: string;
  orders?: string;
  nextVisitDate?: Date;
  signature?: string;
  createdAt: Date;
}

// Expense
export type ExpenseType = 'TRANSPORT' | 'REPAS' | 'HEBERGEMENT' | 'CARBURANT' | 'COMMUNICATION' | 'AUTRE';
export type ExpenseStatus = 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE';
export type Currency = 'XOF' | 'XAF' | 'NGN' | 'USD' | 'EUR';

export interface Expense {
  id: string;
  dmId: string;
  dmName: string;
  type: ExpenseType;
  amount: number;
  currency: Currency;
  date: Date;
  description: string;
  receiptUrl?: string;
  status: ExpenseStatus;
  validatedBy?: string;
  validatedAt?: Date;
  rejectionReason?: string;
  region: string;
  createdAt: Date;
}

// Product
export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  currency: Currency;
  brochureUrl?: string;
  videoUrl?: string;
  isActive: boolean;
}

// Marketing Resource
export type ResourceType = 'BROCHURE' | 'VIDEO' | 'PDF' | 'PRESENTATION' | 'AUTRE';

export interface MarketingResource {
  id: string;
  title: string;
  type: ResourceType;
  url: string;
  description?: string;
  productId?: string;
  createdAt: Date;
  downloads: number;
}

// Campaign
export type CampaignStatus = 'BROUILLON' | 'ACTIVE' | 'TERMINEE' | 'SUSPENDUE';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: CampaignStatus;
  targetRegions: string[];
  productId?: string;
  budget?: number;
  currency?: Currency;
  createdBy: string;
  createdAt: Date;
}

// Region
export interface Region {
  id: string;
  name: string;
  country: string;
  code: string;
  currency: Currency;
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  read: boolean;
  createdAt: Date;
}

// KPI Stats
export interface KPIStats {
  visitsCompleted: number;
  visitsTarget: number;
  coverageRate: number;
  teamRanking: number;
  totalExpenses: number;
  expenseBudget: number;
  activeDms: number;
  totalHCPs: number;
}

// Map Marker
export interface MapMarker {
  id: string;
  dmId: string;
  dmName: string;
  latitude: number;
  longitude: number;
  lastUpdate: Date;
  status: 'ACTIVE' | 'IN_VISIT' | 'OFFLINE';
  currentHCPName?: string;
}

// Geofence Alert
export interface GeofenceAlert {
  id: string;
  dmId: string;
  dmName: string;
  type: 'ENTRY' | 'EXIT' | 'VIOLATION';
  zone: string;
  timestamp: Date;
  resolved: boolean;
}

// Language
export type Language = 'fr' | 'en';

// Translation keys
export interface Translations {
  [key: string]: {
    fr: string;
    en: string;
  };
}

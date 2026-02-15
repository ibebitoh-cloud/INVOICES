
export interface Booking {
  id: string;
  totalBooking: string;
  customer: string;
  shipper: string;
  bookingDate: string;
  customerRef: string;
  gops: string;
  dateOfClipOn: string;
  goPort: string;
  giPort: string;
  clipOffDate: string;
  trucker: string;
  bookingNo: string;
  beneficiaryName: string;
  reeferNumber: string;
  gensetNo: string;
  res: string;
  gaz: string;
  shipperAddress: string;
  status: string;
  rate: string;
  rateValue: number;
  vat: string;
  vatValue: number;
  remarks: string;
  gensetFaultDescription: string;
  invNo: string;
  invDate: string;
  invIssueDate: string;
}

export interface CustomerConfig {
  id: string;
  name: string;
  prefix: string;
  nextNumber: number;
}

export type InvoiceSectionId = 'header' | 'parties' | 'table' | 'totals' | 'footer' | 'signature';

export interface CustomTheme {
  id: string;
  label: string;
  accent: string;
  secondary: string;
  bg: string;
  text: string;
  border: string;
  font: string;
  radius: string;
  layout: 'classic' | 'modern' | 'industrial' | 'split' | 'minimal' | 'sidebar' | 'bold';
  tableStyle: 'grid' | 'clean' | 'striped' | 'heavy' | 'glass';
  headerStyle: 'standard' | 'centered' | 'badge' | 'sidebar';
}

export type InvoiceTheme = 
  | 'logistics-grid' | 'corporate' | 'technical-draft' | 'minimalist' | 'industrial' 
  | 'elegant' | 'blueprint' | 'glass' | 'royal' | 'modern-cards' 
  | 'midnight-pro' | 'sidebar-pro' | 'neon-glow' | 'swiss-modern' | 'brutalist' 
  | 'vintage' | 'soft-clay' | 'eco-green' | 'sunset-vibe' | 'high-contrast'
  | 'deep-ocean' | 'pastel-dream' | 'luxury-gold' | 'urban-street' | 'paper-texture'
  | 'monochrome' | 'vivid-spectrum' | 'classic-ledger' | 'modern-serif' | 'compact-list'
  | string; // Allow for custom IDs

export type GroupingType = 'unit' | 'shipper' | 'trucker' | 'booking';

export interface TemplateFields {
  showReefer: boolean;
  showGenset: boolean;
  showBookingNo: boolean;
  showCustomerRef: boolean;
  showPorts: boolean;
  showServicePeriod: boolean;
  showTerms: boolean;
  showSignature: boolean;
  showLogo: boolean;
  showCompanyInfo: boolean;
  showTaxId: boolean;
  showCustomerAddress: boolean;
  showBeneficiary: boolean;
  showShipperAddress: boolean;
  showTrucker: boolean;
  showVat: boolean;
  showInvoiceDate: boolean;
  showDueDate: boolean;
  showNotes: boolean;
  showWatermark: boolean;
}

export interface TemplateConfig {
  sectionOrder: InvoiceSectionId[];
  hiddenSections: Set<InvoiceSectionId>;
  fields: TemplateFields;
  theme: InvoiceTheme;
  customThemeData?: CustomTheme; // Store full data for custom styles
  groupBy: GroupingType;
  contentScale: number;
  verticalSpacing: number;
  horizontalPadding: number;
}

export interface UserProfile {
  name: string;
  companyName: string;
  address: string;
  taxId: string;
  email: string;
  signatureUrl: string | null;
  logoUrl: string | null;
  watermarkUrl: string | null;
  watermarkOpacity: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerName: string;
  customerAddress?: string;
  beneficiaryName: string;
  items: Booking[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  notes?: string;
  templateConfig?: TemplateConfig;
  userProfile?: UserProfile;
}

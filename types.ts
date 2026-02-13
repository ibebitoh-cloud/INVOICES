
export interface Booking {
  id: string;
  totalBooking: string;
  customer: string;
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
  // New details
  vesselName?: string;
  voyageNo?: string;
  sealNumber?: string;
  weight?: string;
  temperature?: string;
  commodity?: string;
}

export type InvoiceSectionId = 'header' | 'parties' | 'table' | 'totals' | 'footer' | 'signature';
export type InvoiceTheme = 'modern' | 'minimalist' | 'corporate' | 'industrial' | 'elegant' | 'blueprint' | 'glass' | 'royal' | 'sidebar-pro' | 'modern-cards' | 'technical-draft' | 'logistics-grid';
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
  // New details fields
  showVessel: boolean;
  showSeal: boolean;
  showWeight: boolean;
  showTemp: boolean;
  showCommodity: boolean;
}

export interface CustomerSettings {
  prefix: string;
  nextSerial: number;
}

export interface TemplateConfig {
  sectionOrder: InvoiceSectionId[];
  hiddenSections: Set<InvoiceSectionId>;
  fields: TemplateFields;
  theme: InvoiceTheme;
  groupBy: GroupingType;
}

export interface SavedTemplate {
  id: string;
  name: string;
  config: {
    sectionOrder: InvoiceSectionId[];
    hiddenSections: InvoiceSectionId[];
    fields: TemplateFields;
    theme: InvoiceTheme;
  };
}

export interface UserProfile {
  name: string;
  companyName: string;
  address: string;
  taxId: string;
  email: string;
  signatureUrl: string | null;
  logoUrl: string | null;
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

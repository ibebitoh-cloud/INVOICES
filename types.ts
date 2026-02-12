
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
}

export type InvoiceSectionId = 'header' | 'parties' | 'table' | 'totals' | 'footer' | 'signature';

export interface TemplateFields {
  showReefer: boolean;
  showGenset: boolean;
  showBookingNo: boolean;
  showCustomerRef: boolean;
  showRoute: boolean;
  showServicePeriod: boolean;
  showBankDetails: boolean;
  showTerms: boolean;
  showSignature: boolean;
}

export interface TemplateConfig {
  sectionOrder: InvoiceSectionId[];
  hiddenSections: Set<InvoiceSectionId>;
  fields: TemplateFields;
}

export interface SavedTemplate {
  id: string;
  name: string;
  config: {
    sectionOrder: InvoiceSectionId[];
    hiddenSections: InvoiceSectionId[]; // Store as array for JSON compatibility
    fields: TemplateFields;
  };
}

export interface UserProfile {
  name: string;
  companyName: string;
  address: string;
  taxId: string;
  email: string;
  signatureUrl: string | null;
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

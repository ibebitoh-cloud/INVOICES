
import React, { useMemo } from 'react';
import { Invoice, InvoiceSectionId, Booking, TemplateFields, InvoiceTheme } from '../types';
import { formatCurrency } from '../utils/formatters';
// Added ArrowRightLeft to imports to fix the "Cannot find name 'ArrowRightLeft'" error
import { Truck, ShieldCheck, Building, UserCircle, Hash, Calendar, FileText, MapPin, Anchor, Lock, Scale, Thermometer, ArrowRightLeft } from 'lucide-react';

interface InvoiceDocumentProps {
  invoice: Invoice;
}

const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice }) => {
  const config = invoice.templateConfig || {
    sectionOrder: ['header', 'parties', 'table', 'totals', 'signature', 'footer'],
    hiddenSections: new Set<InvoiceSectionId>(),
    theme: 'logistics-grid',
    groupBy: 'booking',
    fields: {
      showReefer: true, showGenset: false, showBookingNo: true, showCustomerRef: true,
      showPorts: true, showServicePeriod: false, showTerms: true, showSignature: true,
      showLogo: true, showCompanyInfo: true, showTaxId: true, showCustomerAddress: true,
      showBeneficiary: false, showShipperAddress: true, showTrucker: true, showVat: true,
      showInvoiceDate: true, showDueDate: true, showNotes: true, showWatermark: true,
      showVessel: true, showSeal: true, showWeight: true, showTemp: true, showCommodity: true
    }
  };

  const fields = config.fields as TemplateFields;
  const theme = config.theme || 'logistics-grid';
  
  const profile = invoice.userProfile || {
    name: 'Authorized Signatory',
    companyName: 'Your Logistics Company',
    address: 'HQ Address',
    taxId: '000-000-000',
    email: 'ops@company.com',
    signatureUrl: null,
    logoUrl: null
  };

  const groupedItems = useMemo(() => {
    const groups = new Map<string, Booking[]>();
    invoice.items.forEach(item => {
      const key = item.bookingNo || item.id;
      const existing = groups.get(key) || [];
      existing.push(item);
      groups.set(key, existing);
    });
    return Array.from(groups.values());
  }, [invoice.items]);

  // Theme Definitions
  const themeStyles: Record<string, any> = {
    'logistics-grid': {
      container: "border-t-[12px] border-emerald-600 bg-white",
      accent: "text-emerald-700",
      accentBg: "bg-emerald-600",
      tableHeader: "bg-emerald-950 text-white",
      totalBox: "bg-slate-900 text-white rounded-[2rem]",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    'corporate': {
      container: "border-t-[12px] border-blue-800 bg-white",
      accent: "text-blue-900",
      accentBg: "bg-blue-800",
      tableHeader: "bg-slate-100 text-slate-700 border-b-2 border-blue-800",
      totalBox: "bg-blue-50 text-blue-900 border-2 border-blue-100 rounded-none",
      badge: "bg-blue-50 text-blue-700 border-blue-100",
    },
    'technical-draft': {
      container: "border-2 border-slate-900 bg-[#f8fafc] font-mono",
      accent: "text-slate-900",
      accentBg: "bg-slate-900",
      tableHeader: "bg-white text-slate-900 border-y-2 border-slate-900",
      totalBox: "bg-white text-slate-900 border-2 border-slate-900 rounded-none",
      badge: "bg-white text-slate-900 border-slate-300",
    },
    'minimalist': {
      container: "border-none bg-white",
      accent: "text-slate-900",
      accentBg: "bg-slate-900",
      tableHeader: "text-slate-400 border-b border-slate-100",
      totalBox: "bg-white text-slate-900 border-t-2 border-slate-900 rounded-none",
      badge: "bg-slate-50 text-slate-500 border-slate-100",
    }
  };

  const style = themeStyles[theme] || themeStyles['logistics-grid'];

  return (
    <div className={`invoice-container relative overflow-hidden transition-all duration-500 ${style.container}`}>
      {fields.showWatermark && profile.logoUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <img src={profile.logoUrl} alt="" className="w-[80%] h-auto opacity-[0.03] grayscale -rotate-12" />
        </div>
      )}
      
      {/* Header Section */}
      <div className={`flex justify-between items-start mb-6 pb-6 relative z-10 ${theme === 'minimalist' ? 'border-b border-slate-50' : ''}`}>
        <div className="flex items-center gap-6">
          {fields.showLogo && profile.logoUrl && <img src={profile.logoUrl} alt="Logo" className="h-16 w-auto object-contain max-w-[180px]" />}
          {fields.showCompanyInfo && (
            <div>
              <h1 className={`text-2xl font-black ${style.accent} tracking-tight uppercase leading-none mb-1`}>{profile.companyName}</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldCheck size={14}/> {theme === 'technical-draft' ? 'SPECIFICATION DOC' : 'OFFICIAL DOCUMENT'}
              </p>
            </div>
          )}
        </div>
        <div className="text-right">
          <h2 className={`text-4xl font-black ${theme === 'minimalist' ? 'text-slate-900' : 'text-slate-100'} uppercase tracking-tighter mb-1`}>INVOICE</h2>
          <div className="flex items-center justify-end gap-3 mt-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REFERENCE</span>
            <span className={`font-mono font-black ${style.accent} bg-slate-50 px-4 py-1 border border-slate-200 rounded-xl shadow-sm text-lg`}>
              {invoice.invoiceNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Logistic Info (Vessel/Commodity) */}
      {(fields.showVessel || fields.showCommodity) && (
        <div className="bg-slate-50 p-4 rounded-2xl mb-8 flex justify-between items-center border border-slate-100 relative z-10">
          <div className="flex gap-8">
            {fields.showVessel && invoice.items[0]?.vesselName && (
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">VESSEL / VOYAGE</p>
                <div className="flex items-center gap-2 text-slate-900">
                  <Anchor size={14} className={style.accent} />
                  <p className="text-[11px] font-black uppercase">
                    {invoice.items[0].vesselName} {invoice.items[0].voyageNo ? ` / ${invoice.items[0].voyageNo}` : ''}
                  </p>
                </div>
              </div>
            )}
            {fields.showCommodity && invoice.items[0]?.commodity && (
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">COMMODITY</p>
                <div className="flex items-center gap-2 text-slate-900">
                  <FileText size={14} className={style.accent} />
                  <p className="text-[11px] font-black uppercase">{invoice.items[0].commodity}</p>
                </div>
              </div>
            )}
          </div>
          {fields.showPorts && (
            <div className="text-right space-y-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ROUTING (POL/POD)</p>
              <p className="text-[11px] font-black text-slate-900 uppercase">
                {invoice.items[0]?.goPort || '---'} <ArrowRightLeft size={10} className="inline mx-1" /> {invoice.items[0]?.giPort || '---'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Parties Info */}
      <div className="grid grid-cols-3 gap-8 mb-10 relative z-10">
        <div className="space-y-4">
          <h3 className={`text-[10px] font-black ${style.accent} uppercase tracking-[0.3em] border-b pb-1 border-slate-100`}>BILL TO</h3>
          <div className={`pl-5 border-l-4 ${style.accent === 'text-slate-900' ? 'border-slate-900' : 'border-emerald-500'}`}>
            <p className="font-black text-lg text-slate-900 leading-tight">{invoice.customerName}</p>
            {fields.showCustomerAddress && invoice.customerAddress && (
              <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase leading-relaxed">{invoice.customerAddress}</p>
            )}
          </div>
        </div>

        {fields.showShipperAddress && (
          <div className="space-y-4">
            <h3 className={`text-[10px] font-black ${style.accent} uppercase tracking-[0.3em] border-b pb-1 border-slate-100`}>SHIPPER</h3>
            <div className={`pl-5 border-l-4 border-slate-300`}>
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin size={12} className="mt-0.5 shrink-0" />
                <p className="text-[9px] font-bold uppercase leading-relaxed">
                  {invoice.items[0]?.shipperAddress || 'NOT SPECIFIED'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className={`text-[10px] font-black ${style.accent} uppercase tracking-[0.3em] border-b pb-1 border-slate-100`}>DOCUMENT DATA</h3>
          <div className="grid grid-cols-2 gap-y-2 text-[10px] font-bold">
            {fields.showTaxId && <><span className="text-slate-400 uppercase tracking-widest text-[8px]">TAX ID</span><span className="text-slate-900">{profile.taxId}</span></>}
            {fields.showInvoiceDate && <><span className="text-slate-400 uppercase tracking-widest text-[8px]">ISSUE DATE</span><span className="text-slate-900">{invoice.date}</span></>}
            {fields.showDueDate && <><span className="text-red-500 uppercase tracking-widest text-[8px]">DUE DATE</span><span className="text-red-600 font-black">{invoice.dueDate}</span></>}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 mb-10 relative z-10">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className={`${style.tableHeader} font-black uppercase tracking-widest text-[9px]`}>
              <th className="py-4 px-4 w-[25%]">BOOKING & CARRIER</th>
              <th className="py-4 px-4 w-[50%]">CONTAINER UNITS & SPECS</th>
              <th className="py-4 px-4 text-right w-[25%]">AMOUNT ({invoice.currency})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groupedItems.map((group, gIdx) => {
              const totalGroupRate = group.reduce((acc, curr) => acc + curr.rateValue, 0);
              const first = group[0];
              return (
                <tr key={gIdx} className="align-top hover:bg-slate-50/50 transition-colors">
                  <td className="py-6 px-4">
                    <p className="font-mono font-black text-slate-900 text-[12px]">{first.bookingNo}</p>
                    {fields.showTrucker && first.trucker && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Truck size={12} className="text-slate-400" />
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">
                          {first.trucker}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-6 px-4">
                    <div className="grid grid-cols-1 gap-4">
                      {group.map((unit, uIdx) => (
                        <div key={uIdx} className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`${style.badge} border text-[11px] px-3 py-1 rounded-lg font-mono font-black shadow-sm`}>
                              {unit.reeferNumber}
                            </span>
                            {fields.showSeal && unit.sealNumber && (
                              <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                                <Lock size={10}/> SEAL: {unit.sealNumber}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-4 pl-1">
                            {fields.showTemp && unit.temperature && (
                              <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                                <Thermometer size={10}/> {unit.temperature}
                              </span>
                            )}
                            {fields.showWeight && unit.weight && (
                              <span className="text-[9px] font-black text-slate-500 flex items-center gap-1">
                                <Scale size={10}/> {unit.weight}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-6 px-4 text-right">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-[14px]">{formatCurrency(totalGroupRate, invoice.currency)}</span>
                      {group.length > 1 && <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">{group.length} UNITS</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer / Totals Section */}
      <div className={`relative z-10 pt-6 mt-auto ${theme === 'minimalist' ? 'border-t border-slate-100' : ''}`}>
        <div className="flex justify-between items-end">
          <div className="max-w-md space-y-4">
            {fields.showNotes && invoice.notes && (
              <div className={`p-5 rounded-[2rem] ${theme === 'technical-draft' ? 'border-2 border-slate-900 bg-white' : 'bg-slate-50 border border-slate-100'}`}>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">REMARKS</p>
                <p className="text-[10px] font-bold text-slate-900 leading-relaxed italic">{invoice.notes}</p>
              </div>
            )}
            <div className="text-[8px] text-slate-400 max-w-sm leading-relaxed uppercase font-bold tracking-tighter">
              * Rates are subject to standard tariffs. This is a computer-generated document.
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-10">
            <div className={`w-80 p-8 shadow-2xl space-y-4 ${style.totalBox}`}>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-70">
                <span>SUBTOTAL</span>
                <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {fields.showVat && (
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-70">
                  <span>VAT (14%)</span>
                  <span>{formatCurrency(invoice.tax, invoice.currency)}</span>
                </div>
              )}
              <div className={`border-t pt-4 flex justify-between items-center ${theme === 'logistics-grid' ? 'border-white/10' : 'border-slate-900/10'}`}>
                <span className="font-black text-[12px] uppercase">GRAND TOTAL</span>
                <span className="text-3xl font-black">{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>

            {fields.showSignature && (
              <div className="text-right flex flex-col items-end">
                <div className="h-20 w-48 border-b-2 border-slate-200 mb-2 flex items-center justify-center">
                  {profile.signatureUrl ? (
                    <img src={profile.signatureUrl} alt="Signature" className="max-h-full w-auto object-contain mix-blend-multiply" />
                  ) : (
                    <span className="text-slate-100 text-[10px] uppercase font-black tracking-[0.5em]">SIGNATURE</span>
                  )}
                </div>
                <p className="text-[12px] font-black text-slate-900 uppercase tracking-tighter">{profile.name}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Authorized Authority</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDocument;

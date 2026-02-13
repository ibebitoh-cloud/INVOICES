import React, { useMemo } from 'react';
import { Invoice, InvoiceSectionId, Booking, TemplateFields } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Anchor, Truck, MapPin, Package, Hash, Calendar, Layers, ShieldCheck, ArrowRightLeft, User, Building } from 'lucide-react';

interface InvoiceDocumentProps {
  invoice: Invoice;
}

const MAJOR_EGYPT_PORTS = ['ALEX', 'DAM', 'GOUDA', 'SCCT', 'SOKHNA'];

const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice }) => {
  const config = invoice.templateConfig || {
    sectionOrder: ['header', 'parties', 'table', 'totals', 'signature', 'footer'],
    hiddenSections: new Set<InvoiceSectionId>(),
    theme: 'modern',
    fields: {
      showReefer: true,
      showGenset: true,
      showBookingNo: true,
      showCustomerRef: true,
      showPorts: true,
      showServicePeriod: true,
      showTerms: true,
      showSignature: true,
      showLogo: true,
      showCompanyInfo: true,
      showTaxId: true,
      showCustomerAddress: true,
      showBeneficiary: true,
      showShipperAddress: true,
      showTrucker: true,
      showVat: true,
      showInvoiceDate: true,
      showDueDate: true,
      showNotes: true,
      showWatermark: true,
    }
  };

  const theme = config.theme || 'modern';
  const fields = config.fields as TemplateFields;
  
  const safeHiddenSections = useMemo(() => {
    if (config.hiddenSections instanceof Set) return config.hiddenSections;
    if (Array.isArray(config.hiddenSections)) return new Set(config.hiddenSections);
    return new Set<InvoiceSectionId>();
  }, [config.hiddenSections]);

  const profile = invoice.userProfile || {
    name: 'Authorized Signatory',
    companyName: 'Your Company Name',
    address: 'City, Country',
    taxId: '000-000-000',
    email: 'info@company.com',
    signatureUrl: null,
    logoUrl: null
  };

  const groupedItems = useMemo(() => {
    const groups = new Map<string, Booking[]>();
    invoice.items.forEach(item => {
      const key = item.bookingNo || `NO_BK_${Math.random()}`;
      const existing = groups.get(key) || [];
      existing.push(item);
      groups.set(key, existing);
    });
    return Array.from(groups.values());
  }, [invoice.items]);

  const styles: Record<string, any> = {
    modern: {
      container: "invoice-container flex flex-col font-sans text-slate-900 bg-white",
      accent: "text-blue-700", accentBg: "bg-blue-700", border: "border-blue-700", tableHeader: "bg-slate-50 border-y border-slate-200", totalsBorder: "border-blue-700"
    },
    'logistics-grid': {
      container: "invoice-container flex flex-col font-sans text-slate-900 bg-white border-t-[8px] border-emerald-600",
      accent: "text-emerald-700", accentBg: "bg-emerald-600", border: "border-emerald-600", tableHeader: "bg-emerald-950 text-white font-black", totalsBorder: "border-emerald-600"
    },
    minimalist: {
      container: "invoice-container flex flex-col font-sans text-zinc-800 bg-white",
      accent: "text-zinc-900", accentBg: "bg-zinc-100", border: "border-zinc-200", tableHeader: "border-b-2 border-zinc-900", totalsBorder: "border-zinc-100"
    },
    corporate: {
      container: "invoice-container flex flex-col font-serif text-slate-900 bg-white",
      accent: "text-indigo-900", accentBg: "bg-indigo-950", border: "border-indigo-900", tableHeader: "bg-slate-50 border-y-2 border-slate-900", totalsBorder: "border-indigo-900"
    },
    'technical-draft': {
      container: "invoice-container flex flex-col font-mono text-blue-950 bg-white border-[6px] border-blue-900",
      accent: "text-blue-900", accentBg: "bg-blue-900", border: "border-blue-400", tableHeader: "bg-blue-900 text-white", totalsBorder: "border-blue-900"
    },
    industrial: {
      container: "invoice-container flex flex-col font-mono text-black bg-white",
      accent: "text-orange-600", accentBg: "bg-orange-600", border: "border-black", tableHeader: "bg-black text-white", totalsBorder: "border-black"
    },
    elegant: {
      container: "invoice-container flex flex-col font-serif text-emerald-950 bg-white",
      accent: "text-emerald-800", accentBg: "bg-emerald-800", border: "border-emerald-200", tableHeader: "bg-emerald-50 border-y border-emerald-100", totalsBorder: "border-emerald-800"
    },
    blueprint: {
      container: "invoice-container flex flex-col font-mono text-white bg-[#002b5c] border-4 border-white",
      accent: "text-cyan-400", accentBg: "bg-white", border: "border-white/30", tableHeader: "bg-white/10 border-y border-white/20 text-white", totalsBorder: "border-white"
    },
    royal: {
      container: "invoice-container flex flex-col font-serif text-neutral-100 bg-neutral-950 border-x-[12px] border-amber-600",
      accent: "text-amber-500", accentBg: "bg-amber-600", border: "border-amber-600/20", tableHeader: "bg-neutral-900 border-y border-amber-600/40", totalsBorder: "border-amber-600"
    }
  };

  const activeStyle = styles[theme] || styles.modern;

  const renderPortBadge = (port: string) => {
    if (!port || port === '---' || port.trim() === '') return <span className="text-gray-300 italic text-[8px]">---</span>;
    const portUpper = port.toUpperCase();
    const isMajor = MAJOR_EGYPT_PORTS.some(p => portUpper.includes(p));
    return (
      <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${isMajor ? (theme === 'royal' ? 'bg-amber-900/40 border-amber-600/40 text-amber-500' : 'bg-blue-50 border-blue-100 text-blue-900') : (theme === 'royal' ? 'bg-neutral-900 border-neutral-800 text-neutral-400' : 'bg-gray-50 border-gray-100 text-gray-700')} justify-center`}>
        <span className="font-black uppercase tracking-tighter text-[8px] truncate">{portUpper}</span>
      </div>
    );
  };

  const renderSection = (id: InvoiceSectionId) => {
    if (safeHiddenSections.has(id)) return null;

    switch (id) {
      case 'header':
        return (
          <div key="header" className={`flex justify-between items-start mb-6 border-b-2 ${activeStyle.border} pb-4 relative z-10`}>
            <div className="flex items-center gap-6">
              {fields.showLogo && profile.logoUrl && (
                <img src={profile.logoUrl} alt="Logo" className="h-12 w-auto object-contain max-w-[150px]" />
              )}
              {fields.showCompanyInfo && (
                <div>
                  <h1 className={`text-xl font-black ${activeStyle.accent} tracking-tight uppercase leading-none mb-1`}>{profile.companyName}</h1>
                  <div className={`text-[9px] font-bold ${theme === 'blueprint' || theme === 'royal' ? 'text-white/40' : 'text-slate-400'} uppercase tracking-[0.3em] flex items-center gap-2`}>
                    <ShieldCheck size={10} className={activeStyle.accent} /> Official Logistics Billing
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <h2 className={`text-3xl font-black ${theme === 'industrial' ? 'text-black' : theme === 'blueprint' || theme === 'royal' ? 'text-white' : 'text-slate-200'} uppercase tracking-tighter mb-1`}>Invoice</h2>
              <div className="space-y-1">
                <div className={`flex items-center justify-end gap-2 text-sm font-bold ${theme === 'blueprint' || theme === 'royal' ? 'text-white' : 'text-slate-900'}`}>
                  <span className="text-[9px] opacity-40 uppercase tracking-widest">Serial</span>
                  <span className={`${activeStyle.accent} font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100`}>{invoice.invoiceNumber}</span>
                </div>
                {fields.showInvoiceDate && <p className={`text-[9px] font-bold ${theme === 'blueprint' || theme === 'royal' ? 'text-white/50' : 'text-slate-400'} uppercase tracking-widest`}>{invoice.date}</p>}
              </div>
            </div>
          </div>
        );
      case 'parties':
        return (
          <div key="parties" className="grid grid-cols-2 gap-8 mb-6 relative z-10">
            <div className="space-y-2">
              <h3 className={`text-[9px] font-black ${activeStyle.accent} uppercase tracking-[0.2em] border-b pb-1`}>Client (Consignee)</h3>
              <div className="pl-3 border-l-2 border-slate-100">
                <p className={`font-black text-base leading-tight ${theme === 'blueprint' || theme === 'royal' ? 'text-white' : 'text-slate-900'}`}>{invoice.customerName}</p>
                {fields.showCustomerAddress && invoice.customerAddress && <p className={`text-[9px] ${theme === 'blueprint' || theme === 'royal' ? 'text-white/50' : 'text-slate-500'} leading-relaxed max-w-sm mt-1`}>{invoice.customerAddress}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-[9px] font-black ${activeStyle.accent} uppercase tracking-[0.2em] border-b pb-1`}>Operation Config</h3>
              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div><span className="text-slate-400 uppercase font-bold">Tax ID:</span><p className="font-black text-slate-800">{profile.taxId}</p></div>
                <div><span className="text-slate-400 uppercase font-bold">Currency:</span><p className="font-black text-slate-800">{invoice.currency}</p></div>
                {fields.showDueDate && <div className="col-span-2"><span className="text-red-400 uppercase font-bold">Payment Due:</span><p className="font-black text-red-600">{invoice.dueDate}</p></div>}
              </div>
            </div>
          </div>
        );
      case 'table':
        return (
          <div key="table" className="flex-1 mb-6 relative z-10">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className={`${activeStyle.tableHeader} text-[8px] uppercase tracking-widest`}>
                  <th className="py-3 px-2 w-[22%]">Operation & Shipper</th>
                  <th className="py-3 px-2 w-[18%]">Equipment (Container)</th>
                  <th className="py-3 px-2 w-[15%] text-center">Route Path</th>
                  <th className="py-3 px-2 w-[15%]">Trucker / Transp.</th>
                  <th className="py-3 px-2 w-[12%] text-center">Date</th>
                  <th className="py-3 px-2 text-right w-[18%]">Rate / Value</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'blueprint' || theme === 'royal' ? 'divide-white/10' : 'divide-slate-100'}`}>
                {groupedItems.map((group, gIdx) => {
                  const first = group[0];
                  const totalGroupRate = group.reduce((acc, curr) => acc + curr.rateValue, 0);
                  return (
                    <tr key={gIdx} className="align-top hover:bg-slate-50/30 transition-colors">
                      <td className="py-3 px-2">
                        {fields.showBookingNo && <div className={`font-black ${activeStyle.accent} text-[9px] uppercase leading-none mb-1`}>BK: {first.bookingNo || 'N/A'}</div>}
                        {fields.showShipperAddress && first.shipperAddress && (
                           <div className="flex items-start gap-1">
                             <Building size={8} className="text-slate-300 mt-0.5" />
                             <p className="text-[8px] text-slate-500 font-bold uppercase leading-tight line-clamp-2">{first.shipperAddress}</p>
                           </div>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="space-y-1">
                          {group.map((item, iIdx) => (
                            <div key={iIdx} className="bg-slate-50 p-1 rounded border-l-2 border-slate-200">
                               <p className="text-[9px] font-black text-slate-800 font-mono tracking-tighter truncate">#{item.reeferNumber || 'UNIDENTIFIED'}</p>
                               {fields.showGenset && item.gensetNo && <p className="text-[7px] text-blue-600 font-bold mt-0.5">GS: {item.gensetNo}</p>}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="space-y-1.5 flex flex-col items-center">
                          {group.map((item, iIdx) => (
                            <div key={iIdx} className="flex items-center gap-1 justify-center w-full">
                               {renderPortBadge(item.goPort)}
                               <ArrowRightLeft size={8} className="text-slate-300 shrink-0" />
                               {renderPortBadge(item.giPort)}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                         <div className="space-y-1.5">
                            {group.map((item, iIdx) => (
                              <div key={iIdx} className="text-[8px] font-bold text-slate-600 flex items-center gap-1 truncate uppercase">
                                <Truck size={10} className="text-slate-300 shrink-0" /> {item.trucker || '---'}
                              </div>
                            ))}
                         </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <p className="text-[9px] font-bold text-slate-700">{formatDate(first.bookingDate)}</p>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex flex-col">
                           <span className={`font-black ${theme === 'blueprint' || theme === 'royal' ? 'text-white' : 'text-slate-900'} text-[11px]`}>{formatCurrency(totalGroupRate, invoice.currency)}</span>
                           {group.length > 1 && <span className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">({group.length} Units)</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      case 'totals':
        return (
          <div key="totals" className={`mt-2 pt-2 border-t-2 ${activeStyle.totalsBorder} flex justify-end mb-4 relative z-10`}>
            <div className="w-56 space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-slate-400 uppercase tracking-widest">Subtotal</span>
                <span className="font-bold text-slate-800">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {fields.showVat && (
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">VAT (14%)</span>
                  <span className="font-bold text-slate-800">{formatCurrency(invoice.tax, invoice.currency)}</span>
                </div>
              )}
              <div className={`flex justify-between items-center pt-2 border-t border-slate-900`}>
                <span className={`${activeStyle.accent} font-black uppercase tracking-[0.2em] text-[9px]`}>Total Amount</span>
                <span className={`text-xl font-black ${activeStyle.accent}`}>{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>
        );
      case 'signature':
        return fields.showSignature ? (
          <div key="signature" className="mt-4 flex justify-between items-end relative z-10">
            <div className="max-w-xs">
              {fields.showNotes && invoice.notes && (
                <div className="p-2 bg-slate-50 border border-slate-100 rounded">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Memorandums</p>
                  <p className="text-[9px] font-bold text-slate-700 leading-tight">{invoice.notes}</p>
                </div>
              )}
            </div>
            <div className="text-right flex flex-col items-end">
              {profile.signatureUrl ? (
                <img src={profile.signatureUrl} alt="Signature" className="h-12 w-auto object-contain mb-1" />
              ) : (
                <div className="h-10 w-32 border-b border-dashed border-slate-200 mb-1"></div>
              )}
              <p className={`text-xs font-black ${activeStyle.accent} uppercase tracking-tight`}>{profile.name}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Authority Signatory</p>
            </div>
          </div>
        ) : null;
      case 'footer':
        return (
          <div key="footer" className={`mt-auto pt-4 text-[8px] ${theme === 'blueprint' || theme === 'royal' ? 'text-white/30' : 'text-slate-400'} border-t ${activeStyle.border} relative z-10`}>
            <div className="flex justify-between items-end">
               <div className="space-y-1">
                  <p className="font-black uppercase tracking-[0.2em] text-slate-600">Document Terms</p>
                  <p className="max-w-md leading-tight opacity-70">This bill of services is verified against operational logs. No modification of container data allowed without technical audit. Payment terms are net {invoice.dueDate}.</p>
               </div>
               <div className="text-right">
                  <p className="font-black text-2xl opacity-5 uppercase italic">Certified Billing</p>
               </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={activeStyle.container}>
      {fields.showWatermark && profile.logoUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <img src={profile.logoUrl} alt="" className={`w-[60%] h-auto object-contain opacity-[0.03] grayscale -rotate-12`} />
        </div>
      )}
      {config.sectionOrder.map(sectionId => renderSection(sectionId))}
    </div>
  );
};

export default InvoiceDocument;
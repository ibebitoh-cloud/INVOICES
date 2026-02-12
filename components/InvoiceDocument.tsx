
import React, { useMemo } from 'react';
import { Invoice, InvoiceSectionId, Booking, TemplateFields } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
// Added ArrowRightLeft to the imports from lucide-react
import { Anchor, Truck, MapPin, Package, Hash, Calendar, Layers, ShieldCheck, ArrowRightLeft } from 'lucide-react';

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
    glass: {
      container: "invoice-container flex flex-col font-sans text-gray-800 bg-white relative",
      accent: "text-sky-600", accentBg: "bg-sky-500", border: "border-sky-100", tableHeader: "bg-sky-50 border-b border-sky-100", totalsBorder: "border-sky-500"
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
    if (!port || port === '---' || port.trim() === '') return <span className="text-gray-300 italic text-[9px]">---</span>;
    const portUpper = port.toUpperCase();
    const isMajor = MAJOR_EGYPT_PORTS.some(p => portUpper.includes(p));
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${isMajor ? (theme === 'royal' ? 'bg-amber-900/40 border-amber-600/40 text-amber-500' : 'bg-blue-50 border-blue-100 text-blue-900') : (theme === 'royal' ? 'bg-neutral-900 border-neutral-800 text-neutral-400' : 'bg-gray-50 border-gray-100 text-gray-700')} w-full justify-center`}>
        {isMajor && <Anchor size={10} className="flex-shrink-0" />}
        <span className="font-bold uppercase tracking-tighter text-[9px] truncate">{portUpper}</span>
      </div>
    );
  };

  const renderSection = (id: InvoiceSectionId) => {
    if (safeHiddenSections.has(id)) return null;

    switch (id) {
      case 'header':
        return (
          <div key="header" className={`flex justify-between items-start mb-8 border-b-2 ${activeStyle.border} pb-6 relative z-10`}>
            <div className="flex items-center gap-6">
              {fields.showLogo && profile.logoUrl ? (
                <img src={profile.logoUrl} alt="Logo" className="h-14 w-auto object-contain max-w-[180px]" />
              ) : fields.showLogo ? (
                <div className={`w-14 h-14 ${activeStyle.accentBg} rounded-lg flex items-center justify-center text-white font-black text-2xl shadow-sm`}>
                  {profile.companyName.charAt(0)}
                </div>
              ) : null}
              {fields.showCompanyInfo && (
                <div>
                  <h1 className={`text-2xl font-black ${activeStyle.accent} tracking-tight uppercase leading-none mb-1`}>{profile.companyName}</h1>
                  <div className={`text-[10px] font-bold ${theme === 'blueprint' || theme === 'royal' ? 'text-white/40' : 'text-slate-400'} uppercase tracking-[0.3em] flex items-center gap-2`}>
                    <ShieldCheck size={12} className={activeStyle.accent} /> Verified Logistics Provider
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <h2 className={`text-4xl font-black ${theme === 'industrial' ? 'text-black' : theme === 'blueprint' || theme === 'royal' ? 'text-white' : 'text-slate-200'} uppercase tracking-tight mb-2`}>Invoice</h2>
              <div className="space-y-1">
                <div className={`flex items-center justify-end gap-2 text-sm font-bold ${theme === 'blueprint' || theme === 'royal' ? 'text-white' : 'text-slate-900'}`}>
                  <span className="text-[10px] opacity-40 uppercase tracking-widest">No.</span>
                  <span className={`${activeStyle.accent} font-mono bg-slate-100 px-2 py-0.5 rounded`}>{invoice.invoiceNumber}</span>
                </div>
                {fields.showInvoiceDate && <p className={`text-[10px] font-bold ${theme === 'blueprint' || theme === 'royal' ? 'text-white/50' : 'text-slate-400'} uppercase tracking-widest`}>Issue Date: {invoice.date}</p>}
                {fields.showDueDate && <p className={`text-[10px] font-black text-red-500 uppercase tracking-widest`}>Due Date: {invoice.dueDate}</p>}
              </div>
            </div>
          </div>
        );
      case 'parties':
        return (
          <div key="parties" className="grid grid-cols-2 gap-12 mb-10 relative z-10">
            <div className="space-y-3">
              <h3 className={`text-[10px] font-black ${activeStyle.accent} uppercase tracking-[0.25em] border-b pb-1 flex items-center gap-2`}>
                <div className={`w-2 h-2 rounded-full ${activeStyle.accentBg}`}></div> Bill To
              </h3>
              <div className="pl-4 border-l-2 border-slate-100">
                <p className={`font-black text-lg leading-tight mb-1 ${theme === 'blueprint' || theme === 'royal' ? 'text-white' : 'text-slate-900'}`}>{invoice.customerName}</p>
                {fields.showBeneficiary && invoice.beneficiaryName && <p className={`text-[11px] ${theme === 'blueprint' || theme === 'royal' ? 'text-white/70' : 'text-slate-600'} italic font-bold mb-1`}>Attn: {invoice.beneficiaryName}</p>}
                {fields.showCustomerAddress && invoice.customerAddress && <p className={`text-[10px] ${theme === 'blueprint' || theme === 'royal' ? 'text-white/50' : 'text-slate-500'} leading-relaxed max-w-sm`}>{invoice.customerAddress}</p>}
              </div>
            </div>
            {fields.showCompanyInfo && (
              <div className="space-y-3">
                <h3 className={`text-[10px] font-black ${activeStyle.accent} uppercase tracking-[0.25em] border-b pb-1 flex items-center gap-2`}>
                   <div className={`w-2 h-2 rounded-full ${activeStyle.accentBg}`}></div> Issued By
                </h3>
                <div className="pl-4 border-l-2 border-slate-100">
                  <p className={`font-black text-sm leading-tight mb-1 ${theme === 'blueprint' || theme === 'royal' ? 'text-white' : 'text-slate-900'}`}>{profile.companyName}</p>
                  <div className={`text-[10px] ${theme === 'blueprint' || theme === 'royal' ? 'text-white/50' : 'text-slate-500'} leading-relaxed space-y-1`}>
                    <p className="whitespace-pre-line">{profile.address}</p>
                    {fields.showTaxId && <p className="font-black text-[9px] uppercase tracking-widest pt-1 border-t border-slate-50 inline-block">Tax ID: {profile.taxId}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'table':
        return (
          <div key="table" className="flex-1 mb-10 relative z-10 overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className={`${activeStyle.tableHeader} text-[9px] font-black uppercase tracking-widest ${theme === 'industrial' || theme === 'blueprint' || theme === 'technical-draft' ? 'text-white' : 'text-slate-500'}`}>
                  <th className="py-4 px-3 w-[20%]">Description / Unit</th>
                  {fields.showPorts && <th className="py-4 px-3 w-[25%] text-center">Route (Port In / Out)</th>}
                  {fields.showTrucker && <th className="py-4 px-3 w-[15%]">Transporter</th>}
                  {fields.showServicePeriod && <th className="py-4 px-3 w-[15%] text-center">Op Date</th>}
                  <th className="py-4 px-3 text-right w-[25%]">Amount</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'blueprint' || theme === 'royal' ? 'divide-white/10' : 'divide-slate-100'}`}>
                {groupedItems.map((group, gIdx) => {
                  const first = group[0];
                  const totalGroupRate = group.reduce((acc, curr) => acc + curr.rateValue, 0);
                  return (
                    <tr key={gIdx} className="align-top hover:bg-slate-50/50 transition-colors">
                      <td className="py-5 px-3">
                        {fields.showBookingNo && <div className={`font-black ${activeStyle.accent} text-[10px] uppercase tracking-tight mb-1.5`}>BK: {first.bookingNo || 'N/A'}</div>}
                        {fields.showCustomerRef && first.customerRef && <div className="text-[8px] text-slate-400 font-bold mb-2">REF: {first.customerRef}</div>}
                        <div className="space-y-1.5">
                          {group.map((item, iIdx) => (
                            <div key={iIdx} className="flex flex-col">
                              {fields.showReefer && <p className={`text-[10px] font-black ${theme === 'blueprint' || theme === 'royal' ? 'text-white' : 'text-slate-900'} truncate`}>{item.reeferNumber || 'UNIT-XX'}</p>}
                              {fields.showGenset && item.gensetNo && <p className={`text-[8px] font-mono mt-0.5 ${theme === 'royal' ? 'text-amber-500' : 'text-blue-600'} uppercase`}>Genset: {item.gensetNo}</p>}
                            </div>
                          ))}
                        </div>
                      </td>
                      {fields.showPorts && (
                        <td className="py-5 px-3">
                          <div className="space-y-2">
                            {group.map((item, iIdx) => (
                              <div key={iIdx} className="flex items-center gap-2 justify-center">
                                {renderPortBadge(item.goPort)}
                                <ArrowRightLeft size={10} className="text-slate-300 shrink-0" />
                                {renderPortBadge(item.giPort)}
                              </div>
                            ))}
                          </div>
                        </td>
                      )}
                      {fields.showTrucker && (
                        <td className="py-5 px-3">
                          <div className="space-y-2">
                            {group.map((item, iIdx) => (
                              <div key={iIdx} className="text-[9px] font-bold text-slate-600 flex items-center gap-1">
                                <Truck size={12} className="text-slate-300" /> <span className="truncate">{item.trucker || '---'}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      )}
                      {fields.showServicePeriod && <td className="py-5 px-3 text-center"><div className={`text-[10px] ${theme === 'blueprint' || theme === 'royal' ? 'text-white/70' : 'text-slate-700'} font-bold`}>{formatDate(first.bookingDate)}</div></td>}
                      <td className="py-5 px-3 text-right">
                        <span className={`font-black ${theme === 'blueprint' || theme === 'royal' ? 'text-white' : 'text-slate-900'} text-sm`}>{formatCurrency(totalGroupRate, invoice.currency)}</span>
                        {group.length > 1 && <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">{group.length} Units Included</div>}
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
          <div key="totals" className={`mt-4 pt-4 border-t-2 ${activeStyle.totalsBorder} flex justify-end mb-6 relative z-10`}>
            <div className="w-64 space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className={`font-bold uppercase tracking-widest ${theme === 'blueprint' || theme === 'royal' ? 'text-white/40' : 'text-slate-400'}`}>Subtotal Amount</span>
                <span className={`font-bold ${theme === 'blueprint' || theme === 'royal' ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {fields.showVat && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className={`font-bold uppercase tracking-widest ${theme === 'blueprint' || theme === 'royal' ? 'text-white/40' : 'text-slate-400'}`}>VAT / TAX (14%)</span>
                  <span className={`font-bold ${theme === 'blueprint' || theme === 'royal' ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(invoice.tax, invoice.currency)}</span>
                </div>
              )}
              <div className={`flex justify-between items-center pt-3 border-t-2 ${theme === 'blueprint' || theme === 'royal' ? 'border-white/30' : 'border-slate-900'}`}>
                <span className={`${activeStyle.accent} font-black uppercase tracking-[0.2em] text-[10px]`}>Grand Total</span>
                <span className={`text-2xl font-black ${activeStyle.accent}`}>{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>
        );
      case 'signature':
        return fields.showSignature ? (
          <div key="signature" className="mt-6 flex justify-between items-end relative z-10">
            <div className="max-w-xs">
              {fields.showNotes && invoice.notes && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Internal Reference</p>
                  <p className="text-[10px] font-bold text-slate-700">{invoice.notes}</p>
                </div>
              )}
            </div>
            <div className="text-right flex flex-col items-end">
              <p className={`text-[9px] font-black ${theme === 'blueprint' || theme === 'royal' ? 'text-white/30' : 'text-slate-400'} uppercase tracking-[0.2em] mb-4`}>Authorized Approval</p>
              {profile.signatureUrl ? (
                <img src={profile.signatureUrl} alt="Signature" className={`h-16 w-auto object-contain mb-2 ${theme === 'blueprint' || theme === 'royal' ? 'brightness-0 invert' : ''}`} />
              ) : (
                <div className="h-16 w-48 border-b-2 border-dashed border-slate-300 mb-2"></div>
              )}
              <p className={`text-sm font-black ${activeStyle.accent} uppercase tracking-tight`}>{profile.name}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Administrative Manager</p>
            </div>
          </div>
        ) : null;
      case 'footer':
        return (
          <div key="footer" className={`mt-auto pt-8 text-[9px] ${theme === 'blueprint' || theme === 'royal' ? 'text-white/30' : 'text-slate-400'} border-t ${activeStyle.border} relative z-10`}>
            <div className="grid grid-cols-2 gap-12">
              {fields.showTerms && (
                <div className="space-y-2">
                  <p className={`font-black uppercase tracking-[0.2em] border-b border-slate-50 pb-1 ${theme === 'blueprint' || theme === 'royal' ? 'text-white/50' : 'text-slate-600'}`}>Document Terms</p>
                  <p className="leading-relaxed">This invoice is generated based on validated operational booking reports. Standard logistics and reefer maintenance terms apply. Please process payment by the specified due date.</p>
                </div>
              )}
              <div className="text-right flex flex-col justify-end">
                <p className={`font-black text-4xl mb-1 tracking-tighter opacity-10 uppercase italic ${theme === 'blueprint' || theme === 'royal' ? 'text-white' : 'text-slate-900'}`}>Official Billing</p>
                <p className="text-[8px] font-medium">Digital Copy - Integrity Verified</p>
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
          <img src={profile.logoUrl} alt="" className={`w-[70%] h-auto object-contain transition-all ${theme === 'blueprint' || theme === 'royal' ? 'opacity-[0.02] brightness-0 invert' : 'opacity-[0.04] grayscale'} -rotate-12`} />
        </div>
      )}
      {config.sectionOrder.map(sectionId => renderSection(sectionId))}
    </div>
  );
};

export default InvoiceDocument;

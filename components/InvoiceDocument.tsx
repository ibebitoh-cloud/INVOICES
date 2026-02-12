
import React, { useMemo } from 'react';
import { Invoice, InvoiceSectionId, InvoiceTheme, Booking, TemplateFields } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Anchor, Truck, MapPin, Package, Hash, Calendar } from 'lucide-react';

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
    name: 'Admin',
    companyName: 'Logistics Pro Egypt Ltd.',
    address: 'Industrial Zone 4, Plot 12, Borg El Arab, Alexandria',
    taxId: '412-100-XXX',
    email: 'billing@logisticspro.com.eg',
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
      container: "invoice-container bg-white shadow-2xl border border-gray-100 flex flex-col font-sans text-gray-900 relative",
      accent: "text-blue-900", accentBg: "bg-blue-900", border: "border-blue-900", tableHeader: "bg-gray-50 border-y border-gray-200", totalsBorder: "border-gray-900"
    },
    minimalist: {
      container: "invoice-container bg-white flex flex-col font-sans relative",
      accent: "text-gray-900", accentBg: "bg-gray-100", border: "border-gray-200", tableHeader: "border-b-2 border-gray-900", totalsBorder: "border-gray-100"
    },
    corporate: {
      container: "invoice-container bg-white flex flex-col font-serif relative",
      accent: "text-slate-900", accentBg: "bg-slate-900", border: "border-slate-300", tableHeader: "bg-slate-50 border-y-2 border-slate-900", totalsBorder: "border-slate-900"
    },
    'sidebar-pro': {
      container: "invoice-container bg-white flex font-sans text-gray-900 relative shadow-2xl p-0", // Sidebar needs custom padding handling
      accent: "text-indigo-600", accentBg: "bg-indigo-600", border: "border-indigo-100", tableHeader: "bg-indigo-50/50 border-b border-indigo-100", totalsBorder: "border-indigo-600"
    },
    'modern-cards': {
      container: "invoice-container bg-slate-50 shadow-2xl flex flex-col font-sans text-slate-900 relative",
      accent: "text-purple-600", accentBg: "bg-purple-600", border: "border-purple-200", tableHeader: "hidden", totalsBorder: "border-purple-600"
    },
    'technical-draft': {
      container: "invoice-container bg-[#f4f7f9] shadow-2xl border-2 border-blue-900 flex flex-col font-mono text-blue-950 relative",
      accent: "text-blue-900", accentBg: "bg-blue-900", border: "border-blue-300", tableHeader: "bg-blue-900 text-white", totalsBorder: "border-blue-900"
    },
    industrial: {
      container: "invoice-container bg-white flex flex-col font-mono relative",
      accent: "text-orange-600", accentBg: "bg-orange-600", border: "border-black", tableHeader: "bg-black text-white", totalsBorder: "border-black"
    },
    elegant: {
      container: "invoice-container bg-white flex flex-col font-serif relative",
      accent: "text-emerald-900", accentBg: "bg-emerald-900", border: "border-emerald-100", tableHeader: "bg-emerald-50/30 border-y border-emerald-100", totalsBorder: "border-emerald-900"
    },
    blueprint: {
      container: "invoice-container bg-[#003366] shadow-2xl border-4 border-white flex flex-col font-mono text-white relative",
      accent: "text-cyan-400", accentBg: "bg-white", border: "border-white", tableHeader: "bg-white/10 border-y border-white/30 text-white", totalsBorder: "border-white"
    },
    glass: {
      container: "invoice-container bg-white shadow-2xl border border-gray-100 flex flex-col font-sans text-gray-800 relative",
      accent: "text-blue-500", accentBg: "bg-blue-400", border: "border-blue-100", tableHeader: "bg-white/30 border-b border-white/50", totalsBorder: "border-blue-50"
    },
    royal: {
      container: "invoice-container bg-neutral-950 shadow-2xl border-x-8 border-amber-600 flex flex-col font-serif text-neutral-100 relative",
      accent: "text-amber-500", accentBg: "bg-amber-600", border: "border-amber-600/30", tableHeader: "bg-neutral-900 border-y border-amber-600/50", totalsBorder: "border-amber-600"
    }
  };

  const activeStyle = styles[theme] || styles.modern;

  const renderPortBadge = (port: string) => {
    if (!port || port === '---' || port.trim() === '') return <span className="text-gray-300 italic text-[8px]">---</span>;
    const portUpper = port.toUpperCase();
    const isMajor = MAJOR_EGYPT_PORTS.some(p => portUpper.includes(p));
    return (
      <div className={`inline-flex items-center gap-1 px-1 py-0.5 rounded ${isMajor ? (theme === 'royal' ? 'bg-amber-900/30 border-amber-600/30 text-amber-500' : 'bg-blue-50 border-blue-100 text-blue-900') : (theme === 'royal' ? 'bg-neutral-900 border-neutral-800 text-neutral-400' : 'bg-gray-50 border-gray-100 text-gray-700')} border transition-all overflow-hidden`}>
        {isMajor && <Anchor size={8} className="flex-shrink-0" />}
        <span className="font-bold uppercase tracking-tighter text-[8px] truncate">{portUpper}</span>
      </div>
    );
  };

  const renderTableSection = () => {
    if (theme === 'modern-cards') {
      return (
        <div className="space-y-4 mb-4 relative z-10">
          {groupedItems.map((group, idx) => (
            <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 relative">
               <div className="flex justify-between items-start mb-2">
                 <div>
                   {fields.showBookingNo && (
                    <div className="flex items-center gap-2 mb-0.5">
                      <Hash size={12} className="text-purple-600" />
                      <span className="font-black text-slate-900 uppercase tracking-tighter text-xs">BK: {group[0].bookingNo}</span>
                    </div>
                   )}
                   {fields.showServicePeriod && (
                    <div className="flex items-center gap-2">
                      <Calendar size={10} className="text-slate-400" />
                      <span className="text-[9px] font-bold text-slate-400">{formatDate(group[0].bookingDate)}</span>
                    </div>
                   )}
                 </div>
                 <div className="text-right">
                   <p className="text-lg font-black text-slate-900">{formatCurrency(group.reduce((acc, curr) => acc + curr.rateValue, 0), invoice.currency)}</p>
                   <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest">{group.length} UNITS</p>
                 </div>
               </div>
               <div className="space-y-2">
                 {group.map((item, iIdx) => (
                   <div key={iIdx} className="bg-slate-50 rounded-lg p-2.5 flex flex-wrap items-center gap-x-6 gap-y-1 border border-slate-100">
                     <div className="flex-1 min-w-[80px]">
                        {fields.showReefer && <p className="font-black text-slate-900 text-[10px]">{item.reeferNumber}</p>}
                        {fields.showGenset && item.gensetNo && <p className="text-[8px] text-purple-600 font-bold uppercase tracking-tighter">GS: {item.gensetNo}</p>}
                     </div>
                     {fields.showPorts && (
                      <div className="flex items-center gap-2 w-32">
                        <div className="flex-1">{renderPortBadge(item.goPort)}</div>
                        <span className="text-slate-300 text-[8px]">→</span>
                        <div className="flex-1">{renderPortBadge(item.giPort)}</div>
                      </div>
                     )}
                     {fields.showTrucker && (
                      <div className="flex-1 min-w-[100px] text-[9px] font-bold text-slate-600 truncate">
                        <Truck size={10} className="inline mr-1" /> {item.trucker || '---'}
                      </div>
                     )}
                   </div>
                 ))}
               </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="mb-4 relative z-10">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className={`${activeStyle.tableHeader} text-[7.5px] font-black uppercase tracking-widest ${theme === 'industrial' ? 'text-white' : theme === 'royal' ? 'text-amber-600' : theme === 'blueprint' ? 'text-cyan-400' : theme === 'technical-draft' ? 'text-white' : 'text-gray-500'}`}>
              <th className="py-2 px-2 w-[18%]">Booking / Unit</th>
              {fields.showPorts && <th className="py-2 px-2 w-[15%] text-center">Port In</th>}
              {fields.showPorts && <th className="py-2 px-2 w-[15%] text-center">Port Out</th>}
              {fields.showShipperAddress && <th className="py-2 px-2 w-[16%]">Shipper</th>}
              {fields.showTrucker && <th className="py-2 px-2 w-[12%]">Trucker</th>}
              {fields.showServicePeriod && <th className="py-2 px-2 w-[10%] text-center">Date</th>}
              <th className="py-2 px-2 text-right w-[14%]">Amount</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme === 'blueprint' || theme === 'royal' || theme === 'technical-draft' ? 'divide-white/10' : 'divide-gray-100'}`}>
            {groupedItems.map((group, gIdx) => {
              const first = group[0];
              const totalGroupRate = group.reduce((acc, curr) => acc + curr.rateValue, 0);
              return (
                <tr key={gIdx} className="align-top hover:bg-gray-50/10 transition-colors">
                  <td className="py-3 px-2">
                    {fields.showBookingNo && <div className={`font-black ${activeStyle.accent} text-[9px] uppercase tracking-tighter mb-1`}>{first.bookingNo || 'N/A'}</div>}
                    <div className="space-y-1">
                      {group.map((item, iIdx) => (
                        <div key={iIdx}>
                          {fields.showReefer && <p className={`text-[8px] font-black ${theme === 'blueprint' || theme === 'royal' ? 'text-white' : 'text-gray-900'} truncate`}>{item.reeferNumber || 'UNIT-XX'}</p>}
                          {fields.showGenset && item.gensetNo && <p className={`text-[6.5px] ${theme === 'royal' ? 'text-amber-500 bg-amber-900/50' : 'text-orange-600 bg-orange-50'} font-mono px-1 rounded inline-block`}>GS: {item.gensetNo}</p>}
                        </div>
                      ))}
                    </div>
                  </td>
                  {fields.showPorts && (
                    <td className="py-3 px-2 text-center">
                      <div className="space-y-1">{group.map((item, iIdx) => (<div key={iIdx} className="min-h-[26px] flex items-center justify-center">{renderPortBadge(item.goPort)}</div>))}</div>
                    </td>
                  )}
                  {fields.showPorts && (
                    <td className="py-3 px-2 text-center">
                      <div className="space-y-1">{group.map((item, iIdx) => (<div key={iIdx} className="min-h-[26px] flex items-center justify-center">{renderPortBadge(item.giPort)}</div>))}</div>
                    </td>
                  )}
                  {fields.showShipperAddress && (
                    <td className="py-3 px-2">
                      <div className="space-y-1">{group.map((item, iIdx) => (<div key={iIdx} className="min-h-[26px] flex items-start gap-1 pt-0.5">{item.shipperAddress ? <p className={`text-[7px] ${theme === 'blueprint' || theme === 'royal' ? 'text-white/50' : 'text-gray-500'} leading-tight line-clamp-2`}>{item.shipperAddress}</p> : <span className="text-[7px] text-gray-300">---</span>}</div>))}</div>
                    </td>
                  )}
                  {fields.showTrucker && (
                    <td className="py-3 px-2">
                      <div className="space-y-1">{group.map((item, iIdx) => (<div key={iIdx} className="min-h-[26px] flex items-center text-[7px] font-bold text-gray-600 truncate">{item.trucker || '---'}</div>))}</div>
                    </td>
                  )}
                  {fields.showServicePeriod && <td className="py-3 px-2 text-center"><div className={`text-[8px] ${theme === 'blueprint' || theme === 'royal' ? 'text-white/70' : 'text-gray-700'} font-bold`}>{formatDate(first.bookingDate)}</div></td>}
                  <td className="py-3 px-2 text-right">
                    <span className={`font-black ${theme === 'blueprint' || theme === 'royal' ? 'text-white' : 'text-gray-900'} text-xs`}>{formatCurrency(totalGroupRate, invoice.currency)}</span>
                    {group.length > 1 && <div className="text-[6.5px] text-gray-400 font-bold">{group.length} UNITS</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSection = (id: InvoiceSectionId) => {
    if (safeHiddenSections.has(id)) return null;

    switch (id) {
      case 'header':
        return (
          <div key="header" className={`flex justify-between items-start mb-6 border-b-4 ${activeStyle.border} pb-4 relative z-10`}>
            <div className="flex items-center gap-4">
              {fields.showLogo && profile.logoUrl ? (
                <img src={profile.logoUrl} alt="Logo" className="h-12 w-auto object-contain max-w-[120px]" />
              ) : fields.showLogo ? (
                <div className={`w-10 h-10 ${activeStyle.accentBg} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
                  {profile.companyName.charAt(0)}
                </div>
              ) : null}
              {fields.showCompanyInfo && (
                <div>
                  <h1 className={`text-lg font-black ${activeStyle.accent} tracking-tighter uppercase leading-tight`}>{profile.companyName}</h1>
                  <p className="text-[7.5px] text-gray-400 font-black uppercase tracking-[0.1em] mt-0.5">Logistics & Supply Chain</p>
                </div>
              )}
            </div>
            <div className="text-right">
              <h2 className={`text-3xl font-light ${theme === 'technical-draft' ? 'text-blue-900' : 'text-gray-200'} uppercase tracking-tighter mb-0.5`}>Invoice</h2>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black">No: <span className={`${activeStyle.accent} font-mono tracking-widest`}>{invoice.invoiceNumber}</span></p>
                {fields.showInvoiceDate && <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Date: {invoice.date}</p>}
                {fields.showDueDate && <p className="text-[8px] font-bold text-red-500 uppercase tracking-widest">Due: {invoice.dueDate}</p>}
              </div>
            </div>
          </div>
        );
      case 'parties':
        return (
          <div key="parties" className="grid grid-cols-2 gap-10 mb-6 relative z-10">
            <div className="space-y-2">
              <h3 className={`text-[8px] font-black ${activeStyle.accent} uppercase tracking-[0.2em] mb-1 border-b ${activeStyle.border} pb-1`}>Billed To</h3>
              <p className="font-bold text-base leading-tight">{invoice.customerName}</p>
              {fields.showBeneficiary && invoice.beneficiaryName && <p className="text-[9px] text-gray-500 italic">Attn: {invoice.beneficiaryName}</p>}
              {fields.showCustomerAddress && invoice.customerAddress && <p className="text-[9px] text-gray-500 max-w-xs leading-snug">{invoice.customerAddress}</p>}
            </div>
            {fields.showCompanyInfo && (
              <div className="space-y-2">
                <h3 className={`text-[8px] font-black ${activeStyle.accent} uppercase tracking-[0.2em] mb-1 border-b ${activeStyle.border} pb-1`}>Issued By</h3>
                <p className="font-bold text-sm leading-tight">{profile.companyName}</p>
                <div className="text-[8px] text-gray-500 leading-snug">
                  <p className="whitespace-pre-line">{profile.address}</p>
                  {fields.showTaxId && <p className="font-black mt-1 uppercase tracking-widest text-[7px]">Tax: {profile.taxId}</p>}
                </div>
              </div>
            )}
          </div>
        );
      case 'table':
        return renderTableSection();
      case 'totals':
        return (
          <div key="totals" className={`mt-2 pt-2 border-t-2 ${activeStyle.totalsBorder} flex justify-end mb-4 relative z-10`}>
            <div className="w-56 space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-black uppercase tracking-widest text-[7.5px] text-gray-400">Subtotal</span>
                <span className="font-bold">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {fields.showVat && (
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-black uppercase tracking-widest text-[7.5px] text-gray-400">VAT (14%)</span>
                  <span className="font-bold">{formatCurrency(invoice.tax, invoice.currency)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-gray-300">
                <span className={`${activeStyle.accent} font-black uppercase tracking-[0.1em] text-[8.5px]`}>Total Amount</span>
                <span className={`text-lg font-black ${activeStyle.accent}`}>{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>
        );
      case 'signature':
        return fields.showSignature ? (
          <div key="signature" className="mt-4 flex justify-end relative z-10">
            <div className="text-right space-y-1">
              <p className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-0.5 mb-1">Authorized Signature</p>
              {profile.signatureUrl ? (
                <img src={profile.signatureUrl} alt="Signature" className="h-10 w-auto ml-auto object-contain" />
              ) : (
                <div className="h-8 w-24 border-b border-dashed border-gray-300"></div>
              )}
              <p className="text-[9px] font-black mt-1 uppercase">{profile.name}</p>
            </div>
          </div>
        ) : null;
      case 'footer':
        return (
          <div key="footer" className={`mt-auto pt-4 text-[7px] text-gray-400 grid grid-cols-2 gap-8 border-t ${activeStyle.border} relative z-10`}>
            {fields.showTerms && (
              <div className="space-y-1">
                <p className="font-black text-gray-500 uppercase tracking-widest border-b border-gray-50 pb-0.5">Terms & Conditions</p>
                <p className="leading-tight">Standard reefer logistics terms apply. All port activities recorded based on operational reports. Payment due by date indicated.</p>
                {fields.showNotes && invoice.notes && <p className="mt-1.5 text-blue-600 font-bold uppercase tracking-tighter">Reference: {invoice.notes}</p>}
              </div>
            )}
            <div className="text-right flex flex-col justify-end opacity-20">
              <p className="text-gray-900 font-black text-xl tracking-tighter uppercase italic">Verified Document</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (theme === 'sidebar-pro') {
    return (
      <div className="invoice-container bg-white flex shadow-2xl p-0 font-sans overflow-hidden">
        <div className="w-56 bg-indigo-950 p-8 text-white flex flex-col shrink-0">
           <div className="flex-1 space-y-8">
              <div className="space-y-3">
                {fields.showLogo && profile.logoUrl && <img src={profile.logoUrl} className="w-16 h-auto brightness-0 invert" />}
                {fields.showCompanyInfo && <h1 className="text-lg font-black uppercase tracking-tighter leading-tight">{profile.companyName}</h1>}
              </div>
              <div className="space-y-4">
                 <div>
                    <p className="text-[7.5px] font-black uppercase tracking-widest text-indigo-400 mb-1">Customer</p>
                    <p className="font-bold text-[13px] leading-tight">{invoice.customerName}</p>
                 </div>
                 <div>
                    <p className="text-[7.5px] font-black uppercase tracking-widest text-indigo-400 mb-1">Details</p>
                    <p className="font-mono text-[10px]">#{invoice.invoiceNumber}</p>
                    {fields.showInvoiceDate && <p className="text-[9px] font-bold text-indigo-300 mt-1">{invoice.date}</p>}
                 </div>
              </div>
           </div>
           <div className="pt-6 border-t border-white/10 text-[8px] opacity-60">
              {fields.showCompanyInfo && <p className="leading-snug">{profile.address}</p>}
           </div>
        </div>
        <div className="flex-1 p-10 flex flex-col">
           {renderTableSection()}
           <div className="mt-auto">{renderSection('totals')}{renderSection('signature')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={activeStyle.container}>
      {fields.showWatermark && profile.logoUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <img src={profile.logoUrl} alt="" className="w-[60%] h-auto object-contain opacity-[0.05] grayscale -rotate-12" />
        </div>
      )}
      {config.sectionOrder.map(sectionId => renderSection(sectionId))}
    </div>
  );
};

export default InvoiceDocument;
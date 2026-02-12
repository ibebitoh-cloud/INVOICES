
import React, { useMemo } from 'react';
import { Invoice, InvoiceSectionId, InvoiceTheme, Booking } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface InvoiceDocumentProps {
  invoice: Invoice;
}

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
    }
  };

  const theme = config.theme || 'modern';

  const profile = invoice.userProfile || {
    name: 'Admin',
    companyName: 'Logistics Pro Egypt Ltd.',
    address: 'Industrial Zone 4, Plot 12, Borg El Arab, Alexandria',
    taxId: '412-100-XXX',
    email: 'billing@logisticspro.com.eg',
    signatureUrl: null,
    logoUrl: null
  };

  // Group items by Booking Number to handle "duplicated" bookings (multiple containers per booking)
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

  // Theme Styles mapping
  const styles: Record<InvoiceTheme, any> = {
    modern: {
      container: "bg-white p-16 shadow-2xl border border-gray-100 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col font-sans",
      accent: "text-blue-900",
      accentBg: "bg-blue-900",
      border: "border-blue-900",
      tableHeader: "bg-gray-50/50 border-y border-gray-200",
      totalsBorder: "border-gray-900"
    },
    minimalist: {
      container: "bg-white p-12 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col font-sans",
      accent: "text-gray-900",
      accentBg: "bg-gray-100",
      border: "border-gray-200",
      tableHeader: "border-b-2 border-gray-900",
      totalsBorder: "border-gray-100"
    },
    corporate: {
      container: "bg-white p-16 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col font-serif",
      accent: "text-slate-900",
      accentBg: "bg-slate-900",
      border: "border-slate-300",
      tableHeader: "bg-slate-50 border-y-2 border-slate-900",
      totalsBorder: "border-slate-900"
    },
    industrial: {
      container: "bg-white p-12 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col font-mono",
      accent: "text-orange-600",
      accentBg: "bg-orange-600",
      border: "border-black",
      tableHeader: "bg-black text-white border-none",
      totalsBorder: "border-black"
    },
    elegant: {
      container: "bg-white p-20 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col font-serif",
      accent: "text-emerald-900",
      accentBg: "bg-emerald-900",
      border: "border-emerald-100",
      tableHeader: "bg-emerald-50/30 border-y border-emerald-100",
      totalsBorder: "border-emerald-900"
    }
  };

  const activeStyle = styles[theme];

  const renderSection = (id: InvoiceSectionId) => {
    if (config.hiddenSections.has(id)) return null;

    switch (id) {
      case 'header':
        return (
          <div key="header" className={`flex justify-between items-start mb-12 border-b-4 ${activeStyle.border} pb-8`}>
            <div className="flex items-center gap-4">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt="Company Logo" className="h-16 w-auto object-contain" />
              ) : (
                <div className={`w-14 h-14 ${activeStyle.accentBg} rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                  {profile.companyName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className={`text-2xl font-black ${activeStyle.accent} tracking-tighter uppercase leading-tight`}>{profile.companyName}</h1>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Premium Logistics Solutions</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className={`text-5xl font-light ${theme === 'industrial' ? 'text-black' : 'text-gray-200'} uppercase tracking-tighter mb-2 -mr-1`}>Invoice</h2>
              <div className="space-y-1">
                <p className="text-sm font-black text-gray-900">No: <span className={`${activeStyle.accent} font-mono tracking-widest`}>{invoice.invoiceNumber}</span></p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date: {invoice.date}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due: {invoice.dueDate}</p>
              </div>
            </div>
          </div>
        );
      case 'parties':
        return (
          <div key="parties" className="grid grid-cols-2 gap-16 mb-12">
            <div className="space-y-4">
              <div>
                <h3 className={`text-[10px] font-black ${activeStyle.accent} uppercase tracking-[0.2em] mb-3 border-b ${activeStyle.border} pb-1`}>Billed To</h3>
                <p className="font-bold text-xl text-gray-900 leading-tight">{invoice.customerName}</p>
                {invoice.beneficiaryName && <p className="text-sm text-gray-500 font-medium mt-1 italic">Attention: {invoice.beneficiaryName}</p>}
                {invoice.customerAddress && <p className="text-xs text-gray-500 mt-2 max-w-xs leading-relaxed">{invoice.customerAddress}</p>}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className={`text-[10px] font-black ${activeStyle.accent} uppercase tracking-[0.2em] mb-3 border-b ${activeStyle.border} pb-1`}>Issued By</h3>
                <p className="font-bold text-lg text-gray-900 leading-tight">{profile.companyName}</p>
                <div className="text-[11px] text-gray-500 space-y-1 mt-2 whitespace-pre-line leading-relaxed font-medium">
                  <p>{profile.address}</p>
                  <p className="font-black text-gray-400 uppercase tracking-widest text-[9px]">Tax ID: {profile.taxId}</p>
                  <p className={`font-bold ${activeStyle.accent} mt-2 underline`}>{profile.email}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'table':
        return (
          <div key="table" className="flex-1 mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`${activeStyle.tableHeader} text-[10px] font-black uppercase tracking-widest ${theme === 'industrial' ? 'text-white' : 'text-gray-500'}`}>
                  <th className="py-4 px-3 w-1/2">Booking & Container Details</th>
                  {config.fields.showServicePeriod && <th className="py-4 px-3">Date</th>}
                  {config.fields.showPorts && <th className="py-4 px-3">Ports</th>}
                  <th className="py-4 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groupedItems.map((group, gIdx) => {
                  const first = group[0];
                  const totalGroupRate = group.reduce((acc, curr) => acc + curr.rateValue, 0);
                  
                  return (
                    <tr key={gIdx} className={`${theme === 'minimalist' ? 'hover:bg-gray-50' : 'hover:bg-blue-50/30'} transition-colors`}>
                      <td className="py-5 px-3">
                        {/* Group Header: Booking Number */}
                        <div className={`font-black ${activeStyle.accent} text-sm flex items-center gap-2`}>
                          <span className="uppercase tracking-tighter">Booking: {first.bookingNo || 'N/A'}</span>
                          {group.length > 1 && (
                            <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-black">
                              {group.length} CONTAINERS
                            </span>
                          )}
                        </div>
                        
                        {/* Nested List of Containers */}
                        <div className="mt-2 space-y-1 ml-1 border-l-2 border-gray-100 pl-3">
                          {group.map((item, iIdx) => (
                            <div key={iIdx} className="text-[11px] text-gray-600 flex items-center gap-2">
                              <span className="font-bold text-gray-900">
                                {config.fields.showReefer ? (item.reeferNumber || 'No Container ID') : 'Logistics Unit'}
                              </span>
                              {config.fields.showGenset && item.gensetNo && (
                                <span className="text-[9px] text-gray-400 font-mono">/ G: {item.gensetNo}</span>
                              )}
                              {item.trucker && (
                                <span className="text-[9px] text-gray-300 italic">via {item.trucker}</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {config.fields.showCustomerRef && first.customerRef && (
                          <div className="text-[10px] text-gray-400 mt-2 uppercase font-bold tracking-widest">
                            Ref: {first.customerRef}
                          </div>
                        )}
                      </td>
                      {config.fields.showServicePeriod && (
                        <td className="py-5 px-3 align-top">
                          <div className="text-xs text-gray-700 font-medium">{formatDate(first.bookingDate)}</div>
                        </td>
                      )}
                      {config.fields.showPorts && (
                        <td className="py-5 px-3 align-top">
                          <div className={`text-xs font-black ${activeStyle.accent} tracking-tighter uppercase`}>{first.goPort || '---'}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">TO {first.giPort || '---'}</div>
                        </td>
                      )}
                      <td className="py-5 px-3 text-right align-top">
                        <span className="font-black text-gray-900">{formatCurrency(totalGroupRate, invoice.currency)}</span>
                        {group.length > 1 && (
                          <div className="text-[9px] text-gray-400 mt-1 uppercase font-bold">
                            (Sum of {group.length} units)
                          </div>
                        )}
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
          <div key="totals" className={`mt-8 pt-8 border-t-2 ${activeStyle.totalsBorder} flex justify-end mb-8`}>
            <div className="w-80 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Subtotal</span>
                <span className="font-bold text-gray-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-black uppercase tracking-widest text-[10px]">VAT (14%)</span>
                <span className="font-bold text-gray-900">{formatCurrency(invoice.tax, invoice.currency)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-300">
                <span className={`${activeStyle.accent} font-black uppercase tracking-[0.2em] text-[10px]`}>Total Amount</span>
                <span className={`text-2xl font-black ${activeStyle.accent}`}>{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>
        );
      case 'signature':
        return (
          <div key="signature" className="mt-8 flex justify-end">
            <div className="text-right space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1 mb-2">Authorized Signature</p>
              {profile.signatureUrl ? (
                <img src={profile.signatureUrl} alt="Signature" className="h-20 w-auto ml-auto object-contain" />
              ) : (
                <div className="h-20 w-48 border-b border-dashed border-gray-300"></div>
              )}
              <p className={`text-sm font-black ${activeStyle.accent} mt-2`}>{profile.name}</p>
            </div>
          </div>
        );
      case 'footer':
        return (
          <div key="footer" className={`mt-auto pt-12 text-[9px] text-gray-400 grid grid-cols-2 gap-12 border-t ${activeStyle.border} pt-8`}>
            <div className="space-y-2">
              <p className="font-black text-gray-500 uppercase tracking-widest border-b border-gray-50 pb-1">Terms & Remarks</p>
              <p className="leading-relaxed font-medium">{invoice.notes || "Standard logistics terms apply."}</p>
            </div>
            <div className="text-right flex flex-col justify-end">
              <p className={`text-gray-200 font-black text-5xl mb-2 tracking-tighter opacity-50 uppercase italic ${theme === 'industrial' ? 'text-black' : ''}`}>Thank You</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={activeStyle.container + " print:shadow-none print:border-none print:m-0 print:p-8"}>
      {config.sectionOrder.map(sectionId => renderSection(sectionId))}
    </div>
  );
};

export default InvoiceDocument;

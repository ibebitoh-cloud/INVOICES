
import React, { useMemo } from 'react';
import { Invoice, InvoiceSectionId, InvoiceTheme, Booking } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Anchor, Truck, MapPin } from 'lucide-react';

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

  const styles: Record<InvoiceTheme, any> = {
    modern: {
      container: "bg-white p-10 shadow-2xl border border-gray-100 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col font-sans text-gray-900",
      accent: "text-blue-900",
      accentBg: "bg-blue-900",
      border: "border-blue-900",
      tableHeader: "bg-gray-50/80 border-y border-gray-200",
      totalsBorder: "border-gray-900"
    },
    minimalist: {
      container: "bg-white p-8 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col font-sans",
      accent: "text-gray-900",
      accentBg: "bg-gray-100",
      border: "border-gray-200",
      tableHeader: "border-b-2 border-gray-900",
      totalsBorder: "border-gray-100"
    },
    corporate: {
      container: "bg-white p-12 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col font-serif",
      accent: "text-slate-900",
      accentBg: "bg-slate-900",
      border: "border-slate-300",
      tableHeader: "bg-slate-50 border-y-2 border-slate-900",
      totalsBorder: "border-slate-900"
    },
    industrial: {
      container: "bg-white p-8 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col font-mono",
      accent: "text-orange-600",
      accentBg: "bg-orange-600",
      border: "border-black",
      tableHeader: "bg-black text-white border-none",
      totalsBorder: "border-black"
    },
    elegant: {
      container: "bg-white p-14 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col font-serif",
      accent: "text-emerald-900",
      accentBg: "bg-emerald-900",
      border: "border-emerald-100",
      tableHeader: "bg-emerald-50/30 border-y border-emerald-100",
      totalsBorder: "border-emerald-900"
    }
  };

  const activeStyle = styles[theme];

  const renderPortBadge = (port: string) => {
    if (!port || port === '---' || port.trim() === '') return <span className="text-gray-300 italic text-[9px]">---</span>;
    
    const portUpper = port.toUpperCase();
    const isMajor = MAJOR_EGYPT_PORTS.some(p => portUpper.includes(p));
    
    if (isMajor) {
      return (
        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 shadow-sm w-full justify-center">
          <Anchor size={9} className="text-blue-500 flex-shrink-0" />
          <span className="font-black text-blue-900 uppercase tracking-tighter text-[9px] truncate">
            {portUpper}
          </span>
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 border border-gray-100 w-full justify-center">
        <span className="font-bold text-gray-700 uppercase tracking-tight text-[9px] truncate">
          {port}
        </span>
      </div>
    );
  };

  const renderSection = (id: InvoiceSectionId) => {
    if (config.hiddenSections.has(id)) return null;

    switch (id) {
      case 'header':
        return (
          <div key="header" className={`flex justify-between items-start mb-8 border-b-4 ${activeStyle.border} pb-6`}>
            <div className="flex items-center gap-4">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt="Company Logo" className="h-12 w-auto object-contain" />
              ) : (
                <div className={`w-10 h-10 ${activeStyle.accentBg} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {profile.companyName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className={`text-xl font-black ${activeStyle.accent} tracking-tighter uppercase leading-tight`}>{profile.companyName}</h1>
                <p className="text-[8px] text-gray-400 font-black uppercase tracking-[0.2em] mt-0.5">Premium Logistics Solutions</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className={`text-4xl font-light ${theme === 'industrial' ? 'text-black' : 'text-gray-200'} uppercase tracking-tighter mb-1 -mr-1`}>Invoice</h2>
              <div className="space-y-0.5">
                <p className="text-xs font-black text-gray-900">No: <span className={`${activeStyle.accent} font-mono tracking-widest`}>{invoice.invoiceNumber}</span></p>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Date: {invoice.date}</p>
              </div>
            </div>
          </div>
        );
      case 'parties':
        return (
          <div key="parties" className="grid grid-cols-2 gap-10 mb-6">
            <div className="space-y-3">
              <div>
                <h3 className={`text-[8px] font-black ${activeStyle.accent} uppercase tracking-[0.2em] mb-2 border-b ${activeStyle.border} pb-1`}>Billed To</h3>
                <p className="font-bold text-lg text-gray-900 leading-tight">{invoice.customerName}</p>
                {invoice.beneficiaryName && <p className="text-xs text-gray-500 font-medium mt-1 italic">Attention: {invoice.beneficiaryName}</p>}
                {invoice.customerAddress && <p className="text-[10px] text-gray-500 mt-1 max-w-xs leading-relaxed">{invoice.customerAddress}</p>}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <h3 className={`text-[8px] font-black ${activeStyle.accent} uppercase tracking-[0.2em] mb-2 border-b ${activeStyle.border} pb-1`}>Issued By</h3>
                <p className="font-bold text-base text-gray-900 leading-tight">{profile.companyName}</p>
                <div className="text-[9px] text-gray-500 space-y-0.5 mt-1 whitespace-pre-line leading-relaxed font-medium">
                  <p>{profile.address}</p>
                  <p className="font-black text-gray-400 uppercase tracking-widest text-[7px]">Tax ID: {profile.taxId}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'table':
        return (
          <div key="table" className="flex-1 mb-6 overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className={`${activeStyle.tableHeader} text-[7px] font-black uppercase tracking-widest ${theme === 'industrial' ? 'text-white' : 'text-gray-500'}`}>
                  <th className="py-3 px-2 w-[18%]">Booking / Unit</th>
                  <th className="py-3 px-2 w-[15%] text-center">Port In</th>
                  <th className="py-3 px-2 w-[15%] text-center">Port Out</th>
                  <th className="py-3 px-2 w-[16%]">Shipper</th>
                  <th className="py-3 px-2 w-[11%]">Trucker</th>
                  {config.fields.showServicePeriod && <th className="py-3 px-2 w-[10%] text-center">Date</th>}
                  <th className="py-3 px-2 text-right w-[15%]">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groupedItems.map((group, gIdx) => {
                  const first = group[0];
                  const totalGroupRate = group.reduce((acc, curr) => acc + curr.rateValue, 0);
                  
                  return (
                    <tr key={gIdx} className={`${theme === 'minimalist' ? 'hover:bg-gray-50' : 'hover:bg-blue-50/20'} transition-colors align-top`}>
                      {/* Booking / Unit Column */}
                      <td className="py-4 px-2">
                        <div className={`font-black ${activeStyle.accent} text-[10px] uppercase tracking-tighter mb-2`}>
                          BK: {first.bookingNo || 'N/A'}
                        </div>
                        <div className="space-y-2">
                          {group.map((item, iIdx) => (
                            <div key={iIdx} className="space-y-0.5">
                              <p className="text-[9px] font-black text-gray-900 truncate">
                                {config.fields.showReefer ? (item.reeferNumber || 'UNIT-XX') : 'UNIT'}
                              </p>
                              {config.fields.showGenset && item.gensetNo && (
                                <p className="text-[7px] text-orange-600 font-mono bg-orange-50 px-1 rounded inline-block">GS: {item.gensetNo}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Port In Column */}
                      <td className="py-4 px-2 text-center">
                        <div className="space-y-2">
                          {group.map((item, iIdx) => (
                            <div key={iIdx} className="min-h-[36px] flex items-center justify-center">
                              {renderPortBadge(item.goPort)}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Port Out Column */}
                      <td className="py-4 px-2 text-center">
                        <div className="space-y-2">
                          {group.map((item, iIdx) => (
                            <div key={iIdx} className="min-h-[36px] flex items-center justify-center">
                              {renderPortBadge(item.giPort)}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Shipper Column */}
                      <td className="py-4 px-2">
                        <div className="space-y-2">
                          {group.map((item, iIdx) => (
                            <div key={iIdx} className="flex items-start gap-1 min-h-[36px] pt-1">
                              {item.shipperAddress ? (
                                <>
                                  <MapPin size={8} className="text-gray-300 mt-1 flex-shrink-0" />
                                  <p className="text-[8px] text-gray-600 leading-tight line-clamp-3 italic">{item.shipperAddress}</p>
                                </>
                              ) : <span className="text-[8px] text-gray-300 italic">---</span>}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Trucker Column */}
                      <td className="py-4 px-2">
                        <div className="space-y-2">
                          {group.map((item, iIdx) => (
                            <div key={iIdx} className="flex items-center gap-1 min-h-[36px]">
                              {item.trucker ? (
                                <>
                                  <Truck size={8} className="text-gray-300 flex-shrink-0" />
                                  <p className="text-[8px] text-gray-600 font-bold truncate">{item.trucker}</p>
                                </>
                              ) : <span className="text-[8px] text-gray-300">---</span>}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Date Column */}
                      {config.fields.showServicePeriod && (
                        <td className="py-4 px-2 text-center">
                          <div className="text-[9px] text-gray-700 font-bold pt-1">{formatDate(first.bookingDate)}</div>
                        </td>
                      )}

                      {/* Amount Column */}
                      <td className="py-4 px-2 text-right">
                        <span className="font-black text-gray-900 text-sm">{formatCurrency(totalGroupRate, invoice.currency)}</span>
                        {group.length > 1 && (
                          <div className="text-[7px] text-gray-400 mt-0.5 uppercase font-black">
                            {group.length} UNITS
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
          <div key="totals" className={`mt-4 pt-4 border-t-2 ${activeStyle.totalsBorder} flex justify-end mb-6`}>
            <div className="w-64 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-black uppercase tracking-widest text-[8px]">Subtotal</span>
                <span className="font-bold text-gray-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-black uppercase tracking-widest text-[8px]">VAT (14%)</span>
                <span className="font-bold text-gray-900">{formatCurrency(invoice.tax, invoice.currency)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-300">
                <span className={`${activeStyle.accent} font-black uppercase tracking-[0.2em] text-[8px]`}>Total Amount</span>
                <span className={`text-xl font-black ${activeStyle.accent}`}>{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>
        );
      case 'signature':
        return (
          <div key="signature" className="mt-4 flex justify-end">
            <div className="text-right space-y-1">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1 mb-2">Authorized Signature</p>
              {profile.signatureUrl ? (
                <img src={profile.signatureUrl} alt="Signature" className="h-12 w-auto ml-auto object-contain" />
              ) : (
                <div className="h-10 w-32 border-b border-dashed border-gray-300"></div>
              )}
              <p className={`text-[10px] font-black ${activeStyle.accent} mt-1`}>{profile.name}</p>
            </div>
          </div>
        );
      case 'footer':
        return (
          <div key="footer" className={`mt-auto pt-6 text-[7px] text-gray-400 grid grid-cols-2 gap-10 border-t ${activeStyle.border} pt-4`}>
            <div className="space-y-1">
              <p className="font-black text-gray-500 uppercase tracking-widest border-b border-gray-50 pb-0.5">Terms & Conditions</p>
              <p className="leading-relaxed font-medium">Standard reefer logistics terms apply. All port activities (ALEX, DAM, GOUDA, SCCT, SOKHNA) are recorded based on operational reports. Payment is due within standard terms.</p>
            </div>
            <div className="text-right flex flex-col justify-end">
              <p className={`text-gray-200 font-black text-3xl mb-1 tracking-tighter opacity-30 uppercase italic ${theme === 'industrial' ? 'text-black' : ''}`}>Verified Logistics</p>
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


import React from 'react';
import { Invoice, InvoiceSectionId } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface InvoiceDocumentProps {
  invoice: Invoice;
}

const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice }) => {
  const config = invoice.templateConfig || {
    sectionOrder: ['header', 'parties', 'table', 'totals', 'signature', 'footer'],
    hiddenSections: new Set<InvoiceSectionId>(),
    fields: {
      showReefer: true,
      showGenset: true,
      showBookingNo: true,
      showCustomerRef: true,
      showRoute: true,
      showServicePeriod: true,
      showBankDetails: true,
      showTerms: true,
      showSignature: true,
    }
  };

  const profile = invoice.userProfile || {
    name: 'Admin',
    companyName: 'Logistics Pro Egypt Ltd.',
    address: 'Industrial Zone 4, Plot 12, Borg El Arab, Alexandria',
    taxId: '412-100-XXX',
    email: 'billing@logisticspro.com.eg',
    signatureUrl: null
  };

  const renderSection = (id: InvoiceSectionId) => {
    if (config.hiddenSections.has(id)) return null;

    switch (id) {
      case 'header':
        return (
          <div key="header" className="flex justify-between items-start mb-12 border-b-4 border-blue-900 pb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  {profile.companyName.charAt(0)}
                </div>
                <h1 className="text-2xl font-black text-blue-900 tracking-tighter uppercase">{profile.companyName}</h1>
              </div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Premium Cold Chain & Freight Solutions</p>
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-light text-gray-300 uppercase tracking-tighter mb-2">Invoice</h2>
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-900">No: <span className="text-blue-700">{invoice.invoiceNumber}</span></p>
                <p className="text-xs text-gray-500">Date: {invoice.date}</p>
                <p className="text-xs text-gray-500">Due: {invoice.dueDate}</p>
              </div>
            </div>
          </div>
        );
      case 'parties':
        return (
          <div key="parties" className="grid grid-cols-2 gap-16 mb-12">
            <div className="space-y-4">
              <div>
                <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] mb-3 border-b border-blue-100 pb-1">Billed To</h3>
                <p className="font-bold text-xl text-gray-900 leading-tight">{invoice.customerName}</p>
                {invoice.beneficiaryName && (
                  <p className="text-sm text-gray-500 font-medium mt-1 italic">Attention: {invoice.beneficiaryName}</p>
                )}
                {invoice.customerAddress && (
                  <p className="text-sm text-gray-600 mt-2 max-w-xs">{invoice.customerAddress}</p>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] mb-3 border-b border-blue-100 pb-1">Issued By</h3>
                <p className="font-bold text-lg text-gray-900 leading-tight">{profile.companyName}</p>
                <div className="text-xs text-gray-600 space-y-0.5 mt-2 whitespace-pre-line">
                  <p>{profile.address}</p>
                  <p>Tax ID: {profile.taxId}</p>
                  <p className="font-bold text-blue-700 mt-2">{profile.email}</p>
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
                <tr className="border-y border-gray-200 bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <th className="py-4 px-3 w-1/2">Shipment Details & Equipment</th>
                  {config.fields.showServicePeriod && <th className="py-4 px-3">Service Period</th>}
                  {config.fields.showRoute && <th className="py-4 px-3">Route</th>}
                  <th className="py-4 px-3 text-right">Amount ({invoice.currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="group hover:bg-blue-50/30 transition-colors">
                    <td className="py-5 px-3">
                      <div className="font-bold text-gray-900 text-sm">
                        {config.fields.showReefer ? (item.reeferNumber || 'General Logistics') : 'General Logistics'}
                        {config.fields.showGenset && item.gensetNo && <span className="ml-2 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">G: {item.gensetNo}</span>}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 flex gap-3">
                        {config.fields.showBookingNo && <span className="font-mono">BK: {item.bookingNo}</span>}
                        {config.fields.showCustomerRef && <span>Ref: {item.customerRef || '---'}</span>}
                      </div>
                    </td>
                    {config.fields.showServicePeriod && (
                      <td className="py-5 px-3 align-top">
                        <div className="text-xs text-gray-700 font-medium">{formatDate(item.bookingDate)}</div>
                        <div className="text-[10px] text-gray-400 mt-1 uppercase">Clip-on: {formatDate(item.dateOfClipOn)}</div>
                      </td>
                    )}
                    {config.fields.showRoute && (
                      <td className="py-5 px-3 align-top">
                        <div className="text-xs font-bold text-gray-800">{item.goPort || '---'}</div>
                        <div className="text-[10px] text-gray-400 font-bold">TO {item.giPort || '---'}</div>
                      </td>
                    )}
                    <td className="py-5 px-3 text-right align-top">
                      <span className="font-bold text-gray-900">{formatCurrency(item.rateValue, invoice.currency)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'totals':
        return (
          <div key="totals" className="mt-8 pt-8 border-t-2 border-gray-900 flex justify-end mb-8">
            <div className="w-80 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Subtotal</span>
                <span className="font-bold text-gray-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">VAT (14%)</span>
                <span className="font-bold text-gray-900">{formatCurrency(invoice.tax, invoice.currency)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-300">
                <span className="text-blue-900 font-black uppercase tracking-tighter text-lg">Total Amount</span>
                <span className="text-2xl font-black text-blue-900">{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
              
              {config.fields.showBankDetails && (
                <div className="pt-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Banking Details</p>
                    <div className="text-[10px] text-gray-600 space-y-1">
                      <p><span className="font-bold">Bank:</span> National Bank of Egypt</p>
                      <p><span className="font-bold">IBAN:</span> EG00 0000 0000 0000 0000 0000 123</p>
                      <p><span className="font-bold">Swift:</span> NBEGEGXX</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'signature':
        return (
          <div key="signature" className="mt-8 flex justify-end">
            <div className="text-right space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Authorized Signature</p>
              {profile.signatureUrl ? (
                <img src={profile.signatureUrl} alt="Signature" className="h-16 w-auto ml-auto object-contain" />
              ) : (
                <div className="h-16 w-40 border-b border-gray-300"></div>
              )}
              <p className="text-xs font-bold text-gray-900 mt-2">{profile.name}</p>
            </div>
          </div>
        );
      case 'footer':
        return (
          <div key="footer" className="mt-auto pt-12 text-[10px] text-gray-400 grid grid-cols-2 gap-12">
            <div className="space-y-2">
              <p className="font-bold text-gray-600 uppercase">Remarks & Instructions</p>
              <p className="leading-relaxed">
                {config.fields.showTerms ? (invoice.notes || "All reefer bookings are subject to power availability and genset health status at the time of loading.") : "Standard logistics terms apply."}
              </p>
            </div>
            <div className="text-right flex flex-col justify-end">
              <p className="text-gray-300 font-black text-4xl mb-2 italic">Thank You</p>
              <p>This is a computer-generated document. No signature required.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-12 shadow-2xl border border-gray-100 max-w-[210mm] mx-auto text-gray-800 leading-relaxed min-h-[297mm] flex flex-col print:shadow-none print:border-none">
      {config.sectionOrder.map(sectionId => renderSection(sectionId))}
    </div>
  );
};

export default InvoiceDocument;

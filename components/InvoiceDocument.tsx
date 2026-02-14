import React, { useMemo } from 'react';
import { Invoice, Booking, TemplateFields } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  ShieldCheck, 
  Table as TableIcon, Layout, Terminal, Feather, Droplets, 
  HardHat, DraftingCompass, Wind, Activity, Briefcase, Award,
  Cloud, Leaf, Sun, Contrast, Waves, Heart, Gem, Map as MapPinIcon, StickyNote,
  Newspaper, Rainbow, List, Type, ScrollText, Square, Grid3X3,
  CreditCard, Boxes, Anchor, Info, Landmark, Scale, FileText, CheckCircle2,
  Clock, Banknote, ShieldAlert
} from 'lucide-react';

interface InvoiceDocumentProps {
  invoice: Invoice;
}

const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice }) => {
  if (!invoice || !invoice.userProfile) {
    return <div className="p-10 text-red-500 bg-white border border-red-200 rounded-lg">Missing invoice data or profile.</div>;
  }

  const config = invoice.templateConfig || {
    sectionOrder: ['header', 'parties', 'table', 'totals', 'signature', 'footer'],
    hiddenSections: new Set(),
    theme: 'logistics-grid',
    groupBy: 'booking',
    fields: {
      showReefer: true, showGenset: false, showBookingNo: true, showCustomerRef: true,
      showPorts: true, showServicePeriod: false, showTerms: true, showSignature: true,
      showLogo: true, showCompanyInfo: true, showTaxId: true, showCustomerAddress: true,
      showBeneficiary: false, showShipperAddress: true, showTrucker: true, showVat: true,
      showInvoiceDate: true, showDueDate: true, showNotes: true, showWatermark: true
    }
  };

  const fields = config.fields as TemplateFields;
  const theme = config.theme || 'logistics-grid';
  const profile = invoice.userProfile;

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

  const WatermarkLayer = () => {
    if (!fields.showWatermark || !profile.watermarkUrl) return null;
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none">
        <img 
          src={profile.watermarkUrl} 
          style={{ 
            opacity: profile.watermarkOpacity || 0.05, 
            transform: 'rotate(-25deg)',
            width: '500px',
            height: '500px',
            filter: 'grayscale(100%)'
          }} 
          className="object-contain" 
          alt="" 
        />
      </div>
    );
  };

  const SignatureBlock = ({ label, isDark = false }: { label: string, isDark?: boolean }) => (
    <div className="pt-4 border-t border-dashed border-slate-200">
       <p className={`text-[9px] font-black uppercase mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
       <div className={`h-16 w-48 border-b flex items-end pb-1 ${isDark ? 'border-white/20' : 'border-slate-300'}`}>
         {profile.signatureUrl && <img src={profile.signatureUrl} className={`max-h-full max-w-full object-contain ${!isDark ? 'mix-blend-multiply' : 'brightness-200'}`} alt="signature" />}
       </div>
       <p className={`text-[10px] font-black uppercase mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.name}</p>
    </div>
  );

  const TermsAndConditions = ({ isDark = false }) => (
    <div className={`p-6 rounded-2xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
      <p className={`text-[10px] font-black uppercase mb-4 flex items-center gap-2 ${isDark ? 'text-indigo-400' : 'text-slate-900'}`}>
        <Scale size={14} className="text-emerald-500" /> Terms & Regulatory Compliance
      </p>
      <div className={`grid grid-cols-1 gap-4 text-[9px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        <div className="flex gap-3">
          <Clock size={12} className="shrink-0 mt-0.5 text-slate-400" />
          <p><span className="font-black text-slate-700 uppercase">Settlement Period:</span> Payment is strictly due by the selected date specified in the "Due Date" field. Timely settlement is required to maintain active credit lines.</p>
        </div>
        <div className="flex gap-3">
          <ShieldAlert size={12} className="shrink-0 mt-0.5 text-slate-400" />
          <p><span className="font-black text-slate-700 uppercase">Statement Finality:</span> This invoice is considered a conclusive account of services rendered. In the absence of written notification regarding discrepancies within 7 calendar days of issue, the document shall be deemed final, binding, and uncontestable.</p>
        </div>
        <div className="flex gap-3">
          <Banknote size={12} className="shrink-0 mt-0.5 text-slate-400" />
          <p><span className="font-black text-slate-700 uppercase">Payment Basis:</span> This transaction is recorded as a <span className="underline italic">Cash-Basis claim</span> for the recipient. Funds must be remitted in full via verified bank transfer or authorized cash collection protocols as listed under payment instructions.</p>
        </div>
        <div className="flex gap-3">
          <Landmark size={12} className="shrink-0 mt-0.5 text-slate-400" />
          <p><span className="font-black text-slate-700 uppercase">Legal Jurisdiction:</span> Issued under the commercial regulations of the Arab Republic of Egypt. All taxes, including 14% VAT, are calculated at the source.</p>
        </div>
      </div>
    </div>
  );

  const renderModernClassic = () => (
    <div className="invoice-container flex flex-col p-[15mm] text-slate-900 font-sans">
      <WatermarkLayer />
      
      {/* Header */}
      <div className="flex justify-between items-start mb-10 relative z-10">
        <div>
          {fields.showLogo && profile.logoUrl && <img src={profile.logoUrl} className="h-20 mb-6 object-contain" />}
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 leading-none">{profile.companyName}</h1>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">Tax ID: {profile.taxId}</p>
        </div>
        <div className="text-right">
          <h2 className="text-6xl font-black text-slate-100 leading-none mb-4">INVOICE</h2>
          <div className="relative z-10 space-y-2">
            <p className="text-sm font-black text-slate-900 uppercase">Ref: <span className="text-emerald-600">#{invoice.invoiceNumber}</span></p>
            <div className="text-[10px] font-bold space-y-1 uppercase text-slate-400">
              <p>Issue Date <span className="text-slate-900 ml-4">{invoice.date}</span></p>
              <p>Payment Due <span className="text-red-600 ml-4">{invoice.dueDate}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-12 mb-10 relative z-10 py-8 border-y border-slate-100 bg-white/50 backdrop-blur-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-900 text-white rounded-lg"><Anchor size={12}/></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Provider</p>
          </div>
          <p className="text-xs font-bold text-slate-600 leading-relaxed whitespace-pre-wrap pl-2">{profile.address}</p>
        </div>
        <div className="text-right space-y-4">
          <div className="flex items-center gap-2 justify-end">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill To Client</p>
            <div className="p-1.5 bg-emerald-500 text-white rounded-lg"><Briefcase size={12}/></div>
          </div>
          <div className="pr-2">
            <p className="text-xl font-black text-slate-900 uppercase mb-2 leading-none">{invoice.customerName}</p>
            <p className="text-xs font-medium text-slate-500 uppercase leading-relaxed whitespace-pre-wrap">{invoice.customerAddress}</p>
          </div>
        </div>
      </div>

      {/* Line Items - FLEX GROW */}
      <div className="flex-1 relative z-10">
        <table className="w-full text-left">
          <thead className="border-b-2 border-slate-900">
            <tr>
              <th className="py-4 px-2 text-[11px] font-black uppercase tracking-widest">Operational Description</th>
              <th className="py-4 px-2 text-right text-[11px] font-black uppercase tracking-widest">Unit Valuation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groupedItems.map((group, idx) => (
              <tr key={idx} className="group">
                <td className="py-8 px-2">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-1.5 h-10 bg-emerald-500 rounded-full"></div>
                    <div>
                      <p className="font-black text-2xl uppercase tracking-tighter text-slate-900">{group[0].bookingNo}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Service Reference ID</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-6">
                    {group.map(u => (
                      <div key={u.id} className="flex items-center gap-2 text-[10px] font-black text-slate-500 bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-xl">
                        <Boxes size={12} className="text-emerald-500" />
                        {u.reeferNumber}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="py-8 px-2 text-right font-black text-3xl text-slate-900 align-top tracking-tighter">
                  {formatCurrency(group.reduce((a,c)=>a+c.rateValue,0), invoice.currency)}
                </td>
              </tr>
            ))}
            {/* Fill space row if items are few */}
            {groupedItems.length < 3 && (
              <tr>
                <td colSpan={2} className="py-12 text-center text-[10px] font-black text-slate-200 uppercase tracking-[1em]">
                  End of Manifest
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer - MT AUTO PUSHES TO BOTTOM */}
      <div className="mt-auto space-y-10 relative z-10 pt-10 border-t border-slate-100">
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-7 space-y-6">
            <TermsAndConditions />
            <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm flex items-center gap-6">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Landmark size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Beneficiary Hub</p>
                <p className="text-sm font-black text-slate-900">{profile.companyName}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Bank Transfer / Cash / Check</p>
              </div>
            </div>
          </div>
          <div className="col-span-5 space-y-8 flex flex-col justify-end">
            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl space-y-4">
              <div className="flex justify-between items-center text-[11px] font-bold opacity-60">
                <span>SUBTOTAL VALUE</span>
                <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {fields.showVat && (
                <div className="flex justify-between items-center text-[11px] font-bold opacity-60">
                  <span>TAX ASSESSMENT (14%)</span>
                  <span>{formatCurrency(invoice.tax, invoice.currency)}</span>
                </div>
              )}
              <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                <span className="text-[12px] font-black text-emerald-400">TOTAL DUE</span>
                <span className="text-4xl font-black tracking-tighter">{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
            <SignatureBlock label="Authorized Authentication Signature" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderIndustrialBold = () => (
    <div className="invoice-container flex flex-col p-[15mm] text-black font-mono border-[15px] border-slate-900">
      <WatermarkLayer />
      
      {/* Heavy Header Banner */}
      <div className="flex justify-between items-center mb-12 bg-slate-900 text-white p-12 -mx-[15mm] -mt-[15mm] relative z-10">
        <div>
          <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">{profile.companyName}</h1>
          <div className="flex items-center gap-4 mt-6">
            <div className="p-2 bg-emerald-500 text-white"><Terminal size={18}/></div>
            <p className="text-[11px] font-black tracking-[0.5em] text-emerald-400">CARGO_SPEC_V4_AUTH</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-black opacity-40 uppercase mb-2">Operation Sequence</p>
          <h2 className="text-7xl font-black italic tracking-tighter">REF_{invoice.invoiceNumber.split('-').pop()}</h2>
          <p className="text-sm font-black mt-6 uppercase tracking-[0.3em]">TS_{invoice.date}</p>
        </div>
      </div>

      {/* Target and Specs */}
      <div className="grid grid-cols-12 gap-10 mb-12 relative z-10">
        <div className="col-span-7 border-r-4 border-slate-100 pr-10">
          <p className="text-[11px] font-black uppercase mb-6 bg-black text-white px-3 py-1 inline-block">TARGET_ENTITY_NODE</p>
          <p className="text-6xl font-black uppercase leading-[0.85] tracking-tighter mb-6">{invoice.customerName}</p>
          <div className="h-2 bg-black w-32 mb-6"></div>
          <p className="text-xs font-black uppercase opacity-60 leading-relaxed max-w-sm">{invoice.customerAddress}</p>
        </div>
        <div className="col-span-5 text-right flex flex-col justify-between py-2">
          <div className="space-y-4">
            <p className="text-[11px] font-black opacity-40">LIABILITY_EXPIRATION</p>
            <div className="bg-emerald-500 text-white p-6 shadow-[12px_12px_0px_#000] inline-block">
              <p className="text-4xl font-black italic tracking-tighter">{invoice.dueDate}</p>
            </div>
          </div>
          <div className="bg-slate-100 p-4 border-2 border-slate-900 text-left">
            <p className="text-[9px] font-black opacity-60">HUB_ORIGIN_SPEC</p>
            <p className="text-[10px] font-black mt-1 leading-tight">{profile.address.replace(/\n/g, ' // ')}</p>
          </div>
        </div>
      </div>

      {/* Heavy Manifest - FLEX GROW */}
      <div className="flex-1 relative z-10">
        <div className="bg-slate-900 text-white p-4 font-black text-[12px] grid grid-cols-12 uppercase border-l-[16px] border-emerald-500 mb-8 tracking-[0.2em]">
          <div className="col-span-8">MANIFEST_LINE_ASSET</div>
          <div className="col-span-4 text-right">CREDIT_VALUATION</div>
        </div>
        <div className="space-y-12">
          {groupedItems.map((group, idx) => (
            <div key={idx} className="flex justify-between items-end border-b-8 border-slate-50 pb-10 hover:bg-slate-50 transition-colors cursor-crosshair">
              <div>
                <p className="text-4xl font-black uppercase tracking-tighter italic leading-none mb-4">{group[0].bookingNo}</p>
                <div className="flex flex-wrap gap-2">
                  {group.map(u => (
                    <div key={u.id} className="flex items-center gap-2 bg-black text-white px-4 py-1.5 text-[12px] font-black italic">
                      <div className="w-2 h-2 bg-emerald-500 animate-pulse"></div>
                      UNIT_{u.reeferNumber}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-7xl font-black tracking-tighter leading-none -mb-2">{formatCurrency(group.reduce((a,c)=>a+c.rateValue,0), invoice.currency)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Aggregate Bottom Section - MT AUTO */}
      <div className="mt-auto relative z-10 pt-16 border-t-8 border-slate-900 bg-white">
        <div className="grid grid-cols-12 gap-10 items-end">
          <div className="col-span-6 space-y-8">
            <div className="p-6 bg-slate-900 text-white border-b-[8px] border-emerald-500 italic">
               <p className="text-[11px] font-black mb-2 opacity-50">CONTRACTUAL_OBLIGATIONS_V4</p>
               <p className="text-[10px] leading-relaxed">THIS TRANSACTION IS LOGGED UNDER NILE FLEET LOGISTICS SYSTEM PROTOCOL. ALL ASSETS LISTED REMAIN UNDER OPERATIONAL CONTROL UNTIL SETTLEMENT IS CONFIRMED.</p>
            </div>
            <SignatureBlock label="SYSTEM_OPERATOR_AUTH" isDark={false} />
          </div>
          <div className="col-span-6 text-right space-y-6">
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase opacity-40">AGGREGATE_LIABILITY_NET</p>
              <div className="flex justify-end gap-10 text-xl font-black italic">
                <span className="opacity-30">SUB_TOTAL</span>
                <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
            </div>
            <p className="text-9xl font-black leading-none tracking-tighter italic -mr-10 text-slate-900">
              {formatCurrency(invoice.total, invoice.currency).replace('EGP', '')}
              <span className="text-2xl ml-4 opacity-30 not-italic">EGP</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderElegantSerif = () => (
    <div className="invoice-container flex flex-col p-[25mm] bg-[#fdfdfd] text-slate-800 font-serif overflow-hidden">
      <WatermarkLayer />
      
      {/* Centered Crest Header */}
      <div className="flex flex-col items-center text-center mb-24 relative z-10">
        {fields.showLogo && profile.logoUrl && <img src={profile.logoUrl} className="h-28 mb-12 object-contain" />}
        <div className="space-y-4">
          <h1 className="text-5xl font-light tracking-[0.5em] uppercase italic leading-none">{profile.companyName}</h1>
          <div className="flex items-center justify-center gap-6">
            <div className="w-16 h-[1px] bg-slate-300"></div>
            <p className="text-[12px] text-slate-400 font-sans font-black uppercase tracking-[0.6em]">{profile.taxId}</p>
            <div className="w-16 h-[1px] bg-slate-300"></div>
          </div>
        </div>
      </div>

      {/* Sophisticated Parties Section */}
      <div className="flex justify-between items-end mb-24 relative z-10 border-b border-slate-100 pb-20">
        <div className="max-w-md">
          <p className="text-[11px] font-sans font-black text-slate-200 uppercase tracking-[0.3em] mb-8 italic">Addressed To</p>
          <p className="text-7xl font-light tracking-tight mb-6 uppercase leading-[0.8] text-slate-900">{invoice.customerName}</p>
          <p className="text-[11px] font-sans text-slate-400 font-bold uppercase tracking-[0.3em] leading-relaxed max-w-xs">{invoice.customerAddress}</p>
        </div>
        <div className="text-right font-sans relative">
          <h2 className="text-stone-100 text-[180px] absolute -top-32 right-0 -z-10 font-black italic leading-none opacity-40">#</h2>
          <div className="relative z-10 space-y-12">
            <div>
              <p className="text-slate-300 text-[11px] font-black uppercase tracking-widest mb-3">Statement Number</p>
              <p className="text-6xl font-light italic tracking-tighter text-slate-900 leading-none">#{invoice.invoiceNumber}</p>
            </div>
            <div className="flex gap-20 text-[11px] uppercase tracking-[0.4em] font-black justify-end">
              <div className="space-y-2"><p className="text-slate-200">Dated</p><p className="text-slate-900 border-b border-slate-900 pb-1">{invoice.date}</p></div>
              <div className="space-y-2"><p className="text-slate-200">Settlement</p><p className="text-red-900 border-b border-red-900 pb-1">{invoice.dueDate}</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Delicate Table - FLEX GROW */}
      <div className="flex-1 relative z-10">
        <div className="grid grid-cols-12 border-b-2 border-slate-800 py-6 mb-12 text-[12px] font-sans font-black uppercase tracking-[0.5em] text-slate-300">
          <div className="col-span-8">Description of Services Rendered</div>
          <div className="col-span-4 text-right">Net Value</div>
        </div>
        <div className="space-y-6">
          {groupedItems.map((group, idx) => (
            <div key={idx} className="grid grid-cols-12 py-12 border-b border-slate-50 items-center group transition-all hover:bg-white/50">
              <div className="col-span-8">
                <p className="text-4xl font-light tracking-[0.2em] leading-none mb-6 uppercase italic text-slate-900">{group[0].bookingNo}</p>
                <div className="flex gap-8 font-sans text-[11px] text-slate-400 font-black uppercase tracking-[0.4em]">
                  {group.map(u => (
                    <span key={u.id} className="relative group/unit">
                      {u.reeferNumber}
                      <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-slate-400 transition-all group-hover/unit:w-full"></span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="col-span-4 text-right font-light text-5xl tracking-tighter text-slate-900 italic">
                {formatCurrency(group.reduce((a,c)=>a+c.rateValue,0), invoice.currency)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Elegant Footer - MT AUTO */}
      <div className="mt-auto relative z-10 font-sans border-t-[1px] border-slate-200 pt-20">
        <div className="grid grid-cols-12 gap-20 items-end">
          <div className="col-span-7 space-y-12">
            <div className="p-10 border border-slate-100 bg-white italic rounded-3xl">
              <p className="text-[12px] font-serif text-slate-500 leading-loose">
                "We appreciate the opportunity to be of service to Nile Fleet Logistics' esteemed partners. All transactions are handled with the utmost professional discretion and logistical excellence."
              </p>
            </div>
            <SignatureBlock label="Authorized Signatory Representative" isDark={false} />
          </div>
          <div className="col-span-5 text-right space-y-10 pb-4">
            <div className="space-y-4">
              <p className="text-[12px] font-black text-slate-200 uppercase tracking-[0.6em] italic">Total Balance Owed</p>
              <p className="text-[140px] font-light font-serif tracking-tighter leading-[0.7] text-slate-900 -mr-12">
                {formatCurrency(invoice.total, invoice.currency).replace('EGP', '')}
              </p>
              <p className="text-3xl font-light uppercase tracking-[0.3em] text-slate-400 mr-2">Egyptian Pounds</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const getLayout = () => {
    switch (theme) {
      case 'brutalist':
      case 'industrial':
      case 'urban-street':
      case 'high-contrast':
      case 'technical-draft':
      case 'blueprint':
        return renderIndustrialBold();

      case 'elegant':
      case 'royal':
      case 'luxury-gold':
      case 'modern-serif':
      case 'pastel-dream':
      case 'vintage':
      case 'soft-clay':
        return renderElegantSerif();

      default:
        return renderModernClassic();
    }
  };

  return (
    <div className="invoice-container shadow-2xl bg-white relative print:m-0 print:shadow-none print:border-none">
      {getLayout()}
    </div>
  );
};

export default InvoiceDocument;
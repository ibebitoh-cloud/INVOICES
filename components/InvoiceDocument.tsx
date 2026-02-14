import React, { useMemo } from 'react';
import { Invoice, Booking, TemplateFields, InvoiceTheme } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  ShieldCheck, Briefcase, Award, Boxes, Anchor, Landmark, Scale, Clock, Banknote, ShieldAlert,
  Truck, MapPin, Package, Grid, Layout, List, Layers, CornerDownRight, Minus, Square
} from 'lucide-react';

interface InvoiceDocumentProps {
  invoice: Invoice;
}

interface ThemeConfig {
  accent: string;
  secondary: string;
  bg: string;
  text: string;
  border: string;
  font: string;
  radius: string;
  layout: 'classic' | 'modern' | 'industrial' | 'split' | 'minimal' | 'sidebar' | 'bold';
  tableStyle: 'grid' | 'clean' | 'striped' | 'heavy' | 'glass';
  headerStyle: 'standard' | 'centered' | 'badge' | 'sidebar';
}

const getThemeConfig = (theme: InvoiceTheme): ThemeConfig => {
  const configs: Record<string, Partial<ThemeConfig>> = {
    'logistics-grid': { 
      accent: 'bg-emerald-600', secondary: 'text-emerald-700', bg: 'bg-white', border: 'border-slate-900', 
      font: 'font-sans', radius: 'rounded-none', layout: 'classic', tableStyle: 'heavy', headerStyle: 'standard' 
    },
    'corporate': { 
      accent: 'bg-slate-900', secondary: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200', 
      font: 'font-sans', radius: 'rounded-lg', layout: 'classic', tableStyle: 'clean', headerStyle: 'standard' 
    },
    'technical-draft': { 
      accent: 'bg-slate-700', secondary: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-300', 
      font: 'font-mono-jb', radius: 'rounded-none', layout: 'industrial', tableStyle: 'grid', headerStyle: 'standard' 
    },
    'minimalist': { 
      accent: 'bg-zinc-200', secondary: 'text-zinc-400', bg: 'bg-white', border: 'border-transparent', 
      font: 'font-sans', radius: 'rounded-full', layout: 'minimal', tableStyle: 'clean', headerStyle: 'centered' 
    },
    'industrial': { 
      accent: 'bg-yellow-500', secondary: 'text-yellow-600', bg: 'bg-white', border: 'border-black', 
      font: 'font-bebas', radius: 'rounded-none', layout: 'industrial', tableStyle: 'heavy', headerStyle: 'standard' 
    },
    'elegant': { 
      accent: 'bg-stone-800', secondary: 'text-stone-500', bg: 'bg-[#fdfdfd]', border: 'border-stone-100', 
      font: 'font-serif-bask', radius: 'rounded-[3rem]', layout: 'split', tableStyle: 'clean', headerStyle: 'centered' 
    },
    'blueprint': { 
      accent: 'bg-blue-600', secondary: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', 
      font: 'font-mono-jb', radius: 'rounded-sm', layout: 'industrial', tableStyle: 'grid', headerStyle: 'standard' 
    },
    'glass': { 
      accent: 'bg-blue-400', secondary: 'text-blue-600', bg: 'bg-blue-50/50', border: 'border-white', 
      font: 'font-sans', radius: 'rounded-3xl', layout: 'modern', tableStyle: 'glass', headerStyle: 'standard' 
    },
    'royal': { 
      accent: 'bg-purple-900', secondary: 'text-purple-600', bg: 'bg-white', border: 'border-purple-100', 
      font: 'font-playfair', radius: 'rounded-xl', layout: 'split', tableStyle: 'clean', headerStyle: 'standard' 
    },
    'midnight-pro': { 
      accent: 'bg-emerald-500', secondary: 'text-emerald-400', bg: 'bg-slate-950', border: 'border-white/5', 
      font: 'font-sans', radius: 'rounded-[2rem]', layout: 'modern', tableStyle: 'glass', headerStyle: 'standard' 
    },
    'swiss-modern': { 
      accent: 'bg-red-600', secondary: 'text-black', bg: 'bg-white', border: 'border-black', 
      font: 'font-grotesk', radius: 'rounded-none', layout: 'bold', tableStyle: 'heavy', headerStyle: 'centered' 
    },
    'brutalist': { 
      accent: 'bg-zinc-900', secondary: 'text-black', bg: 'bg-white', border: 'border-black border-4', 
      font: 'font-bebas', radius: 'rounded-none', layout: 'bold', tableStyle: 'heavy', headerStyle: 'standard' 
    },
    'deep-ocean': { 
      accent: 'bg-blue-900', secondary: 'text-blue-400', bg: 'bg-blue-950', border: 'border-white/10', 
      font: 'font-sans', radius: 'rounded-3xl', layout: 'modern', tableStyle: 'glass', headerStyle: 'standard' 
    },
  };

  const base = configs[theme] || configs['logistics-grid'];
  return {
    accent: base.accent!,
    secondary: base.secondary!,
    bg: base.bg!,
    text: base.text || (theme.includes('midnight') || theme.includes('deep') ? 'text-white' : 'text-slate-900'),
    border: base.border!,
    font: base.font!,
    radius: base.radius || 'rounded-none',
    layout: base.layout || 'classic',
    tableStyle: base.tableStyle || 'clean',
    headerStyle: base.headerStyle || 'standard'
  };
};

const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice }) => {
  if (!invoice || !invoice.userProfile) return null;

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
  const themeName = config.theme || 'logistics-grid';
  const t = getThemeConfig(themeName);
  const profile = invoice.userProfile;
  const isDark = themeName === 'midnight-pro' || themeName === 'deep-ocean';

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

  const firstBooking = invoice.items[0];

  const WatermarkLayer = () => {
    if (!fields.showWatermark || !profile.watermarkUrl) return null;
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none">
        <img src={profile.watermarkUrl} style={{ opacity: profile.watermarkOpacity || 0.05, transform: 'rotate(-25deg)', width: '500px', height: '500px', filter: 'grayscale(100%)' }} className="object-contain" alt="" />
      </div>
    );
  };

  const Header = () => {
    if (t.headerStyle === 'centered') {
      return (
        <div className="flex flex-col items-center text-center mb-12 relative z-10 w-full">
          {fields.showLogo && profile.logoUrl && <img src={profile.logoUrl} className="h-24 mb-6 object-contain" />}
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">{profile.companyName}</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Tax ID: {profile.taxId}</p>
          <div className="flex gap-8 mt-8 border-y py-4 w-full border-slate-100">
            <div className="flex-1 text-center">
              <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Invoice Number</span>
              <span className="text-xl font-black">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex-1 text-center border-x border-slate-100 px-4">
              <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Issue Date</span>
              <span className="text-sm font-bold">{invoice.date}</span>
            </div>
            <div className="flex-1 text-center">
              <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Due Date</span>
              <span className="text-sm font-black text-red-600 underline">{invoice.dueDate}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-between items-start mb-10 relative z-10 w-full">
        <div className="flex-1">
          {fields.showLogo && profile.logoUrl && <img src={profile.logoUrl} className="h-20 mb-6 object-contain" />}
          <h1 className="text-3xl font-black uppercase tracking-tighter leading-none mb-3">{profile.companyName}</h1>
          <div className="flex items-center gap-3">
             <div className={`h-1 w-12 ${t.accent}`}></div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">TAX ID: {profile.taxId}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-6xl font-black uppercase tracking-tighter opacity-10 absolute -top-4 right-0 select-none">INVOICE</p>
          <div className="relative pt-6">
            <p className="text-2xl font-black uppercase tracking-tighter italic">No: <span className={t.secondary}>#{invoice.invoiceNumber}</span></p>
            <div className="mt-4 text-[10px] font-black space-y-1 uppercase opacity-50 tracking-[0.2em]">
              <p>Issue Date <span className={`ml-4 ${t.text}`}>{invoice.date}</span></p>
              <p>Due Date <span className="ml-4 text-red-600 underline">{invoice.dueDate}</span></p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Parties = () => {
    return (
      <div className={`grid grid-cols-2 gap-12 mb-10 relative z-10 py-8 border-y w-full ${isDark ? 'border-white/10' : 'border-slate-100'} ${t.layout === 'split' ? 'items-start' : 'items-stretch'}`}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${t.radius} text-white ${t.accent}`}><Anchor size={14}/></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Service Provider</p>
          </div>
          <p className="text-[12px] font-bold leading-relaxed whitespace-pre-wrap pl-2 max-w-xs">{profile.address}</p>
        </div>
        
        <div className="text-right space-y-6">
          <div className="flex items-center gap-3 justify-end">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Client Details</p>
            <div className={`p-2 ${t.radius} text-white ${t.accent}`}><Briefcase size={14}/></div>
          </div>
          <div className="pr-2 space-y-5">
            <div>
              <p className="text-2xl font-black uppercase mb-1 leading-none tracking-tighter">{invoice.customerName}</p>
              <p className="text-[11px] font-medium uppercase leading-relaxed opacity-60 whitespace-pre-wrap">{invoice.customerAddress}</p>
            </div>

            <div className="flex flex-col gap-2 mt-4 items-end">
              {fields.showShipperAddress && firstBooking?.shipperAddress && (
                <div className={`w-full max-w-[320px] p-3 border ${t.radius} ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50/50 border-slate-200'} flex items-center justify-between text-right`}>
                  <div className={`p-1.5 ${isDark ? 'bg-white/10' : 'bg-white'} rounded-lg shadow-sm text-slate-400`}><Package size={12}/></div>
                  <div className="flex-1 px-3 overflow-hidden">
                    <span className="text-[8px] font-black text-slate-300 uppercase block tracking-widest mb-0.5">Shipper Info</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase leading-tight truncate block">{firstBooking.shipperAddress}</span>
                  </div>
                </div>
              )}
              {fields.showTrucker && firstBooking?.trucker && (
                <div className={`w-full max-w-[320px] p-3 border ${t.radius} ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50/50 border-slate-200'} flex items-center justify-between text-right`}>
                  <div className={`p-1.5 ${isDark ? 'bg-white/10' : 'bg-white'} rounded-lg shadow-sm text-slate-400`}><Truck size={12}/></div>
                  <div className="flex-1 px-3 overflow-hidden">
                    <span className="text-[8px] font-black text-slate-300 uppercase block tracking-widest mb-0.5">Carrier Service</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase leading-tight truncate block">{firstBooking.trucker}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Table = () => {
    const tableHeaderClass = `py-4 px-3 text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-emerald-500' : 'text-slate-400'}`;
    const rowBorder = isDark ? 'border-white/5' : 'border-slate-100';
    
    return (
      <div className="flex-1 w-full relative z-10 py-6 overflow-hidden">
        <table className={`w-full text-left table-auto border-collapse ${t.tableStyle === 'grid' ? 'border' : ''} ${t.tableStyle === 'heavy' ? 'border-t-4 border-slate-950' : ''}`}>
          <thead className={t.tableStyle === 'striped' ? 'bg-slate-50' : ''}>
            <tr className={`border-b ${isDark ? 'border-white/20' : 'border-slate-950'}`}>
              <th className={`${tableHeaderClass} w-[60%] pl-4`}>Description of Logistics Operations</th>
              <th className={`${tableHeaderClass} w-[40%] text-right pr-4`}>Line Valuation</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${rowBorder}`}>
            {groupedItems.map((group, idx) => (
              <tr key={idx} className={t.tableStyle === 'striped' && idx % 2 === 0 ? 'bg-slate-50/50' : ''}>
                <td className="py-8 pl-4 align-top">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-1.5 h-12 rounded-full ${t.accent} shadow-lg shadow-current/20`}></div>
                    <div>
                      <p className={`font-black text-2xl uppercase tracking-tighter mb-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{group[0].bookingNo}</p>
                      <p className={`text-[9px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Ref / Job ID</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-6">
                    {group.map(u => (
                      <div key={u.id} className={`flex items-center gap-2 text-[10px] font-black border px-3 py-2 ${t.radius} shadow-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-100 text-slate-700'}`}>
                        <Square size={12} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />
                        <span className="font-mono-jb uppercase">{u.reeferNumber}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="py-8 pr-4 text-right align-top">
                  <p className={`text-3xl font-black tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatCurrency(group.reduce((a,c)=>a+c.rateValue,0), invoice.currency)}
                  </p>
                  <p className={`text-[9px] font-bold uppercase mt-2 tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Operational Fee</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const Footer = () => {
    const subLabelColor = isDark ? 'text-slate-500' : 'text-slate-400';
    
    return (
      <div className={`mt-auto space-y-8 pt-8 border-t-2 w-full relative z-10 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-7 flex flex-col gap-6">
            <div className={`p-6 ${t.radius} border w-full ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
              <p className={`text-[10px] font-black uppercase mb-4 flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-slate-900'}`}>
                <Scale size={14} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} /> Terms & Regulatory Compliance
              </p>
              <div className={`grid grid-cols-1 gap-3 text-[10px] leading-relaxed`}>
                <div className="flex gap-3 items-start"><Clock size={12} className="shrink-0 mt-0.5 opacity-50" /><p><span className="font-black text-slate-900 uppercase mr-1">Settlement:</span> Due by <span className="font-black text-red-600 underline">{invoice.dueDate}</span>.</p></div>
                <div className="flex gap-3 items-start"><ShieldAlert size={12} className="shrink-0 mt-0.5 opacity-50" /><p><span className="font-black text-slate-900 uppercase mr-1">Compliance:</span> Standard carrier liability applies.</p></div>
              </div>
            </div>
            
            <div className={`p-6 ${t.radius} border flex items-center gap-6 w-full ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'}`}>
              <div className={`p-4 rounded-2xl ${t.accent} text-white shadow-lg`}><Landmark size={24} /></div>
              <div className="flex-1">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${subLabelColor}`}>Bank Remittance Details</p>
                <p className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.companyName}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Accepting: Bankwire, EFT, Corporate Check</p>
              </div>
            </div>
          </div>
          
          <div className="col-span-5 flex flex-col justify-end gap-8">
            <div className={`p-8 ${t.radius} space-y-5 border-b-8 w-full bg-transparent ${isDark ? 'border-emerald-500/30' : 'border-slate-200 border-b-emerald-600 shadow-sm'}`}>
              <div className={`flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'opacity-40 text-white' : 'text-slate-400'}`}>
                <span>Net Subtotal</span>
                <span className={isDark ? 'text-white' : 'text-slate-900'}>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {fields.showVat && (
                <div className={`flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'opacity-40 text-white' : 'text-slate-400'}`}>
                  <span>VAT (14%)</span>
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>{formatCurrency(invoice.tax, invoice.currency)}</span>
                </div>
              )}
              <div className={`pt-6 border-t flex flex-col items-end gap-1 ${isDark ? 'border-white/10' : 'border-slate-900'}`}>
                <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>FINAL BALANCE DUE</span>
                <span className={`text-4xl font-black tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatCurrency(invoice.total, invoice.currency)}
                </span>
              </div>
            </div>
            
            <div className={`pt-4 border-t border-dashed w-full ${isDark ? 'border-white/20' : 'border-slate-300'}`}>
               <p className="text-[9px] font-black uppercase mb-1 text-slate-400">Authorized Signature</p>
               <div className={`h-16 w-full max-w-[220px] border-b flex items-end pb-1 ${isDark ? 'border-white/30' : 'border-slate-900'}`}>
                 {profile.signatureUrl && <img src={profile.signatureUrl} className={`max-h-full max-w-full object-contain ${!isDark ? 'mix-blend-multiply' : 'brightness-200'}`} alt="signature" />}
               </div>
               <p className={`text-[11px] font-black uppercase mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.name}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`invoice-container shadow-2xl relative print:p-0 p-[15mm] ${t.bg} ${t.font} ${t.text}`}>
      <WatermarkLayer />
      <Header />
      <Parties />
      <Table />
      <Footer />
    </div>
  );
};

export default InvoiceDocument;
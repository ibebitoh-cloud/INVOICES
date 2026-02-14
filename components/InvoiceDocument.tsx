import React, { useMemo } from 'react';
import { Invoice, Booking, TemplateFields, InvoiceTheme } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  ShieldCheck, Table as TableIcon, Layout, Terminal, Feather, Droplets, 
  HardHat, DraftingCompass, Wind, Activity, Briefcase, Award,
  Cloud, Leaf, Sun, Contrast, Waves, Heart, Gem, Map as MapPinIcon, StickyNote,
  Newspaper, Rainbow, List, Type, ScrollText, Square, Grid3X3,
  Boxes, Anchor, Landmark, Scale, Clock, Banknote, ShieldAlert,
  Truck, MapPin, User
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
  headerStyle: string;
  tableHeader: string;
  tableRow: string;
}

const getThemeConfig = (theme: InvoiceTheme): ThemeConfig => {
  const configs: Record<string, Partial<ThemeConfig>> = {
    'logistics-grid': { accent: 'bg-emerald-600', text: 'text-slate-900', bg: 'bg-white', border: 'border-slate-100', font: 'font-sans' },
    'corporate': { accent: 'bg-slate-900', text: 'text-slate-900', bg: 'bg-white', border: 'border-slate-200', font: 'font-sans' },
    'technical-draft': { accent: 'bg-slate-700', text: 'text-slate-800', bg: 'bg-slate-50', border: 'border-slate-300', font: 'font-mono' },
    'minimalist': { accent: 'bg-zinc-200', text: 'text-zinc-800', bg: 'bg-white', border: 'border-transparent', font: 'font-sans' },
    'industrial': { accent: 'bg-yellow-500', text: 'text-black', bg: 'bg-white', border: 'border-black', font: 'font-mono' },
    'elegant': { accent: 'bg-stone-800', text: 'text-stone-900', bg: 'bg-[#fdfdfd]', border: 'border-stone-100', font: 'font-serif' },
    'blueprint': { accent: 'bg-blue-600', text: 'text-blue-900', bg: 'bg-blue-50', border: 'border-blue-200', font: 'font-mono' },
    'glass': { accent: 'bg-blue-400', text: 'text-blue-900', bg: 'bg-blue-50/50', border: 'border-white', font: 'font-sans' },
    'royal': { accent: 'bg-purple-900', text: 'text-slate-900', bg: 'bg-white', border: 'border-purple-100', font: 'font-serif' },
    'modern-cards': { accent: 'bg-red-500', text: 'text-slate-900', bg: 'bg-slate-50', border: 'border-white', font: 'font-grotesk' },
    'midnight-pro': { accent: 'bg-emerald-500', text: 'text-white', bg: 'bg-slate-950', border: 'border-white/5', font: 'font-sans' },
    'sidebar-pro': { accent: 'bg-indigo-600', text: 'text-slate-900', bg: 'bg-white', border: 'border-slate-100', font: 'font-sans' },
    'neon-glow': { accent: 'bg-cyan-400', text: 'text-cyan-50', bg: 'bg-slate-900', border: 'border-cyan-500/30', font: 'font-mono' },
    'swiss-modern': { accent: 'bg-red-600', text: 'text-black', bg: 'bg-white', border: 'border-black', font: 'font-sans font-bold' },
    'brutalist': { accent: 'bg-zinc-900', text: 'text-black', bg: 'bg-white', border: 'border-black border-4', font: 'font-sans font-black' },
    'vintage': { accent: 'bg-amber-800', text: 'text-amber-950', bg: 'bg-amber-50', border: 'border-amber-200', font: 'font-serif' },
    'soft-clay': { accent: 'bg-rose-400', text: 'text-rose-950', bg: 'bg-rose-50', border: 'border-rose-200', font: 'font-sans' },
    'eco-green': { accent: 'bg-green-600', text: 'text-green-950', bg: 'bg-green-50', border: 'border-green-200', font: 'font-sans' },
    'sunset-vibe': { accent: 'bg-orange-500', text: 'text-orange-950', bg: 'bg-orange-50', border: 'border-orange-200', font: 'font-sans' },
    'high-contrast': { accent: 'bg-black', text: 'text-black', bg: 'bg-white', border: 'border-black border-8', font: 'font-sans' },
    'deep-ocean': { accent: 'bg-blue-900', text: 'text-white', bg: 'bg-blue-950', border: 'border-white/10', font: 'font-sans' },
    'pastel-dream': { accent: 'bg-pink-300', text: 'text-pink-950', bg: 'bg-pink-50', border: 'border-pink-200', font: 'font-sans' },
    'luxury-gold': { accent: 'bg-yellow-600', text: 'text-slate-900', bg: 'bg-white', border: 'border-yellow-100', font: 'font-serif' },
    'urban-street': { accent: 'bg-slate-600', text: 'text-slate-900', bg: 'bg-slate-50', border: 'border-slate-300', font: 'font-sans' },
    'paper-texture': { accent: 'bg-orange-200', text: 'text-stone-800', bg: 'bg-[#faf7f2]', border: 'border-stone-200', font: 'font-serif' },
    'monochrome': { accent: 'bg-zinc-800', text: 'text-black', bg: 'bg-white', border: 'border-zinc-200', font: 'font-sans' },
    'vivid-spectrum': { accent: 'bg-indigo-600', text: 'text-slate-900', bg: 'bg-white', border: 'border-indigo-100', font: 'font-sans' },
    'classic-ledger': { accent: 'bg-teal-700', text: 'text-teal-950', bg: 'bg-white', border: 'border-teal-100', font: 'font-serif' },
    'modern-serif': { accent: 'bg-stone-900', text: 'text-stone-900', bg: 'bg-white', border: 'border-stone-200', font: 'font-serif' },
    'compact-list': { accent: 'bg-sky-600', text: 'text-slate-900', bg: 'bg-white', border: 'border-slate-100', font: 'font-sans' },
  };

  const base = configs[theme] || configs['logistics-grid'];
  return {
    accent: base.accent!,
    secondary: base.accent!.replace('bg-', 'text-'),
    bg: base.bg!,
    text: base.text!,
    border: base.border!,
    font: base.font!,
    headerStyle: 'mb-8 w-full',
    tableHeader: 'py-3 px-3 text-[10px] font-black uppercase tracking-widest',
    tableRow: 'py-6 px-3'
  };
};

const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice }) => {
  if (!invoice || !invoice.userProfile) {
    return <div className="p-8 text-red-500 bg-white border border-red-200 rounded-lg">Missing invoice data or profile.</div>;
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
  const themeName = config.theme || 'logistics-grid';
  const t = getThemeConfig(themeName);
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
            width: '450px',
            height: '450px',
            filter: 'grayscale(100%)'
          }} 
          className="object-contain" 
          alt="" 
        />
      </div>
    );
  };

  const SignatureBlock = ({ label, isDark = false }: { label: string, isDark?: boolean }) => (
    <div className={`pt-4 border-t border-dashed w-full ${isDark ? 'border-white/20' : 'border-slate-300'}`}>
       <p className={`text-[9px] font-black uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{label}</p>
       <div className={`h-16 w-full max-w-[200px] border-b flex items-end pb-1 ${isDark ? 'border-white/30' : 'border-slate-900'}`}>
         {profile.signatureUrl && <img src={profile.signatureUrl} className={`max-h-full max-w-full object-contain ${!isDark ? 'mix-blend-multiply' : 'brightness-200'}`} alt="signature" />}
       </div>
       <p className={`text-[11px] font-black uppercase mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.name}</p>
    </div>
  );

  const TermsAndConditions = () => {
    const isDark = themeName === 'midnight-pro' || themeName === 'deep-ocean';
    return (
      <div className={`p-6 rounded-2xl border w-full ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
        <p className={`text-[10px] font-black uppercase mb-4 flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-slate-900'}`}>
          <Scale size={14} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} /> Terms & Regulatory Compliance
        </p>
        <div className={`grid grid-cols-1 gap-4 text-[10px] leading-relaxed`}>
          <div className="flex gap-3 items-start">
            <Clock size={14} className="shrink-0 mt-0.5 opacity-50" />
            <p><span className="font-black text-slate-900 uppercase tracking-tighter mr-1">Settlement:</span> Due by <span className="font-black text-red-600 underline">{invoice.dueDate}</span>.</p>
          </div>
          <div className="flex gap-3 items-start">
            <ShieldAlert size={14} className="shrink-0 mt-0.5 opacity-50" />
            <p><span className="font-black text-slate-900 uppercase tracking-tighter mr-1">7-Day Rule:</span> Binding if no report in 7 days.</p>
          </div>
          <div className="flex gap-3 items-start">
            <Banknote size={14} className="shrink-0 mt-0.5 opacity-50" />
            <p><span className="font-black text-slate-900 uppercase tracking-tighter mr-1">Basis:</span> Official Cash-Basis claim.</p>
          </div>
        </div>
      </div>
    );
  };

  const TableLayout = () => {
    const isDark = themeName === 'midnight-pro' || themeName === 'deep-ocean';
    return (
      <div className="flex-1 w-full relative z-10 py-6">
        <table className="w-full text-left table-auto border-collapse">
          <thead>
            <tr className={`border-b-2 ${isDark ? 'border-emerald-500' : 'border-slate-900'}`}>
              <th className={`py-4 px-3 text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-emerald-500' : 'text-slate-400'} w-[65%]`}>Description & Operations</th>
              <th className={`py-4 px-3 text-right text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-emerald-500' : 'text-slate-400'} w-[35%]`}>Valuation</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
            {groupedItems.map((group, idx) => (
              <tr key={idx} className={`group hover:bg-slate-500/5 transition-colors`}>
                <td className="py-8 px-3 align-top">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-1.5 h-10 rounded-full ${t.accent}`}></div>
                    <div>
                      <p className={`font-black text-2xl uppercase tracking-tighter mb-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{group[0].bookingNo}</p>
                      <p className={`text-[9px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Service Reference</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-6">
                    {group.map(u => (
                      <div key={u.id} className={`flex items-center gap-2 text-[11px] font-black border px-3 py-1.5 rounded-xl shadow-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-100 text-slate-700'}`}>
                        <Boxes size={12} className={isDark ? 'text-emerald-400' : 'text-emerald-500'} />
                        <span className="font-mono">{u.reeferNumber}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="py-8 px-3 text-right align-top">
                  <p className={`text-3xl font-black tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatCurrency(group.reduce((a,c)=>a+c.rateValue,0), invoice.currency)}
                  </p>
                  <p className={`text-[9px] font-bold uppercase mt-2 tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Line Total</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const FooterLayout = () => {
    const isDark = themeName === 'midnight-pro' || themeName === 'deep-ocean';
    const subLabelColor = isDark ? 'text-slate-500' : 'text-slate-400';

    return (
      <div className={`mt-auto space-y-8 pt-8 border-t-2 w-full relative z-10 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-7 flex flex-col gap-6">
            <TermsAndConditions />
            <div className={`p-6 rounded-3xl border flex items-center gap-6 w-full ${isDark ? 'bg-white/5 border-white/10' : 'bg-transparent border-slate-200'}`}>
              <div className={`p-4 rounded-2xl ${t.accent} text-white`}>
                <Landmark size={24} />
              </div>
              <div className="flex-1">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${subLabelColor}`}>Payment Remittance</p>
                <p className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.companyName}</p>
                <div className="flex items-center gap-4 mt-2">
                   {['Bankwire', 'Cash', 'Check'].map(m => (
                     <span key={m} className={`text-[9px] font-black uppercase border px-2 py-0.5 rounded ${isDark ? 'border-white/20 text-slate-400' : 'border-slate-200 text-slate-500'}`}>{m}</span>
                   ))}
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-5 flex flex-col justify-end gap-8">
            <div className={`p-8 rounded-[2.5rem] space-y-4 border-b-4 w-full ${isDark ? 'bg-white/5 border-emerald-500/30' : 'bg-transparent border-slate-200 border-b-emerald-600'}`}>
              <div className={`flex justify-between items-center text-[11px] font-bold uppercase tracking-[0.3em] ${isDark ? 'opacity-40 text-white' : 'text-slate-400'}`}>
                <span>Net Subtotal</span>
                <span className={isDark ? 'text-white' : 'text-slate-900'}>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {fields.showVat && (
                <div className={`flex justify-between items-center text-[11px] font-bold uppercase tracking-[0.3em] ${isDark ? 'opacity-40 text-white' : 'text-slate-400'}`}>
                  <span>VAT (14%)</span>
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>{formatCurrency(invoice.tax, invoice.currency)}</span>
                </div>
              )}
              <div className={`pt-6 border-t flex flex-col items-end gap-1 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                <span className={`text-[11px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>TOTAL DUE</span>
                <span className={`text-3xl font-black tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatCurrency(invoice.total, invoice.currency)}
                </span>
              </div>
            </div>
            <SignatureBlock label="Official Authorization" isDark={isDark} />
          </div>
        </div>
      </div>
    );
  };

  const firstBooking = invoice.items[0];

  return (
    <div className={`invoice-container shadow-2xl relative print:m-0 print:shadow-none print:border-none p-[15mm] ${t.bg} ${t.font} ${t.text}`}>
      <WatermarkLayer />
      
      {/* Header */}
      <div className="flex justify-between items-start mb-10 relative z-10 w-full">
        <div className="flex-1">
          {fields.showLogo && profile.logoUrl && <img src={profile.logoUrl} className="h-20 mb-6 object-contain" />}
          <h1 className="text-3xl font-black uppercase tracking-tighter leading-none mb-3">{profile.companyName}</h1>
          <div className="flex items-center gap-3">
             <div className={`h-0.5 w-16 rounded-full ${t.accent}`}></div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">TAX ID: {profile.taxId}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <h2 className={`text-7xl font-black leading-none mb-4 select-none opacity-5 tracking-tighter absolute top-0 right-0 -z-10`}>INVOICE</h2>
          <div className="relative z-10 space-y-3">
            <p className="text-xl font-black uppercase tracking-tighter italic">No: <span className={t.secondary}>#{invoice.invoiceNumber}</span></p>
            <div className="text-[10px] font-black space-y-1 uppercase opacity-50 tracking-[0.2em]">
              <p>Issue Date <span className={`ml-4 ${t.text}`}>{invoice.date}</span></p>
              <p>Due Date <span className="ml-4 text-red-600 underline">{invoice.dueDate}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Parties */}
      <div className={`grid grid-cols-2 gap-12 mb-10 relative z-10 py-8 border-y w-full ${themeName === 'midnight-pro' ? 'border-white/10' : 'border-slate-100'}`}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl text-white ${t.accent}`}><Anchor size={14}/></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Provider Details</p>
          </div>
          <p className="text-[12px] font-bold leading-relaxed whitespace-pre-wrap pl-2 max-w-sm">{profile.address}</p>
        </div>
        
        <div className="text-right space-y-6">
          <div className="flex items-center gap-3 justify-end">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Client Details</p>
            <div className={`p-2 rounded-xl text-white ${t.accent}`}><Briefcase size={14}/></div>
          </div>
          <div className="pr-2 space-y-5">
            <div>
              <p className="text-2xl font-black uppercase mb-1 leading-none tracking-tighter">{invoice.customerName}</p>
              <p className="text-[12px] font-medium uppercase leading-relaxed opacity-60 whitespace-pre-wrap">{invoice.customerAddress}</p>
            </div>

            {/* Additional Info Cells: Shipper and Trucker */}
            <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-50 mt-4">
              {fields.showShipperAddress && firstBooking?.shipperAddress && (
                <div className="flex items-start justify-end gap-3 text-right">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Shipper Info</span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase leading-tight whitespace-pre-wrap">{firstBooking.shipperAddress}</span>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded-lg text-slate-300"><MapPin size={12}/></div>
                </div>
              )}
              {fields.showTrucker && firstBooking?.trucker && (
                <div className="flex items-start justify-end gap-3 text-right">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Carrier Details</span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase leading-tight">{firstBooking.trucker}</span>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded-lg text-slate-300"><Truck size={12}/></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TableLayout />
      <FooterLayout />
    </div>
  );
};

export default InvoiceDocument;
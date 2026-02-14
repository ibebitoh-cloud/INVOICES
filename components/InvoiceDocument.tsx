import React, { useMemo } from 'react';
import { Invoice, Booking, TemplateFields, InvoiceTheme } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  ShieldCheck, Briefcase, Award, Boxes, Anchor, Landmark, Scale, Clock, Banknote, ShieldAlert,
  Truck, MapPin, Package, Grid, Layout, List, Layers, CornerDownRight, Minus, Square, ArrowRight,
  Info, Shield, Heart, Zap, Sparkles, Users, Smartphone, FileText
} from 'lucide-react';

interface InvoiceDocumentProps {
  invoice: Invoice;
  isActivePrint?: boolean;
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

const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice, isActivePrint }) => {
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
        <div className="flex flex-col items-center text-center mb-4 relative z-10 w-full shrink-0">
          {fields.showLogo && profile.logoUrl && <img src={profile.logoUrl} className="h-20 mb-3 object-contain" />}
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">{profile.companyName}</h1>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Sherif Hegazy</p>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mt-2">Tax ID: {profile.taxId}</p>
          <div className="flex gap-6 mt-6 border-y-2 py-4 w-full border-slate-100">
            <div className="flex-1 text-center">
              <span className="text-xs font-black text-slate-400 uppercase block mb-1">Invoice Number</span>
              <span className="text-2xl font-black tracking-tight">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex-1 text-center border-x-2 border-slate-100 px-4">
              <span className="text-xs font-black text-slate-400 uppercase block mb-1">Issue Date</span>
              <span className="text-lg font-bold">{invoice.date}</span>
            </div>
            <div className="flex-1 text-center">
              <span className="text-xs font-black text-slate-400 uppercase block mb-1">Due Date</span>
              <span className="text-lg font-black text-red-600 underline decoration-2">{invoice.dueDate}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-between items-start mb-6 relative z-10 w-full shrink-0">
        <div className="flex-1">
          {fields.showLogo && profile.logoUrl && <img src={profile.logoUrl} className="h-20 mb-3 object-contain" />}
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">{profile.companyName}</h1>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60">Sherif Hegazy</p>
          </div>
          <div className="flex items-center gap-4 mt-3">
             <div className={`h-1.5 w-12 ${t.accent}`}></div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">TAX ID: {profile.taxId}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-7xl font-black uppercase tracking-tighter opacity-10 absolute -top-4 right-0 select-none">INVOICE</p>
          <div className="relative pt-6">
            <p className="text-3xl font-black uppercase tracking-tighter italic">No: <span className={t.secondary}>#{invoice.invoiceNumber}</span></p>
            <div className="mt-4 text-sm font-black space-y-2 uppercase opacity-60 tracking-[0.2em]">
              <p>Issue Date <span className={`ml-6 ${t.text} font-black`}>{invoice.date}</span></p>
              <p>Due Date <span className="ml-6 text-red-600 font-black underline decoration-2">{invoice.dueDate}</span></p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Parties = () => {
    return (
      <div className={`grid grid-cols-2 gap-10 mb-6 relative z-10 py-6 border-y-2 w-full shrink-0 ${isDark ? 'border-white/10' : 'border-slate-100'} ${t.layout === 'split' ? 'items-start' : 'items-stretch'}`}>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={`p-2 ${t.radius} text-white ${t.accent}`}><Anchor size={18}/></div>
            <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40">Service Provider</p>
          </div>
          <p className="text-base font-bold leading-relaxed whitespace-pre-wrap pl-3 max-w-sm">{profile.address}</p>
        </div>
        
        <div className="text-right space-y-6">
          <div className="flex items-center gap-4 justify-end">
            <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40">Client Details</p>
            <div className={`p-2 ${t.radius} text-white ${t.accent}`}><Briefcase size={18}/></div>
          </div>
          <div className="pr-3 space-y-4">
            <div>
              <p className="text-3xl font-black uppercase mb-2 leading-none tracking-tighter">{invoice.customerName}</p>
              <p className="text-sm font-medium uppercase leading-relaxed opacity-60 whitespace-pre-wrap">{invoice.customerAddress}</p>
            </div>

            <div className="flex flex-col gap-2.5 mt-4 items-end">
              {fields.showShipperAddress && firstBooking?.shipperAddress && (
                <div className={`w-full max-w-[360px] p-3 border-2 ${t.radius} ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50/50 border-slate-200'} flex items-center justify-between text-right`}>
                  <div className={`p-2 ${isDark ? 'bg-white/10' : 'bg-white'} rounded-lg shadow-sm text-slate-400`}><Package size={16}/></div>
                  <div className="flex-1 px-4 overflow-hidden">
                    <span className="text-[10px] font-black text-slate-300 uppercase block tracking-widest mb-0.5">Shipper Info</span>
                    <span className="text-sm font-black text-slate-900 uppercase block leading-tight truncate mb-0.5">{firstBooking.shipper}</span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase leading-tight block truncate">{firstBooking.shipperAddress}</span>
                  </div>
                </div>
              )}
              {fields.showTrucker && firstBooking?.trucker && (
                <div className={`w-full max-w-[360px] p-3 border-2 ${t.radius} ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50/50 border-slate-200'} flex items-center justify-between text-right`}>
                  <div className={`p-2 ${isDark ? 'bg-white/10' : 'bg-white'} rounded-lg shadow-sm text-slate-400`}><Truck size={16}/></div>
                  <div className="flex-1 px-4 overflow-hidden">
                    <span className="text-[10px] font-black text-slate-300 uppercase block tracking-widest mb-0.5">Carrier Service</span>
                    <span className="text-sm font-bold text-slate-500 uppercase leading-tight truncate block">{firstBooking.trucker}</span>
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
    const tableHeaderClass = `py-5 px-4 text-sm font-black uppercase tracking-[0.2em] ${isDark ? 'text-emerald-500' : 'text-slate-400'}`;
    const rowBorder = isDark ? 'border-white/10' : 'border-slate-100';
    
    return (
      <div className="flex-1 w-full relative z-10 py-4 overflow-hidden">
        <table className={`w-full text-left table-auto border-collapse ${t.tableStyle === 'grid' ? 'border-2' : ''} ${t.tableStyle === 'heavy' ? 'border-t-8 border-slate-950' : ''}`}>
          <thead className={t.tableStyle === 'striped' ? 'bg-slate-50' : ''}>
            <tr className={`border-b-4 ${isDark ? 'border-white/20' : 'border-slate-950'}`}>
              <th className={`${tableHeaderClass} w-[70%] pl-6`}>Logistics & Operational Details</th>
              <th className={`${tableHeaderClass} w-[30%] text-right pr-6`}>Valuation</th>
            </tr>
          </thead>
          <tbody className={`divide-y-2 ${rowBorder}`}>
            {groupedItems.map((group, idx) => (
              <tr key={idx} className={t.tableStyle === 'striped' && idx % 2 === 0 ? 'bg-slate-50/20' : ''}>
                <td className="py-6 pl-6 align-top">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-2 h-12 rounded-full ${t.accent}`}></div>
                    <div>
                      <div className="flex items-baseline gap-4">
                        <p className={`font-black text-3xl uppercase tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{group[0].bookingNo}</p>
                        
                        {/* Port and Clip info */}
                        <div className="flex items-center gap-4 py-1.5 px-4 bg-slate-50 border border-slate-100 rounded-xl shadow-sm">
                          <div className="flex items-center gap-2 text-xs font-black text-slate-600">
                             <span className="text-[9px] opacity-40">FROM</span> <span className="tracking-tight">{group[0].goPort}</span>
                             <ArrowRight size={14} className="text-emerald-500 mx-1" />
                             <span className="text-[9px] opacity-40">TO</span> <span className="tracking-tight">{group[0].giPort}</span>
                          </div>
                          <div className="w-px h-4 bg-slate-200"></div>
                          <div className="flex items-center gap-2 text-xs font-black text-blue-700">
                             <Clock size={12}/> <span className="bg-blue-100/50 px-2 py-0.5 rounded uppercase">{group[0].dateOfClipOn || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 ml-6 mt-2">
                    {group.map(u => (
                      <div key={u.id} className={`flex items-center gap-2 text-xs font-black border-2 px-4 py-2 ${t.radius} shadow-md ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                        <Square size={12} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                        <span className="font-mono-jb uppercase tracking-widest">{u.reeferNumber}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="py-6 pr-6 text-right align-top">
                  <p className={`text-3xl font-black tracking-tighter leading-none mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatCurrency(group.reduce((a,c)=>a+c.rateValue,0), invoice.currency)}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const Footer = () => {
    return (
      <div className={`mt-auto space-y-6 pt-6 border-t-2 w-full relative z-10 shrink-0 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-6 flex flex-col gap-4">
            {/* Nile Fleet Note */}
            <div className={`relative p-5 border-l-4 ${t.accent.replace('bg-', 'border-')} ${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-r-2xl shadow-sm`}>
              <div className="flex items-center gap-3 mb-2">
                <Heart size={14} className={isDark ? 'text-emerald-400' : 'text-rose-500'} />
                <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-emerald-400' : 'text-slate-900'}`}>A Note from Nile Fleet</h4>
              </div>
              <p className={`text-[10px] leading-relaxed font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Thank you for choosing Nile Fleet Company for your Genset rental needs.
              </p>
              <ul className={`space-y-2 text-[9px] leading-relaxed font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <li className="flex gap-2 items-start">
                  <div className={`w-1 h-1 rounded-full mt-1 shrink-0 ${t.accent}`}></div>
                  <p>Settlement required by <span className="font-black text-slate-900 underline">{invoice.dueDate}</span>.</p>
                </li>
              </ul>
            </div>

            {/* Studio Notes - The dynamic notes field */}
            {fields.showNotes && invoice.notes && (
              <div className={`p-5 border-2 ${t.radius} ${isDark ? 'bg-white/5 border-white/10' : 'bg-amber-50/30 border-amber-100'}`}>
                <div className="flex items-center gap-2 mb-2 opacity-60">
                  <FileText size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Operational Remarks</span>
                </div>
                <p className="text-[10px] font-bold leading-relaxed whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </div>
          
          <div className="col-span-6 flex flex-col justify-end">
            <div className={`p-4 border-t-4 flex flex-col items-end gap-1 ${isDark ? 'border-white/20' : 'border-slate-950'}`}>
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>TOTAL DUE</span>
              <span className={`text-4xl font-black tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {formatCurrency(invoice.total, invoice.currency)}
              </span>
            </div>

            {/* Signature Section - Improved visibility */}
            {fields.showSignature && (
              <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col items-end">
                <div className="h-24 w-full flex justify-end items-end relative overflow-visible">
                  {profile.signatureUrl && (
                    <img 
                      src={profile.signatureUrl} 
                      className={`h-32 w-auto max-w-[200px] object-contain mb-[-12px] z-20 pointer-events-none ${!isDark ? 'mix-blend-darken' : 'brightness-125'}`} 
                      alt="Manager Signature" 
                    />
                  )}
                </div>
                <div className="text-right mt-2">
                  <p className={`text-lg font-black uppercase tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.name}</p>
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 mt-1">Authorized Operations Manager</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Brand Signature - Smaller as requested */}
        <div className="pt-4 mt-4 flex flex-col items-center justify-center w-full border-t border-slate-50">
          <p className="text-[7px] font-black uppercase tracking-[0.4em] text-slate-300 italic select-none">
            Powered by <span className="text-slate-400">Bebito</span>
          </p>
          <p className="text-[6px] font-bold tracking-[0.2em] text-slate-300 mt-0.5">+201146475759</p>
        </div>
      </div>
    );
  };

  return (
    <div className={`invoice-container shadow-2xl relative print:p-0 p-[15mm] ${t.bg} ${t.font} ${t.text} ${isActivePrint ? 'active-print' : ''}`}>
      <WatermarkLayer />
      <Header />
      <Parties />
      <Table />
      <Footer />
    </div>
  );
};

export default InvoiceDocument;
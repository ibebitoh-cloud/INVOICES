
import React, { useMemo } from 'react';
import { Invoice, Booking, TemplateFields, InvoiceTheme, CustomTheme } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  Anchor, Briefcase, Clock, Truck, Package, Square, ArrowRight, Heart, FileText, Info
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

const getThemeConfig = (theme: InvoiceTheme, customData?: CustomTheme): ThemeConfig => {
  // If custom data exists, prioritize it
  if (customData) {
    return {
      accent: customData.accent,
      secondary: customData.secondary,
      bg: customData.bg,
      text: customData.text,
      border: customData.border,
      font: customData.font,
      radius: customData.radius,
      layout: customData.layout,
      tableStyle: customData.tableStyle,
      headerStyle: customData.headerStyle,
    };
  }

  const configs: Record<string, Partial<ThemeConfig>> = {
    'logistics-grid': { 
      accent: 'bg-emerald-600', secondary: 'text-emerald-700', bg: 'bg-white', border: 'border-slate-900', 
      font: 'font-sans', radius: 'rounded-none', layout: 'classic', tableStyle: 'heavy', headerStyle: 'standard' 
    },
    'corporate': { 
      accent: 'bg-slate-900', secondary: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200', 
      font: 'font-sans', radius: 'rounded-lg', layout: 'classic', tableStyle: 'clean', headerStyle: 'standard' 
    },
    'luxury-gold': { 
      accent: 'bg-amber-600', secondary: 'text-amber-500', bg: 'bg-slate-950', border: 'border-white/10', 
      font: 'font-serif-bask', radius: 'rounded-none', layout: 'modern', tableStyle: 'clean', headerStyle: 'standard' 
    },
    'vintage': { 
      accent: 'bg-amber-800', secondary: 'text-amber-900', bg: 'bg-[#f4ead5]', border: 'border-amber-900/20', 
      font: 'font-serif-bask', radius: 'rounded-none', layout: 'classic', tableStyle: 'grid', headerStyle: 'standard' 
    },
    'eco-green': { 
      accent: 'bg-emerald-600', secondary: 'text-emerald-800', bg: 'bg-[#f0fdf4]', border: 'border-emerald-100', 
      font: 'font-sans', radius: 'rounded-3xl', layout: 'modern', tableStyle: 'clean', headerStyle: 'standard' 
    },
    'sunset-vibe': { 
      accent: 'bg-gradient-to-r from-orange-500 to-rose-500', secondary: 'text-rose-600', bg: 'bg-orange-50', border: 'border-orange-100', 
      font: 'font-grotesk', radius: 'rounded-2xl', layout: 'modern', tableStyle: 'glass', headerStyle: 'standard' 
    },
    'blueprint': { 
      accent: 'bg-white', secondary: 'text-blue-300', bg: 'bg-blue-800', border: 'border-blue-400', 
      font: 'font-mono-jb', radius: 'rounded-none', layout: 'industrial', tableStyle: 'grid', headerStyle: 'standard' 
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
    text: base.text || (theme.includes('midnight') || theme.includes('deep') || theme === 'luxury-gold' || theme === 'blueprint' ? 'text-white' : 'text-slate-900'),
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
    contentScale: 1.0,
    verticalSpacing: 16,
    horizontalPadding: 15,
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
  const t = getThemeConfig(themeName, config.customThemeData);
  const profile = invoice.userProfile;
  const isDark = themeName === 'midnight-pro' || themeName === 'deep-ocean' || themeName === 'luxury-gold' || themeName === 'blueprint' || (config.customThemeData?.bg.includes('950') || config.customThemeData?.bg.includes('black'));

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
        <img src={profile.watermarkUrl} style={{ opacity: profile.watermarkOpacity || 0.05, transform: 'rotate(-25deg)', width: '350px', height: '350px', filter: 'grayscale(100%)' }} className="object-contain" alt="" />
      </div>
    );
  };

  const spacingStyle = { marginBottom: `${config.verticalSpacing}px` };
  const paddingStyle = { padding: `${config.horizontalPadding}mm` };
  
  const scaleStyle = { 
    transform: `scale(${config.contentScale})`, 
    transformOrigin: 'top center',
    width: `${100 / config.contentScale}%`,
    height: `${100 / config.contentScale}%`
  };

  const Header = () => {
    return (
      <div style={spacingStyle} className="flex justify-between items-start relative z-10 w-full shrink-0">
        <div className="flex-1">
          {fields.showLogo && profile.logoUrl && <img src={profile.logoUrl} className="h-24 mb-4 object-contain" />}
          <div className="space-y-0">
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">{profile.companyName}</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">SHERIF HEGAZY</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black uppercase tracking-tighter opacity-10 absolute -top-2 right-0 select-none">INVOICE</p>
          <div className="relative pt-3">
            <p className="text-2xl font-black uppercase tracking-tighter italic">No: <span className={t.secondary}>#{invoice.invoiceNumber}</span></p>
            <div className="mt-1.5 text-[10px] font-black space-y-0.5 uppercase opacity-60 tracking-[0.2em]">
              {fields.showInvoiceDate && <p>Issue Date <span className={`ml-4 ${t.text} font-black`}>{invoice.date}</span></p>}
              {fields.showDueDate && <p>Due Date <span className="ml-4 text-red-600 font-black underline decoration-2">{invoice.dueDate}</span></p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Parties = () => {
    return (
      <div style={spacingStyle} className={`grid grid-cols-2 gap-10 relative z-10 py-3 border-y-2 w-full shrink-0 ${isDark ? 'border-white/10' : 'border-slate-100'} items-start`}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 ${t.radius} text-white ${t.accent}`}><Anchor size={14}/></div>
            <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40">From</p>
          </div>
          {fields.showCompanyInfo && <p className="text-base font-bold leading-relaxed whitespace-pre-wrap pl-3 max-w-sm">{profile.address}</p>}
        </div>
        
        <div className="text-right space-y-2">
          <div className="flex items-center gap-2 justify-end">
            <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40">To</p>
            <div className={`p-1.5 ${t.radius} text-white ${t.accent}`}><Briefcase size={14}/></div>
          </div>
          <div className="pr-3 space-y-0.5">
            <p className="text-xl font-black uppercase leading-none tracking-tighter">{invoice.customerName}</p>
            {fields.showCustomerAddress && <p className="text-[10px] font-medium uppercase leading-relaxed opacity-60 whitespace-pre-wrap">{invoice.customerAddress}</p>}
          </div>
        </div>
      </div>
    );
  };

  const Table = () => {
    const tableHeaderClass = `py-2.5 px-3 text-[10px] font-black uppercase tracking-[0.1em] ${isDark ? 'text-emerald-500' : 'text-slate-400'}`;
    const rowBorder = isDark ? 'border-white/10' : 'border-slate-100';
    
    return (
      <div className="w-full relative z-10 shrink-0">
        <table className={`w-full text-left table-auto border-collapse ${t.tableStyle === 'grid' ? 'border-2' : ''} ${t.tableStyle === 'heavy' ? 'border-t-8 border-slate-950' : ''}`}>
          <thead>
            <tr className={`border-b-2 ${isDark ? 'border-white/20' : 'border-slate-950'}`}>
              <th className={`${tableHeaderClass} w-[75%] pl-4`}>Operational & Logistics Data</th>
              <th className={`${tableHeaderClass} w-[25%] text-right pr-4`}>Subtotal</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${rowBorder}`}>
            {groupedItems.map((group, idx) => (
              <tr key={idx} className="break-inside-avoid">
                <td className="py-4 pl-4 align-top">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-1 h-5 rounded-full ${t.accent}`}></div>
                    <div className="flex items-center gap-3">
                      {fields.showBookingNo && <p className={`font-black text-sm uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{group[0].bookingNo}</p>}
                      {fields.showPorts && (
                        <div className={`flex items-center gap-2 py-0.5 px-2 rounded-md text-[9px] font-black ${isDark ? 'bg-white/5 border border-white/10 text-slate-300' : 'bg-slate-50 border border-slate-100 text-slate-500'}`}>
                           <span>{group[0].goPort}</span>
                           <ArrowRight size={10} className="text-emerald-500" />
                           <span>{group[0].giPort}</span>
                           <span className="text-slate-200 mx-1">|</span>
                           <span className={`${isDark ? 'text-emerald-400' : 'text-blue-600'} font-mono`}>{group[0].bookingDate || 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {group.map(u => (
                        <div key={u.id} className="group relative">
                          <div className={`text-[10px] font-black border px-2 py-0.5 rounded-sm font-mono-jb flex flex-col ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                            <span>{u.reeferNumber}</span>
                            {fields.showGenset && u.gensetNo !== '---' && <span className="text-[8px] text-emerald-600">GS: {u.gensetNo}</span>}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {fields.showTrucker && group[0].trucker !== '---' && (
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase">
                          <Truck size={12} className="text-slate-300"/>
                          <span>Trucker: <span className={isDark ? 'text-slate-200' : 'text-slate-600'}>{group[0].trucker}</span></span>
                        </div>
                      )}
                      {fields.showShipperAddress && group[0].shipper !== '---' && (
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase">
                          <Package size={12} className="text-slate-300"/>
                          <span>Shipper: <span className={isDark ? 'text-slate-200' : 'text-slate-600'}>{group[0].shipper}</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-4 text-right align-top">
                  <p className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
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

  const Totals = () => {
      return (
        <div className="w-full flex justify-end shrink-0 relative z-10" style={spacingStyle}>
            <div className={`w-1/3 p-3 border-t-2 flex flex-col items-end gap-1 ${isDark ? 'border-white/20' : 'border-slate-950'}`}>
                <div className="flex justify-between w-full text-[9px] font-bold uppercase opacity-60">
                    <span>Subtotal</span>
                    <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                {fields.showVat && (
                    <div className="flex justify-between w-full text-[9px] font-bold uppercase opacity-60">
                        <span>VAT (14%)</span>
                        <span>{formatCurrency(invoice.tax, invoice.currency)}</span>
                    </div>
                )}
                <div className="w-full border-t border-dotted my-1 opacity-20"></div>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>TOTAL PAYABLE</span>
                <span className={`text-2xl font-black tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatCurrency(invoice.total, invoice.currency)}
                </span>
            </div>
        </div>
      );
  }

  const BottomSection = () => {
    return (
      <div className={`mt-auto space-y-6 pt-6 border-t w-full relative z-10 shrink-0 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
        <div className="grid grid-cols-12 gap-6 items-end">
          <div className="col-span-8 flex flex-col gap-3">
            <div className={`p-4 border-l-4 ${t.accent.replace('bg-', 'border-')} ${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-r-xl shadow-sm`}>
              <div className="flex items-center gap-2 mb-1.5">
                <Heart size={14} className={isDark ? 'text-emerald-400' : 'text-rose-500'} />
                <h4 className={`text-[11px] font-black uppercase tracking-[0.1em] ${isDark ? 'text-emerald-400' : 'text-slate-900'}`}>Settlement Note</h4>
              </div>
              <p className={`text-[10px] leading-relaxed font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Thank you for your business! We kindly request full settlement by {invoice.dueDate}. For smooth processing, please include the invoice number in your payment reference.<br/>
                <span className="mt-1 block">We value your feedback, so please review these details within one week of receipt; after this time, the invoice will be considered final and approved. We appreciate your cooperation!</span>
              </p>
            </div>

            {fields.showNotes && invoice.notes && (
              <div className={`p-3 border rounded-xl flex gap-3 items-start ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50/20 border-slate-100'}`}>
                <Info size={14} className="text-slate-300 mt-0.5" />
                <p className="text-[10px] font-bold leading-relaxed whitespace-pre-wrap text-slate-500 italic">{invoice.notes}</p>
              </div>
            )}
          </div>
          
          <div className="col-span-4 flex flex-col gap-4">
            {fields.showSignature && (
              <div className="flex flex-col items-end">
                <div className="h-20 w-full flex justify-end items-end relative overflow-visible">
                  {profile.signatureUrl && (
                    <img 
                      src={profile.signatureUrl} 
                      className={`h-28 w-auto max-w-[180px] object-contain mb-[-12px] z-20 pointer-events-none ${!isDark ? 'mix-blend-darken' : 'brightness-110'}`} 
                      alt="Manager Signature" 
                    />
                  )}
                </div>
                <div className="text-right mt-2">
                  <p className={`text-base font-black uppercase tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.name}</p>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 mt-1">Authorized Operations Manager</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 flex flex-col items-center justify-center w-full border-t border-slate-100 mt-2 opacity-30 select-none">
          <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-400 italic leading-none">
            NILE FLEET GENSET COMPANY <span className="mx-2">|</span> POWERED BY BEBITO
          </p>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`invoice-container relative shadow-2xl ${t.bg} ${t.font} ${t.text} ${isActivePrint ? 'active-print' : ''}`}
      style={paddingStyle}
    >
      <div style={scaleStyle} className="w-full flex flex-col h-full overflow-hidden relative">
        <WatermarkLayer />
        <Header />
        <Parties />
        <Table />
        <Totals />
        <div className="flex-grow min-h-[40px]"></div>
        <BottomSection />
      </div>
    </div>
  );
};

export default InvoiceDocument;

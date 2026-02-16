
import React, { useMemo } from 'react';
import { Invoice, Booking, TemplateFields, InvoiceTheme, CustomTheme } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  Anchor, Briefcase, Clock, Truck, Package, Square, ArrowRight, Heart, FileText, Info, Phone, Globe, Landmark, Mail, Hash, Box, Layers, Layout as LayoutIcon, MapPin, ShieldCheck, User, Zap, Terminal, Activity, Globe2
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
  layout: 'classic' | 'modern' | 'industrial' | 'split' | 'minimal' | 'sidebar' | 'bold' | 'centered' | 'cards' | 'blueprint' | 'elegant' | 'dark' | 'brutalist' | 'airport' | 'eco';
  tableStyle: 'grid' | 'clean' | 'striped' | 'heavy' | 'glass';
  headerStyle: 'standard' | 'centered' | 'badge' | 'sidebar';
}

const getThemeConfig = (theme: InvoiceTheme, customData?: CustomTheme): ThemeConfig => {
  if (customData) {
    return {
      accent: customData.accent,
      secondary: customData.secondary,
      bg: 'bg-white',
      text: 'text-slate-900',
      border: customData.border,
      font: customData.font,
      radius: customData.radius,
      layout: customData.layout as any,
      tableStyle: customData.tableStyle,
      headerStyle: customData.headerStyle,
    };
  }

  // Force bg-white and text-slate-900 for all standard themes per request
  const configs: Record<string, Partial<ThemeConfig>> = {
    'logistics-grid': { accent: 'bg-emerald-600', secondary: 'text-emerald-700', border: 'border-slate-900', font: 'font-sans', radius: 'rounded-none', layout: 'classic', tableStyle: 'heavy' },
    'corporate': { accent: 'bg-slate-900', secondary: 'text-slate-600', border: 'border-slate-200', font: 'font-sans', radius: 'rounded-lg', layout: 'split', tableStyle: 'clean' },
    'luxury-gold': { accent: 'bg-amber-600', secondary: 'text-amber-500', border: 'border-amber-200', font: 'font-playfair', radius: 'rounded-none', layout: 'centered', tableStyle: 'clean' },
    'vintage': { accent: 'bg-amber-800', secondary: 'text-amber-900', border: 'border-amber-900/20', font: 'font-serif-bask', radius: 'rounded-none', layout: 'classic', tableStyle: 'grid' },
    'technical-draft': { accent: 'bg-slate-700', secondary: 'text-slate-500', border: 'border-slate-300', font: 'font-mono-jb', radius: 'rounded-none', layout: 'industrial', tableStyle: 'grid' },
    'swiss-modern': { accent: 'bg-slate-900', secondary: 'text-slate-500', border: 'border-slate-200', font: 'font-grotesk', radius: 'rounded-none', layout: 'bold', tableStyle: 'clean' },
    'minimalist': { accent: 'bg-slate-900', secondary: 'text-slate-400', border: 'border-transparent', font: 'font-grotesk', radius: 'rounded-none', layout: 'minimal', tableStyle: 'clean' },
    'sidebar-pro': { accent: 'bg-blue-600', secondary: 'text-blue-800', border: 'border-slate-100', font: 'font-sans', radius: 'rounded-2xl', layout: 'sidebar', tableStyle: 'clean' },
    'modern-cards': { accent: 'bg-purple-600', secondary: 'text-purple-700', border: 'border-purple-100', font: 'font-sans', radius: 'rounded-3xl', layout: 'cards', tableStyle: 'clean' },
    'blueprint': { accent: 'bg-cyan-600', secondary: 'text-cyan-700', border: 'border-cyan-200', font: 'font-mono-jb', layout: 'blueprint', tableStyle: 'grid' },
    'elegant': { accent: 'bg-rose-400', secondary: 'text-rose-600', border: 'border-rose-100', font: 'font-serif-bask', layout: 'elegant', tableStyle: 'clean' },
    'industrial': { accent: 'bg-zinc-900', secondary: 'text-zinc-600', border: 'border-zinc-300', font: 'font-bebas', layout: 'industrial', tableStyle: 'heavy' },
    'dark-mode-pro': { accent: 'bg-emerald-600', secondary: 'text-emerald-700', border: 'border-slate-200', font: 'font-grotesk', layout: 'dark', tableStyle: 'heavy' },
    'brutalist': { accent: 'bg-yellow-400', secondary: 'text-slate-900', border: 'border-black', font: 'font-bebas', layout: 'brutalist', tableStyle: 'heavy' },
    'airport-terminal': { accent: 'bg-slate-900', secondary: 'text-slate-500', border: 'border-slate-200', font: 'font-mono-jb', layout: 'airport', tableStyle: 'grid' },
    'eco-freight': { accent: 'bg-lime-600', secondary: 'text-lime-800', border: 'border-lime-200', font: 'font-sans', layout: 'eco', tableStyle: 'clean' },
  };

  const base = configs[theme] || configs['logistics-grid'];
  return {
    accent: base.accent!,
    secondary: base.secondary!,
    bg: 'bg-white', // Strictly white background
    text: 'text-slate-900', // Strictly dark text
    border: base.border!,
    font: base.font!,
    radius: base.radius || 'rounded-none',
    layout: (base.layout as any) || 'classic',
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
      showBeneficiary: false, showShipperAddress: true, showTrucker: true,
      showInvoiceDate: true, showDueDate: true, showNotes: true, showWatermark: true
    }
  };

  const fields = config.fields as TemplateFields;
  const themeName = config.theme || 'logistics-grid';
  const t = getThemeConfig(themeName, config.customThemeData);
  const profile = invoice.userProfile;

  const mainShipper = invoice.items[0]?.shipper || '---';
  const mainTrucker = invoice.items[0]?.trucker || '---';

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
        <img src={profile.watermarkUrl} style={{ opacity: profile.watermarkOpacity || 0.05, transform: 'rotate(-25deg)', width: '450px', height: '450px', filter: 'grayscale(100%)' }} className="object-contain" alt="" />
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

  const LogisticsInfoBanner = () => (
    <div style={spacingStyle} className={`grid grid-cols-2 gap-4 border-2 ${t.border} p-5 relative overflow-hidden group`}>
      <div className="absolute top-0 right-0 p-2 opacity-5">
        <Truck size={60} />
      </div>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1`}>Official Shipper</p>
        <p className={`text-xl font-black uppercase ${t.text}`}>{mainShipper}</p>
      </div>
      <div className={`border-l-2 border-slate-100 pl-6`}>
        <p className={`text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1`}>Contracted Trucker</p>
        <p className={`text-xl font-black uppercase ${t.text}`}>{mainTrucker}</p>
      </div>
    </div>
  );

  const InvoiceTable = ({ noHeader = false, variant = 'standard' }: { noHeader?: boolean, variant?: string }) => (
    <div className="w-full relative z-10 shrink-0">
      <table className={`w-full text-left table-auto border-collapse ${t.tableStyle === 'grid' ? 'border-2' : ''} ${t.tableStyle === 'heavy' ? 'border-t-8 border-slate-950' : ''}`}>
        {!noHeader && (
          <thead>
            <tr className={`border-b-2 border-slate-950`}>
              <th className={`py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>Logistics Itemization</th>
              <th className={`py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right`}>Subtotal</th>
            </tr>
          </thead>
        )}
        <tbody className={`divide-y divide-slate-100`}>
          {groupedItems.map((group, idx) => (
            <tr key={idx} className="break-inside-avoid">
              <td className="py-4 px-4 align-top">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-1 h-5 ${t.accent}`}></div>
                  <p className={`font-black text-xl uppercase ${t.text}`}>{group[0].bookingNo}</p>
                  <div className={`flex items-center gap-2 py-0.5 px-2 rounded bg-slate-50 border-slate-100 text-slate-500 text-[9px] font-black uppercase`}>
                     <span>{group[0].goPort}</span>
                     <ArrowRight size={10} className="text-emerald-500" />
                     <span>{group[0].giPort}</span>
                  </div>
                </div>
                <div className="ml-4 flex flex-wrap gap-1.5">
                  {group.map(u => (
                    <span key={u.id} className={`text-[10px] font-black px-2 py-0.5 border border-slate-200 bg-white rounded-sm uppercase`}>
                      {u.reeferNumber}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-4 px-4 text-right align-top">
                <p className={`text-xl font-black tracking-tight ${t.text}`}>
                  {formatCurrency(group.reduce((a,c)=>a+c.rateValue,0), invoice.currency)}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderLayout = () => {
    switch (t.layout) {
      case 'dark': return <DarkLayout />; // Now strictly white/black per theme logic
      case 'brutalist': return <BrutalistLayout />;
      case 'airport': return <AirportLayout />;
      case 'eco': return <EcoLayout />;
      case 'centered': return <><CenteredLayout /><LogisticsInfoBanner /><InvoiceTable /></>;
      case 'split': return <><SplitLayout /><LogisticsInfoBanner /><InvoiceTable /></>;
      case 'industrial': return <IndustrialLayout />;
      case 'bold': return <><SwissModernCleanLayout /><LogisticsInfoBanner /><InvoiceTable /></>;
      case 'sidebar': return <SidebarLayout />;
      case 'cards': return <CardsLayout />;
      case 'blueprint': return <><BlueprintLayout /><LogisticsInfoBanner /><InvoiceTable /></>;
      case 'elegant': return <><ElegantLayout /><LogisticsInfoBanner /><InvoiceTable /></>;
      case 'minimal': return <><MinimalLayout /><LogisticsInfoBanner /><InvoiceTable /></>;
      default: return <><ClassicLayout /><LogisticsInfoBanner /><InvoiceTable /></>;
    }
  };

  /* Fix: Added missing SplitLayout component definition for usage in renderLayout switch */
  const SplitLayout = () => (
    <div style={spacingStyle} className="flex justify-between items-start pt-10 pb-8 border-b-2 border-slate-900/10">
      <div>
        <h1 className="text-4xl font-black uppercase tracking-tight leading-none">{profile.companyName}</h1>
        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">{profile.ownerName}</p>
        <div className="mt-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Bill To</p>
          <p className="text-xl font-black uppercase tracking-tight">{invoice.customerName}</p>
          {fields.showCustomerAddress && <p className="text-[10px] opacity-60 mt-1">{invoice.customerAddress}</p>}
        </div>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Invoice Document</p>
        <p className="text-4xl font-black font-mono">#{invoice.invoiceNumber}</p>
        <div className="mt-8 space-y-1">
           <p className="text-[10px] font-black uppercase">Issued: {invoice.date}</p>
           {fields.showDueDate && <p className="text-[10px] font-black uppercase text-emerald-600">Due: {invoice.dueDate}</p>}
        </div>
      </div>
    </div>
  );

  const DarkLayout = () => (
    <div className="flex flex-col h-full">
      <div style={spacingStyle} className="flex justify-between items-start border-b-2 border-slate-200 pb-8 pt-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-emerald-600 leading-none">{profile.companyName}</h1>
          <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">{profile.ownerName}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1">Logistics Manifest</p>
          <p className="text-3xl font-black font-mono">#{invoice.invoiceNumber}</p>
        </div>
      </div>
      <LogisticsInfoBanner />
      <div className="flex-1 mt-6"><InvoiceTable /></div>
    </div>
  );

  const BrutalistLayout = () => (
    <div className="flex flex-col h-full">
      <div style={spacingStyle} className="bg-yellow-400/10 p-8 border-4 border-black">
        <h1 className="text-7xl font-bebas leading-none tracking-tighter text-black">{profile.companyName}</h1>
        <div className="flex justify-between items-end mt-4">
          <p className="text-2xl font-bebas uppercase tracking-widest text-black">{profile.ownerName}</p>
          <p className="text-5xl font-bebas text-black">#{invoice.invoiceNumber}</p>
        </div>
      </div>
      <LogisticsInfoBanner />
      <InvoiceTable />
    </div>
  );

  const AirportLayout = () => (
    <div className="flex flex-col h-full border-x-4 border-slate-900 px-8 py-10">
      <div style={spacingStyle} className="border-4 border-slate-900 p-6 rounded-t-xl">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <Globe2 size={40} className="text-slate-900" />
            <div>
              <h1 className="text-4xl font-mono font-black uppercase tracking-tighter">{profile.companyName}</h1>
              <p className="text-xs font-mono font-bold text-slate-500">SYSTEM: LOGISTICS_CORE_V1</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono font-black">REF_NO: {invoice.invoiceNumber}</p>
            <p className="text-xs font-mono font-bold">{invoice.date}</p>
          </div>
        </div>
      </div>
      <LogisticsInfoBanner />
      <InvoiceTable />
    </div>
  );

  const EcoLayout = () => (
    <div className="flex flex-col h-full px-4">
      <div style={spacingStyle} className="border-b-4 border-lime-600 pb-6 pt-6 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-lime-600 rounded-full flex items-center justify-center text-white"><Package size={20}/></div>
            <h1 className="text-3xl font-black text-lime-900 tracking-tight uppercase leading-none">{profile.companyName}</h1>
          </div>
          <p className="text-xs font-bold text-lime-700 mt-2 uppercase ml-14">{profile.ownerName}</p>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black uppercase tracking-widest text-lime-400">Green Logistics</p>
           <p className="text-2xl font-black text-lime-900">{invoice.invoiceNumber}</p>
        </div>
      </div>
      <LogisticsInfoBanner />
      <InvoiceTable />
    </div>
  );

  const ClassicLayout = () => (
    <>
      <div style={spacingStyle} className="flex justify-between items-start relative z-10 w-full shrink-0">
        <div className="flex-1">
          {fields.showLogo && profile.logoUrl && <img src={profile.logoUrl} className="h-20 mb-4 object-contain" />}
          <div className="space-y-0">
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">{profile.companyName}</h1>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">{profile.ownerName}</p>
            {fields.showCompanyInfo && <p className="text-[9px] font-bold mt-2 opacity-70 max-w-xs">{profile.address}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-5xl font-black uppercase tracking-tighter opacity-10 absolute -top-4 right-0">INVOICE</p>
          <div className="relative pt-4">
             <p className="text-xl font-black uppercase tracking-tight">Invoice <span className={t.secondary}>#{invoice.invoiceNumber}</span></p>
             <div className="mt-2 text-[10px] font-black space-y-0.5 uppercase opacity-60">
               {fields.showInvoiceDate && <p>Date: {invoice.date}</p>}
               {fields.showDueDate && <p>Due: {invoice.dueDate}</p>}
             </div>
          </div>
        </div>
      </div>
      <div style={spacingStyle} className="grid grid-cols-2 gap-10 py-4 border-y border-slate-900/10">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Bill To</p>
          <p className="text-lg font-black uppercase tracking-tight">{invoice.customerName}</p>
          {fields.showCustomerAddress && <p className="text-[10px] opacity-60 mt-1">{invoice.customerAddress}</p>}
        </div>
        <div className="text-right">
           {fields.showTaxId && <p className="text-[9px] font-black uppercase opacity-40">Tax ID: {profile.taxId}</p>}
        </div>
      </div>
    </>
  );

  const CenteredLayout = () => (
    <div className="text-center flex flex-col items-center">
      <div style={spacingStyle} className="space-y-4">
        {fields.showLogo && profile.logoUrl && <img src={profile.logoUrl} className="h-24 mx-auto object-contain" />}
        <div>
          <h1 className="text-4xl font-playfair font-bold uppercase tracking-widest">{profile.companyName}</h1>
          <p className="text-xs font-black uppercase tracking-[0.5em] text-amber-600 mt-1">{profile.ownerName}</p>
        </div>
        <div className="w-16 h-0.5 bg-amber-500 mx-auto"></div>
        <p className="text-[10px] font-serif uppercase tracking-widest opacity-60">{profile.address}</p>
      </div>
      
      <div className="w-full grid grid-cols-3 border-y border-slate-100 py-6 mb-8 items-center">
         <div className="text-left">
            <p className="text-[8px] uppercase tracking-widest opacity-40">Invoice For</p>
            <p className="text-lg font-bold uppercase">{invoice.customerName}</p>
         </div>
         <div className="text-center">
            <p className="text-3xl font-playfair italic">No. {invoice.invoiceNumber}</p>
         </div>
         <div className="text-right space-y-1">
            <p className="text-[9px] font-bold uppercase">Issued: {invoice.date}</p>
            <p className="text-[9px] font-bold uppercase text-amber-500 underline">Due: {invoice.dueDate}</p>
         </div>
      </div>
    </div>
  );

  const SidebarLayout = () => (
    <div className="grid grid-cols-12 h-full -mx-[15mm] -my-[15mm]">
      <div className={`col-span-3 border-r border-slate-100 p-10 flex flex-col gap-10`}>
        {fields.showLogo && profile.logoUrl && <img src={profile.logoUrl} className="w-full object-contain mb-4" />}
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice No.</p>
          <p className="text-2xl font-black">#{invoice.invoiceNumber}</p>
        </div>
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Billed To</p>
          <p className="text-lg font-black uppercase">{invoice.customerName}</p>
          <p className="text-[9px] leading-relaxed opacity-70">{invoice.customerAddress}</p>
        </div>
        <div className="mt-auto space-y-2 text-slate-400 text-[9px] font-black uppercase">
          <p>Date: {invoice.date}</p>
          <p>Due: {invoice.dueDate}</p>
        </div>
      </div>
      <div className="col-span-9 bg-white p-12">
        <h2 className="text-4xl font-black uppercase mb-12 tracking-tight">Fleet Operational Invoice</h2>
        <LogisticsInfoBanner />
        <InvoiceTable noHeader={true} />
      </div>
    </div>
  );

  const CardsLayout = () => (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">{profile.companyName}</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-2 text-slate-400">{profile.ownerName} <span className="opacity-40">| Principal</span></p>
        </div>
        <div className="bg-slate-50 p-6 rounded-3xl text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Ref ID</p>
          <p className="text-2xl font-black text-slate-900 leading-none">{invoice.invoiceNumber}</p>
        </div>
      </div>
      <LogisticsInfoBanner />
      <div className="flex-1">
        <InvoiceTable />
      </div>
    </div>
  );

  const BlueprintLayout = () => (
    <div className="flex flex-col h-full border-4 border-cyan-600/30 p-8">
      <div className="flex justify-between border-b-2 border-cyan-600/30 pb-8 mb-8">
        <div>
          <p className="text-[10px] font-mono font-black text-cyan-600 uppercase mb-2">// LOGISTICS_DRAFT</p>
          <h1 className="text-5xl font-mono font-black uppercase leading-none tracking-tighter text-slate-900">{profile.companyName}</h1>
          <p className="text-xs font-mono font-bold mt-1 text-cyan-700">OWNER: {profile.ownerName}</p>
        </div>
        <div className="text-right font-mono">
          <p className="text-xs font-black uppercase">SERIAL: {invoice.invoiceNumber}</p>
          <p className="text-xs font-black uppercase">TIMESTAMP: {invoice.date}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-10 mb-12 font-mono">
        <div className="p-4 bg-cyan-50/50 border border-cyan-100">
          <p className="text-[10px] font-black text-cyan-600 uppercase mb-2">TARGET_CLIENT</p>
          <p className="text-xl font-black">{invoice.customerName}</p>
          <p className="text-[10px] opacity-60 mt-1">{invoice.customerAddress}</p>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2">AUTHORIZED_BY</p>
          <p className="text-xl font-black">{profile.name}</p>
          <p className="text-[10px] opacity-60 mt-1">{profile.title || 'FLEET OPERATIONS MANAGER'}</p>
        </div>
      </div>
    </div>
  );

  const ElegantLayout = () => (
    <div className="flex flex-col h-full text-center px-12">
      <div className="pt-12 pb-16 border-b border-rose-100 mb-12">
        {fields.showLogo && profile.logoUrl && <img src={profile.logoUrl} className="h-16 mx-auto mb-8 grayscale opacity-50" />}
        <h1 className="text-5xl font-serif-bask italic mb-2 tracking-tight">{profile.companyName}</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-300">{profile.ownerName}</p>
      </div>
      <div className="flex justify-between text-left mb-16">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mb-2">Client Signature Space</p>
          <p className="text-2xl font-serif-bask font-bold">{invoice.customerName}</p>
          <p className="text-xs italic opacity-40 mt-1">{invoice.customerAddress}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mb-2">Invoice Particulars</p>
          <p className="text-xl font-serif-bask font-bold">Ref: {invoice.invoiceNumber}</p>
          <p className="text-xs italic opacity-40 mt-1">Date of Issue: {invoice.date}</p>
        </div>
      </div>
    </div>
  );

  const MinimalLayout = () => (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-24">
        <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">{profile.companyName}</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{profile.ownerName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black uppercase tracking-tighter">{invoice.invoiceNumber}</p>
          <p className="text-xs opacity-40 font-bold uppercase">{invoice.date}</p>
        </div>
      </div>
      <div className="mb-24">
        <p className="text-xs font-black text-slate-300 uppercase mb-4 tracking-widest">To</p>
        <p className="text-4xl font-black tracking-tighter uppercase leading-none">{invoice.customerName}</p>
      </div>
    </div>
  );

  const IndustrialLayout = () => (
    <div className="grid grid-cols-12 border-4 border-slate-900 h-full overflow-hidden bg-white">
       <div className="col-span-7 border-b-4 border-r-4 border-slate-900 p-6">
          <div className="flex items-start gap-4">
            {profile.logoUrl && <img src={profile.logoUrl} className="h-16 w-16 object-contain" />}
            <div>
              <h1 className="text-3xl font-mono font-black uppercase tracking-tight leading-none">{profile.companyName}</h1>
              <p className="text-[10px] font-mono font-bold border border-slate-900 px-2 inline-block mt-2">PRINCIPAL: {profile.ownerName}</p>
            </div>
          </div>
       </div>
       <div className="col-span-5 border-b-4 border-slate-900 p-6 bg-slate-50 flex flex-col justify-center">
          <p className="text-[9px] font-mono font-black uppercase opacity-40">Document Serial</p>
          <p className="text-3xl font-mono font-black">#{invoice.invoiceNumber}</p>
       </div>
       <div className="col-span-12 border-b-4 border-slate-900 p-6 grid grid-cols-2 bg-slate-900 text-white">
          <div className="border-r-2 border-white/20 pr-6">
            <p className="text-[9px] font-mono font-black uppercase opacity-60 mb-1">Logistics: Shipper</p>
            <p className="text-2xl font-mono font-black uppercase">{mainShipper}</p>
          </div>
          <div className="pl-6">
            <p className="text-[9px] font-mono font-black uppercase opacity-60 mb-1">Logistics: Trucker</p>
            <p className="text-2xl font-mono font-black uppercase">{mainTrucker}</p>
          </div>
       </div>
       <div className="col-span-12 p-2 bg-white flex-1"><InvoiceTable noHeader={true} /></div>
    </div>
  );

  const SwissModernCleanLayout = () => (
    <div className="flex flex-col h-full bg-white px-4">
      <div className="flex justify-between items-end border-b-2 border-black pb-4 pt-10">
        <h1 className="text-4xl font-grotesk font-black leading-none tracking-tight">INVOICE DOCUMENT</h1>
        <div className="text-right"><p className="text-2xl font-grotesk font-bold uppercase tracking-tighter">{invoice.invoiceNumber}</p></div>
      </div>
      <div className="grid grid-cols-12 gap-8 mt-8">
        <div className="col-span-8 space-y-1">
          <h2 className="text-3xl font-grotesk font-black leading-none">{profile.companyName}</h2>
          <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">{profile.ownerName}</p>
          <p className="text-[10px] mt-4 font-bold text-slate-500 uppercase max-w-sm">{profile.address}</p>
        </div>
        <div className="col-span-4 border border-slate-200 p-6 flex flex-col justify-between rounded-xl bg-slate-50">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Billed Client</p>
            <p className="text-xl font-grotesk font-black tracking-tight uppercase">{invoice.customerName}</p>
          </div>
          <p className="text-[10px] font-black uppercase text-slate-400 mt-4">Issue Date: {invoice.date}</p>
        </div>
      </div>
    </div>
  );

  const TotalsSection = () => (
    <div className="mt-8 flex justify-end">
      <div className={`w-64 p-6 bg-slate-50 border-slate-200 border-2 rounded-3xl flex flex-col gap-2 items-end`}>
         <div className={`flex justify-between w-full text-[10px] font-bold uppercase opacity-60`}>
           <span>Gross Subtotal</span>
           <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
         </div>
         <div className={`w-full h-px bg-slate-950/10 my-1`}></div>
         <p className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-40`}>Net Amount Payable</p>
         <p className={`text-3xl font-black tracking-tighter leading-none ${t.text}`}>{formatCurrency(invoice.total, invoice.currency)}</p>
      </div>
    </div>
  );

  return (
    <div 
      className={`invoice-container relative shadow-2xl bg-white ${t.font} ${t.text} ${isActivePrint ? 'active-print' : ''}`}
      style={paddingStyle}
    >
      <div style={scaleStyle} className="w-full flex flex-col h-full overflow-hidden relative">
        <WatermarkLayer />
        {renderLayout()}
        <TotalsSection />
        <div className={`mt-auto pt-10 border-t border-slate-100 flex justify-between items-end`}>
           <div className="space-y-4 max-w-lg">
              {fields.showNotes && invoice.notes && (
                <div className={`p-4 bg-slate-50/50 border border-slate-100 rounded-2xl`}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1 flex items-center gap-1"><Info size={10}/> Official Notes</p>
                  <p className={`text-[10px] font-bold leading-relaxed opacity-60`}>{invoice.notes}</p>
                </div>
              )}
              <p className={`text-[8px] font-black uppercase tracking-[0.4em] opacity-30`}>NILE FLEET GENSET POWERED BY BEBITO</p>
           </div>
           {fields.showSignature && (
             <div className="text-right flex flex-col items-end">
                {profile.signatureUrl && <img src={profile.signatureUrl} className="h-24 w-auto object-contain mb-[-10px] z-20 pointer-events-none mix-blend-multiply" />}
                <div className={`border-t-2 border-slate-900 pt-2 w-72`}>
                  <p className={`text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2`}>Authorized Official</p>
                  <div className="space-y-1">
                    <p className={`text-sm font-black uppercase leading-none ${t.text}`}>{profile.name}</p>
                    {profile.title && <p className="text-[10px] font-black uppercase text-emerald-600 tracking-tighter">{profile.title}</p>}
                    
                    {/* MY INFO: Added detailed contact info under the signature per request */}
                    <div className="mt-3 space-y-0.5 border-t border-slate-100 pt-2 text-right">
                      {profile.phone && <p className="text-[9px] font-bold text-slate-500 flex items-center justify-end gap-1.5 leading-none"><Phone size={9} className="text-slate-300"/> {profile.phone}</p>}
                      {profile.email && <p className="text-[9px] font-bold text-slate-500 flex items-center justify-end gap-1.5 leading-none"><Mail size={9} className="text-slate-300"/> {profile.email}</p>}
                      {profile.website && <p className="text-[9px] font-bold text-slate-500 flex items-center justify-end gap-1.5 leading-none"><Globe size={9} className="text-slate-300"/> {profile.website}</p>}
                    </div>
                  </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDocument;
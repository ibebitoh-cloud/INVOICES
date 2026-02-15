
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileUp, Search, ChevronLeft, Layout, 
  UserCircle, Trash2, Image as ImageIcon, 
  Table as TableIcon, X, CheckCircle, Settings as SettingsIcon,
  Briefcase, FileCheck, Layers, Palette, 
  Printer, Sparkles, Droplets, Terminal,
  FileStack, Download, Square, BookOpen,
  Users, Plus, ArrowRight, PenTool, Check, Eye, EyeOff,
  Truck, MapPin, Package, RotateCcw, FileSpreadsheet,
  Copy, Archive, Share2, Send, Wand2, Zap, Grid3X3, Award, Smartphone, FileDown,
  ExternalLink, MousePointerClick, Banknote, AlertTriangle, Info, ListChecks,
  Maximize2, Minimize2, MoveHorizontal, MoveVertical,
  PlusCircle, Compass, Leaf, Sunrise, ScrollText, FlaskConical, Beaker,
  ShieldCheck, Key, Cpu, Paintbrush, Building2, Hash, Edit3,
  // Add missing FileText icon import
  FileText
} from 'lucide-react';
import { Booking, Invoice, InvoiceSectionId, TemplateConfig, UserProfile, TemplateFields, GroupingType, InvoiceTheme, CustomerConfig, CustomTheme } from './types';
import { parseCurrency, formatCurrency, exportToCSV } from './utils/formatters';
import InvoiceDocument from './components/InvoiceDocument';
import { GoogleGenAI, Type } from "@google/genai";

const DEFAULT_COMPANY_LOGO = "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&q=80&w=200&h=200";

const STANDARD_THEMES: { id: InvoiceTheme, label: string, desc: string, icon: any, color: string }[] = [
  { id: 'logistics-grid', label: 'Classic Logistics', desc: 'Heavy borders, official grid layout', icon: TableIcon, color: 'bg-emerald-600' },
  { id: 'corporate', label: 'Corporate Clean', desc: 'Minimal, business-standard style', icon: Briefcase, color: 'bg-slate-900' },
  { id: 'luxury-gold', label: 'Luxury Gold', desc: 'Premium executive dark/gold theme', icon: Award, color: 'bg-amber-500' },
  { id: 'vintage', label: 'Vintage Archive', desc: 'Typewriter fonts on aged paper', icon: ScrollText, color: 'bg-orange-200' },
  { id: 'eco-green', label: 'Eco Green', desc: 'Soft earthy tones for natural brands', icon: Leaf, color: 'bg-green-500' },
  { id: 'sunset-vibe', label: 'Sunset Glow', desc: 'Vibrant warm gradients & modern fonts', icon: Sunrise, color: 'bg-orange-500' },
  { id: 'blueprint', label: 'Blueprint Tech', desc: 'Technical architectural design', icon: Compass, color: 'bg-blue-700' },
  { id: 'swiss-modern', label: 'Swiss Modern', desc: 'High contrast, bold grotesk font', icon: Grid3X3, color: 'bg-red-600' },
  { id: 'brutalist', label: 'Brutalist Heavy', desc: 'Raw, industrial, black & white', icon: Square, color: 'bg-black' },
  { id: 'glass', label: 'Digital Glass', desc: 'Semi-transparent modern gradients', icon: Droplets, color: 'bg-blue-400' },
  { id: 'midnight-pro', label: 'Midnight Night', desc: 'Premium dark mode for screens', icon: Sparkles, color: 'bg-slate-950' },
  { id: 'elegant', label: 'Elegant Serif', desc: 'Refined serif for luxury clients', icon: Award, color: 'bg-stone-800' },
  { id: 'technical-draft', label: 'Technical Draft', desc: 'Monospace, blueprint technical look', icon: Terminal, color: 'bg-slate-600' }
];

const App: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('invoice_bookings');
    return saved ? JSON.parse(saved) : [];
  });
  const [customerConfigs, setCustomerConfigs] = useState<CustomerConfig[]>(() => {
    const saved = localStorage.getItem('customer_configs');
    return saved ? JSON.parse(saved) : [];
  });
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(() => {
    const saved = localStorage.getItem('custom_themes');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  
  const [view, setView] = useState<'dashboard' | 'invoice-preview' | 'profile' | 'edit-invoice' | 'settings' | 'customers' | 'batch-summary' | 'theme-creator'>('dashboard');
  
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [batchInvoices, setBatchInvoices] = useState<Invoice[]>([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState<{ count: number } | null>(null);
  
  // Theme Creator State
  const [editingTheme, setEditingTheme] = useState<CustomTheme>({
    id: `theme-${Date.now()}`,
    label: 'My Custom Style',
    accent: 'bg-emerald-600',
    secondary: 'text-emerald-700',
    bg: 'bg-white',
    text: 'text-slate-900',
    border: 'border-slate-200',
    font: 'font-sans',
    radius: 'rounded-xl',
    layout: 'modern',
    tableStyle: 'clean',
    headerStyle: 'standard'
  });
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // API Management State
  const [apiActive, setApiActive] = useState(false);

  useEffect(() => {
    const checkApiStatus = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiActive(hasKey);
      }
    };
    checkApiStatus();
  }, []);

  const handleOpenApiKeyDialog = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setApiActive(true);
    } else {
      alert("API Activation is available through the secure AI Studio project selector.");
    }
  };

  const [manualBooking, setManualBooking] = useState<Partial<Booking>>({
    bookingNo: '',
    reeferNumber: '',
    goPort: '',
    giPort: '',
    rateValue: 0,
    shipper: '',
    trucker: '',
    shipperAddress: '',
    customer: ''
  });

  const [newCustomer, setNewCustomer] = useState<Partial<CustomerConfig>>({
    name: '',
    prefix: 'INV',
    nextNumber: 1
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('user_profile');
    if (saved) return JSON.parse(saved);
    return {
      name: 'Mohamed Alaa',
      companyName: 'Nile Fleet',
      address: 'Genset Rent Company\nCairo, Egypt',
      taxId: '620-410-998',
      email: 'mohamed.alaa@nilefleet.com',
      signatureUrl: null,
      logoUrl: DEFAULT_COMPANY_LOGO,
      watermarkUrl: null,
      watermarkOpacity: 0.1
    };
  });

  const [invConfig, setInvConfig] = useState({
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    notes: 'Operational services provided for Genset rental and logistics.',
    currency: 'EGP'
  });

  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>(() => {
    const saved = localStorage.getItem('template_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, hiddenSections: new Set(parsed.hiddenSections) };
    }
    return {
      sectionOrder: ['header', 'parties', 'table', 'totals', 'signature', 'footer'],
      hiddenSections: new Set<InvoiceSectionId>(),
      theme: 'logistics-grid',
      groupBy: 'booking',
      contentScale: 1.0,
      verticalSpacing: 16,
      horizontalPadding: 15,
      fields: {
        showReefer: true, showGenset: true, showBookingNo: true, showCustomerRef: true,
        showPorts: true, showServicePeriod: true, showTerms: true, showSignature: true,
        showLogo: true, showCompanyInfo: true, showTaxId: true, showCustomerAddress: true,
        showBeneficiary: false, showShipperAddress: true, showTrucker: true, showVat: true,
        showInvoiceDate: true, showDueDate: true, showNotes: true, showWatermark: true
      }
    };
  });

  useEffect(() => { localStorage.setItem('invoice_bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('user_profile', JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem('customer_configs', JSON.stringify(customerConfigs)); }, [customerConfigs]);
  useEffect(() => { localStorage.setItem('custom_themes', JSON.stringify(customThemes)); }, [customThemes]);
  useEffect(() => {
    const toSave = { ...templateConfig, hiddenSections: Array.from(templateConfig.hiddenSections) };
    localStorage.setItem('template_config', JSON.stringify(toSave));
  }, [templateConfig]);

  const generateSmartTheme = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await localAi.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a JSON object for an invoice theme based on the following description: "${aiPrompt}". 
        Return ONLY valid JSON with these keys: 
        "accent" (Tailwind bg color, e.g. bg-blue-600), 
        "secondary" (Tailwind text color, e.g. text-blue-700), 
        "bg" (Tailwind bg color, e.g. bg-white), 
        "text" (Tailwind text color, e.g. text-slate-900), 
        "border" (Tailwind border color and width, e.g. border-slate-200), 
        "font" (Options: font-sans, font-mono-jb, font-serif-bask, font-playfair, font-bebas, font-grotesk), 
        "radius" (Tailwind rounded class, e.g. rounded-xl, rounded-none), 
        "layout" (Options: classic, modern, industrial, split, minimal, bold), 
        "tableStyle" (Options: grid, clean, striped, heavy, glass), 
        "headerStyle" (Options: standard, centered, badge).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              accent: { type: Type.STRING },
              secondary: { type: Type.STRING },
              bg: { type: Type.STRING },
              text: { type: Type.STRING },
              border: { type: Type.STRING },
              font: { type: Type.STRING },
              radius: { type: Type.STRING },
              layout: { type: Type.STRING },
              tableStyle: { type: Type.STRING },
              headerStyle: { type: Type.STRING }
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      setEditingTheme(prev => ({
        ...prev,
        ...data,
        label: `AI: ${aiPrompt.slice(0, 15)}...`
      }));
    } catch (error: any) {
      console.error("AI Generation failed", error);
      if (error.message?.includes("Requested entity was not found")) {
        setApiActive(false);
        alert("API Configuration reset required. Please select a valid Project Key.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const saveCustomTheme = () => {
    setCustomThemes(prev => {
      const exists = prev.findIndex(t => t.id === editingTheme.id);
      if (exists !== -1) {
        const next = [...prev];
        next[exists] = editingTheme;
        return next;
      }
      return [...prev, editingTheme];
    });
    alert('Theme Laboratory: Formula Saved!');
    setView('settings');
  };

  const toggleBooking = (id: string) => {
    const target = bookings.find(b => b.id === id);
    if (!target) return;
    const sameBookingNoIds = bookings
      .filter(b => b.bookingNo === target.bookingNo && target.bookingNo !== '---')
      .map(b => b.id);
    const idsToToggle = sameBookingNoIds.length > 0 ? sameBookingNoIds : [id];
    setSelectedIds(prev => {
      const next = new Set(prev);
      const isAdding = !prev.has(id);
      idsToToggle.forEach(toggleId => {
        if (isAdding) next.add(toggleId);
        else next.delete(toggleId);
      });
      return next;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const rows = content.split('\n').filter(row => row.trim());
      if (rows.length < 2) return;

      const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const newEntries: Booking[] = [];
      const newCustomersToRegister = new Set<string>();

      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const booking: any = {
          id: `booking-csv-${Date.now()}-${i}`,
          status: 'PENDING',
          gensetNo: '---',
          trucker: '---',
          shipper: '---',
          goPort: '---',
          giPort: '---',
          reeferNumber: '---',
          bookingNo: '---',
          customer: 'Unnamed Client',
          bookingDate: new Date().toISOString().split('T')[0],
          rateValue: 0,
          vatValue: 0,
          shipperAddress: ''
        };

        headers.forEach((header, index) => {
          if (index < values.length) {
            const val = values[index];
            if (header === 'rateValue' || header === 'vatValue') {
              booking[header] = parseCurrency(val);
            } else {
              booking[header] = val || booking[header];
            }
          }
        });

        if (booking.bookingNo && booking.bookingNo !== '---') {
          if (!booking.vatValue && booking.rateValue) {
            booking.vatValue = booking.rateValue * 0.14;
            booking.vat = booking.vatValue.toString();
          }
          if (booking.rateValue) {
            booking.rate = booking.rateValue.toString();
          }
          newEntries.push(booking as Booking);
          newCustomersToRegister.add(booking.customer);
        }
      }

      setCustomerConfigs(prev => {
        const existingNames = new Set(prev.map(c => c.name.toLowerCase()));
        const toAdd: CustomerConfig[] = [];
        newCustomersToRegister.forEach(name => {
          if (!existingNames.has(name.toLowerCase())) {
            toAdd.push({ id: `cust-${Date.now()}-${Math.random()}`, name, prefix: 'INV', nextNumber: 1 });
          }
        });
        return [...prev, ...toAdd];
      });

      if (newEntries.length > 0) {
        setBookings(prev => [...newEntries, ...prev]);
        alert(`Successfully imported ${newEntries.length} manifest records.`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleManualBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBooking.customer || !manualBooking.bookingNo) return;

    const newId = `booking-manual-${Date.now()}`;
    const rateVal = manualBooking.rateValue || 0;
    const vatVal = rateVal * 0.14;

    const newEntry: Booking = {
      id: newId,
      customer: manualBooking.customer || 'Unnamed Client',
      bookingNo: manualBooking.bookingNo || '---',
      reeferNumber: manualBooking.reeferNumber || '---',
      goPort: manualBooking.goPort || '---',
      giPort: manualBooking.giPort || '---',
      rateValue: rateVal,
      rate: rateVal.toString(),
      vatValue: vatVal,
      vat: vatVal.toString(),
      shipper: manualBooking.shipper || '---',
      trucker: manualBooking.trucker || '---',
      shipperAddress: manualBooking.shipperAddress || '---',
      bookingDate: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      totalBooking: '', customerRef: '', gops: '', dateOfClipOn: '', clipOffDate: '', 
      beneficiaryName: '', gensetNo: '---', res: '', gaz: '', remarks: '', 
      gensetFaultDescription: '', invNo: '', invDate: '', invIssueDate: ''
    };
    
    // Register customer if new
    setCustomerConfigs(prev => {
      if (prev.some(c => c.name === newEntry.customer)) return prev;
      return [...prev, { id: `cust-${Date.now()}`, name: newEntry.customer, prefix: 'INV', nextNumber: 1 }];
    });

    setBookings(prev => [newEntry, ...prev]);
    setShowManualEntryModal(false);
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return;
    const cust: CustomerConfig = {
      id: `cust-${Date.now()}`,
      name: newCustomer.name,
      prefix: newCustomer.prefix || 'INV',
      nextNumber: newCustomer.nextNumber || 1
    };
    setCustomerConfigs(prev => [...prev, cust]);
    setShowAddCustomerModal(false);
    setNewCustomer({ name: '', prefix: 'INV', nextNumber: 1 });
  };

  const deleteCustomer = (id: string) => {
    if (confirm("Are you sure you want to remove this customer configuration? Manifest entries will not be deleted.")) {
      setCustomerConfigs(prev => prev.filter(c => c.id !== id));
    }
  };

  const updateCustomerPrefix = (id: string, prefix: string) => {
    setCustomerConfigs(prev => prev.map(c => c.id === id ? { ...c, prefix } : c));
  };

  const updateCustomerNextNumber = (id: string, num: number) => {
    setCustomerConfigs(prev => prev.map(c => c.id === id ? { ...c, nextNumber: num } : c));
  };

  const triggerOperation = () => {
    const selectedItems = bookings.filter(b => selectedIds.has(b.id));
    if (selectedItems.length === 0) return;
    const groups = new Map<string, Booking[]>();
    selectedItems.forEach(item => {
      const key = item.bookingNo || '---';
      const existing = groups.get(key) || [];
      existing.push(item);
      groups.set(key, existing);
    });
    const generatedInvoices: Invoice[] = [];
    
    // We'll update the customer next number sequentially
    const updatedCustomerConfigs = [...customerConfigs];

    groups.forEach((items, bkNo) => {
      const firstItem = items[0];
      const subtotal = items.reduce((acc, curr) => acc + curr.rateValue, 0);
      const tax = items.reduce((acc, curr) => acc + curr.vatValue, 0);
      
      const custIdx = updatedCustomerConfigs.findIndex(c => c.name === firstItem.customer);
      let prefix = 'INV';
      let nextNum = Math.floor(Math.random() * 1000);
      
      if (custIdx !== -1) {
        const c = updatedCustomerConfigs[custIdx];
        prefix = c.prefix;
        nextNum = c.nextNumber;
        updatedCustomerConfigs[custIdx].nextNumber += 1;
      }

      generatedInvoices.push({
        id: `INV-${bkNo}-${Date.now()}`,
        invoiceNumber: `${prefix}-${nextNum.toString().padStart(4, '0')}`,
        date: invConfig.date,
        dueDate: invConfig.dueDate,
        customerName: firstItem.customer,
        customerAddress: firstItem.shipperAddress,
        beneficiaryName: '',
        items: items,
        subtotal,
        tax,
        total: subtotal + tax,
        currency: invConfig.currency,
        notes: invConfig.notes,
        templateConfig,
        userProfile: profile
      });
    });

    setCustomerConfigs(updatedCustomerConfigs);

    if (generatedInvoices.length > 1) {
      setBatchInvoices(generatedInvoices);
      setView('batch-summary');
    } else {
      setActiveInvoice(generatedInvoices[0]);
      setShowOperationModal(true);
    }
  };

  const handleSaveInvoice = () => {
    if (!activeInvoice) return;
    setBookings(bookings.map(b => activeInvoice.items.find(item => item.id === b.id) ? { ...b, invNo: activeInvoice.invoiceNumber } : b));
    setSelectedIds(new Set());
    setShowActionModal(true);
  };

  const updateTheme = (themeId: InvoiceTheme, customData?: CustomTheme) => {
    setTemplateConfig(prev => ({ ...prev, theme: themeId, customThemeData: customData }));
    if (activeInvoice) {
      setActiveInvoice({
        ...activeInvoice,
        templateConfig: {
          ...(activeInvoice.templateConfig || templateConfig),
          theme: themeId,
          customThemeData: customData
        }
      });
    }
  };

  const filteredBookings = bookings.filter(b => (!searchTerm || b.bookingNo.toLowerCase().includes(searchTerm.toLowerCase()) || b.reeferNumber.toLowerCase().includes(searchTerm.toLowerCase()) || b.customer.toLowerCase().includes(searchTerm.toLowerCase())));

  const previewInvoiceData: Invoice = activeInvoice || {
    id: 'preview',
    invoiceNumber: 'PREVIEW-001',
    date: '2025-01-01',
    dueDate: '2025-01-15',
    customerName: 'Sample Logistics Co.',
    customerAddress: '123 Harbor Way, Port Alexandria',
    beneficiaryName: '',
    items: bookings.length > 0 ? bookings.slice(0, 2) : [manualBooking as any],
    subtotal: 5000,
    tax: 700,
    total: 5700,
    currency: 'EGP',
    notes: 'Preview of your custom style.',
    templateConfig: { ...templateConfig, theme: editingTheme.id, customThemeData: editingTheme },
    userProfile: profile
  };

  const handleImageUpload = (file: File, field: 'logoUrl' | 'signatureUrl' | 'watermarkUrl') => {
    const reader = new FileReader();
    reader.onload = (event) => setProfile(prev => ({ ...prev, [field]: event.target?.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 antialiased overflow-hidden">
      <aside className="no-print w-64 bg-slate-900 flex flex-col h-screen sticky top-0 shadow-2xl z-50 shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-emerald-500 p-2 rounded-xl text-white"><Briefcase size={20} /></div>
            <h1 className="text-sm font-black text-white tracking-tighter uppercase leading-tight">NILE FLEET<br/>GENSET</h1>
          </div>
          <nav className="space-y-2">
            {[
              { id: 'dashboard', icon: Layout, label: 'Manifest' },
              { id: 'customers', icon: Users, label: 'Customers' },
              { id: 'settings', icon: SettingsIcon, label: 'Templates' },
              { id: 'profile', icon: UserCircle, label: 'Identity' }
            ].map(item => (
              <button key={item.id} onClick={() => setView(item.id as any)} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === item.id || (view === 'edit-invoice' && item.id === 'dashboard') || (view === 'invoice-preview' && item.id === 'dashboard') || (view === 'batch-summary' && item.id === 'dashboard') || (view === 'theme-creator' && item.id === 'settings') ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <item.icon size={18} /> {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-8 border-t border-white/5">
          <div className="flex flex-col gap-1 items-start">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-tight">{profile.companyName}</span>
            <span className="text-xs font-black text-white tracking-tight leading-none">SHERIF HEGAZY</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto custom-scroll relative">
        <div className="max-w-6xl mx-auto p-12 print:p-0">
          {view === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex justify-between items-end">
                <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">Fleet Manifest</h2><p className="text-slate-500 font-medium mt-1">Ready for automated billing cycles.</p></div>
                <div className="flex gap-3">
                   <button onClick={() => setShowManualEntryModal(true)} className="bg-emerald-50 text-emerald-700 px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-emerald-100 transition-colors"><PlusCircle size={16}/> Add Booking</button>
                   <label className="cursor-pointer bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 shadow-xl hover:bg-emerald-700 transition-all">
                      <FileUp size={16}/> Import CSV
                      <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                   </label>
                </div>
              </header>

              <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="text" placeholder="Search manifest..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-2xl font-bold outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <button disabled={selectedIds.size === 0} onClick={triggerOperation} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black disabled:opacity-30 transition-all uppercase text-xs tracking-widest shadow-lg flex items-center gap-2 active:scale-95">
                    <Zap size={18} className="text-emerald-400 fill-emerald-400"/> Auto-Group & Generate ({selectedIds.size})
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b font-black text-slate-400 uppercase tracking-widest text-[10px]">
                    <tr><th className="py-5 px-6 w-12 text-center">#</th><th className="py-5 px-4">Client</th><th className="py-5 px-4">Booking</th><th className="py-5 px-4">Unit</th><th className="py-5 px-4">Rate</th><th className="py-5 px-4 text-center">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedIds.has(b.id) ? 'bg-emerald-50 border-l-4 border-emerald-500' : 'border-l-4 border-transparent'}`} onClick={() => toggleBooking(b.id)}>
                        <td className="py-5 px-6 text-center"><input type="checkbox" className="w-5 h-5 rounded cursor-pointer accent-emerald-600" checked={selectedIds.has(b.id)} onChange={() => toggleBooking(b.id)} /></td>
                        <td className="py-5 px-4 font-bold text-slate-900">{b.customer}</td>
                        <td className="py-5 px-4 font-mono text-slate-500">{b.bookingNo}</td>
                        <td className="py-5 px-4 font-mono font-bold text-emerald-600">{b.reeferNumber}</td>
                        <td className="py-5 px-4 font-black text-slate-900">{formatCurrency(b.rateValue, 'EGP')}</td>
                        <td className="py-5 px-4 text-center">{b.invNo ? <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase bg-emerald-100 text-emerald-700">BILLED</span> : <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase bg-slate-100 text-slate-400">PENDING</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'customers' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <header className="flex justify-between items-end">
                 <div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight">Customer Directory</h2>
                   <p className="text-slate-500 font-medium mt-1">Configure automated invoice numbering and prefixes.</p>
                 </div>
                 <button onClick={() => setShowAddCustomerModal(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 shadow-xl hover:bg-emerald-700 transition-all">
                    <Plus size={16}/> New Client
                 </button>
               </header>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {customerConfigs.length === 0 ? (
                   <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                     <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
                     <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No customers configured yet</p>
                   </div>
                 ) : customerConfigs.map((cust) => (
                   <div key={cust.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 group">
                     <div className="flex justify-between items-start">
                       <div className="bg-slate-50 p-3 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                         <Building2 size={24} />
                       </div>
                       <button onClick={() => deleteCustomer(cust.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                         <Trash2 size={18} />
                       </button>
                     </div>
                     <div>
                       <h3 className="text-lg font-black text-slate-900 leading-tight">{cust.name}</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">ID: {cust.id.split('-')[1]}</p>
                     </div>
                     <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                       <div className="space-y-1">
                         <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Hash size={8}/> Prefix</label>
                         <input 
                           className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-black outline-none focus:ring-2 ring-emerald-500/20" 
                           value={cust.prefix} 
                           onChange={(e) => updateCustomerPrefix(cust.id, e.target.value)}
                         />
                       </div>
                       <div className="space-y-1">
                         <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><ListChecks size={8}/> Next #</label>
                         <input 
                           type="number"
                           className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-black outline-none focus:ring-2 ring-emerald-500/20" 
                           value={cust.nextNumber} 
                           onChange={(e) => updateCustomerNextNumber(cust.id, parseInt(e.target.value) || 1)}
                         />
                       </div>
                     </div>
                     <div className="bg-emerald-50 p-3 rounded-2xl flex items-center justify-between">
                       <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Latest Sample</span>
                       <span className="text-[10px] font-mono font-bold text-emerald-600">{cust.prefix}-{(cust.nextNumber).toString().padStart(4, '0')}</span>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {view === 'batch-summary' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <header className="flex justify-between items-end">
                 <div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight">Batch Generation Complete</h2>
                   <p className="text-slate-500 font-medium mt-1">{batchInvoices.length} documents have been synthesized.</p>
                 </div>
                 <button onClick={() => setView('dashboard')} className="p-3 bg-slate-100 rounded-xl text-slate-600 font-black uppercase text-xs flex items-center gap-2 hover:bg-slate-200 transition-all">
                   <ChevronLeft size={18}/> Back to Manifest
                 </button>
               </header>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {batchInvoices.map((inv) => (
                   <div key={inv.id} className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex items-center justify-between group">
                     <div className="flex items-center gap-4">
                       <div className="bg-slate-50 p-4 rounded-2xl text-emerald-600">
                         <FileText size={24} />
                       </div>
                       <div>
                         <h4 className="text-sm font-black text-slate-900">{inv.invoiceNumber}</h4>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inv.customerName}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="text-right">
                         <p className="text-xs font-black text-slate-900">{formatCurrency(inv.total, inv.currency)}</p>
                         <p className="text-[9px] font-bold text-slate-400">{inv.items.length} Units</p>
                       </div>
                       <button onClick={() => { setActiveInvoice(inv); setView('invoice-preview'); }} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-black transition-all">
                         <Eye size={16} />
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="space-y-12 animate-in fade-in duration-500">
               <header className="flex justify-between items-end">
                 <div><h2 className="text-4xl font-black text-slate-900 tracking-tight">Style Laboratory</h2><p className="text-slate-500 font-medium mt-1">Browse presets or invent your own brand signature.</p></div>
                 <button onClick={() => setView('theme-creator')} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-xl hover:bg-black transition-all active:scale-95"><FlaskConical size={18} className="text-emerald-400"/> Theme Creator</button>
               </header>

               <div className="space-y-10">
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 border-b pb-6"><Beaker size={24} className="text-emerald-500"/> Personal Laboratory (Custom Styles)</h3>
                    {customThemes.length === 0 ? (
                      <div className="py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                         <p className="text-slate-400 font-bold">No custom themes created yet. Start innovating!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {customThemes.map(t => (
                           <button key={t.id} onClick={() => updateTheme(t.id, t)} className={`flex items-center gap-4 p-5 rounded-3xl transition-all border-2 text-left ${templateConfig.theme === t.id ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-transparent'}`}>
                              <div className={`p-4 rounded-2xl ${t.accent} text-white shadow-lg`}><Wand2 size={24}/></div>
                              <div><p className="font-black text-slate-800">{t.label}</p><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Custom Formula</p></div>
                              <button onClick={(e) => { e.stopPropagation(); setCustomThemes(customThemes.filter(ct => ct.id !== t.id)); }} className="ml-auto p-2 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                           </button>
                         ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 border-b pb-6"><Palette size={24} className="text-emerald-500"/> Professional Presets</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {STANDARD_THEMES.map(t => (
                          <button key={t.id} onClick={() => updateTheme(t.id)} className={`flex items-center gap-4 p-5 rounded-3xl transition-all border-2 text-left ${templateConfig.theme === t.id ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                             <div className={`p-4 rounded-2xl ${t.color} text-white shadow-lg`}><t.icon size={24}/></div>
                             <div><p className="font-black text-slate-800">{t.label}</p><p className="text-[10px] font-medium text-slate-400">{t.desc}</p></div>
                             {templateConfig.theme === t.id && <div className="ml-auto bg-emerald-600 text-white p-1 rounded-full"><Check size={16}/></div>}
                          </button>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {view === 'theme-creator' && (
            <div className="space-y-10 animate-in slide-in-from-right duration-500 pb-20">
               <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setView('settings')} className="p-3 bg-slate-50 rounded-2xl text-slate-400"><ChevronLeft size={24}/></button>
                    <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">Style Laboratory</h2><p className="text-slate-500 font-bold uppercase text-[10px] mt-1">Engineer your perfect visual identity</p></div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setView('settings')} className="px-8 py-4 rounded-2xl font-black uppercase text-xs text-slate-400">Discard</button>
                    <button onClick={saveCustomTheme} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl uppercase text-xs active:scale-95 transition-all">Save Formula</button>
                  </div>
               </header>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
                       <div className="flex items-center gap-3 text-emerald-400">
                          <Sparkles size={24}/>
                          <h3 className="text-lg font-black uppercase tracking-tight text-white">Gemini Style Synthesis</h3>
                       </div>
                       <div className="space-y-4">
                          <textarea rows={3} placeholder="Describe the vibe... e.g. 'Cyberpunk shipping company with neon cyan accents and dark carbon backgrounds'" className="w-full bg-white/5 border-2 border-white/10 p-4 rounded-2xl text-white font-medium outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600 resize-none" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
                          <button onClick={generateSmartTheme} disabled={isGenerating || !aiPrompt} className="w-full bg-emerald-500 text-slate-950 py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all disabled:opacity-30">
                            {isGenerating ? <RotateCcw size={18} className="animate-spin"/> : <Wand2 size={18}/>}
                            {isGenerating ? 'Synthesizing Formula...' : 'Run Magic Synthesis'}
                          </button>
                       </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8">
                       <div className="space-y-6">
                          <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Style Label</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={editingTheme.label} onChange={e => setEditingTheme({...editingTheme, label: e.target.value})} /></div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Layout Mode</label>
                                <select className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent outline-none focus:border-emerald-600" value={editingTheme.layout} onChange={e => setEditingTheme({...editingTheme, layout: e.target.value as any})}>
                                   {['classic', 'modern', 'industrial', 'split', 'minimal', 'bold'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                                </select>
                             </div>
                             <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Typography</label>
                                <select className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent outline-none focus:border-emerald-600" value={editingTheme.font} onChange={e => setEditingTheme({...editingTheme, font: e.target.value})}>
                                   {['font-sans', 'font-mono-jb', 'font-serif-bask', 'font-playfair', 'font-bebas', 'font-grotesk'].map(f => <option key={f} value={f}>{f.replace('font-', '').toUpperCase()}</option>)}
                                </select>
                             </div>
                          </div>
                          <div className="space-y-4 pt-4 border-t">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tailwind Style Definitions</p>
                             <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1"><label className="text-[8px] font-black text-slate-300 uppercase">Accent BG</label><input className="w-full bg-slate-50 p-2 rounded-lg text-xs font-mono" value={editingTheme.accent} onChange={e => setEditingTheme({...editingTheme, accent: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[8px] font-black text-slate-300 uppercase">Accent Text</label><input className="w-full bg-slate-50 p-2 rounded-lg text-xs font-mono" value={editingTheme.secondary} onChange={e => setEditingTheme({...editingTheme, secondary: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[8px] font-black text-slate-300 uppercase">Page BG</label><input className="w-full bg-slate-50 p-2 rounded-lg text-xs font-mono" value={editingTheme.bg} onChange={e => setEditingTheme({...editingTheme, bg: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[8px] font-black text-slate-300 uppercase">Base Text</label><input className="w-full bg-slate-50 p-2 rounded-lg text-xs font-mono" value={editingTheme.text} onChange={e => setEditingTheme({...editingTheme, text: e.target.value})} /></div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                  <div className="lg:col-span-7 space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Live Result Preview</p>
                     <div className="bg-slate-200 p-8 rounded-[3rem] shadow-inner overflow-hidden flex justify-center scale-90 origin-top">
                        <InvoiceDocument invoice={previewInvoiceData} />
                     </div>
                  </div>
               </div>
            </div>
          )}

          {view === 'profile' && (
            <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
               <div className="flex justify-between items-end">
                 <div>
                   <h2 className="text-4xl font-black text-slate-900 tracking-tight">Identity & Brand</h2>
                   <p className="text-slate-500 font-medium mt-1">Manage official brand assets and system activation.</p>
                 </div>
                 <button onClick={() => {localStorage.setItem('user_profile', JSON.stringify(profile)); alert('Identity Synced Successfully!');}} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl uppercase text-xs active:scale-95 transition-all">Sync Identity</button>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Business Details */}
                  <div className="lg:col-span-7 space-y-8">
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
                       <h3 className="text-xl font-black text-slate-900 pb-4 border-b uppercase tracking-tight flex items-center gap-3">
                         <Briefcase size={22} className="text-emerald-500"/> Official Profile
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Entity Name</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.companyName} onChange={e => setProfile({...profile, companyName: e.target.value})} /></div>
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Tax Identifier</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.taxId} onChange={e => setProfile({...profile, taxId: e.target.value})} /></div>
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Authorized Manager</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} /></div>
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Official Email</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} /></div>
                       </div>
                       <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Primary Headquarters Address</label><textarea rows={3} className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none resize-none" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} /></div>
                    </div>

                    <div className="bg-slate-950 p-10 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Cpu size={120} className="text-emerald-400" />
                        </div>
                        <div className="relative z-10 space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-emerald-500/20 p-3 rounded-2xl"><ShieldCheck size={28} className="text-emerald-400" /></div>
                              <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">AI Access Formula</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Gemini Intelligence System</p>
                              </div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${apiActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              <div className={`w-2 h-2 rounded-full ${apiActive ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                              {apiActive ? 'Active' : 'Locked'}
                            </div>
                          </div>
                          <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-sm">Select and confirm your Google Cloud Project key to activate automated style synthesis and manifest intelligence.</p>
                          <button onClick={handleOpenApiKeyDialog} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3">
                            <Key size={18} /> {apiActive ? 'Sync Project Access' : 'Connect Project Key'}
                          </button>
                        </div>
                    </div>
                  </div>

                  {/* Brand Assets */}
                  <div className="lg:col-span-5 space-y-8">
                    <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-6">
                      <div className="flex items-center justify-between w-full">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Logo</p>
                        <label className="cursor-pointer text-emerald-600 font-black text-[10px] uppercase hover:underline decoration-2"><input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logoUrl')} />Change</label>
                      </div>
                      <div className="h-40 w-full bg-slate-50 rounded-3xl flex items-center justify-center shadow-inner overflow-hidden border-2 border-slate-100">
                        {profile.logoUrl ? <img src={profile.logoUrl} className="h-full w-full object-contain p-4" /> : <ImageIcon size={48} className="text-slate-200" />}
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-6">
                      <div className="flex items-center justify-between w-full">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manager Signature</p>
                        <label className="cursor-pointer text-emerald-600 font-black text-[10px] uppercase hover:underline decoration-2"><input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'signatureUrl')} />Upload</label>
                      </div>
                      <div className="h-28 w-full bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner overflow-hidden border-2 border-slate-100">
                        {profile.signatureUrl ? <img src={profile.signatureUrl} className="h-full w-auto object-contain p-4 mix-blend-multiply" /> : <PenTool size={32} className="text-slate-200" />}
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-6">
                      <div className="flex items-center justify-between w-full">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">A4 Watermark</p>
                        <label className="cursor-pointer text-emerald-600 font-black text-[10px] uppercase hover:underline decoration-2"><input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'watermarkUrl')} />Upload</label>
                      </div>
                      <div className="space-y-4">
                        <div className="h-28 w-full bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner overflow-hidden border-2 border-slate-100 relative">
                           {profile.watermarkUrl ? <img src={profile.watermarkUrl} style={{ opacity: profile.watermarkOpacity }} className="h-full w-auto object-contain p-4" /> : <Droplets size={32} className="text-slate-200" />}
                        </div>
                        <div className="px-2 space-y-2">
                           <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase"><span>Opacity</span><span>{Math.round(profile.watermarkOpacity * 100)}%</span></div>
                           <input type="range" min="0" max="0.5" step="0.01" value={profile.watermarkOpacity} onChange={e => setProfile({...profile, watermarkOpacity: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {view === 'invoice-preview' && activeInvoice && (
             <div className="animate-in fade-in duration-500 pb-32">
               <div className="no-print bg-white p-8 rounded-[2.5rem] shadow-2xl mb-8 border-2 border-slate-100">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setView('dashboard')} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"><ChevronLeft size={24}/></button>
                      <div><h3 className="text-2xl font-black text-slate-900 tracking-tight">Document Preview</h3><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{activeInvoice.invoiceNumber}</p></div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2 shadow-xl hover:bg-black transition-all active:scale-95"><Printer size={18}/> Print PDF</button>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Choose Visual Style</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scroll no-scrollbar">
                       {[...STANDARD_THEMES.map(t => ({...t, isCustom: false})), ...customThemes.map(t => ({id: t.id, label: t.label, icon: Wand2, color: t.accent, isCustom: true, data: t}))].map(t => {
                         const isActive = (activeInvoice.templateConfig?.theme || templateConfig.theme) === t.id;
                         return (
                          <button key={t.id} onClick={() => updateTheme(t.id, (t as any).isCustom ? (t as any).data : undefined)} className={`flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all ${isActive ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-600 hover:border-slate-200'}`}>
                             <t.icon size={16} className={isActive ? 'text-emerald-100' : 'text-slate-400'} />
                             <span className="text-xs font-black uppercase tracking-tight">{t.label}</span>
                          </button>
                         );
                       })}
                    </div>
                  </div>
               </div>
               <InvoiceDocument invoice={activeInvoice} />
             </div>
          )}
        </div>
      </main>

      {/* Manual Entry Modal */}
      {showManualEntryModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Manual Booking entry</h3>
                <button onClick={() => setShowManualEntryModal(false)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><X size={24}/></button>
              </div>
              <form onSubmit={handleManualBookingSubmit} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Billing Client</label>
                   <input required className="w-full bg-slate-50 p-3 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={manualBooking.customer} onChange={e => setManualBooking({...manualBooking, customer: e.target.value})} placeholder="e.g., Global Logistics S.A." />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Booking No.</label>
                   <input required className="w-full bg-slate-50 p-3 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={manualBooking.bookingNo} onChange={e => setManualBooking({...manualBooking, bookingNo: e.target.value})} placeholder="BK123456" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Unit Number</label>
                   <input className="w-full bg-slate-50 p-3 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={manualBooking.reeferNumber} onChange={e => setManualBooking({...manualBooking, reeferNumber: e.target.value})} placeholder="MWCU1234567" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Rate (EGP)</label>
                   <input type="number" className="w-full bg-slate-50 p-3 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={manualBooking.rateValue} onChange={e => setManualBooking({...manualBooking, rateValue: parseFloat(e.target.value) || 0})} />
                </div>
                <button type="submit" className="col-span-2 bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-emerald-700 transition-all active:scale-[0.98] mt-4">Save Entry</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Register Client</h3>
                <button onClick={() => setShowAddCustomerModal(false)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><X size={24}/></button>
              </div>
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Company Name</label>
                   <input required className="w-full bg-slate-50 p-3 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} placeholder="e.g., Nile Shipping" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Invoice Prefix</label>
                    <input required className="w-full bg-slate-50 p-3 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={newCustomer.prefix} onChange={e => setNewCustomer({...newCustomer, prefix: e.target.value})} placeholder="INV" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Start From #</label>
                    <input type="number" required className="w-full bg-slate-50 p-3 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={newCustomer.nextNumber} onChange={e => setNewCustomer({...newCustomer, nextNumber: parseInt(e.target.value) || 1})} />
                  </div>
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-emerald-700 transition-all active:scale-[0.98] mt-4">Confirm Registration</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Action Operation Modal */}
      {showOperationModal && activeInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="p-12 space-y-10">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit">Pending Action</div>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">System Ready</h3>
                </div>
                <button onClick={() => setShowOperationModal(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <button onClick={() => { setShowOperationModal(false); setView('invoice-preview'); }} className="group relative bg-slate-50 border-2 border-transparent hover:border-emerald-500 p-8 rounded-[2.5rem] transition-all text-left space-y-4">
                  <div className="bg-white p-4 rounded-2xl text-emerald-600 shadow-sm inline-block group-hover:scale-110 transition-transform"><Eye size={32}/></div>
                  <h4 className="text-lg font-black text-slate-900">Preview Invoice</h4>
                  <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all"><ArrowRight size={24} className="text-emerald-500"/></div>
                </button>
                <button onClick={handleSaveInvoice} className="bg-slate-900 text-white p-8 rounded-[2.5rem] font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-black transition-all">Save To Manifest</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showActionModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-lg rounded-[3.5rem] shadow-2xl p-12 text-center space-y-8 relative overflow-hidden">
            <div className="flex justify-center"><div className="bg-emerald-100 p-8 rounded-full text-emerald-600 shadow-inner"><FileCheck size={56} /></div></div>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Records Synced</h3>
            <button onClick={() => setShowActionModal(false)} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase text-sm shadow-xl">Complete Workflow</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

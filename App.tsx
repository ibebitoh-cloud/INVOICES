
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
  Image, PlusCircle, Compass, Leaf, Sunrise, ScrollText
} from 'lucide-react';
import { Booking, Invoice, InvoiceSectionId, TemplateConfig, UserProfile, TemplateFields, GroupingType, InvoiceTheme, CustomerConfig } from './types';
import { parseCurrency, formatCurrency, exportToCSV } from './utils/formatters';
import InvoiceDocument from './components/InvoiceDocument';

const DEFAULT_COMPANY_LOGO = "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&q=80&w=200&h=200";

const THEMES: { id: InvoiceTheme, label: string, desc: string, icon: any, color: string }[] = [
  { id: 'logistics-grid', label: 'Classic Logistics', desc: 'Heavy borders, official grid layout', icon: TableIcon, color: 'bg-emerald-600' },
  { id: 'corporate', label: 'Corporate Clean', desc: 'Minimal, business-standard style', icon: Briefcase, color: 'bg-slate-900' },
  { id: 'luxury-gold', label: 'Luxury Gold', desc: 'Premium executive dark/gold theme', icon: Award, color: 'bg-amber-500' },
  { id: 'vintage', label: 'Vintage Archive', desc: 'Typewriter fonts on aged paper', icon: ScrollText, color: 'bg-orange-200' },
  { id: 'eco-green', label: 'Eco Green', desc: 'Soft earthy tones for natural brands', icon: Leaf, color: 'bg-green-500' },
  { id: 'sunset-vibe', label: 'Sunset Glow', desc: 'Vibrant warm gradients & modern fonts', icon: Sunrise, color: 'bg-orange-500' },
  // Fixed: removed duplicate 'label' property in the object below
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  
  const [view, setView] = useState<'dashboard' | 'invoice-preview' | 'profile' | 'edit-invoice' | 'settings' | 'customers' | 'batch-summary'>('dashboard');
  
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [batchInvoices, setBatchInvoices] = useState<Invoice[]>([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState<{ count: number } | null>(null);

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
  useEffect(() => {
    const toSave = { ...templateConfig, hiddenSections: Array.from(templateConfig.hiddenSections) };
    localStorage.setItem('template_config', JSON.stringify(toSave));
  }, [templateConfig]);

  const toggleBooking = (id: string) => {
    const target = bookings.find(b => b.id === id);
    if (!target) return;
    
    // Auto-select all items with same booking number (Strict grouping)
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

  const handleDuplicateSelected = () => {
    const toDup = bookings.filter(b => selectedIds.has(b.id));
    const newSelectedIds = new Set<string>();
    const newItems = toDup.map(item => {
      const newId = `booking-dup-${Date.now()}-${Math.random()}`;
      newSelectedIds.add(newId);
      return {
        ...item,
        id: newId,
        invNo: '',
        status: 'PENDING'
      };
    });
    setBookings(prev => [...newItems, ...prev]);
    setSelectedIds(newSelectedIds);
    setDuplicateAlert({ count: toDup.length });
  };

  const handleArchiveSelected = () => {
    const updated = bookings.filter(b => !selectedIds.has(b.id));
    setBookings(updated);
    setSelectedIds(new Set());
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const allRows = text.split('\n').filter(l => l.trim()).map(row => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/));
      if (allRows.length === 0) return;
      const headers = allRows[0].map(h => h.replace(/"/g, '').trim().toLowerCase());
      const findCol = (keys: string[]) => headers.findIndex(h => keys.some(k => h.includes(k)));
      const mapping = {
        bookingNo: findCol(['booking', 'bk no']), 
        reefer: findCol(['container', 'unit', 'reefer']),
        shipper: findCol(['shipper']), 
        shipperAddress: findCol(['shipper address', 'address']), 
        trucker: findCol(['trucker']),
        rate: findCol(['rate', 'amount']), 
        customer: findCol(['customer', 'consignee']),
        vat: findCol(['vat', 'tax']), 
        date: findCol(['date']),
        goPort: findCol(['go port', 'origin']),
        giPort: findCol(['gi port', 'destination'])
      };
      
      const newBookings: Booking[] = [];
      const newCustomersToRegister = new Set<string>();
      let duplicateCount = 0;

      allRows.slice(1).forEach((row, idx) => {
        const clean = (valIdx: number) => (valIdx !== -1 && row[valIdx]) ? row[valIdx].replace(/"/g, '').trim() : '';
        const rVal = parseCurrency(clean(mapping.rate));
        const vVal = parseCurrency(clean(mapping.vat));
        const custName = clean(mapping.customer) || 'Unnamed Client';
        const bkNo = clean(mapping.bookingNo) || '---';
        const rfNo = clean(mapping.reefer) || '---';

        const isDuplicate = bookings.some(b => b.bookingNo === bkNo && b.reeferNumber === rfNo);
        if (isDuplicate) duplicateCount++;

        newCustomersToRegister.add(custName);

        newBookings.push({
          id: `booking-${idx}-${Date.now()}`,
          customer: custName,
          shipper: clean(mapping.shipper) || '---',
          bookingNo: bkNo,
          reeferNumber: rfNo,
          shipperAddress: clean(mapping.shipperAddress) || '---',
          trucker: clean(mapping.trucker) || '---',
          rate: clean(mapping.rate) || '0',
          rateValue: rVal,
          vat: clean(mapping.vat) || '0',
          vatValue: vVal,
          bookingDate: clean(mapping.date) || new Date().toISOString().split('T')[0],
          status: 'PENDING', 
          goPort: clean(mapping.goPort) || '---', 
          giPort: clean(mapping.giPort) || '---', 
          totalBooking: '', customerRef: '', gops: '', dateOfClipOn: '', clipOffDate: '', 
          beneficiaryName: '', gensetNo: '---', res: '', gaz: '', remarks: '', 
          gensetFaultDescription: '', invNo: '', invDate: '', invIssueDate: ''
        });
      });

      setCustomerConfigs(prev => {
        const existingNames = new Set(prev.map(c => c.name.toLowerCase()));
        const toAdd: CustomerConfig[] = [];
        newCustomersToRegister.forEach(name => {
          if (!existingNames.has(name.toLowerCase())) {
            toAdd.push({
              id: `cust-${Date.now()}-${Math.random()}`,
              name,
              prefix: 'GS',
              nextNumber: 1
            });
          }
        });
        return [...prev, ...toAdd];
      });

      setBookings(prev => [...newBookings, ...prev]);
      if (duplicateCount > 0) setDuplicateAlert({ count: duplicateCount });
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleManualBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBooking.customer || !manualBooking.bookingNo) {
      alert("Please enter at least Client and Booking Number.");
      return;
    }

    const newId = `booking-manual-${Date.now()}`;
    const rateVal = manualBooking.rateValue || 0;
    const vatVal = rateVal * 0.14; // Default VAT 14%

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

    setBookings(prev => [newEntry, ...prev]);
    
    // Auto-register customer if new
    setCustomerConfigs(prev => {
      if (!prev.find(c => c.name.toLowerCase() === newEntry.customer.toLowerCase())) {
        return [...prev, {
          id: `cust-${Date.now()}`,
          name: newEntry.customer,
          prefix: 'GS',
          nextNumber: 1
        }];
      }
      return prev;
    });

    setShowManualEntryModal(false);
    setManualBooking({
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
  };

  const getInvoiceNumber = (customerName: string, offset: number = 0) => {
    const config = customerConfigs.find(c => c.name.toLowerCase() === customerName.toLowerCase());
    if (config) return `${config.prefix}${config.nextNumber + offset}`;
    return `INV-${Math.floor(Math.random() * 900000 + 100000 + offset)}`;
  };

  const incrementSerial = (customerName: string, count: number = 1) => {
    setCustomerConfigs(prev => prev.map(c => 
      c.name.toLowerCase() === customerName.toLowerCase() ? { ...c, nextNumber: c.nextNumber + count } : c
    ));
  };

  const triggerOperation = () => {
    const selectedItems = bookings.filter(b => selectedIds.has(b.id));
    if (selectedItems.length === 0) return;

    // Group selected items by booking number automatically
    const groups = new Map<string, Booking[]>();
    selectedItems.forEach(item => {
      const key = item.bookingNo || '---';
      const existing = groups.get(key) || [];
      existing.push(item);
      groups.set(key, existing);
    });

    const generatedInvoices: Invoice[] = [];
    let idx = 0;
    groups.forEach((items, bkNo) => {
      const firstItem = items[0];
      const subtotal = items.reduce((acc, curr) => acc + curr.rateValue, 0);
      const tax = items.reduce((acc, curr) => acc + curr.vatValue, 0);
      
      generatedInvoices.push({
        id: `INV-${bkNo}-${Date.now()}`,
        invoiceNumber: getInvoiceNumber(firstItem.customer, idx++),
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

    if (generatedInvoices.length > 1) {
      setBatchInvoices(generatedInvoices);
      setView('batch-summary');
    } else {
      setActiveInvoice(generatedInvoices[0]);
      setShowOperationModal(true);
    }
  };

  const handleSaveBatch = () => {
    let updatedBookings = [...bookings];
    batchInvoices.forEach(inv => {
      updatedBookings = updatedBookings.map(b => {
        if (inv.items.find(item => item.id === b.id)) return { ...b, invNo: inv.invoiceNumber };
        return b;
      });
      incrementSerial(inv.customerName);
    });
    setBookings(updatedBookings);
    setSelectedIds(new Set());
    setBatchInvoices([]);
    setView('dashboard');
    setShowActionModal(true);
  };

  const handleQuickPreview = () => {
    setShowOperationModal(false);
    setView('invoice-preview');
  };

  const handleDetailedEdit = () => {
    setShowOperationModal(false);
    setView('edit-invoice');
  };

  const handleSaveInvoice = () => {
    if (!activeInvoice) return;
    const updatedBookings = bookings.map(b => {
      if (activeInvoice.items.find(item => item.id === b.id)) return { ...b, invNo: activeInvoice.invoiceNumber };
      return b;
    });
    setBookings(updatedBookings);
    incrementSerial(activeInvoice.customerName);
    setSelectedIds(new Set());
    setShowActionModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'signature' | 'watermark') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (type === 'logo') setProfile(prev => ({ ...prev, logoUrl: dataUrl }));
      else if (type === 'signature') setProfile(prev => ({ ...prev, signatureUrl: dataUrl }));
      else if (type === 'watermark') setProfile(prev => ({ ...prev, watermarkUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const toggleField = (field: keyof TemplateFields) => {
    setTemplateConfig(prev => ({
      ...prev,
      fields: { ...prev.fields, [field]: !prev.fields[field] }
    }));
  };

  const filteredBookings = bookings.filter(b => 
    (!searchTerm || b.bookingNo.toLowerCase().includes(searchTerm.toLowerCase()) || b.reeferNumber.toLowerCase().includes(searchTerm.toLowerCase()) || b.customer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const groupedInvoiceItems = useMemo(() => {
    if (!activeInvoice) return [];
    const groups = new Map<string, Booking[]>();
    activeInvoice.items.forEach(item => {
      const key = item.bookingNo || item.id;
      const existing = groups.get(key) || [];
      existing.push(item);
      groups.set(key, existing);
    });
    return Array.from(groups.entries());
  }, [activeInvoice?.items]);

  const updateTheme = (themeId: InvoiceTheme) => {
    setTemplateConfig(prev => ({ ...prev, theme: themeId }));
    if (activeInvoice) {
      setActiveInvoice({
        ...activeInvoice,
        templateConfig: {
          ...(activeInvoice.templateConfig || templateConfig),
          theme: themeId
        }
      });
    }
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
              <button key={item.id} onClick={() => setView(item.id as any)} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === item.id || (view === 'edit-invoice' && item.id === 'dashboard') || (view === 'invoice-preview' && item.id === 'dashboard') || (view === 'batch-summary' && item.id === 'dashboard') ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <item.icon size={18} /> {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-8 border-t border-white/5">
          <div className="flex flex-col gap-1 items-start">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-tight">{profile.companyName}</span>
            <span className="text-xs font-black text-white tracking-tight leading-none">SHERIF HEGAZY</span>
            <div className="mt-4 flex flex-col gap-0.5">
              <span className="text-[7px] font-black uppercase tracking-[0.4em] text-slate-500">Powered by <span className="text-slate-400">Bebito</span></span>
              <span className="text-[6px] font-bold text-slate-500 tracking-[0.2em]">+201146475759</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto custom-scroll relative">
        <div className="max-w-6xl mx-auto p-12 print:p-0">
          {view === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex justify-between items-end">
                <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">Fleet Manifest</h2><p className="text-slate-500 font-medium mt-1">Automatic grouping by Booking No. is enabled.</p></div>
                <div className="flex gap-3">
                   <button onClick={() => setBookings([])} className="bg-white text-slate-500 border border-slate-200 px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors"><Trash2 size={16}/> Clear All</button>
                   <button onClick={() => setShowManualEntryModal(true)} className="bg-emerald-50 text-emerald-700 px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-emerald-100 transition-colors"><PlusCircle size={16}/> Add Booking</button>
                   <label className="cursor-pointer bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 shadow-xl hover:bg-emerald-700 transition-all">
                      <FileUp size={16}/> Import CSV
                      <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                   </label>
                </div>
              </header>

              {duplicateAlert && (
                <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-300">
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-500 p-3 rounded-2xl text-white shadow-lg"><AlertTriangle size={24}/></div>
                    <div>
                      <h4 className="font-black text-amber-900 uppercase text-xs tracking-widest">Duplicate Detected</h4>
                      <p className="text-sm font-bold text-amber-700">{duplicateAlert.count} bookings in your manifest have the same identifier.</p>
                    </div>
                  </div>
                  <button onClick={() => setDuplicateAlert(null)} className="p-2 text-amber-300 hover:text-amber-900 transition-colors"><X size={20}/></button>
                </div>
              )}

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
                <div className="flex gap-2">
                   <button disabled={selectedIds.size === 0} onClick={handleDuplicateSelected} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl font-black uppercase text-[10px] hover:bg-emerald-100 transition-all disabled:opacity-30"><Copy size={14}/> Duplicate & Select</button>
                   <button disabled={selectedIds.size === 0} onClick={handleArchiveSelected} className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl font-black uppercase text-[10px] hover:bg-red-100 transition-all disabled:opacity-30"><Archive size={14}/> Remove Selected</button>
                   <button onClick={() => {
                     const ids = new Set<string>();
                     bookings.filter(b => !b.invNo).forEach(b => ids.add(b.id));
                     setSelectedIds(ids);
                   }} className="flex items-center gap-2 bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl font-black uppercase text-[10px] hover:bg-slate-100 transition-all ml-auto"><ListChecks size={14}/> Select All Pending</button>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b font-black text-slate-400 uppercase tracking-widest text-[10px]">
                    <tr><th className="py-5 px-6 w-12 text-center">#</th><th className="py-5 px-4">Client</th><th className="py-5 px-4">Booking</th><th className="py-5 px-4">Unit</th><th className="py-5 px-4">Rate</th><th className="py-5 px-4 text-center">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredBookings.length === 0 ? (
                      <tr><td colSpan={6} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest">No manifest entries</td></tr>
                    ) : (
                      filteredBookings.map((b, idx) => {
                        const isDuplicateRow = filteredBookings.some((item, i) => i !== idx && item.bookingNo === b.bookingNo && item.reeferNumber === b.reeferNumber);
                        return (
                          <tr key={b.id} className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedIds.has(b.id) ? 'bg-emerald-50 border-l-4 border-emerald-500' : 'border-l-4 border-transparent'} ${isDuplicateRow ? 'bg-amber-50/30' : ''}`} onClick={() => toggleBooking(b.id)}>
                            <td className="py-5 px-6 text-center"><input type="checkbox" className="w-5 h-5 rounded cursor-pointer accent-emerald-600" checked={selectedIds.has(b.id)} onChange={() => toggleBooking(b.id)} /></td>
                            <td className="py-5 px-4 font-bold text-slate-900">{b.customer}</td>
                            <td className="py-5 px-4 font-mono text-slate-500">{b.bookingNo}</td>
                            <td className="py-5 px-4 font-mono font-bold text-emerald-600 flex items-center gap-2">
                              {b.reeferNumber}
                              {isDuplicateRow && <div title="Duplicate identifier found" className="bg-amber-100 text-amber-600 p-1 rounded-md"><AlertTriangle size={12}/></div>}
                            </td>
                            <td className="py-5 px-4 font-black text-slate-900">{formatCurrency(b.rateValue, 'EGP')}</td>
                            <td className="py-5 px-4 text-center">{b.invNo ? <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase bg-emerald-100 text-emerald-700">BILLED</span> : <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase bg-slate-100 text-slate-400">PENDING</span>}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'batch-summary' && (
            <div className="space-y-10 animate-in fade-in duration-500 pb-20">
              <header className="flex justify-between items-end">
                 <div><h2 className="text-4xl font-black text-slate-900 tracking-tight">Batch Generation</h2><p className="text-slate-500 font-medium mt-1">Ready to create {batchInvoices.length} individual invoices.</p></div>
                 <div className="flex gap-4">
                   <button onClick={() => setView('dashboard')} className="bg-white text-slate-400 px-8 py-4 rounded-2xl font-black uppercase text-xs">Cancel</button>
                   <button onClick={handleSaveBatch} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Process {batchInvoices.length} Invoices</button>
                 </div>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {batchInvoices.map(inv => (
                   <div key={inv.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-4">
                     <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{inv.invoiceNumber}</p>
                          <h3 className="text-xl font-black text-slate-900">{inv.customerName}</h3>
                        </div>
                        <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-black">{formatCurrency(inv.total, inv.currency)}</span>
                     </div>
                     <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                       {inv.items.map(it => (
                         <span key={it.id} className="text-[9px] font-black bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-slate-500">{it.reeferNumber}</span>
                       ))}
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <header>
                 <h2 className="text-4xl font-black text-slate-900 tracking-tight">Templates & Styles</h2>
                 <p className="text-slate-500 font-medium mt-1">Configure what information appears on your documents.</p>
               </header>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-10">
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
                       <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 border-b pb-6"><Maximize2 size={24} className="text-emerald-500"/> Dimensions & Fitting</h3>
                       <div className="space-y-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-black text-slate-400 uppercase flex items-center gap-2"><Minimize2 size={14}/> Content Scale</label>
                              <span className="bg-slate-50 px-3 py-1 rounded-lg text-xs font-black">{Math.round(templateConfig.contentScale * 100)}%</span>
                            </div>
                            <input type="range" min="0.5" max="1.5" step="0.05" className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" value={templateConfig.contentScale} onChange={e => setTemplateConfig({...templateConfig, contentScale: parseFloat(e.target.value)})} />
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-black text-slate-400 uppercase flex items-center gap-2"><MoveVertical size={14}/> Section Spacing</label>
                              <span className="bg-slate-50 px-3 py-1 rounded-lg text-xs font-black">{templateConfig.verticalSpacing}px</span>
                            </div>
                            <input type="range" min="0" max="40" step="2" className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" value={templateConfig.verticalSpacing} onChange={e => setTemplateConfig({...templateConfig, verticalSpacing: parseInt(e.target.value)})} />
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-black text-slate-400 uppercase flex items-center gap-2"><MoveHorizontal size={14}/> Safety Margins</label>
                              <span className="bg-slate-50 px-3 py-1 rounded-lg text-xs font-black">{templateConfig.horizontalPadding}mm</span>
                            </div>
                            <input type="range" min="5" max="25" step="1" className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" value={templateConfig.horizontalPadding} onChange={e => setTemplateConfig({...templateConfig, horizontalPadding: parseInt(e.target.value)})} />
                          </div>
                       </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
                       <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 border-b pb-6"><SettingsIcon size={24} className="text-emerald-500"/> Content Toggles</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(templateConfig.fields).map(([key, val]) => (
                            <button key={key} onClick={() => toggleField(key as keyof TemplateFields)} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${val ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                               <span className={`text-[11px] font-black uppercase tracking-tight ${val ? 'text-emerald-900' : 'text-slate-500'}`}>{key.replace('show', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                               {val ? <Eye size={16} className="text-emerald-600" /> : <EyeOff size={16} className="text-slate-300" />}
                            </button>
                          ))}
                       </div>
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 border-b pb-6"><Palette size={24} className="text-emerald-500"/> Global Theme</h3>
                     <div className="grid grid-cols-1 gap-3 max-h-[800px] overflow-y-auto pr-2 custom-scroll">
                        {THEMES.map(t => (
                          <button key={t.id} onClick={() => setTemplateConfig({...templateConfig, theme: t.id})} className={`flex items-center gap-4 p-5 rounded-3xl transition-all border-2 text-left ${templateConfig.theme === t.id ? 'bg-emerald-50 border-emerald-500 shadow-md scale-[1.02]' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                             <div className={`p-4 rounded-2xl ${t.color} text-white shadow-lg`}><t.icon size={24}/></div>
                             <div><p className={`font-black text-base ${templateConfig.theme === t.id ? 'text-emerald-900' : 'text-slate-800'}`}>{t.label}</p><p className="text-[11px] font-medium text-slate-400 mt-0.5">{t.desc}</p></div>
                             {templateConfig.theme === t.id && <div className="ml-auto bg-emerald-600 text-white p-1 rounded-full"><Check size={16}/></div>}
                          </button>
                        ))}
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
                      <button onClick={() => setView('edit-invoice')} className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2 hover:bg-slate-200 transition-all"><Wand2 size={18}/> Studio</button>
                      <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2 shadow-xl hover:bg-black transition-all active:scale-95"><Printer size={18}/> Print PDF</button>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Choose Visual Style</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scroll no-scrollbar">
                       {THEMES.map(t => {
                         const isActive = (activeInvoice.templateConfig?.theme || templateConfig.theme) === t.id;
                         return (
                          <button key={t.id} onClick={() => updateTheme(t.id)} className={`flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all ${isActive ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-600 hover:border-slate-200'}`}>
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

          {view === 'edit-invoice' && activeInvoice && (
            <div className="space-y-10 animate-in fade-in duration-500 pb-20">
              <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <button onClick={() => setView('dashboard')} className="p-3 bg-slate-50 rounded-2xl text-slate-400"><ChevronLeft size={24} /></button>
                  <div><h2 className="text-3xl font-black text-slate-900">Finalize Billing</h2><p className="text-slate-500 font-bold uppercase text-[10px]">Reference: {activeInvoice.invoiceNumber}</p></div>
                </div>
                <button onClick={handleSaveInvoice} className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl uppercase text-xs active:scale-95 transition-all">Generate & Save</button>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 h-fit">
                   <h3 className="text-xl font-black text-slate-900 pb-4 border-b uppercase tracking-tighter">Bill Configuration</h3>
                   <div className="space-y-4">
                      <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Serial No.</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={activeInvoice.invoiceNumber} onChange={e => setActiveInvoice({...activeInvoice, invoiceNumber: e.target.value})} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Issue Date</label><input type="date" className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={activeInvoice.date} onChange={e => setActiveInvoice({...activeInvoice, date: e.target.value})} /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Due Date</label><input type="date" className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-red-600 outline-none" value={activeInvoice.dueDate} onChange={e => setActiveInvoice({...activeInvoice, dueDate: e.target.value})} /></div>
                      </div>
                      <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Notes</label><textarea rows={3} className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none resize-none" value={activeInvoice.notes} onChange={e => setActiveInvoice({...activeInvoice, notes: e.target.value})} /></div>
                   </div>
                </div>
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                   <h3 className="text-xl font-black text-slate-900 pb-4 border-b mb-6 uppercase tracking-tighter">Line Items (Auto-Summed by Booking)</h3>
                   <div className="space-y-4">
                      {groupedInvoiceItems.map(([bkNo, group], idx) => {
                        const summedRate = group.reduce((a,c) => a + c.rateValue, 0);
                        return (
                          <div key={bkNo} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 grid grid-cols-4 gap-4 items-center shadow-sm">
                            <div className="col-span-2 space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking: {bkNo}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {group.map(u => (
                                  <span key={u.id} className="text-[9px] font-black bg-white px-2 py-0.5 rounded border border-slate-100 text-emerald-600">{u.reeferNumber}</span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Group Sum</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">EGP</span>
                                <input 
                                  type="number" 
                                  className="w-full bg-white pl-10 p-3 rounded-xl font-black border border-slate-200 outline-none text-sm focus:ring-2 focus:ring-emerald-500 transition-all" 
                                  value={summedRate} 
                                  onChange={e => { 
                                    const newVal = parseFloat(e.target.value) || 0;
                                    const perItemRate = newVal / group.length;
                                    const newAllItems = [...activeInvoice.items];
                                    
                                    group.forEach(gItem => {
                                      const index = newAllItems.findIndex(i => i.id === gItem.id);
                                      if (index !== -1) {
                                        newAllItems[index] = { ...newAllItems[index], rateValue: perItemRate, rate: perItemRate.toString() };
                                      }
                                    });
                                    
                                    const sub = newAllItems.reduce((acc, curr) => acc + curr.rateValue, 0);
                                    setActiveInvoice({...activeInvoice, items: newAllItems, subtotal: sub, tax: sub * 0.14, total: sub * 1.14}); 
                                  }} 
                                />
                              </div>
                            </div>
                            <button 
                              onClick={() => { 
                                const newItems = activeInvoice.items.filter(i => (i.bookingNo || i.id) !== bkNo); 
                                if(newItems.length === 0) {setView('dashboard'); return;} 
                                const sub = newItems.reduce((acc, curr) => acc + curr.rateValue, 0); 
                                setActiveInvoice({...activeInvoice, items: newItems, subtotal: sub, tax: sub * 0.14, total: sub * 1.14}); 
                              }} 
                              className="p-3 text-slate-300 hover:text-red-500 transition-colors ml-auto bg-white rounded-xl shadow-sm hover:shadow-md"
                            >
                              <Trash2 size={20}/>
                            </button>
                          </div>
                        );
                      })}
                   </div>
                </div>
              </div>
            </div>
          )}

          {view === 'profile' && (
            <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500">
               <div className="flex justify-between items-end"><div><h2 className="text-4xl font-black text-slate-900 tracking-tight">Identity</h2><p className="text-slate-500 font-medium mt-1">Brand assets and official watermark.</p></div><button onClick={() => {localStorage.setItem('user_profile', JSON.stringify(profile)); alert('Identity Saved!');}} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl uppercase text-xs active:scale-95 transition-all">Save Identity</button></div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-6 h-fit">
                    <h3 className="text-xl font-black text-slate-900 pb-4 border-b uppercase tracking-tight">Business Profile</h3>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Entity Name</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.companyName} onChange={e => setProfile({...profile, companyName: e.target.value})} /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Tax Identifier</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.taxId} onChange={e => setProfile({...profile, taxId: e.target.value})} /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Manager Name</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Address</label><textarea rows={3} className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none resize-none" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} /></div>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center gap-6 group relative">
                      <p className="text-[10px] font-black text-slate-400 uppercase w-full">Brand Logo</p>
                      {profile.logoUrl ? <img src={profile.logoUrl} className="h-40 w-full object-contain shadow-inner rounded-3xl border-2 border-slate-50 p-6" /> : <div className="h-40 w-full bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200"><ImageIcon size={64}/></div>}
                      <label className="cursor-pointer bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-emerald-600 shadow-xl"><FileUp size={16} className="inline mr-2"/> Upload Logo<input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} /></label>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center gap-6 group relative">
                      <p className="text-[10px] font-black text-slate-400 uppercase w-full">Official Signature</p>
                      {profile.signatureUrl ? <img src={profile.signatureUrl} className="h-32 w-full object-contain shadow-inner rounded-3xl border-2 border-slate-50 p-4 bg-white" /> : <div className="h-32 w-full bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200"><PenTool size={48}/></div>}
                      <label className="cursor-pointer bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-emerald-600 shadow-xl"><FileUp size={16} className="inline mr-2"/> Upload Signature<input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'signature')} /></label>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8 flex flex-col items-center group relative">
                      <p className="text-[10px] font-black text-slate-400 uppercase w-full">Watermark Image</p>
                      {profile.watermarkUrl ? (
                        <div className="relative w-full h-32 flex items-center justify-center bg-slate-50 rounded-3xl overflow-hidden">
                           <img src={profile.watermarkUrl} className="max-h-full object-contain" style={{ opacity: profile.watermarkOpacity || 0.1 }} />
                        </div>
                      ) : (
                        <div className="h-32 w-full bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200"><Image size={48}/></div>
                      )}
                      
                      <div className="w-full space-y-4">
                        <label className="cursor-pointer bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-emerald-600 shadow-xl w-full text-center block"><FileUp size={16} className="inline mr-2"/> Upload Watermark<input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'watermark')} /></label>
                        
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase w-full flex justify-between"><span>Opacity</span> <span>{Math.round(profile.watermarkOpacity * 100)}%</span></p>
                          <input type="range" min="0" max="0.3" step="0.01" className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" value={profile.watermarkOpacity} onChange={e => setProfile({...profile, watermarkOpacity: parseFloat(e.target.value)})} />
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {view === 'customers' && (
             <div className="space-y-8 animate-in fade-in duration-500">
                <header className="flex justify-between items-end">
                   <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">Client Database</h2><p className="text-slate-500 font-medium mt-1">Manage billing rules and prefixes per customer.</p></div>
                   <button onClick={() => { const n = prompt("Client Name:"); if(n) setCustomerConfigs([...customerConfigs, { id: Date.now().toString(), name: n, prefix: 'GS', nextNumber: 1 }]); }} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-xl hover:bg-emerald-700 transition-all active:scale-95"><Plus size={18}/> New Client</button>
                </header>
                {customerConfigs.length === 0 ? (
                  <div className="bg-white rounded-[2.5rem] p-24 text-center border-2 border-dashed border-slate-200 flex flex-col items-center gap-6">
                    <div className="bg-slate-50 p-6 rounded-full text-slate-200"><Users size={64}/></div>
                    <div><h3 className="text-xl font-black text-slate-900">No customers registered</h3><p className="text-slate-500 mt-2">New client configurations will appear here automatically when you import CSVs.</p></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {customerConfigs.map(config => (
                      <div key={config.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 relative group">
                        <button onClick={() => setCustomerConfigs(customerConfigs.filter(c => c.id !== config.id))} className="absolute top-6 right-6 p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                        <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 w-fit mb-6"><Users size={24}/></div>
                        <h3 className="text-xl font-black text-slate-900 truncate pr-8">{config.name}</h3>
                        <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-50">
                          <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Prefix</label><input className="w-full bg-slate-50 p-3 rounded-xl font-black text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all" value={config.prefix} onChange={e => setCustomerConfigs(customerConfigs.map(c => c.id === config.id ? {...c, prefix: e.target.value} : c))} /></div>
                          <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Next No.</label><input type="number" className="w-full bg-slate-50 p-3 rounded-xl font-black text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all" value={config.nextNumber} onChange={e => setCustomerConfigs(customerConfigs.map(c => c.id === config.id ? {...c, nextNumber: parseInt(e.target.value) || 1} : c))} /></div>
                        </div>
                        <div className="mt-8 flex items-center justify-between">
                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active Serial</span>
                           <span className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-xs">{config.prefix}{config.nextNumber}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">New Booking Manual Entry</h3>
                <button onClick={() => setShowManualEntryModal(false)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><X size={24}/></button>
              </div>
              
              <form onSubmit={handleManualBookingSubmit} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Billing Client (Customer)</label>
                   <input required className="w-full bg-slate-50 p-3 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={manualBooking.customer} onChange={e => setManualBooking({...manualBooking, customer: e.target.value})} placeholder="e.g., Global Logistics S.A." />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Booking No.</label>
                   <input required className="w-full bg-slate-50 p-3 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={manualBooking.bookingNo} onChange={e => setManualBooking({...manualBooking, bookingNo: e.target.value})} placeholder="BK123456" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Container Number (Reefer)</label>
                   <input className="w-full bg-slate-50 p-3 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={manualBooking.reeferNumber} onChange={e => setManualBooking({...manualBooking, reeferNumber: e.target.value})} placeholder="MWCU1234567" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Port On (Origin)</label>
                   <input className="w-full bg-slate-50 p-3 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={manualBooking.goPort} onChange={e => setManualBooking({...manualBooking, goPort: e.target.value})} placeholder="Port Said" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Port Out (Destination)</label>
                   <input className="w-full bg-slate-50 p-3 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={manualBooking.giPort} onChange={e => setManualBooking({...manualBooking, giPort: e.target.value})} placeholder="Alexandria" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Unit Rate (Amount)</label>
                   <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">EGP</span>
                      <input type="number" className="w-full bg-slate-50 pl-10 p-3 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={manualBooking.rateValue} onChange={e => setManualBooking({...manualBooking, rateValue: parseFloat(e.target.value) || 0})} />
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Shipper Name</label>
                   <input className="w-full bg-slate-50 p-3 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={manualBooking.shipper} onChange={e => setManualBooking({...manualBooking, shipper: e.target.value})} placeholder="Export Co." />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Trucker Name</label>
                   <input className="w-full bg-slate-50 p-3 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={manualBooking.trucker} onChange={e => setManualBooking({...manualBooking, trucker: e.target.value})} placeholder="Fast Trans" />
                </div>
                <div className="col-span-2 space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Address Details</label>
                   <textarea rows={2} className="w-full bg-slate-50 p-3 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none resize-none" value={manualBooking.shipperAddress} onChange={e => setManualBooking({...manualBooking, shipperAddress: e.target.value})} placeholder="Full address for invoice parties section..." />
                </div>
                <button type="submit" className="col-span-2 bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-emerald-700 transition-all active:scale-[0.98] mt-4">Save Entry to Manifest</button>
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
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Fleet Operation</h3>
                  <p className="text-slate-500 font-bold text-sm">Invoice {activeInvoice.invoiceNumber} for {activeInvoice.customerName} is ready.</p>
                </div>
                <button onClick={() => setShowOperationModal(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <button onClick={handleQuickPreview} className="group relative bg-slate-50 border-2 border-transparent hover:border-emerald-500 p-8 rounded-[2.5rem] transition-all text-left space-y-4">
                  <div className="bg-white p-4 rounded-2xl text-emerald-600 shadow-sm inline-block group-hover:scale-110 transition-transform"><Eye size={32}/></div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">View Invoice</h4>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Open instant preview & print</p>
                  </div>
                  <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all"><ArrowRight size={24} className="text-emerald-500"/></div>
                </button>

                <button onClick={handleDetailedEdit} className="group relative bg-slate-50 border-2 border-transparent hover:border-slate-900 p-8 rounded-[2.5rem] transition-all text-left space-y-4">
                  <div className="bg-white p-4 rounded-2xl text-slate-900 shadow-sm inline-block group-hover:scale-110 transition-transform"><Wand2 size={32}/></div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Custom Studio</h4>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Refine rates, notes & items</p>
                  </div>
                  <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all"><ArrowRight size={24} className="text-slate-900"/></div>
                </button>
              </div>

              <div className="bg-emerald-950 text-white p-8 rounded-[2.5rem] flex items-center justify-between shadow-xl shadow-emerald-200">
                <div className="flex items-center gap-6">
                   <div className="bg-emerald-500/20 p-4 rounded-2xl"><Banknote size={32} className="text-emerald-400" /></div>
                   <div>
                     <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Summary Total</p>
                     <p className="text-3xl font-black tracking-tighter">{formatCurrency(activeInvoice.total, activeInvoice.currency)}</p>
                   </div>
                </div>
                <button onClick={handleSaveInvoice} className="bg-white text-emerald-900 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-50 active:scale-95 transition-all shadow-lg">Commit To System</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {showActionModal && activeInvoice && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-lg rounded-[3.5rem] shadow-2xl p-12 text-center space-y-8 relative overflow-hidden border border-slate-100">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50"></div>
            <button onClick={() => setShowActionModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500 transition-colors z-20"><X size={24} /></button>
            <div className="flex justify-center relative z-10"><div className="bg-emerald-100 p-8 rounded-full text-emerald-600 shadow-inner"><FileCheck size={56} /></div></div>
            <div className="relative z-10"><h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Records Synced</h3><p className="text-slate-500 font-bold uppercase text-[10px] mt-2 tracking-[0.3em]">Operational Flow Complete</p></div>
            <div className="flex flex-col gap-3 pt-4 relative z-10">
              <button onClick={() => {setShowActionModal(false); setView('invoice-preview');}} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase text-sm shadow-xl shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95">Open Live Preview <ExternalLink size={20}/></button>
              <button onClick={() => setShowActionModal(false)} className="w-full bg-slate-50 text-slate-400 py-4 rounded-2xl font-black uppercase text-xs hover:bg-white transition-all">Dismiss Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

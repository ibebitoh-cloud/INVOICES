
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
  ExternalLink, MousePointerClick, Banknote, AlertTriangle, AlertCircle, Info, ListChecks,
  Maximize2, Minimize2, MoveHorizontal, MoveVertical,
  PlusCircle, Compass, Leaf, Sunrise, ScrollText, FlaskConical, Beaker,
  ShieldCheck, Key, Cpu, Paintbrush, Building2, Hash, Edit3,
  FileText, Activity, Layers2, FileOutput, Globe, Phone, Landmark, Sliders, ToggleRight, ToggleLeft, Save
} from 'lucide-react';
import { Booking, Invoice, InvoiceSectionId, TemplateConfig, UserProfile, TemplateFields, GroupingType, InvoiceTheme, CustomerConfig, CustomTheme } from './types';
import { parseCurrency, formatCurrency, exportToCSV } from './utils/formatters';
import InvoiceDocument from './components/InvoiceDocument';

const DEFAULT_COMPANY_LOGO = "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&q=80&w=200&h=200";

const STANDARD_THEMES: { id: InvoiceTheme, label: string, desc: string, icon: any, color: string }[] = [
  { id: 'logistics-grid', label: 'Classic Logistics', desc: 'Heavy borders, official grid layout', icon: TableIcon, color: 'bg-emerald-600' },
  { id: 'corporate', label: 'Corporate Clean', desc: 'Minimal, business-standard style', icon: Briefcase, color: 'bg-slate-900' },
  { id: 'luxury-gold', label: 'Luxury Gold', desc: 'Premium executive dark/gold theme', icon: Award, color: 'bg-amber-500' },
  { id: 'vintage', label: 'Vintage Archive', desc: 'Typewriter fonts on aged paper', icon: ScrollText, color: 'bg-orange-200' },
  { id: 'swiss-modern', label: 'Swiss Modern', desc: 'High contrast, bold grotesk font', icon: Grid3X3, color: 'bg-red-600' },
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
  
  const [view, setView] = useState<'dashboard' | 'invoice-preview' | 'profile' | 'settings' | 'customers' | 'batch-summary' | 'print-view'>('dashboard');
  
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [batchInvoices, setBatchInvoices] = useState<Invoice[]>([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  
  // State for Customer Operations View
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<CustomerConfig | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

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
    if (saved) {
        const parsed = JSON.parse(saved);
        const { bankName, iban, swift, ...rest } = parsed;
        return rest;
    }
    return {
      name: 'Mohamed Alaa',
      companyName: 'Nile Fleet',
      address: 'Genset Rent Company\nCairo, Egypt',
      taxId: '620-410-998',
      email: 'mohamed.alaa@nilefleet.com',
      phone: '+20 100 000 0000',
      website: 'www.nilefleet.com',
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

  const handleImageUpload = (file: File, field: 'logoUrl' | 'signatureUrl' | 'watermarkUrl') => {
    const reader = new FileReader();
    reader.onload = (event) => setProfile(prev => ({ ...prev, [field]: event.target?.result as string }));
    reader.readAsDataURL(file);
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

      const lines = content.split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) {
        alert("Invalid CSV format: Missing header or data lines.");
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const newEntries: Booking[] = [];
      const newCustomersToRegister = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const booking: any = {
          id: `bk-${Date.now()}-${i}`,
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
          remarks: ''
        };

        headers.forEach((header, index) => {
          if (index < values.length) {
            const val = values[index];
            if (header.includes('customer') || header.includes('client')) booking.customer = val || booking.customer;
            else if (header.includes('booking') && header.includes('no')) booking.bookingNo = val || booking.bookingNo;
            else if (header.includes('reefer') || header.includes('unit')) booking.reeferNumber = val || booking.reeferNumber;
            else if (header.includes('port') && header.includes('go')) booking.goPort = val || booking.goPort;
            else if (header.includes('port') && header.includes('gi')) booking.giPort = val || booking.giPort;
            else if (header.includes('trucker')) booking.trucker = val || booking.trucker;
            else if (header.includes('shipper') && !header.includes('address')) booking.shipper = val || booking.shipper;
            else if (header.includes('address')) booking.shipperAddress = val || booking.shipperAddress;
            else if (header.includes('rate') || header.includes('amount')) booking.rateValue = parseCurrency(val);
            else if (header.includes('remark') || header.includes('note')) booking.remarks = val || booking.remarks;
            else if (header.includes('date')) booking.bookingDate = val || booking.bookingDate;
          }
        });

        if (booking.bookingNo !== '---' && booking.customer) {
          booking.vatValue = booking.rateValue * 0.14;
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
        alert(`Successfully imported ${newEntries.length} items.`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      {
        Customer: "Nile Shipping Co",
        "Booking No": "BK990011",
        "Reefer Number": "MRKU1234567",
        "Go Port": "Alexandria",
        "Gi Port": "Sokhna",
        Rate: "2500.00",
        Trucker: "Fleet Express",
        Shipper: "Global Exports",
        "Booking Date": "2025-05-20",
        Remarks: "Standard clip-on service"
      }
    ];
    exportToCSV(sampleData, "nile-fleet-sample-manifest.csv");
  };

  const generateInvoicesFromSelection = (silent: boolean = false): Invoice[] => {
    const selectedItems = bookings.filter(b => selectedIds.has(b.id));
    if (selectedItems.length === 0) return [];
    
    const groups = new Map<string, Booking[]>();
    selectedItems.forEach(item => {
      const key = `${item.customer}-${item.bookingNo}`;
      const existing = groups.get(key) || [];
      existing.push(item);
      groups.set(key, existing);
    });

    const generatedInvoices: Invoice[] = [];
    const updatedCustomerConfigs = [...customerConfigs];

    groups.forEach((items) => {
      const firstItem = items[0];
      const subtotal = items.reduce((acc, curr) => acc + curr.rateValue, 0);
      const tax = subtotal * 0.14;
      
      const custIdx = updatedCustomerConfigs.findIndex(c => c.name === firstItem.customer);
      let prefix = 'INV';
      let nextNum = 1001;
      
      if (custIdx !== -1) {
        const c = updatedCustomerConfigs[custIdx];
        prefix = c.prefix;
        nextNum = c.nextNumber;
        updatedCustomerConfigs[custIdx].nextNumber += 1;
      }

      generatedInvoices.push({
        id: `INV-${Date.now()}-${Math.random()}`,
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
        notes: firstItem.remarks || "Genset rental services and logistics support.",
        templateConfig,
        userProfile: profile
      });
    });

    setCustomerConfigs(updatedCustomerConfigs);
    return generatedInvoices;
  };

  const executeInvoiceGeneration = () => {
    const generated = generateInvoicesFromSelection();
    if (generated.length === 0) return;

    if (generated.length > 1) {
      setBatchInvoices(generated);
      setView('batch-summary');
    } else {
      setActiveInvoice(generated[0]);
      setView('invoice-preview');
    }
    setSelectedIds(new Set());
    setShowActionModal(false);
  };

  const executeInstantPrint = () => {
    const generated = generateInvoicesFromSelection();
    if (generated.length === 0) return;

    setBatchInvoices(generated);
    setView('print-view');
    setShowActionModal(false);
    
    // Trigger print dialog after small delay to allow render
    setTimeout(() => {
      window.print();
      // After print, offer to clear selection or mark billed
      if (confirm("Invoices sent to printer. Mark these manifest items as 'BILLED'?")) {
        executeBulkStatusUpdate('BILLED');
      }
      setView('dashboard');
      setSelectedIds(new Set());
    }, 500);
  };

  const executeBulkStatusUpdate = (status: 'BILLED' | 'PENDING') => {
    setBookings(prev => prev.map(b => selectedIds.has(b.id) ? { ...b, status, invNo: status === 'BILLED' ? 'M-GEN' : '' } : b));
    setSelectedIds(new Set());
    setShowActionModal(false);
  };

  const executeSelectionExport = () => {
    const selectedItems = bookings.filter(b => selectedIds.has(b.id));
    exportToCSV(selectedItems, `manifest-export-${new Date().toISOString().split('T')[0]}.csv`);
    setShowActionModal(false);
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

  const toggleTemplateField = (field: keyof TemplateFields) => {
    setTemplateConfig(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: !prev.fields[field]
      }
    }));
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

    const config: CustomerConfig = {
      id: `cust-${Date.now()}`,
      name: newCustomer.name,
      prefix: newCustomer.prefix || 'INV',
      nextNumber: newCustomer.nextNumber || 1
    };

    setCustomerConfigs(prev => [...prev, config]);
    setNewCustomer({ name: '', prefix: 'INV', nextNumber: 1 });
    setShowAddCustomerModal(false);
  };

  const handleUpdateCustomerConfig = (updated: CustomerConfig) => {
    setCustomerConfigs(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelectedCustomerForDetail(updated);
  };

  const handleUpdateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    setBookings(prev => prev.map(b => b.id === editingBooking.id ? editingBooking : b));
    setEditingBooking(null);
  };

  const filteredBookings = bookings.filter(b => (!searchTerm || b.bookingNo.toLowerCase().includes(searchTerm.toLowerCase()) || b.reeferNumber.toLowerCase().includes(searchTerm.toLowerCase()) || b.customer.toLowerCase().includes(searchTerm.toLowerCase())));

  const customerSpecificBookings = useMemo(() => {
    if (!selectedCustomerForDetail) return [];
    return bookings.filter(b => b.customer.toLowerCase() === selectedCustomerForDetail.name.toLowerCase());
  }, [bookings, selectedCustomerForDetail]);

  return (
    <div className="min-h-screen flex bg-slate-50 antialiased overflow-hidden">
      <aside className="no-print w-64 bg-slate-900 flex flex-col h-screen sticky top-0 shadow-2xl z-50 shrink-0">
        <div className="p-8">
          <div className="flex flex-col gap-0.5 mb-10">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 p-2 rounded-xl text-white"><Briefcase size={20} /></div>
              <h1 className="text-sm font-black text-white tracking-tighter uppercase leading-tight">NILE FLEET<br/>GENSET</h1>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-11">SHERIF HEGAZY</p>
          </div>
          <nav className="space-y-2">
            {[
              { id: 'dashboard', icon: Layout, label: 'Manifest' },
              { id: 'customers', icon: Users, label: 'Customers' },
              { id: 'settings', icon: Palette, label: 'Templates' },
              { id: 'profile', icon: UserCircle, label: 'Identity' }
            ].map(item => (
              <button key={item.id} onClick={() => { setView(item.id as any); setSelectedCustomerForDetail(null); }} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === 'dashboard' && item.id === 'dashboard' || (view === 'invoice-preview' && item.id === 'dashboard') || (view === 'batch-summary' && item.id === 'dashboard') || (view === 'print-view' && item.id === 'dashboard') || view === item.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <item.icon size={18} /> {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-8 border-t border-white/5">
          <div className="flex flex-col gap-1 items-start">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-tight">{profile.companyName}</span>
            <span className="text-xs font-black text-white tracking-tight uppercase">OPERATOR DASHBOARD</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto custom-scroll relative bg-slate-50">
        <div className={`max-w-6xl mx-auto ${view === 'print-view' ? 'p-0' : 'p-12'}`}>
          {view === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex justify-between items-end">
                <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">Fleet Manifest</h2><p className="text-slate-500 font-medium mt-1">Ready for automated billing cycles.</p></div>
                <div className="flex gap-3">
                   <button onClick={downloadSampleCSV} className="bg-white border border-slate-200 text-slate-600 px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"><Download size={16}/> Sample CSV</button>
                   <button onClick={() => setShowManualEntryModal(true)} className="bg-white border border-slate-200 text-slate-600 px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"><PlusCircle size={16}/> Add Booking</button>
                   <label className="cursor-pointer bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 shadow-xl hover:bg-black transition-all">
                      <FileUp size={16}/> Import CSV
                      <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                   </label>
                </div>
              </header>

              <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-6 flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input type="text" placeholder="Search manifest..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-2xl font-bold outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button 
                  disabled={selectedIds.size === 0} 
                  onClick={() => setShowActionModal(true)} 
                  className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black disabled:opacity-30 transition-all uppercase text-xs tracking-widest shadow-xl flex items-center gap-2 active:scale-95 hover:bg-emerald-700"
                >
                  <Activity size={18} className="fill-white"/> Quick Operations ({selectedIds.size})
                </button>
              </div>

              <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b font-black text-slate-400 uppercase tracking-widest text-[10px]">
                    <tr><th className="py-5 px-6 w-12 text-center">#</th><th className="py-5 px-4">Client</th><th className="py-5 px-4">Booking</th><th className="py-5 px-4">Unit</th><th className="py-5 px-4">Rate</th><th className="py-5 px-4 text-center">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedIds.has(b.id) ? 'bg-emerald-50' : ''}`} onClick={() => toggleBooking(b.id)}>
                        <td className="py-5 px-6 text-center"><input type="checkbox" readOnly className="w-5 h-5 rounded cursor-pointer accent-emerald-600" checked={selectedIds.has(b.id)} /></td>
                        <td className="py-5 px-4 font-bold text-slate-900">{b.customer}</td>
                        <td className="py-5 px-4 font-mono text-slate-500">{b.bookingNo}</td>
                        <td className="py-5 px-4 font-mono font-bold text-emerald-600">{b.reeferNumber}</td>
                        <td className="py-5 px-4 font-black text-slate-900">{formatCurrency(b.rateValue, 'EGP')}</td>
                        <td className="py-5 px-4 text-center">{b.invNo || b.status === 'BILLED' ? <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase bg-emerald-100 text-emerald-700">BILLED</span> : <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase bg-slate-100 text-slate-400">PENDING</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'customers' && !selectedCustomerForDetail && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <header className="flex justify-between items-end">
                 <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">Customer Directory</h2><p className="text-slate-500 font-medium mt-1">Click a customer to manage operations and numbering.</p></div>
                 <button onClick={() => setShowAddCustomerModal(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 shadow-xl hover:bg-emerald-700 transition-all"><Plus size={16}/> New Client</button>
               </header>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {customerConfigs.map((cust) => (
                   <div key={cust.id} onClick={() => setSelectedCustomerForDetail(cust)} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 group cursor-pointer hover:border-emerald-500 transition-all hover:scale-[1.02]">
                     <div className="flex justify-between items-start">
                       <div className="bg-slate-50 p-3 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform"><Building2 size={24} /></div>
                       <div className="flex gap-2">
                         <button onClick={(e) => { e.stopPropagation(); setCustomerConfigs(prev => prev.filter(c => c.id !== cust.id)); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                       </div>
                     </div>
                     <div>
                       <h3 className="text-lg font-black text-slate-900 leading-tight">{cust.name}</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest flex items-center gap-1"><Layers size={10}/> {bookings.filter(b => b.customer.toLowerCase() === cust.name.toLowerCase()).length} Operations</p>
                     </div>
                     <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                       <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Prefix</label><p className="font-black text-emerald-600 font-mono">{cust.prefix}</p></div>
                       <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Next Serial</label><p className="font-black text-slate-900 font-mono">#{cust.nextNumber}</p></div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {view === 'customers' && selectedCustomerForDetail && (
            <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-right-4">
              <header className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedCustomerForDetail(null)} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-colors shadow-sm"><ChevronLeft size={24}/></button>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedCustomerForDetail.name}</h2>
                    <p className="text-slate-500 font-medium">Customer Operations & Configuration</p>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Configuration Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><SettingsIcon size={18}/> Configuration</h3>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Billing Prefix</label>
                        <input 
                          className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" 
                          value={selectedCustomerForDetail.prefix} 
                          onChange={e => handleUpdateCustomerConfig({...selectedCustomerForDetail, prefix: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Next Serial Number</label>
                        <input 
                          type="number"
                          className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" 
                          value={selectedCustomerForDetail.nextNumber} 
                          onChange={e => handleUpdateCustomerConfig({...selectedCustomerForDetail, nextNumber: parseInt(e.target.value) || 1})} 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Company Display Name</label>
                        <input 
                          className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" 
                          value={selectedCustomerForDetail.name} 
                          onChange={e => handleUpdateCustomerConfig({...selectedCustomerForDetail, name: e.target.value})} 
                        />
                        <p className="text-[8px] text-amber-500 font-bold mt-1 uppercase">* Renaming will disconnect existing manifest items if not matched exactly.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operations List */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col min-h-[500px]">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><TableIcon size={18}/> Manifest History</h3>
                      <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase">{customerSpecificBookings.length} Total Entries</span>
                    </div>
                    
                    {customerSpecificBookings.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-4 opacity-30">
                        <Archive size={48} />
                        <p className="font-bold text-slate-900">No active manifest items for this customer.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 border-b font-black text-slate-400 uppercase tracking-widest text-[10px]">
                            <tr>
                              <th className="py-5 px-8">Booking #</th>
                              <th className="py-5 px-4">Unit</th>
                              <th className="py-5 px-4">Rate</th>
                              <th className="py-5 px-4">Status</th>
                              <th className="py-5 px-8 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {customerSpecificBookings.map((b) => (
                              <tr key={b.id} className="hover:bg-slate-50 group">
                                <td className="py-5 px-8 font-mono text-slate-500 font-bold">{b.bookingNo}</td>
                                <td className="py-5 px-4 font-mono font-black text-emerald-600">{b.reeferNumber}</td>
                                <td className="py-5 px-4 font-black text-slate-900">{formatCurrency(b.rateValue, 'EGP')}</td>
                                <td className="py-5 px-4">
                                  {b.status === 'BILLED' ? 
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase bg-emerald-100 text-emerald-700">BILLED</span> : 
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase bg-slate-100 text-slate-400">PENDING</span>
                                  }
                                </td>
                                <td className="py-5 px-8 text-right">
                                  <button onClick={() => setEditingBooking(b)} className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Edit3 size={18} /></button>
                                  <button onClick={() => setBookings(prev => prev.filter(item => item.id !== b.id))} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 ml-2"><Trash2 size={18} /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'profile' && (
            <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
               <div className="flex justify-between items-end">
                 <div><h2 className="text-4xl font-black text-slate-900 tracking-tight">Identity & Brand</h2><p className="text-slate-500 font-medium mt-1">Manage official brand assets and business data.</p></div>
                 <button onClick={() => alert('Identity Saved Locally!')} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl uppercase text-xs active:scale-95 transition-all">Save Changes</button>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 space-y-8">
                    {/* Basic Info */}
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
                       <h3 className="text-xl font-black text-slate-900 pb-4 border-b uppercase tracking-tight flex items-center gap-3"><Briefcase size={22} className="text-emerald-500"/> Official Profile</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Entity Name</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.companyName} onChange={e => setProfile({...profile, companyName: e.target.value})} /></div>
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Tax ID / CR</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.taxId} onChange={e => setProfile({...profile, taxId: e.target.value})} /></div>
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Manager Name</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} /></div>
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Email Address</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} /></div>
                          <div className="space-y-1 col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase">Physical Address</label><textarea rows={2} className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none resize-none" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} /></div>
                       </div>
                    </div>

                    {/* Contact & Web */}
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
                       <h3 className="text-xl font-black text-slate-900 pb-4 border-b uppercase tracking-tight flex items-center gap-3"><Phone size={22} className="text-blue-500"/> Contact & Digital</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Business Phone</label><div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/><input className="w-full bg-slate-50 pl-12 p-4 rounded-xl font-bold border-2 border-transparent focus:border-blue-600 outline-none" value={profile.phone || ''} onChange={e => setProfile({...profile, phone: e.target.value})} /></div></div>
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Website URL</label><div className="relative"><Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/><input className="w-full bg-slate-50 pl-12 p-4 rounded-xl font-bold border-2 border-transparent focus:border-blue-600 outline-none" value={profile.website || ''} onChange={e => setProfile({...profile, website: e.target.value})} /></div></div>
                       </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-8">
                    {/* Visual Brand Assets */}
                    <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-6">
                      <div className="flex justify-between"><p className="text-[10px] font-black text-slate-400 uppercase">Primary Logo</p><label className="cursor-pointer text-emerald-600 font-black text-[10px] uppercase hover:underline"><input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logoUrl')} />Upload</label></div>
                      <div className="h-40 bg-slate-50 rounded-3xl flex items-center justify-center border-2 border-slate-100 overflow-hidden relative group">
                        {profile.logoUrl ? <img src={profile.logoUrl} className="h-full object-contain p-4 transition-transform group-hover:scale-110" /> : <ImageIcon size={48} className="text-slate-200" />}
                        {profile.logoUrl && <button onClick={() => setProfile({...profile, logoUrl: null})} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>}
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-6">
                      <div className="flex justify-between"><p className="text-[10px] font-black text-slate-400 uppercase">Digital Signature</p><label className="cursor-pointer text-emerald-600 font-black text-[10px] uppercase hover:underline"><input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'signatureUrl')} />Upload</label></div>
                      <div className="h-28 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-slate-100 overflow-hidden relative group">
                        {profile.signatureUrl ? <img src={profile.signatureUrl} className="h-full object-contain p-4 mix-blend-multiply transition-transform group-hover:scale-110" /> : <PenTool size={32} className="text-slate-200" />}
                        {profile.signatureUrl && <button onClick={() => setProfile({...profile, signatureUrl: null})} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>}
                      </div>
                    </div>

                    {/* Safety Watermark */}
                    <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-6">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Safety Watermark</p>
                        <label className="cursor-pointer text-emerald-600 font-black text-[10px] uppercase hover:underline">
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'watermarkUrl')} />
                          {profile.watermarkUrl ? 'Replace' : 'Upload'}
                        </label>
                      </div>
                      <div className="h-32 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-slate-100 overflow-hidden relative group">
                        {profile.watermarkUrl ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                             <img src={profile.watermarkUrl} style={{ opacity: profile.watermarkOpacity }} className="h-full object-contain p-4 transition-all" />
                             <button onClick={() => setProfile({...profile, watermarkUrl: null})} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"><Trash2 size={14}/></button>
                          </div>
                        ) : (
                          <Layers2 size={32} className="text-slate-200" />
                        )}
                      </div>
                      {profile.watermarkUrl && (
                        <div className="space-y-3 pt-2">
                           <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                             <span className="flex items-center gap-1"><Sliders size={10}/> Intensity</span>
                             <span>{Math.round(profile.watermarkOpacity * 100)}%</span>
                           </div>
                           <input type="range" min="0.01" max="0.3" step="0.01" className="w-full accent-emerald-500" value={profile.watermarkOpacity} onChange={e => setProfile({...profile, watermarkOpacity: parseFloat(e.target.value)})} />
                        </div>
                      )}
                    </div>
                  </div>
               </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="space-y-12 animate-in fade-in duration-500">
               <header className="flex justify-between items-end">
                 <div>
                   <h2 className="text-4xl font-black text-slate-900 tracking-tight">Templates</h2>
                   <p className="text-slate-500 font-medium mt-1">Design your documents and select visible invoice data.</p>
                 </div>
               </header>

               <div className="space-y-8">
                 <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Palette size={18}/> Visual Style</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {STANDARD_THEMES.map(t => (
                      <button key={t.id} onClick={() => updateTheme(t.id)} className={`p-8 rounded-[2.5rem] border-2 transition-all text-left space-y-6 ${templateConfig.theme === t.id ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-transparent hover:border-slate-200 shadow-xl'}`}>
                         <div className={`p-4 rounded-2xl ${t.color} text-white shadow-lg inline-block`}><t.icon size={28}/></div>
                         <div><h4 className="text-xl font-black text-slate-900">{t.label}</h4><p className="text-slate-500 font-medium text-xs mt-1">{t.desc}</p></div>
                      </button>
                    ))}
                 </div>
               </div>

               <div className="space-y-8">
                 <div className="flex items-end justify-between">
                   <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ListChecks size={18}/> Field Visibility</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Choose exactly what data to appear on invoices</p>
                 </div>
                 <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-4">
                    {[
                      { key: 'showLogo', label: 'Company Logo' },
                      { key: 'showCompanyInfo', label: 'Our Address' },
                      { key: 'showTaxId', label: 'Tax ID / CR' },
                      { key: 'showInvoiceDate', label: 'Invoice Date' },
                      { key: 'showDueDate', label: 'Due Date' },
                      { key: 'showCustomerAddress', label: 'Customer Address' },
                      { key: 'showBookingNo', label: 'Booking Number' },
                      { key: 'showPorts', label: 'Ports (Go/Gi)' },
                      { key: 'showReefer', label: 'Reefer Numbers' },
                      { key: 'showGenset', label: 'Genset Info' },
                      { key: 'showTrucker', label: 'Trucker Name' },
                      { key: 'showShipperAddress', label: 'Shipper Name' },
                      { key: 'showVat', label: 'Tax Calculations' },
                      { key: 'showSignature', label: 'Authorized Signature' },
                      { key: 'showNotes', label: 'Terms & Notes' },
                      { key: 'showWatermark', label: 'Safety Watermark' },
                      { key: 'showBeneficiary', label: 'Beneficiary Info' },
                      { key: 'showCustomerRef', label: 'Customer Reference' },
                      { key: 'showTerms', label: 'Extended Terms' },
                      { key: 'showServicePeriod', label: 'Service Timeline' }
                    ].map(field => (
                      <button 
                        key={field.key} 
                        onClick={() => toggleTemplateField(field.key as keyof TemplateFields)}
                        className={`flex items-center justify-between p-4 rounded-2xl transition-all ${templateConfig.fields[field.key as keyof TemplateFields] ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                      >
                        <span className="text-[11px] font-black uppercase tracking-tight">{field.label}</span>
                        {templateConfig.fields[field.key as keyof TemplateFields] ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    ))}
                 </div>
               </div>
            </div>
          )}

          {view === 'invoice-preview' && activeInvoice && (
            <div className="animate-in fade-in duration-500 pb-32">
               <div className="no-print bg-white p-8 rounded-[2.5rem] shadow-2xl mb-8 border-2 border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setView('dashboard')} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"><ChevronLeft size={24}/></button>
                    <div><h3 className="text-2xl font-black text-slate-900 tracking-tight">Document Preview</h3><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{activeInvoice.invoiceNumber}</p></div>
                  </div>
                  <button onClick={() => window.print()} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-xl hover:bg-black transition-all active:scale-95"><Printer size={18}/> Print PDF</button>
               </div>
               <div className="flex justify-center">
                 <InvoiceDocument invoice={activeInvoice} />
               </div>
            </div>
          )}

          {view === 'batch-summary' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <header className="flex justify-between items-end">
                 <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">Batch Generated</h2><p className="text-slate-500 font-medium mt-1">{batchInvoices.length} invoices ready.</p></div>
                 <div className="flex gap-2">
                   <button onClick={() => { setView('print-view'); setTimeout(() => window.print(), 300); }} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-lg hover:bg-black"><Printer size={16}/> Print All Batch</button>
                   <button onClick={() => setView('dashboard')} className="bg-white border border-slate-200 p-3 px-6 rounded-xl font-black text-xs uppercase">Done</button>
                 </div>
               </header>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {batchInvoices.map(inv => (
                   <div key={inv.id} className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex items-center justify-between group hover:border-emerald-500 transition-all">
                     <div><h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{inv.invoiceNumber}</h4><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inv.customerName}</p></div>
                     <button onClick={() => { setActiveInvoice(inv); setView('invoice-preview'); }} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-black transition-all shadow-md active:scale-90"><Eye size={16} /></button>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Editing Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 space-y-8 relative max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600"><Edit3 size={28}/></div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Edit Entry</h3>
              </div>
              <button onClick={() => setEditingBooking(null)} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleUpdateBooking} className="grid grid-cols-2 gap-6">
               <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Booking Number</label><input required className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={editingBooking.bookingNo} onChange={e => setEditingBooking({...editingBooking, bookingNo: e.target.value})} /></div>
               <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Reefer Number</label><input required className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={editingBooking.reeferNumber} onChange={e => setEditingBooking({...editingBooking, reeferNumber: e.target.value})} /></div>
               <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Genset Number</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={editingBooking.gensetNo} onChange={e => setEditingBooking({...editingBooking, gensetNo: e.target.value})} /></div>
               <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Operational Date</label><input type="date" className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={editingBooking.bookingDate} onChange={e => setEditingBooking({...editingBooking, bookingDate: e.target.value})} /></div>
               <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Go Port</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={editingBooking.goPort} onChange={e => setEditingBooking({...editingBooking, goPort: e.target.value})} /></div>
               <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Gi Port</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={editingBooking.giPort} onChange={e => setEditingBooking({...editingBooking, giPort: e.target.value})} /></div>
               <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Trucker Company</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={editingBooking.trucker} onChange={e => setEditingBooking({...editingBooking, trucker: e.target.value})} /></div>
               <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Rate (EGP)</label><input type="number" step="0.01" className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={editingBooking.rateValue} onChange={e => { const val = parseFloat(e.target.value) || 0; setEditingBooking({...editingBooking, rateValue: val, vatValue: val * 0.14}); }} /></div>
               <div className="col-span-2 space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Internal Remarks</label><textarea className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none resize-none" rows={3} value={editingBooking.remarks} onChange={e => setEditingBooking({...editingBooking, remarks: e.target.value})} /></div>
               
               <button type="submit" className="col-span-2 bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all">
                  <Save size={18}/> Commit Changes
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Operations Quick Actions Modal */}
      {showActionModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 space-y-8 relative">
            <button onClick={() => setShowActionModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors"><X size={24}/></button>
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600"><Activity size={28}/></div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Operation Hub</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{selectedIds.size} selections active</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* INSTANT PRINT */}
              <button onClick={executeInstantPrint} className="group p-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] flex flex-col gap-4 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors"><Printer size={24}/></div>
                <div className="text-left">
                  <h4 className="font-black uppercase text-sm">Instant Print / PDF</h4>
                  <p className="text-white/60 text-[10px] font-medium leading-relaxed">Fast-track to print dialog for all items</p>
                </div>
              </button>

              {/* GENERATE & REVIEW */}
              <button onClick={executeInvoiceGeneration} className="group p-6 bg-slate-900 hover:bg-black text-white rounded-[2rem] flex flex-col gap-4 transition-all shadow-lg shadow-black/20 active:scale-95">
                <div className="bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors"><FileOutput size={24}/></div>
                <div className="text-left">
                  <h4 className="font-black uppercase text-sm">Review & Generate</h4>
                  <p className="text-white/50 text-[10px] font-medium leading-relaxed">Preview invoices before final output</p>
                </div>
              </button>

              {/* INSTANT DOWNLOAD MANIFEST */}
              <button onClick={executeSelectionExport} className="group p-6 bg-white border-2 border-slate-100 hover:border-emerald-500 rounded-[2rem] flex flex-col gap-4 transition-all active:scale-95">
                <div className="bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors"><Download size={24}/></div>
                <div className="text-left">
                  <h4 className="font-black uppercase text-sm text-slate-900">Download CSV</h4>
                  <p className="text-slate-400 text-[10px] font-medium leading-relaxed">Immediate manifest export for Excel</p>
                </div>
              </button>

              {/* BULK MARK AS BILLED */}
              <button onClick={() => executeBulkStatusUpdate('BILLED')} className="group p-6 bg-white border-2 border-slate-100 hover:border-blue-500 rounded-[2rem] flex flex-col gap-4 transition-all active:scale-95">
                <div className="bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors"><CheckCircle size={24}/></div>
                <div className="text-left">
                  <h4 className="font-black uppercase text-sm text-slate-900">Mark as Billed</h4>
                  <p className="text-slate-400 text-[10px] font-medium leading-relaxed">Quick status update without invoices</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManualEntryModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 space-y-8">
            <div className="flex justify-between items-center"><h3 className="text-3xl font-black text-slate-900 tracking-tight">Add Unit</h3><button onClick={() => setShowManualEntryModal(false)}><X/></button></div>
            <form onSubmit={handleManualBookingSubmit} className="space-y-4">
               <input required className="w-full bg-slate-50 p-4 rounded-xl font-bold" placeholder="Customer Name" value={manualBooking.customer} onChange={e => setManualBooking({...manualBooking, customer: e.target.value})} />
               <input required className="w-full bg-slate-50 p-4 rounded-xl font-bold" placeholder="Booking No." value={manualBooking.bookingNo} onChange={e => setManualBooking({...manualBooking, bookingNo: e.target.value})} />
               <input className="w-full bg-slate-50 p-4 rounded-xl font-bold" placeholder="Unit Number" value={manualBooking.reeferNumber} onChange={e => setManualBooking({...manualBooking, reeferNumber: e.target.value})} />
               <input type="number" className="w-full bg-slate-50 p-4 rounded-xl font-bold" placeholder="Rate (EGP)" value={manualBooking.rateValue} onChange={e => setManualBooking({...manualBooking, rateValue: parseFloat(e.target.value) || 0})} />
               <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase tracking-widest">Save Booking</button>
            </form>
          </div>
        </div>
      )}

      {showAddCustomerModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 space-y-8">
            <div className="flex justify-between items-center"><h3 className="text-3xl font-black text-slate-900 tracking-tight">Register Client</h3><button onClick={() => setShowAddCustomerModal(false)}><X/></button></div>
            <form onSubmit={handleAddCustomer} className="space-y-4">
               <input required className="w-full bg-slate-50 p-4 rounded-xl font-bold" placeholder="Client Company Name" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
               <div className="grid grid-cols-2 gap-4">
                 <input className="w-full bg-slate-50 p-4 rounded-xl font-bold" placeholder="Prefix" value={newCustomer.prefix} onChange={e => setNewCustomer({...newCustomer, prefix: e.target.value})} />
                 <input type="number" className="w-full bg-slate-50 p-4 rounded-xl font-bold" placeholder="Start Seq" value={newCustomer.nextNumber} onChange={e => setNewCustomer({...newCustomer, nextNumber: parseInt(e.target.value) || 1})} />
               </div>
               <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase tracking-widest">Register Client</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

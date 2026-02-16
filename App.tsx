
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
  FileText, Activity, Layers2, FileOutput, Globe, Phone, Landmark, Sliders, ToggleRight, ToggleLeft, Save,
  Hash as HashIcon, Mail, Box, Calendar, MessageSquareText, Award as AwardIcon, User,
  Maximize, Minimize, Palette as PaletteIcon, Globe2, Moon
} from 'lucide-react';
import { Booking, Invoice, InvoiceSectionId, TemplateConfig, UserProfile, TemplateFields, GroupingType, InvoiceTheme, CustomerConfig, CustomTheme } from './types';
import { parseCurrency, formatCurrency, exportToCSV, downloadSampleCSV } from './utils/formatters';
import InvoiceDocument from './components/InvoiceDocument';

const DEFAULT_COMPANY_LOGO = "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&q=80&w=200&h=200";

const STANDARD_THEMES: { id: InvoiceTheme, label: string, desc: string, icon: any, color: string }[] = [
  { id: 'logistics-grid', label: 'Classic Logistics', desc: 'Heavy borders, official grid layout', icon: TableIcon, color: 'bg-emerald-600' },
  { id: 'dark-mode-pro', label: 'Electronic Bill', desc: 'Sleek tech-focused white layout', icon: Smartphone, color: 'bg-slate-900' },
  { id: 'airport-terminal', label: 'Airport Manifest', desc: 'Monospaced flight-board aesthetic', icon: Globe2, color: 'bg-black' },
  { id: 'brutalist', label: 'High Brutalist', desc: 'Bold, heavy, yellow industrial style', icon: Zap, color: 'bg-yellow-400' },
  { id: 'corporate', label: 'Corporate Clean', desc: 'Minimal, business-standard style', icon: Briefcase, color: 'bg-slate-900' },
  { id: 'eco-freight', label: 'Eco Freight', desc: 'Fresh lime and earth tones', icon: Leaf, color: 'bg-lime-600' },
  { id: 'luxury-gold', label: 'Executive Gold', desc: 'Premium serif fonts with gold accents', icon: Award, color: 'bg-amber-500' },
  { id: 'vintage', label: 'Vintage Archive', desc: 'Typewriter fonts on clean white paper', icon: ScrollText, color: 'bg-orange-600' },
  { id: 'swiss-modern', label: 'Modern Clean', desc: 'Clean typography, minimal spacing', icon: Layout, color: 'bg-slate-800' },
  { id: 'technical-draft', label: 'Technical Draft', desc: 'Monospace, blueprint technical look', icon: Terminal, color: 'bg-slate-600' },
  { id: 'minimalist', label: 'Ultra Minimal', desc: 'Maximum whitespace, zero borders', icon: Square, color: 'bg-slate-300' },
  { id: 'sidebar-pro', label: 'Left Sidebar', desc: 'Details on side, wide table layout', icon: MoveHorizontal, color: 'bg-blue-600' },
  { id: 'modern-cards', label: 'Card-based', desc: 'Items presented in distinct blocks', icon: Layers, color: 'bg-purple-600' },
  { id: 'blueprint', label: 'Blueprint Grid', desc: 'Architectural lines and grid focus', icon: MapPin, color: 'bg-cyan-600' },
  { id: 'elegant', label: 'Elegant Serif', desc: 'Sophisticated typography and spacing', icon: Sunrise, color: 'bg-rose-400' },
  { id: 'industrial', label: 'Industrial Stamped', desc: 'Bold headers and stamped aesthetics', icon: Box, color: 'bg-zinc-800' }
];

declare var html2pdf: any;

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
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
    nextNumber: 1,
    dueDate: '2026-03-03'
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('user_profile');
    if (saved) {
        return JSON.parse(saved);
    }
    return {
      name: 'Mohamed Alaa',
      ownerName: 'Sherif Hegazy',
      title: 'Operations Manager',
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

  const [invConfig, setInvConfig] = useState(() => {
    const saved = localStorage.getItem('inv_config');
    if (saved) return JSON.parse(saved);
    return {
      date: new Date().toISOString().split('T')[0],
      dueDate: "2026-03-03",
      notes: 'Settlement Note Thank you for your business! We kindly request full settlement by 2026-03-03. For smooth processing, please include the invoice number in your payment reference. We value your feedback, so please review these details within one week of receipt; after this time, the invoice will be considered final and approved. We appreciate your cooperation.',
      currency: 'EGP'
    };
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
        showBeneficiary: false, showShipperAddress: true, showTrucker: true,
        showInvoiceDate: true, showDueDate: true, showNotes: true, showWatermark: true
      }
    };
  });

  useEffect(() => { localStorage.setItem('invoice_bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { localStorage.setItem('user_profile', JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem('customer_configs', JSON.stringify(customerConfigs)); }, [customerConfigs]);
  useEffect(() => { localStorage.setItem('custom_themes', JSON.stringify(customThemes)); }, [customThemes]);
  useEffect(() => { localStorage.setItem('inv_config', JSON.stringify(invConfig)); }, [invConfig]);
  useEffect(() => {
    const toSave = { ...templateConfig, hiddenSections: Array.from(templateConfig.hiddenSections) };
    localStorage.setItem('template_config', JSON.stringify(toSave));
  }, [templateConfig]);

  useEffect(() => {
    const handler = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleDownloadPDF = async (filename: string = 'invoice.pdf') => {
    const element = document.querySelector('.invoice-container');
    if (!element) return;
    
    setIsDownloading(true);
    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Could not generate PDF. Please try the Print option.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleImageUpload = (file: File, field: 'logoUrl' | 'signatureUrl' | 'watermarkUrl') => {
    const reader = new FileReader();
    reader.onload = (event) => setProfile(prev => ({ ...prev, [field]: event.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => (!searchTerm || b.bookingNo.toLowerCase().includes(searchTerm.toLowerCase()) || b.reeferNumber.toLowerCase().includes(searchTerm.toLowerCase()) || b.customer.toLowerCase().includes(searchTerm.toLowerCase())));
  }, [bookings, searchTerm]);

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

  const toggleAllBookings = () => {
    const allFilteredIds = filteredBookings.map(b => b.id);
    const areAllSelected = allFilteredIds.every(id => selectedIds.has(id));

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (areAllSelected) {
        allFilteredIds.forEach(id => next.delete(id));
      } else {
        allFilteredIds.forEach(id => next.add(id));
      }
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
          newEntries.push(booking as Booking);
          newCustomersToRegister.add(booking.customer);
        }
      }

      setCustomerConfigs(prev => {
        const existingNames = new Set(prev.map(c => c.name.toLowerCase()));
        const toAdd: CustomerConfig[] = [];
        newCustomersToRegister.forEach(name => {
          if (!existingNames.has(name.toLowerCase())) {
            toAdd.push({ id: `cust-${Date.now()}-${Math.random()}`, name, prefix: 'INV', nextNumber: 1, dueDate: '2026-03-03' });
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

  const generateInvoicesFromSelection = (silent: boolean = false, itemsToBill?: Booking[]): Invoice[] => {
    const selectedItems = itemsToBill || bookings.filter(b => selectedIds.has(b.id));
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
      
      const custIdx = updatedCustomerConfigs.findIndex(c => c.name === firstItem.customer);
      let prefix = 'INV';
      let nextNum = 1001;
      let customerDueDate = invConfig.dueDate;
      
      if (custIdx !== -1) {
        const c = updatedCustomerConfigs[custIdx];
        prefix = c.prefix;
        nextNum = c.nextNumber;
        if (c.dueDate) customerDueDate = c.dueDate;
        updatedCustomerConfigs[custIdx].nextNumber += 1;
      }

      const syncedNotes = invConfig.notes.replace(/\d{4}-\d{2}-\d{2}/, customerDueDate);

      generatedInvoices.push({
        id: `INV-${Date.now()}-${Math.random()}`,
        invoiceNumber: `${prefix}-${nextNum.toString().padStart(4, '0')}`,
        date: invConfig.date,
        dueDate: customerDueDate,
        customerName: firstItem.customer,
        customerAddress: firstItem.shipperAddress,
        beneficiaryName: '',
        items: items,
        subtotal,
        total: subtotal,
        currency: invConfig.currency,
        notes: syncedNotes,
        templateConfig,
        userProfile: profile
      });
    });

    setCustomerConfigs(updatedCustomerConfigs);
    return generatedInvoices;
  };

  const executeInvoiceGeneration = (items?: Booking[]) => {
    const generated = generateInvoicesFromSelection(false, items);
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

  const executeInstantPrint = (items?: Booking[]) => {
    const generated = generateInvoicesFromSelection(false, items);
    if (generated.length === 0) return;

    setBatchInvoices(generated);
    setView('print-view');
    setShowActionModal(false);
    
    setTimeout(() => {
      window.print();
      const markAsBilled = confirm("Invoices sent to printer. Mark items as 'BILLED'?");
      if (markAsBilled) {
        const ids = items ? items.map(i => i.id) : Array.from(selectedIds);
        setBookings(prev => prev.map(b => ids.includes(b.id) ? { ...b, status: 'BILLED', invNo: 'M-GEN' } : b));
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

    const newEntry: Booking = {
      id: newId,
      customer: manualBooking.customer || 'Unnamed Client',
      bookingNo: manualBooking.bookingNo || '---',
      reeferNumber: manualBooking.reeferNumber || '---',
      goPort: manualBooking.goPort || '---',
      giPort: manualBooking.giPort || '---',
      rateValue: rateVal,
      rate: rateVal.toString(),
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
      return [...prev, { id: `cust-${Date.now()}`, name: newEntry.customer, prefix: 'INV', nextNumber: 1, dueDate: '2026-03-03' }];
    });

    setBookings(prev => [newEntry, ...prev]);
    setManualBooking({
        bookingNo: '', reeferNumber: '', goPort: '', giPort: '', rateValue: 0,
        shipper: '', trucker: '', shipperAddress: '', customer: ''
    });
    setShowManualEntryModal(false);
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return;

    const config: CustomerConfig = {
      id: `cust-${Date.now()}`,
      name: newCustomer.name,
      prefix: newCustomer.prefix || 'INV',
      nextNumber: newCustomer.nextNumber || 1,
      dueDate: newCustomer.dueDate || '2026-03-03'
    };

    setCustomerConfigs(prev => [...prev, config]);
    setNewCustomer({ name: '', prefix: 'INV', nextNumber: 1, dueDate: '2026-03-03' });
    setShowAddCustomerModal(false);
  };

  const updateCustomerProperty = (id: string, property: keyof CustomerConfig, value: any) => {
    setCustomerConfigs(prev => prev.map(c => c.id === id ? { ...c, [property]: value } : c));
  };

  return (
    <div className="min-h-screen flex bg-slate-50 antialiased overflow-hidden">
      <aside className="no-print w-64 bg-slate-900 flex flex-col h-screen sticky top-0 shadow-2xl z-50 shrink-0">
        <div className="p-8">
          <div className="flex justify-between items-start mb-10">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-xl text-white"><Briefcase size={20} /></div>
                <h1 className="text-sm font-black text-white tracking-tighter uppercase leading-tight">NILE FLEET<br/>GENSET</h1>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-11">{profile.ownerName}</p>
            </div>
            <button 
              onClick={toggleFullScreen}
              className="text-slate-500 hover:text-white transition-colors p-1"
              title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
            >
              {isFullScreen ? <Minimize size={18}/> : <Maximize size={18}/>}
            </button>
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
        <div className="mt-auto p-8 border-t border-white/5 text-center">
          <div className="flex flex-col gap-1 items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-tight">{profile.companyName}</span>
            <span className="text-[8px] font-black text-white/40 tracking-tight uppercase">POWERED BY BEBITO</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto custom-scroll relative bg-slate-50">
        <div className={`mx-auto ${view === 'print-view' ? 'p-0' : (view === 'invoice-preview' ? 'p-0 max-w-full' : 'p-12 max-w-6xl')}`}>
          {view === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex justify-between items-end">
                <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">Fleet Manifest</h2><p className="text-slate-500 font-medium mt-1">Select items for bulk billing or use row actions for quick printing.</p></div>
                <div className="flex gap-3">
                   <button onClick={() => setShowManualEntryModal(true)} className="bg-white border border-slate-200 text-slate-600 px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"><PlusCircle size={16}/> Add Booking</button>
                   <button onClick={downloadSampleCSV} className="bg-white border border-slate-200 text-slate-600 px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"><FileSpreadsheet size={16}/> Download Sample</button>
                   <label className="cursor-pointer bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 shadow-xl hover:bg-black transition-all">
                      <FileUp size={16}/> Import CSV
                      <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                   </label>
                </div>
              </header>

              <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-6 flex flex-col gap-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="text" placeholder="Search manifest..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-2xl font-bold outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  {selectedIds.size > 0 && (
                    <div className="flex gap-3 animate-in slide-in-from-right duration-300">
                      <button 
                        onClick={() => executeInstantPrint()} 
                        className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black transition-all uppercase text-xs tracking-widest shadow-xl flex items-center gap-2 hover:bg-emerald-700"
                      >
                        <Printer size={18}/> Print Batch ({selectedIds.size})
                      </button>
                      <button 
                        onClick={() => executeInvoiceGeneration()} 
                        className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black transition-all uppercase text-xs tracking-widest shadow-xl flex items-center gap-2 hover:bg-black"
                      >
                        <Eye size={18}/> Preview Batch
                      </button>
                      <button 
                        onClick={() => setShowActionModal(true)} 
                        className="bg-white border-2 border-slate-100 text-slate-600 p-4 rounded-2xl hover:bg-slate-50 transition-all"
                      >
                        <Sliders size={20}/>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b font-black text-slate-400 uppercase tracking-widest text-[10px]">
                    <tr>
                      <th className="py-5 px-6 w-12 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={toggleAllBookings}>
                        <input 
                          type="checkbox" 
                          readOnly 
                          className="w-5 h-5 rounded cursor-pointer accent-emerald-600" 
                          checked={filteredBookings.length > 0 && filteredBookings.every(b => selectedIds.has(b.id))} 
                        />
                      </th>
                      <th className="py-5 px-4">Client</th>
                      <th className="py-5 px-4">Booking</th>
                      <th className="py-5 px-4">Unit</th>
                      <th className="py-5 px-4">Rate</th>
                      <th className="py-5 px-4 text-center">Status</th>
                      <th className="py-5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(b.id) ? 'bg-emerald-50' : ''}`}>
                        <td className="py-5 px-6 text-center" onClick={() => toggleBooking(b.id)}>
                          <input type="checkbox" readOnly className="w-5 h-5 rounded cursor-pointer accent-emerald-600" checked={selectedIds.has(b.id)} />
                        </td>
                        <td className="py-5 px-4 font-bold text-slate-900" onClick={() => toggleBooking(b.id)}>{b.customer}</td>
                        <td className="py-5 px-4 font-mono text-slate-500" onClick={() => toggleBooking(b.id)}>{b.bookingNo}</td>
                        <td className="py-5 px-4 font-mono font-bold text-emerald-600" onClick={() => toggleBooking(b.id)}>{b.reeferNumber}</td>
                        <td className="py-5 px-4 font-black text-slate-900" onClick={() => toggleBooking(b.id)}>{formatCurrency(b.rateValue, 'EGP')}</td>
                        <td className="py-5 px-4 text-center" onClick={() => toggleBooking(b.id)}>
                          {b.invNo || b.status === 'BILLED' ? 
                            <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase bg-emerald-100 text-emerald-700">BILLED</span> : 
                            <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase bg-slate-100 text-slate-400">PENDING</span>
                          }
                        </td>
                        <td className="py-5 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={(e) => { e.stopPropagation(); executeInstantPrint([b]); }} 
                              title="Instant Print"
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Printer size={18} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); executeInvoiceGeneration([b]); }} 
                              title="Preview Invoice"
                              className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEditingBooking(b); }} 
                              title="Edit Entry"
                              className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Edit3 size={18} />
                            </button>
                          </div>
                        </td>
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
                 <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">Customer Directory</h2><p className="text-slate-500 font-medium mt-1">Manage operations and invoice numbering for your clients.</p></div>
                 <button onClick={() => setShowAddCustomerModal(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 shadow-xl hover:bg-emerald-700 transition-all"><Plus size={16}/> New Client</button>
               </header>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {customerConfigs.map((cust) => (
                   <div key={cust.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 group transition-all hover:scale-[1.02]">
                     <div className="flex justify-between items-start">
                       <div className="bg-slate-50 p-3 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform"><Building2 size={24} /></div>
                       <button onClick={() => setCustomerConfigs(prev => prev.filter(c => c.id !== cust.id))} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                     </div>
                     <div>
                       <h3 className="text-lg font-black text-slate-900 leading-tight">{cust.name}</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest flex items-center gap-1"><Layers size={10}/> {bookings.filter(b => b.customer.toLowerCase() === cust.name.toLowerCase()).length} Operations</p>
                     </div>
                     <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Prefix</label>
                          <input 
                            className="w-full bg-slate-50 p-2 rounded-lg font-black text-emerald-600 font-mono text-xs border border-transparent focus:border-emerald-500 outline-none transition-all" 
                            value={cust.prefix} 
                            onChange={e => updateCustomerProperty(cust.id, 'prefix', e.target.value)}
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Next Serial</label>
                          <input 
                            type="number"
                            className="w-full bg-slate-50 p-2 rounded-lg font-black text-slate-900 font-mono text-xs border border-transparent focus:border-emerald-500 outline-none transition-all" 
                            value={cust.nextNumber} 
                            onChange={e => updateCustomerProperty(cust.id, 'nextNumber', parseInt(e.target.value) || 1)}
                          />
                       </div>
                       <div className="space-y-1 col-span-2">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={10}/> Due Date</label>
                          <input 
                            type="date"
                            className="w-full bg-slate-50 p-2 rounded-lg font-black text-slate-900 font-mono text-xs border border-transparent focus:border-emerald-500 outline-none transition-all" 
                            value={cust.dueDate || '2026-03-03'} 
                            onChange={e => updateCustomerProperty(cust.id, 'dueDate', e.target.value)}
                          />
                       </div>
                     </div>
                   </div>
                 ))}
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
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
                       <h3 className="text-xl font-black text-slate-900 pb-4 border-b uppercase tracking-tight flex items-center gap-3"><Briefcase size={22} className="text-emerald-500"/> Official Profile</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Entity Name</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.companyName} onChange={e => setProfile({...profile, companyName: e.target.value})} /></div>
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Tax ID / CR</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.taxId} onChange={e => setProfile({...profile, taxId: e.target.value})} /></div>
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Company Owner</label><div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/><input className="w-full bg-slate-50 pl-12 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.ownerName || ''} onChange={e => setProfile({...profile, ownerName: e.target.value})} /></div></div>
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Authorized Official</label><div className="relative"><CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/><input className="w-full bg-slate-50 pl-12 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} /></div></div>
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Professional Title</label><div className="relative"><AwardIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/><input className="w-full bg-slate-50 pl-12 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.title || ''} onChange={e => setProfile({...profile, title: e.target.value})} /></div></div>
                          <div className="space-y-1 col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase">Physical Address</label><textarea rows={2} className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none resize-none" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} /></div>
                       </div>
                    </div>
                    
                    {/* Extra Info Section added to profile for contact details */}
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
                       <h3 className="text-xl font-black text-slate-900 pb-4 border-b uppercase tracking-tight flex items-center gap-3"><Phone size={22} className="text-blue-500"/> Contact Records</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Official Phone</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.phone || ''} onChange={e => setProfile({...profile, phone: e.target.value})} /></div>
                          <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Official Email</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} /></div>
                          <div className="space-y-1 col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase">Official Website</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.website || ''} onChange={e => setProfile({...profile, website: e.target.value})} /></div>
                       </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-6">
                      <div className="flex justify-between items-center"><p className="text-[10px] font-black text-slate-400 uppercase">Primary Logo</p><label className="cursor-pointer text-emerald-600 font-black text-[10px] uppercase hover:underline"><input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logoUrl')} />Upload</label></div>
                      <div className="h-40 bg-slate-50 rounded-3xl flex items-center justify-center border-2 border-slate-100 overflow-hidden relative group">
                        {profile.logoUrl ? <img src={profile.logoUrl} className="h-full object-contain p-4 transition-transform group-hover:scale-110" /> : <ImageIcon size={48} className="text-slate-200" />}
                        {profile.logoUrl && <button onClick={() => setProfile({...profile, logoUrl: null})} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>}
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="space-y-12 animate-in fade-in duration-500">
               <header className="flex justify-between items-end">
                 <div><h2 className="text-4xl font-black text-slate-900 tracking-tight">Templates</h2><p className="text-slate-500 font-medium mt-1">Design your documents and select visible invoice data.</p></div>
               </header>

               <div className="space-y-8">
                 <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MessageSquareText size={18}/> Default Settlement Note</h3>
                 <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-4">
                    <textarea 
                      className="w-full bg-slate-50 p-6 rounded-2xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none resize-none" 
                      rows={5}
                      value={invConfig.notes}
                      onChange={e => setInvConfig({...invConfig, notes: e.target.value})}
                      placeholder="Enter your settlement note template..."
                    />
                 </div>
               </div>
            </div>
          )}

          {view === 'invoice-preview' && activeInvoice && (
            <div className="flex h-[calc(100vh-2rem)] overflow-hidden">
               {/* Main Preview Area */}
               <div className="flex-1 overflow-y-auto p-12 space-y-8 no-scrollbar bg-slate-200/50">
                  <div className="no-print bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setView('dashboard')} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"><ChevronLeft size={24}/></button>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Previewing</p>
                        <h3 className="text-xl font-black text-slate-900 leading-none">{activeInvoice.invoiceNumber}</h3>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button disabled={isDownloading} onClick={() => handleDownloadPDF(`${activeInvoice.invoiceNumber}.pdf`)} className={`bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-xl hover:bg-emerald-700 transition-all active:scale-95 ${isDownloading ? 'opacity-50' : ''}`}><Download size={18}/> {isDownloading ? 'Exporting...' : 'Export PDF'}</button>
                      <button onClick={() => window.print()} className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl hover:bg-black transition-all"><Printer size={20}/></button>
                    </div>
                  </div>
                  <div className="flex justify-center"><InvoiceDocument invoice={activeInvoice} /></div>
               </div>

               {/* Right Style Slider Sidebar */}
               <div className="no-print w-80 bg-white border-l border-slate-200 h-full flex flex-col animate-in slide-in-from-right duration-500">
                  <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                    <div className="p-2 bg-emerald-500 rounded-lg text-white"><PaletteIcon size={20}/></div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Styles (All White)</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
                    {STANDARD_THEMES.map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => updateTheme(t.id)} 
                        className={`w-full group p-4 rounded-2xl border-2 transition-all text-left flex items-start gap-4 ${activeInvoice.templateConfig?.theme === t.id ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-transparent hover:border-slate-100 hover:bg-slate-50'}`}
                      >
                         <div className={`p-3 rounded-xl ${t.color} text-white shadow-md group-hover:scale-110 transition-transform`}><t.icon size={20}/></div>
                         <div>
                            <p className={`text-xs font-black uppercase tracking-tight ${activeInvoice.templateConfig?.theme === t.id ? 'text-emerald-700' : 'text-slate-900'}`}>{t.label}</p>
                            <p className="text-[10px] font-medium text-slate-400 leading-tight mt-1">{t.desc}</p>
                         </div>
                      </button>
                    ))}
                  </div>
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

      {showManualEntryModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 space-y-8">
            <div className="flex justify-between items-center"><h3 className="text-3xl font-black text-slate-900 tracking-tight">Add Unit</h3><button onClick={() => setShowManualEntryModal(false)}><X/></button></div>
            <form onSubmit={handleManualBookingSubmit} className="space-y-4">
               <input required className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" placeholder="Customer Name" value={manualBooking.customer} onChange={e => setManualBooking({...manualBooking, customer: e.target.value})} />
               <input required className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" placeholder="Booking No." value={manualBooking.bookingNo} onChange={e => setManualBooking({...manualBooking, bookingNo: e.target.value})} />
               <div className="grid grid-cols-2 gap-4">
                 <input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" placeholder="Unit Number" value={manualBooking.reeferNumber} onChange={e => setManualBooking({...manualBooking, reeferNumber: e.target.value})} />
                 <input type="number" className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" placeholder="Rate (EGP)" value={manualBooking.rateValue || ''} onChange={e => setManualBooking({...manualBooking, rateValue: parseFloat(e.target.value) || 0})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" placeholder="Shipper Name" value={manualBooking.shipper} onChange={e => setManualBooking({...manualBooking, shipper: e.target.value})} />
                 <input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" placeholder="Trucker Name" value={manualBooking.trucker} onChange={e => setManualBooking({...manualBooking, trucker: e.target.value})} />
               </div>
               <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Save Booking</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
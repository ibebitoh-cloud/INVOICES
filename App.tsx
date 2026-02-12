
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileUp, Search, Plus, FileText, CheckCircle2, XCircle, Clock, Printer, 
  ChevronLeft, Info, Settings2, Calendar, User, Hash, ArrowRightLeft, 
  Layout, Eye, EyeOff, ArrowUp, ArrowDown, Users, UserCircle, 
  Filter, Download, Trash2, Edit3, Image as ImageIcon, Table as TableIcon,
  Save, X, Copy, BookOpen, SlidersHorizontal, ChevronDown, ChevronUp, AlertCircle,
  Building2, Palette, Layers, Info as InfoIcon, Settings, CheckCircle, Anchor,
  FileSpreadsheet, ClipboardCheck
} from 'lucide-react';
import { Booking, Invoice, InvoiceSectionId, TemplateConfig, UserProfile, SavedTemplate, InvoiceTheme, CustomerSettings } from './types';
import { parseCurrency, formatCurrency, exportToCSV } from './utils/formatters';
import InvoiceDocument from './components/InvoiceDocument';

const MAJOR_PORTS = ['ALEX', 'DAM', 'GOUDA', 'SCCT', 'SOKHNA'];

const App: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [hoveredBookingNo, setHoveredBookingNo] = useState<string | null>(null);
  
  // Advanced Filter State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });
  const [filterRoute, setFilterRoute] = useState('');
  const [filterReefer, setFilterReefer] = useState('');
  const [filterGenset, setFilterGenset] = useState('');
  const [activeQuickPort, setActiveQuickPort] = useState<string | null>(null);

  const [view, setView] = useState<'dashboard' | 'config' | 'invoice-preview' | 'profile' | 'portfolio' | 'operations'>('dashboard');
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [inspectingBooking, setInspectingBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string | null>(null);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Customer Settings (Prefix & Serial)
  const [customerSettings, setCustomerSettings] = useState<Record<string, CustomerSettings>>(() => {
    const saved = localStorage.getItem('customer_settings');
    return saved ? JSON.parse(saved) : {};
  });

  const [editingCustomerSettings, setEditingCustomerSettings] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('customer_settings', JSON.stringify(customerSettings));
  }, [customerSettings]);

  // Persisted Templates
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>(() => {
    const saved = localStorage.getItem('invoice_templates');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('invoice_templates', JSON.stringify(savedTemplates));
  }, [savedTemplates]);

  // User Profile State
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('user_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Ahmed Mostafa',
      companyName: 'Logistics Pro Egypt Ltd.',
      address: 'Industrial Zone 4, Plot 12\nBorg El Arab, Alexandria\nEgypt',
      taxId: '412-100-XXX',
      email: 'billing@logisticspro.com.eg',
      signatureUrl: null,
      logoUrl: null
    };
  });

  useEffect(() => {
    localStorage.setItem('user_profile', JSON.stringify(profile));
  }, [profile]);

  // Config State for New Invoice
  const [invConfig, setInvConfig] = useState({
    number: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    address: '',
    notes: '',
    currency: 'EGP'
  });

  // Template Config State
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>({
    sectionOrder: ['header', 'parties', 'table', 'totals', 'signature', 'footer'],
    hiddenSections: new Set<InvoiceSectionId>(),
    theme: 'modern',
    fields: {
      showReefer: true,
      showGenset: true,
      showBookingNo: true,
      showCustomerRef: true,
      showPorts: true,
      showServicePeriod: true,
      showTerms: true,
      showSignature: true,
    }
  });

  const downloadSampleTemplate = () => {
    const headers = "Customer,Booking No,Booking Date,Rate,VAT,Reefer,Genset,Port In,Port Out,Beneficiary,Address,Status,Trucker";
    const sampleData = "Maersk Egypt,BK99021,2024-05-20,4500.00,630.00,MSKU1234567,GS8892,ALEX,SCCT,Global Traders LLC,Borg El Arab Ind Zone,OK,Super Logistics Ltd";
    const blob = new Blob([`${headers}\n${sampleData}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logistics_invoice_template.csv';
    a.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const allRows = text.split('\n').map(row => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/));
      if (allRows.length === 0) return;

      const findHeaderIndex = () => {
        for (let i = 0; i < Math.min(10, allRows.length); i++) {
          const row = allRows[i].map(c => c.replace(/"/g, '').toLowerCase());
          if (row.includes('customer') || row.includes('rate') || row.includes('booking')) return i;
        }
        return 0;
      };

      const headerIdx = findHeaderIndex();
      const headers = allRows[headerIdx].map(h => h.replace(/"/g, '').trim().toLowerCase());
      
      const findCol = (keys: string[]) => headers.findIndex(h => keys.some(k => h.includes(k)));

      const mapping = {
        customer: findCol(['customer', 'client']),
        bookingNo: findCol(['booking no', 'booking #', 'bk no']),
        rate: findCol(['rate', 'amount', 'price', 'value']),
        vat: findCol(['vat', 'tax']),
        bookingDate: findCol(['booking date', 'date']),
        reefer: findCol(['reefer', 'container']),
        genset: findCol(['genset']),
        goPort: findCol(['port in', 'go port', 'origin', 'from', 'clip on']),
        giPort: findCol(['port out', 'gi port', 'destination', 'to', 'clip off']),
        beneficiary: findCol(['beneficiary', 'attention']),
        shipperAddress: findCol(['address', 'shipper']),
        status: findCol(['status']),
        customerRef: findCol(['ref', 'customer ref']),
        trucker: findCol(['trucker', 'driver', 'transporter']),
        invNo: findCol(['inv no', 'invoice no', 'invoice #']),
      };

      if (mapping.rate === -1) mapping.rate = 18;
      if (mapping.vat === -1) mapping.vat = 19;
      if (mapping.customer === -1) mapping.customer = 1;

      const dataRows = allRows.slice(headerIdx + 1).filter(r => r.length > 2 && r[mapping.customer > -1 ? mapping.customer : 1]?.trim());

      const parsed: Booking[] = dataRows.map((row, idx) => {
        const clean = (valIdx: number) => {
          if (valIdx === -1 || !row[valIdx]) return '';
          return row[valIdx].replace(/"/g, '').trim();
        };

        const rateStr = clean(mapping.rate);
        const vatStr = clean(mapping.vat);

        return {
          id: `booking-${idx}-${Date.now()}`,
          totalBooking: clean(0),
          customer: clean(mapping.customer),
          bookingDate: clean(mapping.bookingDate),
          customerRef: clean(mapping.customerRef),
          gops: clean(4),
          dateOfClipOn: clean(5),
          goPort: clean(mapping.goPort),
          giPort: clean(mapping.giPort),
          clipOffDate: clean(8),
          trucker: clean(mapping.trucker),
          bookingNo: clean(mapping.bookingNo),
          beneficiaryName: clean(mapping.beneficiary),
          reeferNumber: clean(mapping.reefer),
          gensetNo: clean(mapping.genset),
          res: clean(14),
          gaz: clean(15),
          shipperAddress: clean(mapping.shipperAddress),
          status: clean(mapping.status),
          rate: rateStr,
          rateValue: parseCurrency(rateStr),
          vat: vatStr,
          vatValue: parseCurrency(vatStr),
          remarks: clean(20),
          gensetFaultDescription: clean(21),
          invNo: clean(mapping.invNo),
          invDate: clean(23),
          invIssueDate: clean(24),
        };
      });

      setBookings(parsed);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setProfile(prev => ({ ...prev, signatureUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setProfile(prev => ({ ...prev, logoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    setBookings(prev => prev.map(b => 
      b.id === editingBooking.id 
        ? { 
            ...editingBooking, 
            rateValue: parseCurrency(editingBooking.rate),
            vatValue: parseCurrency(editingBooking.vat)
          } 
        : b
    ));
    setEditingBooking(null);
  };

  const saveCurrentTemplate = () => {
    if (!newTemplateName.trim()) return;
    const newTemplate: SavedTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplateName,
      config: {
        sectionOrder: templateConfig.sectionOrder,
        hiddenSections: Array.from(templateConfig.hiddenSections),
        fields: templateConfig.fields,
        theme: templateConfig.theme
      }
    };
    setSavedTemplates([...savedTemplates, newTemplate]);
    setNewTemplateName('');
    setShowSaveTemplateModal(false);
  };

  const applyTemplate = (template: SavedTemplate) => {
    setTemplateConfig({
      sectionOrder: template.config.sectionOrder,
      hiddenSections: new Set(template.config.hiddenSections),
      fields: template.config.fields,
      theme: template.config.theme || 'modern'
    });
  };

  const deleteTemplate = (id: string) => {
    setSavedTemplates(savedTemplates.filter(t => t.id !== id));
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = b.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.bookingNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.reeferNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.invNo?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || b.status?.toUpperCase().includes(statusFilter);
      
      const matchesRoute = !filterRoute || 
        b.goPort?.toLowerCase().includes(filterRoute.toLowerCase()) || 
        b.giPort?.toLowerCase().includes(filterRoute.toLowerCase());
        
      const matchesReefer = !filterReefer || b.reeferNumber?.toLowerCase().includes(filterReefer.toLowerCase());
      const matchesGenset = !filterGenset || b.gensetNo?.toLowerCase().includes(filterGenset.toLowerCase());
      
      let matchesQuickPort = true;
      if (activeQuickPort) {
        matchesQuickPort = b.goPort?.toUpperCase().includes(activeQuickPort) || b.giPort?.toUpperCase().includes(activeQuickPort);
      }

      let matchesDate = true;
      if (filterDateRange.start) matchesDate = matchesDate && b.bookingDate >= filterDateRange.start;
      if (filterDateRange.end) matchesDate = matchesDate && b.bookingDate <= filterDateRange.end;

      return matchesSearch && matchesStatus && matchesRoute && matchesReefer && matchesGenset && matchesDate && matchesQuickPort;
    });
  }, [bookings, searchTerm, statusFilter, filterRoute, filterReefer, filterGenset, filterDateRange, activeQuickPort]);

  const customerStats = useMemo(() => {
    const map = new Map<string, { count: number; total: number; bookings: Booking[] }>();
    bookings.forEach(b => {
      const existing = map.get(b.customer) || { count: 0, total: 0, bookings: [] };
      existing.count += 1;
      existing.total += b.rateValue;
      existing.bookings.push(b);
      map.set(b.customer, existing);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [bookings]);

  const toggleBookingSelection = (booking: Booking) => {
    const next = new Set(selectedIds);
    const relatedBookings = booking.bookingNo 
      ? bookings.filter(b => b.bookingNo === booking.bookingNo)
      : [booking];

    const isCurrentlySelected = next.has(booking.id);

    relatedBookings.forEach(b => {
      if (isCurrentlySelected) {
        next.delete(b.id);
      } else {
        next.add(b.id);
      }
    });

    setSelectedIds(next);
  };

  const prepareInvoiceConfig = () => {
    if (selectedIds.size === 0) return;
    const firstItem = bookings.find(b => selectedIds.has(b.id));
    if (!firstItem) return;

    // Detect if customer has specific settings
    const settings = customerSettings[firstItem.customer];
    let suggestedNumber = firstItem.invNo || `INV-${Date.now().toString().slice(-6)}`;
    
    if (settings) {
      suggestedNumber = `${settings.prefix}${settings.nextSerial}`;
    }

    setInvConfig({
      ...invConfig,
      number: suggestedNumber,
      address: firstItem.shipperAddress || ''
    });
    setView('config');
  };

  const finalizeInvoice = () => {
    const selectedItems = bookings.filter(b => selectedIds.has(b.id));
    if (selectedItems.length === 0) return;
    
    const subtotal = selectedItems.reduce((acc, curr) => acc + curr.rateValue, 0);
    const tax = selectedItems.reduce((acc, curr) => acc + curr.vatValue, 0);
    const firstItem = selectedItems[0];
    
    // Update customer next serial if applicable
    const settings = customerSettings[firstItem.customer];
    if (settings && invConfig.number === `${settings.prefix}${settings.nextSerial}`) {
      setCustomerSettings({
        ...customerSettings,
        [firstItem.customer]: {
          ...settings,
          nextSerial: settings.nextSerial + 1
        }
      });
    }

    // Persist Invoice Number back to bookings
    const updatedBookings = bookings.map(b => 
      selectedIds.has(b.id) ? { ...b, invNo: invConfig.number } : b
    );
    setBookings(updatedBookings);

    setActiveInvoice({
      id: `INV-${Date.now()}`,
      invoiceNumber: invConfig.number,
      date: invConfig.date,
      dueDate: invConfig.dueDate,
      customerName: firstItem.customer,
      customerAddress: invConfig.address,
      beneficiaryName: firstItem.beneficiaryName,
      items: selectedItems,
      subtotal,
      tax,
      total: subtotal + tax,
      currency: invConfig.currency,
      notes: invConfig.notes,
      templateConfig: templateConfig,
      userProfile: profile
    });
    setSelectedIds(new Set()); // Clear selection after finalizing
    setView('invoice-preview');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setFilterDateRange({ start: '', end: '' });
    setFilterRoute('');
    setFilterReefer('');
    setFilterGenset('');
    setActiveQuickPort(null);
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase() || '';
    if (s.includes('OK')) return <span className="text-[10px] font-black px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200 uppercase">OK</span>;
    if (s.includes('CANCEL')) return <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 uppercase">Cancelled</span>;
    return <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200 uppercase">Active</span>;
  };

  const NavItem = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => (
    <button 
      onClick={() => setView(id)}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:bg-gray-100'}`}
    >
      <Icon size={20} />
      {label}
    </button>
  );

  const THEMES: { id: InvoiceTheme; label: string; color: string }[] = [
    { id: 'modern', label: 'Modern Blue', color: 'bg-blue-600' },
    { id: 'minimalist', label: 'Minimalist', color: 'bg-gray-400' },
    { id: 'corporate', label: 'Corporate Dark', color: 'bg-slate-900' },
    { id: 'industrial', label: 'Industrial', color: 'bg-orange-600' },
    { id: 'elegant', label: 'Elegant Serif', color: 'bg-emerald-800' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex antialiased">
      <aside className="no-print w-72 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen shadow-xl z-[60]">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-blue-900 p-2 rounded-xl text-white shadow-lg shadow-blue-900/20">
              <FileText size={22} />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase">InvoicePro</h1>
          </div>
          <div className="space-y-2">
            <NavItem id="dashboard" icon={Layout} label="Dashboard" />
            <NavItem id="portfolio" icon={Users} label="Customers" />
            <NavItem id="operations" icon={TableIcon} label="All Operations" />
            <NavItem id="profile" icon={UserCircle} label="My Profile" />
          </div>
        </div>
        <div className="mt-auto p-8 border-t border-gray-50">
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm overflow-hidden">
              {profile.logoUrl ? <img src={profile.logoUrl} className="w-full h-full object-cover" /> : profile.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-gray-900 truncate">{profile.name}</p>
              <p className="text-[10px] font-bold text-gray-400 truncate uppercase">{profile.companyName}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full p-10">
          {view === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-black text-gray-900 tracking-tight">Booking Operations</h2>
                  <p className="text-gray-500 font-medium mt-1">Select shipments for conversion into invoices.</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={downloadSampleTemplate}
                    className="flex items-center gap-3 bg-white border-2 border-gray-200 text-gray-600 px-6 py-3 rounded-2xl hover:border-blue-500 hover:text-blue-600 transition-all font-black text-sm active:scale-95"
                  >
                    <FileSpreadsheet size={18} /> Format Guide
                  </button>
                  <label className="group flex items-center gap-3 cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-all font-black text-sm shadow-xl shadow-blue-600/20 active:scale-95">
                    <FileUp size={18} /> Import Sheet
                    <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </header>

              {/* Grouping Info Panel */}
              <div className="bg-blue-900 text-white p-6 rounded-[2rem] flex items-center justify-between shadow-2xl shadow-blue-900/30 overflow-hidden relative">
                <div className="relative z-10 flex items-center gap-6">
                  <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md border border-white/20">
                    <Layers size={32} className="text-blue-100" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Duplicate Recognition Active</h3>
                    <p className="text-blue-200 text-sm font-medium mt-1">Shipments with matching Booking Numbers are automatically linked.</p>
                  </div>
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-10">
                  <Layers size={200} />
                </div>
              </div>

              {/* Format Guide Card - Collapsible or always visible */}
              <div className="bg-white border-2 border-dashed border-blue-200 p-8 rounded-[2rem] shadow-sm flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <ClipboardCheck className="text-blue-600" size={24} />
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Import Format Guide</h3>
                  </div>
                  <p className="text-gray-500 text-sm font-medium mb-6">Use these exact column names in your CSV to ensure 100% accurate mapping. Case-insensitive.</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Client", keys: "Customer" },
                      { label: "Order #", keys: "Booking No" },
                      { label: "Rate", keys: "Rate" },
                      { label: "Tax", keys: "VAT" },
                      { label: "Entry Port", keys: "Port In" },
                      { label: "Exit Port", keys: "Port Out" },
                      { label: "Unit ID", keys: "Reefer" },
                      { label: "Add-on", keys: "Genset" },
                    ].map(f => (
                      <div key={f.label} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{f.label}</p>
                        <p className="text-xs font-black text-blue-600 font-mono">{f.keys}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-full md:w-auto self-stretch flex flex-col justify-center gap-3">
                   <button 
                    onClick={downloadSampleTemplate}
                    className="flex items-center justify-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all shadow-xl active:scale-95"
                   >
                     <Download size={18} /> Download Sample CSV
                   </button>
                   <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recommended Format</p>
                </div>
              </div>

              {/* Quick Port Chips */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  <Anchor size={14} className="text-gray-400" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Major Ports</span>
                </div>
                {MAJOR_PORTS.map(port => (
                  <button 
                    key={port}
                    onClick={() => setActiveQuickPort(activeQuickPort === port ? null : port)}
                    className={`
                      px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border-2 whitespace-nowrap
                      ${activeQuickPort === port 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200 hover:text-blue-600'
                      }
                    `}
                  >
                    {port}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search client, container, invoice or booking..."
                      className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <button 
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all border-2 ${showAdvancedFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200'}`}
                  >
                    <SlidersHorizontal size={18} />
                    Filters
                    {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  <div className="h-10 w-px bg-gray-100"></div>

                  <button 
                    onClick={prepareInvoiceConfig}
                    disabled={selectedIds.size === 0}
                    className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black text-sm disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-gray-900/10 active:scale-95"
                  >
                    Create Invoice ({selectedIds.size})
                  </button>
                </div>

                {showAdvancedFilters && (
                  <div className="pt-4 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</label>
                      <select 
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="OK">OK Only</option>
                        <option value="CANCEL">Cancelled</option>
                        <option value="ACTIVE">Active</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date Range</label>
                      <div className="flex items-center gap-2">
                        <input type="date" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500/20" value={filterDateRange.start} onChange={(e) => setFilterDateRange({...filterDateRange, start: e.target.value})} />
                        <span className="text-gray-300">-</span>
                        <input type="date" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500/20" value={filterDateRange.end} onChange={(e) => setFilterDateRange({...filterDateRange, end: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ports (Origin/Destination)</label>
                      <input type="text" placeholder="Port name..." className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={filterRoute} onChange={(e) => setFilterRoute(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Equipment (Reefer/Genset)</label>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Reefer #" className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={filterReefer} onChange={(e) => setFilterReefer(e.target.value)} />
                        <input type="text" placeholder="Genset #" className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={filterGenset} onChange={(e) => setFilterGenset(e.target.value)} />
                      </div>
                    </div>
                    <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                      <button onClick={clearFilters} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors">Reset All Filters</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <tr>
                      <th className="py-5 px-8 w-16 text-center">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded-lg border-2 border-gray-200 text-blue-600 focus:ring-0"
                          checked={selectedIds.size === filteredBookings.length && filteredBookings.length > 0}
                          onChange={() => {
                            if (selectedIds.size === filteredBookings.length) setSelectedIds(new Set());
                            else setSelectedIds(new Set(filteredBookings.map(b => b.id)));
                          }}
                        />
                      </th>
                      <th className="py-5 px-4">Customer</th>
                      <th className="py-5 px-4">Booking / Date</th>
                      <th className="py-5 px-4">Port In</th>
                      <th className="py-5 px-4">Port Out</th>
                      <th className="py-5 px-4 text-right">Rate</th>
                      <th className="py-5 px-4 text-center">Inv #</th>
                      <th className="py-5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {filteredBookings.length > 0 ? filteredBookings.map(b => {
                      const groupMembers = b.bookingNo ? bookings.filter(x => x.bookingNo === b.bookingNo) : [];
                      const isPartofGroup = groupMembers.length > 1;
                      const isHoveredGroup = b.bookingNo && hoveredBookingNo === b.bookingNo;
                      const isSelected = selectedIds.has(b.id);
                      
                      return (
                        <tr 
                          key={b.id} 
                          onMouseEnter={() => b.bookingNo && setHoveredBookingNo(b.bookingNo)}
                          onMouseLeave={() => setHoveredBookingNo(null)}
                          className={`
                            group transition-all duration-200 relative
                            ${isSelected ? 'bg-blue-50/60' : ''}
                            ${isHoveredGroup && !isSelected ? 'bg-orange-50/40' : ''}
                            ${!isSelected && !isHoveredGroup ? 'hover:bg-gray-50/50' : ''}
                          `}
                        >
                          <td className="py-6 px-8 text-center relative">
                            {/* Duplicate Marker Bar */}
                            {isPartofGroup && (
                              <div className={`absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full ${isSelected ? 'bg-blue-500' : isHoveredGroup ? 'bg-orange-500' : 'bg-gray-200'} transition-colors`} />
                            )}
                            
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 rounded-lg border-2 border-gray-200 text-blue-600 focus:ring-0 cursor-pointer"
                              checked={isSelected}
                              onChange={() => toggleBookingSelection(b)}
                            />
                          </td>
                          <td className="py-6 px-4">
                            <p className="font-black text-gray-900 text-base leading-tight">{b.customer}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase truncate max-w-[150px] mt-1">{b.beneficiaryName || 'No Consignee'}</p>
                          </td>
                          <td className="py-6 px-4">
                            <div className="flex items-center gap-2">
                              <p className={`font-mono text-xs font-bold ${isHoveredGroup ? 'text-orange-600' : 'text-gray-600'}`}>{b.bookingNo}</p>
                              {isPartofGroup && (
                                <div className="group/badge relative">
                                  <span className={`
                                    ${isSelected ? 'bg-blue-600 text-white' : isHoveredGroup ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-500'}
                                    text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors
                                  `}>
                                    <Layers size={8} /> {groupMembers.length}
                                  </span>
                                  
                                  {/* Group Tooltip */}
                                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none z-20">
                                    <div className="bg-gray-900 text-white text-[10px] font-bold px-3 py-2 rounded-xl whitespace-nowrap shadow-xl">
                                      Part of a group with {groupMembers.length} shipments
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 mt-1">{b.bookingDate}</p>
                          </td>
                          <td className="py-6 px-4">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded ${MAJOR_PORTS.includes(b.goPort?.toUpperCase()) ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-gray-600'} font-bold text-[10px] uppercase`}>
                               {MAJOR_PORTS.includes(b.goPort?.toUpperCase()) && <Anchor size={10} />}
                               {b.goPort || '---'}
                            </div>
                          </td>
                          <td className="py-6 px-4">
                             <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded ${MAJOR_PORTS.includes(b.giPort?.toUpperCase()) ? 'bg-red-50 text-red-600 border border-red-100' : 'text-gray-600'} font-bold text-[10px] uppercase`}>
                                {MAJOR_PORTS.includes(b.giPort?.toUpperCase()) && <Anchor size={10} />}
                                {b.giPort || '---'}
                             </div>
                          </td>
                          <td className="py-6 px-4 text-right font-black text-gray-900">
                            {b.rateValue === 0 && b.rate !== '0' && b.rate !== '' ? (
                              <div className="flex items-center justify-end gap-1 text-red-500">
                                <AlertCircle size={14} />
                                <span>{b.rate}</span>
                              </div>
                            ) : b.rate}
                          </td>
                          <td className="py-6 px-4 text-center">
                            {b.invNo ? (
                              <div className="inline-flex items-center gap-1.5 text-blue-600 font-black bg-blue-50 px-2 py-1 rounded-lg">
                                <CheckCircle size={12} />
                                <span className="font-mono text-[10px]">{b.invNo}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">Pending</span>
                            )}
                          </td>
                          <td className="py-6 px-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => setEditingBooking(b)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 rounded-lg" title="Edit">
                                <Edit3 size={18} />
                              </button>
                              <button onClick={() => setInspectingBooking(b)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 rounded-lg" title="Details">
                                <Info size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={8} className="py-20 text-center"><p className="text-gray-400 font-bold">No results found.</p></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'config' && (
            <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-300 pb-20">
               <header className="flex justify-between items-center">
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">Invoice Customization</h2>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowSaveTemplateModal(true)} className="flex items-center gap-2 bg-white border-2 border-blue-600 text-blue-600 px-5 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all font-black text-sm shadow-sm"><Save size={18} /> Save as Template</button>
                  <button onClick={() => setView('dashboard')} className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-red-500 transition-all"><XCircle size={28} /></button>
                </div>
              </header>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                  <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8">
                    <h3 className="text-xl font-black text-gray-900 mb-8 pb-4 border-b flex items-center gap-2">
                      <Palette size={20} className="text-blue-600" /> Visual Theme
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {THEMES.map(theme => (
                        <button 
                          key={theme.id} 
                          onClick={() => setTemplateConfig({ ...templateConfig, theme: theme.id })}
                          className={`flex flex-col items-center gap-3 p-4 rounded-[2rem] border-4 transition-all ${templateConfig.theme === theme.id ? 'border-blue-500 bg-blue-50' : 'border-gray-50 bg-gray-50'}`}
                        >
                          <div className={`w-12 h-12 rounded-full ${theme.color} shadow-lg`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${templateConfig.theme === theme.id ? 'text-blue-600' : 'text-gray-400'}`}>
                            {theme.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {savedTemplates.length > 0 && (
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 space-y-6">
                      <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><BookOpen size={20} className="text-blue-600" /> Saved Templates</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {savedTemplates.map(t => (
                          <div key={t.id} className="group flex items-center justify-between p-4 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-blue-500 transition-all cursor-pointer" onClick={() => applyTemplate(t)}>
                            <div className="flex items-center gap-3"><div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Layout size={16} /></div><span className="font-bold text-gray-900">{t.name}</span></div>
                            <button onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }} className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 space-y-8">
                    <h3 className="text-xl font-black text-gray-900 border-b pb-4">Basic Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          Invoice Number 
                          {customerSettings[bookings.find(b => selectedIds.has(b.id))?.customer || ''] && (
                            <span className="text-blue-500 text-[8px] flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded">
                              <Info size={10} /> Rule Applied
                            </span>
                          )}
                        </label>
                        <input type="text" className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl px-6 py-4 outline-none font-bold" value={invConfig.number} onChange={(e) => setInvConfig({...invConfig, number: e.target.value})} />
                      </div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Currency</label><select className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl px-6 py-4 outline-none font-bold" value={invConfig.currency} onChange={(e) => setInvConfig({...invConfig, currency: e.target.value})}><option value="EGP">Egyptian Pound (EGP)</option><option value="USD">US Dollar (USD)</option><option value="EUR">Euro (EUR)</option></select></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8">
                    <h3 className="text-xl font-black text-gray-900 mb-8 pb-4 border-b">Display Options</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(templateConfig.fields).map(([key, value]) => (
                        <button 
                          key={key} 
                          onClick={() => setTemplateConfig({ ...templateConfig, fields: { ...templateConfig.fields, [key as keyof TemplateConfig['fields']]: !value } })} 
                          className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all font-bold text-xs ${value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-50 bg-gray-50 text-gray-400'}`}
                        >
                          {key.replace('show', '')}
                          {value ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 sticky top-10 h-fit">
                  <h3 className="text-xl font-black text-gray-900 mb-8 border-b pb-4">Invoice Sequence</h3>
                  <div className="space-y-3">{templateConfig.sectionOrder.map((sectionId, idx) => (<div key={sectionId} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${templateConfig.hiddenSections.has(sectionId) ? 'opacity-30 grayscale border-gray-100' : 'bg-blue-50/30 border-blue-50'}`}><div className="flex items-center gap-3"><button onClick={() => { const next = new Set(templateConfig.hiddenSections); if (next.has(sectionId)) next.delete(sectionId); else next.add(sectionId); setTemplateConfig({ ...templateConfig, hiddenSections: next }); }} className="p-1 text-blue-600">{templateConfig.hiddenSections.has(sectionId) ? <EyeOff size={18} /> : <Eye size={18} />}</button><span className="text-xs font-black uppercase text-gray-900">{sectionId}</span></div><div className="flex gap-1"><button disabled={idx === 0} onClick={() => { const next = [...templateConfig.sectionOrder]; [next[idx], next[idx-1]] = [next[idx-1], next[idx]]; setTemplateConfig({ ...templateConfig, sectionOrder: next }); }} className="p-1 disabled:opacity-0 hover:bg-white rounded-lg transition-colors"><ArrowUp size={16} /></button><button disabled={idx === templateConfig.length - 1} onClick={() => { const next = [...templateConfig.sectionOrder]; [next[idx], next[idx+1]] = [next[idx-1], next[idx]]; setTemplateConfig({ ...templateConfig, sectionOrder: next }); }} className="p-1 disabled:opacity-0 hover:bg-white rounded-lg transition-colors"><ArrowDown size={16} /></button></div></div>))}</div>
                  <button onClick={finalizeInvoice} className="w-full mt-10 bg-gray-900 text-white py-5 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all shadow-2xl active:scale-95">Preview & Export</button>
                </div>
              </div>
            </div>
          )}

          {view === 'portfolio' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
               <header><h2 className="text-4xl font-black text-gray-900 tracking-tight">Customer Portfolio</h2><p className="text-gray-500 font-medium mt-1">Review activity and revenue per client.</p></header>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customerStats.map(([name, stat]) => (
                  <div key={name} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <User size={28} />
                      </div>
                      <button 
                        onClick={() => setEditingCustomerSettings(name)}
                        className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                      >
                        <Settings size={20} />
                      </button>
                    </div>
                    <button onClick={() => setSelectedCustomerName(name)} className="text-left">
                      <h3 className="text-xl font-black text-gray-900 mb-1 truncate">{name}</h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">{stat.count} Shipments</p>
                      
                      {customerSettings[name] && (
                        <div className="mb-4 bg-blue-50 px-3 py-2 rounded-xl inline-flex items-center gap-2">
                          <Hash size={12} className="text-blue-600" />
                          <span className="text-[10px] font-black text-blue-700 uppercase">
                            Next: {customerSettings[name].prefix}{customerSettings[name].nextSerial}
                          </span>
                        </div>
                      )}

                      <div className="pt-6 border-t border-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total Volume</p>
                        <p className="text-2xl font-black text-gray-900">{formatCurrency(stat.total)}</p>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'operations' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <header className="flex justify-between items-center"><div><h2 className="text-4xl font-black text-gray-900 tracking-tight">Operation History</h2><p className="text-gray-500 font-medium mt-1">Historical log and monthly reports.</p></div><button onClick={() => exportToCSV(bookings, `Operations_Report_${new Date().getMonth() + 1}.csv`)} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl active:scale-95"><Download size={18} className="inline mr-2" /> Export CSV</button></header>
              <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-gray-50 border-b border-gray-100 font-black text-gray-400 uppercase tracking-widest"><tr><th className="py-4 px-4">Booking No</th><th className="py-4 px-4">Customer</th><th className="py-4 px-4">Date</th><th className="py-4 px-4">Route</th><th className="py-4 px-4 text-right">Rate</th><th className="py-4 px-4">Inv #</th><th className="py-4 px-4">Status</th></tr></thead><tbody className="divide-y divide-gray-50">{bookings.map(b => (<tr key={b.id} className="hover:bg-gray-50"><td className="py-4 px-4 font-bold">{b.bookingNo}</td><td className="py-4 px-4 truncate max-w-[120px]">{b.customer}</td><td className="py-4 px-4">{b.bookingDate}</td><td className="py-4 px-4">{b.goPort} → {b.giPort}</td><td className="py-4 px-4 text-right font-black">{b.rate}</td><td className="py-4 px-4 font-mono text-blue-600">{b.invNo || '---'}</td><td className="py-4 px-4">{getStatusBadge(b.status)}</td></tr>))}</tbody></table></div>
            </div>
          )}

          {view === 'profile' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
               <header><h2 className="text-4xl font-black text-gray-900 tracking-tight">Organization Profile</h2></header>
              <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 p-10 space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label><input type="text" className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company</label><input type="text" className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold" value={profile.companyName} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })} /></div>
                    <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Business Address</label><textarea className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold min-h-[100px]" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tax ID / CR</label><input type="text" className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold" value={profile.taxId} onChange={(e) => setProfile({ ...profile, taxId: e.target.value })} /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Billing Email</label><input type="email" className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-gray-100">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Building2 size={24} className="text-blue-600" />
                        <h3 className="text-xl font-black text-gray-900">Company Logo</h3>
                      </div>
                      <div className="flex flex-col gap-6">
                        <label className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-2xl hover:bg-blue-700 transition-all font-black text-sm cursor-pointer shadow-lg shadow-blue-600/20 active:scale-95">
                          <ImageIcon size={18}/> Upload Logo
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        </label>
                        <div className="h-48 w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex items-center justify-center overflow-hidden relative group">
                          {profile.logoUrl ? (
                            <>
                              <img src={profile.logoUrl} className="max-h-full max-w-full object-contain p-4" />
                              <button onClick={() => setProfile({...profile, logoUrl: null})} className="absolute top-4 right-4 p-2 bg-white/90 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm"><Trash2 size={16}/></button>
                            </>
                          ) : (
                            <div className="text-center">
                              <Building2 size={40} className="mx-auto text-gray-200 mb-2" />
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No Logo Uploaded</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <ImageIcon size={24} className="text-blue-600" />
                        <h3 className="text-xl font-black text-gray-900">Digital Signature</h3>
                      </div>
                      <div className="flex flex-col gap-6">
                        <label className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-2xl hover:bg-blue-700 transition-all font-black text-sm cursor-pointer shadow-lg shadow-blue-600/20 active:scale-95">
                          <ImageIcon size={18}/> Upload Signature
                          <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                        </label>
                        <div className="h-48 w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex items-center justify-center overflow-hidden relative group">
                          {profile.signatureUrl ? (
                            <>
                              <img src={profile.signatureUrl} className="max-h-full max-w-full object-contain p-4" />
                              <button onClick={() => setProfile({...profile, signatureUrl: null})} className="absolute top-4 right-4 p-2 bg-white/90 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm"><Trash2 size={16}/></button>
                            </>
                          ) : (
                            <div className="text-center">
                              <ImageIcon size={40} className="mx-auto text-gray-200 mb-2" />
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No Signature</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          )}

          {view === 'invoice-preview' && (
            <div className="space-y-10 animate-in fade-in duration-500 pb-20">
              <header className="no-print flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <button onClick={() => setView('dashboard')} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all" title="Close Preview">
                    <X size={24} />
                  </button>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Invoice Preview</h2>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setView('dashboard')} className="flex items-center gap-2 bg-gray-50 text-gray-600 px-5 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all">
                    <Layout size={18} /> Return to Dashboard
                  </button>
                  <button onClick={() => setView('config')} className="bg-white border border-gray-200 text-gray-600 px-5 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all">
                    Edit Layout
                  </button>
                  <button 
                    onClick={() => window.print()} 
                    className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl shadow-blue-600/30 hover:bg-blue-700 hover:scale-[1.02] transition-all active:scale-95 animate-pulse-subtle"
                  >
                    <Printer size={20} /> Print & Save PDF
                  </button>
                </div>
              </header>
              {activeInvoice && <InvoiceDocument invoice={activeInvoice} />}
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      {editingCustomerSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 no-print">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setEditingCustomerSettings(null)}></div>
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative overflow-hidden p-10 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-gray-900 mb-2">Invoice Rules</h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-8">For {editingCustomerSettings}</p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice Prefix</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl px-5 py-4 font-bold outline-none"
                  placeholder="e.g. LOG-"
                  value={customerSettings[editingCustomerSettings]?.prefix || ''}
                  onChange={(e) => setCustomerSettings({
                    ...customerSettings,
                    [editingCustomerSettings]: {
                      ...(customerSettings[editingCustomerSettings] || { nextSerial: 1 }),
                      prefix: e.target.value
                    }
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Start Serial</label>
                <input 
                  type="number" 
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl px-5 py-4 font-bold outline-none"
                  placeholder="e.g. 1001"
                  value={customerSettings[editingCustomerSettings]?.nextSerial || ''}
                  onChange={(e) => setCustomerSettings({
                    ...customerSettings,
                    [editingCustomerSettings]: {
                      ...(customerSettings[editingCustomerSettings] || { prefix: '' }),
                      nextSerial: parseInt(e.target.value) || 1
                    }
                  })}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setEditingCustomerSettings(null)} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg">Save Rules</button>
                <button onClick={() => {
                   const next = { ...customerSettings };
                   delete next[editingCustomerSettings];
                   setCustomerSettings(next);
                   setEditingCustomerSettings(null);
                }} className="flex-1 bg-red-50 text-red-500 py-4 rounded-2xl font-black">Reset</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCustomerName && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 no-print">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setSelectedCustomerName(null)}></div>
          <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10">
            <div className="p-10 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-4xl font-black text-gray-900">{selectedCustomerName}</h3>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">Full Customer Profile & Analytics</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    const customerData = customerStats.find(s => s[0] === selectedCustomerName)?.[1];
                    if (customerData) exportToCSV(customerData.bookings, `${selectedCustomerName}_Portfolio.csv`);
                  }}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-2xl hover:bg-green-700 transition-all font-black text-sm"
                >
                  <Download size={18} /> Export CSV
                </button>
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-all font-black text-sm"
                >
                  <Printer size={18} /> Print Report
                </button>
                <button onClick={() => setSelectedCustomerName(null)} className="p-4 bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all">
                  <X size={28} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-10">
              {(() => {
                const customerData = customerStats.find(s => s[0] === selectedCustomerName)?.[1];
                if (!customerData) return <p className="text-center py-20 text-gray-400 font-bold">No data found for this customer.</p>;
                return (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100"><p className="text-[10px] font-black text-blue-900/40 uppercase mb-1">Total Revenue</p><p className="text-3xl font-black text-blue-900">{formatCurrency(customerData.total)}</p></div>
                      <div className="bg-green-50/50 p-6 rounded-3xl border border-green-100"><p className="text-[10px] font-black text-green-900/40 uppercase mb-1">Total Shipments</p><p className="text-3xl font-black text-green-900">{customerData.count}</p></div>
                      <div className="bg-yellow-50/50 p-6 rounded-3xl border border-yellow-100"><p className="text-[10px] font-black text-yellow-900/40 uppercase mb-1">Active Ports</p><p className="text-3xl font-black text-yellow-900">{new Set(customerData.bookings.map(b => `${b.goPort}-${b.giPort}`)).size}</p></div>
                    </div>
                    <div className="bg-white border rounded-[2rem] overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <tr>
                            <th className="py-4 px-6">Date & Booking</th>
                            <th className="py-4 px-6">Consignee</th>
                            <th className="py-4 px-6">Container #</th>
                            <th className="py-4 px-6">Trucker</th>
                            <th className="py-4 px-6">Route & Address</th>
                            <th className="py-4 px-6">Inv #</th>
                            <th className="py-4 px-6 text-right">Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {customerData.bookings.map(b => (
                            <tr key={b.id} className="hover:bg-gray-50/80 transition-all">
                              <td className="py-6 px-6">
                                <p className="font-black text-gray-900 text-sm">{b.bookingNo}</p>
                                <p className="text-[10px] font-bold text-gray-400 mt-1">{b.bookingDate}</p>
                              </td>
                              <td className="py-6 px-6">
                                <p className="font-bold text-gray-700">{b.beneficiaryName || 'N/A'}</p>
                              </td>
                              <td className="py-6 px-6">
                                <p className="font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded inline-block">{b.reeferNumber || 'N/A'}</p>
                              </td>
                              <td className="py-6 px-6">
                                <p className="font-bold text-gray-600">{b.trucker || '---'}</p>
                              </td>
                              <td className="py-6 px-6">
                                <p className="font-black text-blue-600 uppercase tracking-tighter">{b.goPort} → {b.giPort}</p>
                                <p className="text-[10px] font-medium text-gray-400 mt-1 line-clamp-1 italic">{b.shipperAddress}</p>
                              </td>
                              <td className="py-6 px-6">
                                <span className="font-mono text-[10px] font-bold text-blue-600">{b.invNo || '---'}</span>
                              </td>
                              <td className="py-6 px-6 text-right font-black text-gray-900 text-sm">
                                {b.rate}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 no-print">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowSaveTemplateModal(false)}></div>
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden p-10 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-gray-900 mb-6">Save Template</h3>
            <div className="space-y-4">
              <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Template Name</label><input type="text" className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl px-5 py-3 font-bold" placeholder="e.g., International Reefer" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} /></div>
              <div className="flex gap-4 pt-6"><button onClick={saveCurrentTemplate} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg">Save Template</button><button onClick={() => setShowSaveTemplateModal(false)} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black">Cancel</button></div>
            </div>
          </div>
        </div>
      )}

      {editingBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 no-print">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setEditingBooking(null)}></div>
          <form onSubmit={handleSaveEdit} className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 p-10 space-y-6">
            <h3 className="text-2xl font-black text-gray-900">Edit Booking</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1"><label className="text-[10px] font-bold">Rate</label><input type="text" className="w-full bg-gray-50 border p-3 rounded-xl font-bold" value={editingBooking.rate} onChange={e => setEditingBooking({...editingBooking, rate: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold">VAT</label><input type="text" className="w-full bg-gray-50 border p-3 rounded-xl font-bold" value={editingBooking.vat} onChange={e => setEditingBooking({...editingBooking, vat: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold">Status</label><input type="text" className="w-full bg-gray-50 border p-3 rounded-xl font-bold" value={editingBooking.status} onChange={e => setEditingBooking({...editingBooking, status: e.target.value})} /></div>
            </div>
            <div className="flex gap-4 pt-4"><button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg">Save</button><button type="button" onClick={() => setEditingBooking(null)} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black">Cancel</button></div>
          </form>
        </div>
      )}

      {inspectingBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 no-print">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setInspectingBooking(null)}></div>
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden p-8 animate-in zoom-in-95">
             <div className="flex justify-between items-start mb-6"><h3 className="text-3xl font-black">{inspectingBooking.bookingNo}</h3><button onClick={() => setInspectingBooking(null)}><X size={24}/></button></div>
             <div className="grid grid-cols-2 gap-6">
               <div><p className="text-xs font-bold text-gray-400 uppercase">Customer</p><p className="font-black">{inspectingBooking.customer}</p></div>
               <div><p className="text-xs font-bold text-gray-400 uppercase">Rate</p><p className="font-black text-blue-600">{inspectingBooking.rate}</p></div>
               <div className="col-span-2"><p className="text-xs font-bold text-gray-400 uppercase">Remarks</p><p className="p-4 bg-gray-50 rounded-xl mt-1">{inspectingBooking.remarks || 'None'}</p></div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

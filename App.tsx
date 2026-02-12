
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileUp, Search, Plus, FileText, CheckCircle2, XCircle, Clock, Printer, 
  ChevronLeft, Info, Settings2, Calendar, User, Hash, ArrowRightLeft, 
  Layout, Eye, EyeOff, ArrowUp, ArrowDown, Users, UserCircle, 
  Filter, Download, Trash2, Edit3, Image as ImageIcon, Table as TableIcon,
  Save, X, Copy, BookOpen, SlidersHorizontal, ChevronDown, ChevronUp, AlertCircle,
  Building2, Palette, Layers, Info as InfoIcon, Settings, CheckCircle, Anchor,
  FileSpreadsheet, ClipboardCheck, FilePlus, ToggleLeft, ToggleRight, Settings as SettingsIcon,
  MapPin, Package, Truck
} from 'lucide-react';
import { Booking, Invoice, InvoiceSectionId, TemplateConfig, UserProfile, SavedTemplate, InvoiceTheme, CustomerSettings, TemplateFields } from './types';
import { parseCurrency, formatCurrency, exportToCSV } from './utils/formatters';
import InvoiceDocument from './components/InvoiceDocument';

const MAJOR_PORTS = ['ALEX', 'DAM', 'GOUDA', 'SCCT', 'SOKHNA'];

const App: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [hoveredBookingNo, setHoveredBookingNo] = useState<string | null>(null);
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });
  const [filterRoute, setFilterRoute] = useState('');
  const [filterReefer, setFilterReefer] = useState('');
  const [filterGenset, setFilterGenset] = useState('');
  const [activeQuickPort, setActiveQuickPort] = useState<string | null>(null);

  const [view, setView] = useState<'dashboard' | 'config' | 'invoice-preview' | 'profile' | 'portfolio' | 'operations' | 'field-master'>('dashboard');
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [inspectingBooking, setInspectingBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string | null>(null);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  const [customerSettings, setCustomerSettings] = useState<Record<string, CustomerSettings>>(() => {
    const saved = localStorage.getItem('customer_settings');
    return saved ? JSON.parse(saved) : {};
  });

  const [editingCustomerSettings, setEditingCustomerSettings] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('customer_settings', JSON.stringify(customerSettings));
  }, [customerSettings]);

  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>(() => {
    const saved = localStorage.getItem('invoice_templates');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('invoice_templates', JSON.stringify(savedTemplates));
  }, [savedTemplates]);

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

  const [invConfig, setInvConfig] = useState({
    number: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    address: '',
    notes: '',
    currency: 'EGP'
  });

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
      showLogo: true,
      showCompanyInfo: true,
      showTaxId: true,
      showCustomerAddress: true,
      showBeneficiary: true,
      showShipperAddress: true,
      showTrucker: true,
      showVat: true,
      showInvoiceDate: true,
      showDueDate: true,
      showNotes: true,
      showWatermark: true,
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
      const matchesRoute = !filterRoute || b.goPort?.toLowerCase().includes(filterRoute.toLowerCase()) || b.giPort?.toLowerCase().includes(filterRoute.toLowerCase());
      const matchesReefer = !filterReefer || b.reeferNumber?.toLowerCase().includes(filterReefer.toLowerCase());
      const matchesGenset = !filterGenset || b.gensetNo?.toLowerCase().includes(filterGenset.toLowerCase());
      let matchesQuickPort = true;
      if (activeQuickPort) matchesQuickPort = b.goPort?.toUpperCase().includes(activeQuickPort) || b.giPort?.toUpperCase().includes(activeQuickPort);
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
    const relatedBookings = booking.bookingNo ? bookings.filter(b => b.bookingNo === booking.bookingNo) : [booking];
    const isCurrentlySelected = next.has(booking.id);
    relatedBookings.forEach(b => {
      if (isCurrentlySelected) next.delete(b.id);
      else next.add(b.id);
    });
    setSelectedIds(next);
  };

  const prepareInvoiceConfig = () => {
    if (selectedIds.size === 0) return;
    const firstItem = bookings.find(b => selectedIds.has(b.id));
    if (!firstItem) return;
    const settings = customerSettings[firstItem.customer];
    let suggestedNumber = firstItem.invNo || `INV-${Date.now().toString().slice(-6)}`;
    if (settings) suggestedNumber = `${settings.prefix}${settings.nextSerial}`;
    setInvConfig({ ...invConfig, number: suggestedNumber, address: firstItem.shipperAddress || '' });
    setView('config');
  };

  const handleQuickCreate = (booking: Booking) => {
    const next = new Set<string>();
    const groupMembers = booking.bookingNo ? bookings.filter(x => x.bookingNo === booking.bookingNo) : [booking];
    groupMembers.forEach(m => next.add(m.id));
    setSelectedIds(next);
    const firstItem = groupMembers[0];
    const settings = customerSettings[firstItem.customer];
    let suggestedNumber = firstItem.invNo || `INV-${Date.now().toString().slice(-6)}`;
    if (settings) suggestedNumber = `${settings.prefix}${settings.nextSerial}`;
    setInvConfig({ ...invConfig, number: suggestedNumber, date: new Date().toISOString().split('T')[0], dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0], address: firstItem.shipperAddress || '', notes: '', currency: 'EGP' });
    setView('config');
  };

  const finalizeInvoice = () => {
    const selectedItems = bookings.filter(b => selectedIds.has(b.id));
    if (selectedItems.length === 0) return;
    const subtotal = selectedItems.reduce((acc, curr) => acc + curr.rateValue, 0);
    const tax = selectedItems.reduce((acc, curr) => acc + curr.vatValue, 0);
    const firstItem = selectedItems[0];
    const settings = customerSettings[firstItem.customer];
    if (settings && invConfig.number === `${settings.prefix}${settings.nextSerial}`) {
      setCustomerSettings({ ...customerSettings, [firstItem.customer]: { ...settings, nextSerial: settings.nextSerial + 1 } });
    }
    const updatedBookings = bookings.map(b => selectedIds.has(b.id) ? { ...b, invNo: invConfig.number } : b);
    setBookings(updatedBookings);
    setActiveInvoice({ id: `INV-${Date.now()}`, invoiceNumber: invConfig.number, date: invConfig.date, dueDate: invConfig.dueDate, customerName: firstItem.customer, customerAddress: invConfig.address, beneficiaryName: firstItem.beneficiaryName, items: selectedItems, subtotal, tax, total: subtotal + tax, currency: invConfig.currency, notes: invConfig.notes, templateConfig: { ...templateConfig, hiddenSections: new Set(templateConfig.hiddenSections) }, userProfile: profile });
    setSelectedIds(new Set());
    setView('invoice-preview');
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
    { id: 'sidebar-pro', label: 'Sidebar Layout', color: 'bg-indigo-600' },
    { id: 'modern-cards', label: 'Visual Cards', color: 'bg-purple-600' },
    { id: 'technical-draft', label: 'Tech Blueprint', color: 'bg-[#1a365d]' },
    { id: 'industrial', label: 'Industrial', color: 'bg-orange-600' },
    { id: 'elegant', label: 'Elegant Serif', color: 'bg-emerald-800' },
  ];

  const FieldToggle = ({ field, label, description, icon: Icon }: { field: keyof TemplateFields, label: string, description: string, icon: any }) => {
    const isActive = templateConfig.fields[field];
    return (
      <div 
        onClick={() => setTemplateConfig({ ...templateConfig, fields: { ...templateConfig.fields, [field]: !isActive } })}
        className={`group p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex items-center justify-between ${isActive ? 'bg-blue-50 border-blue-600 shadow-md' : 'bg-white border-gray-100 opacity-60 hover:opacity-100 hover:border-gray-200'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl transition-all ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
            <Icon size={20} />
          </div>
          <div>
            <h4 className={`text-sm font-black tracking-tight ${isActive ? 'text-blue-900' : 'text-gray-600'}`}>{label}</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">{description}</p>
          </div>
        </div>
        <div className={`transition-all ${isActive ? 'text-blue-600' : 'text-gray-200'}`}>
          {isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
        </div>
      </div>
    );
  };

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
            <NavItem id="field-master" icon={SettingsIcon} label="Field Master" />
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
        <div className="max-w-6xl mx-auto w-full p-10 print:p-0">
          {view === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-black text-gray-900 tracking-tight">Booking Operations</h2>
                  <p className="text-gray-500 font-medium mt-1">Select shipments for conversion into invoices.</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={downloadSampleTemplate} className="flex items-center gap-3 bg-white border-2 border-gray-200 text-gray-600 px-6 py-3 rounded-2xl hover:border-blue-500 hover:text-blue-600 transition-all font-black text-sm active:scale-95"><FileSpreadsheet size={18} /> Format Guide</button>
                  <label className="group flex items-center gap-3 cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-all font-black text-sm shadow-xl shadow-blue-600/20 active:scale-95"><FileUp size={18} /> Import Sheet<input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} /></label>
                </div>
              </header>

              <div className="bg-blue-900 text-white p-6 rounded-[2rem] flex items-center justify-between shadow-2xl shadow-blue-900/30 overflow-hidden relative">
                <div className="relative z-10 flex items-center gap-6">
                  <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md border border-white/20"><Layers size={32} className="text-blue-100" /></div>
                  <div><h3 className="text-xl font-black tracking-tight">Duplicate Recognition Active</h3><p className="text-blue-200 text-sm font-medium mt-1">Shipments with matching Booking Numbers are automatically linked.</p></div>
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-10"><Layers size={200} /></div>
              </div>

              <div className="bg-white border-2 border-dashed border-blue-200 p-8 rounded-[2rem] shadow-sm flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4"><ClipboardCheck className="text-blue-600" size={24} /><h3 className="text-xl font-black text-gray-900 tracking-tight">Import Format Guide</h3></div>
                  <p className="text-gray-500 text-sm font-medium mb-6">Use these exact column names in your CSV to ensure 100% accurate mapping.</p>
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
                   <button onClick={downloadSampleTemplate} className="flex items-center justify-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all shadow-xl active:scale-95"><Download size={18} /> Download Sample CSV</button>
                   <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recommended Format</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input type="text" placeholder="Search client, container, invoice or booking..." className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all border-2 ${showAdvancedFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200'}`}><SlidersHorizontal size={18} /> Filters {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                  <div className="h-10 w-px bg-gray-100"></div>
                  <button onClick={prepareInvoiceConfig} disabled={selectedIds.size === 0} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black text-sm disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-gray-900/10 active:scale-95">Create Invoice ({selectedIds.size})</button>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <tr>
                      <th className="py-5 px-8 w-16 text-center"><input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-gray-200 text-blue-600 focus:ring-0" checked={selectedIds.size === filteredBookings.length && filteredBookings.length > 0} onChange={() => { if (selectedIds.size === filteredBookings.length) setSelectedIds(new Set()); else setSelectedIds(new Set(filteredBookings.map(b => b.id))); }} /></th>
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
                    {filteredBookings.map(b => {
                      const groupMembers = b.bookingNo ? bookings.filter(x => x.bookingNo === b.bookingNo) : [];
                      const isPartofGroup = groupMembers.length > 1;
                      const isHoveredGroup = b.bookingNo && hoveredBookingNo === b.bookingNo;
                      const isSelected = selectedIds.has(b.id);
                      return (
                        <tr key={b.id} onMouseEnter={() => b.bookingNo && setHoveredBookingNo(b.bookingNo)} onMouseLeave={() => setHoveredBookingNo(null)} className={`group transition-all duration-200 relative ${isSelected ? 'bg-blue-50/60' : isHoveredGroup ? 'bg-orange-50/40' : 'hover:bg-gray-50/50'}`}>
                          <td className="py-6 px-8 text-center relative">{isPartofGroup && <div className={`absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full ${isSelected ? 'bg-blue-500' : isHoveredGroup ? 'bg-orange-500' : 'bg-gray-200'} transition-colors`} />}<input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-gray-200 text-blue-600 focus:ring-0 cursor-pointer" checked={isSelected} onChange={() => toggleBookingSelection(b)} /></td>
                          <td className="py-6 px-4"><p className="font-black text-gray-900 text-base leading-tight">{b.customer}</p></td>
                          <td className="py-6 px-4"><div className="flex items-center gap-2"><p className="font-mono text-xs font-bold">{b.bookingNo}</p>{isPartofGroup && <span className="bg-gray-100 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"><Layers size={8} /> {groupMembers.length}</span>}</div></td>
                          <td className="py-6 px-4"><div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded ${MAJOR_PORTS.includes(b.goPort?.toUpperCase()) ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-gray-600'} font-bold text-[10px] uppercase`}>{b.goPort || '---'}</div></td>
                          <td className="py-6 px-4"><div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded ${MAJOR_PORTS.includes(b.giPort?.toUpperCase()) ? 'bg-red-50 text-red-600 border border-red-100' : 'text-gray-600'} font-bold text-[10px] uppercase`}>{b.giPort || '---'}</div></td>
                          <td className="py-6 px-4 text-right font-black text-gray-900">{b.rate}</td>
                          <td className="py-6 px-4 text-center">{b.invNo ? <div className="inline-flex items-center gap-1.5 text-blue-600 font-black bg-blue-50 px-2 py-1 rounded-lg"><CheckCircle size={12} /><span className="font-mono text-[10px]">{b.invNo}</span></div> : <span className="text-[10px] font-bold text-gray-300 uppercase italic">Pending</span>}</td>
                          <td className="py-6 px-4 text-center"><div className="flex justify-center gap-1"><button onClick={() => handleQuickCreate(b)} className="p-2 text-white hover:bg-blue-700 bg-blue-600 rounded-lg active:scale-90"><FilePlus size={16} /></button><button onClick={() => setEditingBooking(b)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg"><Edit3 size={16} /></button></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'field-master' && (
            <div className="space-y-10 animate-in fade-in duration-500 pb-20 no-print">
              <header>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">Field Master</h2>
                <p className="text-gray-500 font-medium mt-1">Granular control over every element of your generated documents.</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 border-b pb-4"><Building2 className="text-blue-600" /> Header Branding</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <FieldToggle field="showLogo" label="Company Logo" description="Main brand image at top-left" icon={ImageIcon} />
                    <FieldToggle field="showCompanyInfo" label="Organization Info" description="Company name and address blocks" icon={Building2} />
                    <FieldToggle field="showTaxId" label="Tax Registration" description="Tax ID / Commercial Record labels" icon={Hash} />
                    <FieldToggle field="showWatermark" label="Faded Watermark" description="Faded logo background overlay" icon={Layers} />
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 border-b pb-4"><TableIcon className="text-blue-600" /> Shipment Details</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <FieldToggle field="showReefer" label="Unit / Container ID" description="Equipment number identification" icon={Package} />
                    <FieldToggle field="showGenset" label="Genset Add-on" description="Auxiliary power unit identification" icon={ToggleRight} />
                    <FieldToggle field="showPorts" label="Operational Ports" description="Port-In and Port-Out journey" icon={Anchor} />
                    <FieldToggle field="showTrucker" label="Transport Data" description="Transporter/Trucker names" icon={Truck} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'invoice-preview' && (
            <div className="space-y-10 animate-in fade-in duration-500 pb-20">
              <header className="no-print flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4"><button onClick={() => setView('dashboard')} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all"><X size={24} /></button><h2 className="text-2xl font-black text-gray-900 tracking-tight">Standard A4 Preview</h2></div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setView('config')} className="bg-white border text-gray-600 px-5 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all">Adjust Layout</button>
                  <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all"><Printer size={20} /> Print Invoice</button>
                </div>
              </header>
              {activeInvoice && <InvoiceDocument invoice={activeInvoice} />}
            </div>
          )}
        </div>
      </main>

      {selectedCustomerName && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 no-print">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setSelectedCustomerName(null)}></div>
          <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 overflow-hidden">
            <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div><h3 className="text-3xl font-black text-gray-900">{selectedCustomerName}</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Detailed Operational Performance Report</p></div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    const customerData = customerStats.find(s => s[0] === selectedCustomerName)?.[1];
                    if (customerData) exportToCSV(customerData.bookings, `${selectedCustomerName}_Performance.csv`);
                  }}
                  className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-green-700 active:scale-95 transition-all"
                >
                  <Download size={18} /> Export Data
                </button>
                <button 
                  onClick={() => {
                    const originalView = view;
                    // Force a layout adjustment for printing if needed, or just trigger window.print
                    window.print();
                  }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                >
                  <Printer size={18} /> Print Report
                </button>
                <button onClick={() => setSelectedCustomerName(null)} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"><X size={24} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-10 print:p-0">
              {(() => {
                const customerData = customerStats.find(s => s[0] === selectedCustomerName)?.[1];
                if (!customerData) return null;
                return (
                  <div className="space-y-10 portfolio-print-view">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                        <p className="text-[9px] font-black text-blue-900/40 uppercase mb-1">Cumulative Revenue</p>
                        <p className="text-3xl font-black text-blue-900">{formatCurrency(customerData.total)}</p>
                      </div>
                      <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100">
                        <p className="text-[9px] font-black text-green-900/40 uppercase mb-1">Total Operations</p>
                        <p className="text-3xl font-black text-green-900">{customerData.count}</p>
                      </div>
                      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Status Coverage</p>
                        <p className="text-2xl font-black text-slate-700">100% Verified</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                       <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><TableIcon size={16} className="text-blue-600" /> Operational History</h4>
                       <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-gray-50 border-b font-black text-gray-400 uppercase tracking-widest">
                            <tr>
                              <th className="py-4 px-6">Booking / Date</th>
                              <th className="py-4 px-6">Reefer ID</th>
                              <th className="py-4 px-6">Route</th>
                              <th className="py-4 px-6 text-right">Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {customerData.bookings.map(b => (
                              <tr key={b.id} className="hover:bg-gray-50/50">
                                <td className="py-4 px-6"><p className="font-black text-gray-900">{b.bookingNo}</p><p className="text-[9px] text-gray-400">{b.bookingDate}</p></td>
                                <td className="py-4 px-6 font-mono font-bold text-gray-600">{b.reeferNumber || '---'}</td>
                                <td className="py-4 px-6"><div className="flex items-center gap-1 font-bold"><span className="text-blue-600">{b.goPort}</span><ArrowRightLeft size={10} className="text-gray-300"/><span className="text-red-600">{b.giPort}</span></div></td>
                                <td className="py-4 px-6 text-right font-black text-gray-900">{b.rate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
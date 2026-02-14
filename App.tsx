import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileUp, Search, ChevronLeft, Layout, 
  UserCircle, Trash2, Image as ImageIcon, 
  Table as TableIcon, X, CheckCircle, Settings as SettingsIcon,
  Briefcase, FileCheck, Layers, Palette, 
  Printer, Sparkles, Droplets, HardHat, Feather,
  ShieldCheck, FileStack, Download, Terminal, LayoutPanelLeft,
  BrainCircuit, Loader2, Wind, DraftingCompass, Activity, Award, Cpu,
  FileDown, Zap, Grid3X3, Square, BookOpen, Cloud, Leaf, Sun, Contrast,
  Waves, Heart, Gem, Map as MapPinIcon, StickyNote, Type, Rainbow, ScrollText, Newspaper, List,
  Users, Hash, Plus, ArrowRight, PenTool, Check, Eye, EyeOff, GripVertical,
  Info
} from 'lucide-react';
import { Booking, Invoice, InvoiceSectionId, TemplateConfig, UserProfile, TemplateFields, GroupingType, InvoiceTheme, CustomerConfig } from './types';
import { parseCurrency, formatCurrency } from './utils/formatters';
import InvoiceDocument from './components/InvoiceDocument';

const DEFAULT_COMPANY_LOGO = "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&q=80&w=200&h=200";

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
  const [view, setView] = useState<'dashboard' | 'operations' | 'invoice-preview' | 'profile' | 'edit-invoice' | 'settings' | 'batch-review' | 'customers'>('dashboard');
  
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [batchInvoices, setBatchInvoices] = useState<Invoice[]>([]);
  const [showActionModal, setShowActionModal] = useState(false);

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
    number: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    address: '',
    notes: 'Operational services provided for Genset rental and logistics. Subject to standard terms.',
    currency: 'EGP',
    groupBy: 'booking' as GroupingType
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

  const handleToggleBookingGroup = (booking: Booking) => {
    const targetNo = booking.bookingNo;
    if (!targetNo || targetNo === '---') {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(booking.id)) next.delete(booking.id);
        else next.add(booking.id);
        return next;
      });
      return;
    }
    const groupIds = bookings.filter(b => b.bookingNo === targetNo && !b.invNo).map(b => b.id);
    setSelectedIds(prev => {
      const next = new Set(prev);
      const isAlreadyIn = next.has(booking.id);
      if (isAlreadyIn) groupIds.forEach(id => next.delete(id));
      else groupIds.forEach(id => next.add(id));
      return next;
    });
  };

  const handleDownloadSample = () => {
    const csvContent = "Booking No,Container No,Customer,Shipper Address,Trucker,Rate,VAT,Date,Go Port,Gi Port,Clip On Date,Clip Off Date,Genset No\n" +
      "BK778899,REEU1234567,Global Logistics Inc,Alexandria Port,Captain Jack,4500,630,2024-05-10,Sokhna,Alexandria,2024-05-10,2024-05-15,GS-102\n" +
      "BK778899,REEU9876543,Global Logistics Inc,Alexandria Port,Captain Jack,4500,630,2024-05-10,Sokhna,Alexandria,2024-05-10,2024-05-15,GS-105\n" +
      "BK112233,UNIT5544332,Nile Traders,Cairo West,Driver Sam,3200,448,2024-05-11,Damietta,Port Said,2024-05-11,2024-05-14,GS-088";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_manifest.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const allRows = text.split('\n').filter(l => l.trim()).map(row => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/));
      if (allRows.length === 0) return;
      let headerIdx = 0;
      for (let i = 0; i < Math.min(allRows.length, 10); i++) {
        if (allRows[i].join('').toLowerCase().includes('booking')) { headerIdx = i; break; }
      }
      const headers = allRows[headerIdx].map(h => h.replace(/"/g, '').trim().toLowerCase());
      const findCol = (keys: string[]) => headers.findIndex(h => keys.some(k => h.includes(k)));
      const mapping = {
        bookingNo: findCol(['booking', 'bk no']), 
        reefer: findCol(['container', 'unit', 'reefer']),
        shipper: findCol(['shipper', 'address']), 
        trucker: findCol(['trucker', 'driver']),
        rate: findCol(['rate', 'amount']), 
        customer: findCol(['customer', 'consignee']),
        vat: findCol(['vat', 'tax']), 
        date: findCol(['date']),
        goPort: findCol(['go port', 'clip on port', 'clip-on port', 'origin port']),
        giPort: findCol(['gi port', 'clip off port', 'clip-off port', 'destination port']),
        clipOnDate: findCol(['clip on date', 'clip-on date', 'gate out date']),
        clipOffDate: findCol(['clip off date', 'clip-off date', 'gate in date']),
        gensetNo: findCol(['genset', 'genset no', 'generator'])
      };
      
      const newlyFoundCustomers = new Set<string>();
      
      const parsed: Booking[] = allRows.slice(headerIdx + 1).map((row, idx) => {
        const clean = (valIdx: number) => (valIdx !== -1 && row[valIdx]) ? row[valIdx].replace(/"/g, '').trim() : '';
        const custName = clean(mapping.customer) || 'Unnamed Client';
        newlyFoundCustomers.add(custName);
        
        const rVal = parseCurrency(clean(mapping.rate));
        const vVal = parseCurrency(clean(mapping.vat));
        return {
          id: `booking-${idx}-${Date.now()}`,
          customer: custName,
          bookingNo: clean(mapping.bookingNo) || '---',
          reeferNumber: clean(mapping.reefer) || '---',
          shipperAddress: clean(mapping.shipper) || '---',
          trucker: clean(mapping.trucker) || '---',
          rate: clean(mapping.rate) || '0',
          rateValue: rVal,
          vat: clean(mapping.vat) || '0',
          vatValue: vVal,
          bookingDate: clean(mapping.date) || new Date().toISOString().split('T')[0],
          status: 'PENDING', 
          goPort: clean(mapping.goPort) || '---', 
          giPort: clean(mapping.giPort) || '---', 
          totalBooking: '', 
          customerRef: '',
          gops: '', 
          dateOfClipOn: clean(mapping.clipOnDate) || '', 
          clipOffDate: clean(mapping.clipOffDate) || '', 
          beneficiaryName: '', 
          gensetNo: clean(mapping.gensetNo) || '---',
          res: '', gaz: '', remarks: '', gensetFaultDescription: '', invNo: '',
          invDate: '', invIssueDate: ''
        };
      });

      // Auto-collect unique customers not already in the config
      const existingNames = new Set(customerConfigs.map(c => c.name.toLowerCase()));
      const newConfigs: CustomerConfig[] = [];
      newlyFoundCustomers.forEach(name => {
        if (!existingNames.has(name.toLowerCase())) {
          newConfigs.push({
            id: `cust-${Date.now()}-${Math.random()}`,
            name: name,
            prefix: 'GS',
            nextNumber: 1
          });
        }
      });

      if (newConfigs.length > 0) {
        setCustomerConfigs(prev => [...prev, ...newConfigs]);
      }
      
      setBookings(prev => [...prev, ...parsed]);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const getInvoiceNumber = (customerName: string) => {
    const config = customerConfigs.find(c => c.name.toLowerCase() === customerName.toLowerCase());
    if (config) return `${config.prefix}${config.nextNumber}`;
    return `INV-${Math.floor(Math.random() * 900000 + 100000)}`;
  };

  const incrementSerial = (customerName: string) => {
    setCustomerConfigs(prev => prev.map(c => 
      c.name.toLowerCase() === customerName.toLowerCase() ? { ...c, nextNumber: c.nextNumber + 1 } : c
    ));
  };

  const processInvoices = (mode: 'grouped' | 'individual') => {
    const selectedItems = bookings.filter(b => selectedIds.has(b.id));
    if (selectedItems.length === 0) return;

    if (mode === 'grouped') {
      const firstItem = selectedItems[0];
      const subtotal = selectedItems.reduce((acc, curr) => acc + curr.rateValue, 0);
      const tax = selectedItems.reduce((acc, curr) => acc + curr.vatValue, 0);
      const generatedNo = getInvoiceNumber(firstItem.customer);
      
      const newInvoice: Invoice = {
        id: `INV-${Date.now()}`,
        invoiceNumber: generatedNo,
        date: invConfig.date,
        dueDate: invConfig.dueDate,
        customerName: firstItem.customer,
        customerAddress: firstItem.shipperAddress,
        beneficiaryName: '',
        items: selectedItems,
        subtotal,
        tax,
        total: subtotal + tax,
        currency: invConfig.currency,
        notes: invConfig.notes,
        templateConfig,
        userProfile: profile
      };
      setActiveInvoice(newInvoice);
      setView('edit-invoice');
    } else {
      const generatedBatch = selectedItems.map((item, idx) => {
        const subtotal = item.rateValue;
        const tax = item.vatValue;
        const generatedNo = getInvoiceNumber(item.customer);
        return {
          id: `INV-BATCH-${idx}-${Date.now()}`,
          invoiceNumber: generatedNo,
          date: invConfig.date,
          dueDate: invConfig.dueDate,
          customerName: item.customer,
          customerAddress: item.shipperAddress,
          beneficiaryName: '',
          items: [item],
          subtotal,
          tax,
          total: subtotal + tax,
          currency: invConfig.currency,
          notes: invConfig.notes,
          templateConfig,
          userProfile: profile
        };
      });
      setBatchInvoices(generatedBatch);
      setView('batch-review');
    }
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

  const filteredBookings = useMemo(() => bookings.filter(b => 
    b.bookingNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.reeferNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.customer?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [bookings, searchTerm]);

  const bookingCounts = useMemo(() => {
    const c: Record<string, number> = {};
    bookings.forEach(b => { if(b.bookingNo !== '---' && !b.invNo) c[b.bookingNo] = (c[b.bookingNo] || 0) + 1; });
    return c;
  }, [bookings]);

  const updateActiveInvoiceTheme = (newTheme: InvoiceTheme) => {
    setTemplateConfig(prev => ({ ...prev, theme: newTheme }));
    if (activeInvoice) {
      setActiveInvoice({
        ...activeInvoice,
        templateConfig: { ...activeInvoice.templateConfig!, theme: newTheme }
      });
    }
  };

  const toggleField = (field: keyof TemplateFields) => {
    setTemplateConfig(prev => ({
      ...prev,
      fields: { ...prev.fields, [field]: !prev.fields[field] }
    }));
  };

  const addCustomer = () => {
    const name = prompt("Enter customer name:");
    if(name) {
      const prefix = prompt("Enter prefix (e.g. GS):", "GS") || "GS";
      const start = parseInt(prompt("Enter starting number:", "1") || "1");
      setCustomerConfigs([...customerConfigs, { id: Date.now().toString(), name, prefix, nextNumber: isNaN(start) ? 1 : start }]);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 antialiased font-sans">
      <aside className="no-print w-72 bg-slate-900 flex flex-col sticky top-0 h-screen shadow-2xl z-50">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-emerald-500 p-2.5 rounded-2xl text-white shadow-lg"><Briefcase size={24} /></div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase">CargoBill</h1>
          </div>
          <div className="space-y-2">
            {[
              { id: 'dashboard', icon: Layout, label: 'Manifest', badge: bookings.filter(b => !b.invNo).length },
              { id: 'customers', icon: Users, label: 'Customers', badge: customerConfigs.length },
              { id: 'settings', icon: SettingsIcon, label: 'Templates' },
              { id: 'profile', icon: UserCircle, label: 'Identity' }
            ].map(item => (
              <button key={item.id} onClick={() => setView(item.id as any)} className={`relative flex items-center gap-3 w-full px-5 py-3.5 rounded-2xl transition-all font-bold text-sm ${view === item.id || (view === 'batch-review' && item.id === 'dashboard') || (view === 'edit-invoice' && item.id === 'dashboard') || (view === 'invoice-preview' && item.id === 'dashboard') ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <item.icon size={20} /> 
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 text-[10px] px-2 py-0.5 rounded-full font-black">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-auto p-8 border-t border-white/5">
          <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-3 border border-white/10">
             <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-black text-white shrink-0">{profile.companyName.charAt(0)}</div>
             <div className="flex-1 overflow-hidden"><p className="text-sm font-black text-white truncate">{profile.companyName}</p><p className="text-[10px] text-slate-500 font-bold uppercase truncate">{profile.name}</p></div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-12 print:p-0">
          {view === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex justify-between items-end">
                <div><h2 className="text-4xl font-black text-slate-900 tracking-tight">Manifest</h2><p className="text-slate-500 font-medium mt-1">Select entries for billing.</p></div>
                <div className="flex gap-4">
                  <button onClick={handleDownloadSample} className="bg-slate-100 text-slate-900 px-6 py-4 rounded-2xl hover:bg-slate-200 transition-all font-black text-sm shadow-sm flex items-center gap-3 uppercase tracking-widest active:scale-95 border border-slate-200"><FileDown size={20} /> Sample CSV</button>
                  <label className="cursor-pointer bg-emerald-600 text-white px-8 py-4 rounded-2xl hover:bg-emerald-700 transition-all font-black text-sm shadow-xl flex items-center gap-3 uppercase tracking-widest active:scale-95"><FileUp size={20} /> Import CSV<input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} /></label>
                </div>
              </header>

              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-6 flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 relative w-full">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input type="text" placeholder="Search manifest..." className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-[1.5rem] font-bold outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button disabled={selectedIds.size === 0} onClick={() => processInvoices('grouped')} className="flex-1 bg-slate-900 text-white px-8 py-5 rounded-[1.5rem] font-black disabled:opacity-30 transition-all uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"><Layers size={18}/> Consolidate ({selectedIds.size})</button>
                  <button disabled={selectedIds.size === 0} onClick={() => processInvoices('individual')} className="flex-1 bg-emerald-600 text-white px-8 py-5 rounded-[1.5rem] font-black disabled:opacity-30 transition-all uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"><FileStack size={18}/> Individual Batch</button>
                </div>
              </div>
              
              {bookings.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200 flex flex-col items-center gap-6">
                   <div className="bg-slate-50 p-6 rounded-full text-slate-200"><BookOpen size={64}/></div>
                   <div><h3 className="text-xl font-black text-slate-900">Your manifest is empty</h3><p className="text-slate-500 mt-2">Upload a CSV file to start generating invoices.</p></div>
                   <button onClick={handleDownloadSample} className="text-emerald-600 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:underline"><Download size={14}/> Download Sample CSV</button>
                </div>
              ) : (
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">
                      <tr><th className="py-6 px-8 w-16 text-center">#</th><th className="py-6 px-4">Client</th><th className="py-6 px-4">Booking</th><th className="py-6 px-4">Container</th><th className="py-6 px-4">Rate</th><th className="py-6 px-4 text-center">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredBookings.map(b => (
                        <tr key={b.id} className={`hover:bg-slate-50 cursor-pointer ${selectedIds.has(b.id) ? 'bg-emerald-50' : ''}`} onClick={() => handleToggleBookingGroup(b)}>
                          <td className="py-6 px-8 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="w-5 h-5 rounded cursor-pointer accent-emerald-600" checked={selectedIds.has(b.id)} onChange={() => handleToggleBookingGroup(b)} /></td>
                          <td className="py-6 px-4 font-bold text-slate-900">{b.customer}</td>
                          <td className="py-6 px-4 font-mono font-black flex items-center gap-2">{b.bookingNo}{bookingCounts[b.bookingNo] > 1 && <span className="bg-amber-100 text-amber-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase"><Layers size={10} className="inline mr-1"/>Group</span>}</td>
                          <td className="py-6 px-4 font-mono font-bold text-emerald-600">{b.reeferNumber}</td>
                          <td className="py-6 px-4 font-black text-slate-900">{formatCurrency(b.rateValue, invConfig.currency)}</td>
                          <td className="py-6 px-4 text-center">{b.invNo ? <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase bg-emerald-100 text-emerald-700">BILLED</span> : <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase bg-slate-100 text-slate-400">PENDING</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {view === 'customers' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <header className="flex justify-between items-end">
                <div><h2 className="text-4xl font-black text-slate-900 tracking-tight">Customers</h2><p className="text-slate-500 font-medium mt-1">Assign invoice serial prefixes (e.g. GS1, GS2) for each client.</p></div>
                <button onClick={addCustomer} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl hover:bg-emerald-700 transition-all font-black text-sm shadow-xl flex items-center gap-3 uppercase tracking-widest active:scale-95"><Plus size={20}/> Add Customer Config</button>
              </header>

              {customerConfigs.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200 flex flex-col items-center gap-6">
                  <div className="bg-slate-50 p-6 rounded-full text-slate-200"><Users size={64}/></div>
                  <div><h3 className="text-xl font-black text-slate-900">No customers registered</h3><p className="text-slate-500 mt-2">Upload a CSV or add customers manually to manage their unique invoice serials.</p></div>
                  <button onClick={addCustomer} className="bg-slate-900 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest">Register First Client</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customerConfigs.map(config => (
                    <div key={config.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><Users size={24}/></div>
                        <button onClick={() => setCustomerConfigs(customerConfigs.filter(c => c.id !== config.id))} className="text-slate-200 hover:text-red-500 p-2 transition-colors"><Trash2 size={18}/></button>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2 truncate">{config.name}</h3>
                      <div className="flex items-center gap-4 pt-4 border-t border-slate-50 mt-4">
                        <div className="flex-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Prefix</label>
                          <input className="w-full bg-slate-50 p-3 rounded-xl font-black text-sm border-2 border-transparent focus:border-emerald-600 outline-none" value={config.prefix} onChange={e => setCustomerConfigs(customerConfigs.map(c => c.id === config.id ? {...c, prefix: e.target.value} : c))} />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Next No.</label>
                          <input type="number" className="w-full bg-slate-50 p-3 rounded-xl font-black text-sm border-2 border-transparent focus:border-emerald-600 outline-none" value={config.nextNumber} onChange={e => setCustomerConfigs(customerConfigs.map(c => c.id === config.id ? {...c, nextNumber: parseInt(e.target.value) || 1} : c))} />
                        </div>
                      </div>
                      <div className="mt-6 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-300 uppercase">Current Serial</span>
                        <span className="bg-emerald-600 text-white px-3 py-1 rounded-lg font-black text-xs">{config.prefix}{config.nextNumber}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'settings' && (
             <div className="space-y-10 animate-in fade-in duration-500">
                <header>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">Templates</h2>
                  <p className="text-slate-500 font-medium mt-1">Configure default fields and layout logic for all invoices.</p>
                </header>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                    <h3 className="text-xl font-black text-slate-900 mb-8 border-b pb-4 flex items-center gap-3 uppercase tracking-tighter"><LayoutPanelLeft className="text-emerald-500"/> Visibility Controls</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(templateConfig.fields).map(([key, value]) => (
                        <button key={key} onClick={() => toggleField(key as keyof TemplateFields)} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${value ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                          <span className="text-[10px] font-black uppercase tracking-widest">{key.replace('show', '').replace(/([A-Z])/g, ' $1')}</span>
                          {value ? <Eye size={16}/> : <EyeOff size={16}/>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                    <h3 className="text-xl font-black text-slate-900 mb-8 border-b pb-4 flex items-center gap-3 uppercase tracking-tighter"><Palette className="text-emerald-500"/> Global Style</h3>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grouping Logic</label>
                        <div className="flex gap-2">
                          {['booking', 'unit', 'trucker'].map(g => (
                            <button key={g} onClick={() => setTemplateConfig({...templateConfig, groupBy: g as GroupingType})} className={`flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${templateConfig.groupBy === g ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{g}</button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-800 leading-relaxed"><Info size={16} className="inline mr-2 mb-1"/> These settings apply to all newly generated invoices. You can still override the theme individually in the preview screen.</p>
                      </div>
                    </div>
                  </div>
                </div>
             </div>
          )}

          {view === 'batch-review' && (
             <div className="space-y-8 animate-in fade-in duration-500">
               <header className="flex justify-between items-center">
                 <div><h2 className="text-4xl font-black text-slate-900 tracking-tight">Batch Review</h2><p className="text-slate-500 font-medium mt-1">Reviewing {batchInvoices.length} individual invoices for {batchInvoices[0]?.customerName}.</p></div>
                 <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black uppercase text-xs transition-colors"><ChevronLeft size={20}/> Back to Manifest</button>
               </header>
               <div className="space-y-12">
                 {batchInvoices.map((inv, idx) => (
                   <div key={inv.id} className="relative group">
                     <div className="absolute -left-4 top-0 bottom-0 w-1 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <InvoiceDocument invoice={inv} />
                   </div>
                 ))}
               </div>
               <div className="fixed bottom-10 right-10 flex gap-4 no-print">
                 <button onClick={() => window.print()} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs shadow-2xl flex items-center gap-3"><Printer size={20}/> Print All ({batchInvoices.length})</button>
               </div>
             </div>
          )}

          {view === 'invoice-preview' && activeInvoice && (
             <div className="animate-in fade-in duration-500 pb-20">
               <div className="no-print bg-slate-900 p-6 rounded-[2rem] shadow-2xl mb-8 border-b-4 border-emerald-600 overflow-hidden">
                  <div className="p-4 flex flex-col md:flex-row items-center justify-between w-full gap-6">
                    <div className="flex items-center gap-4"><div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg"><Palette size={24}/></div><div><h4 className="text-white font-black text-lg">Style Studio</h4><p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Select manifest layout style</p></div></div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => window.print()} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2 hover:bg-emerald-700 transition-all"><Printer size={18}/> Print A4</button>
                      <button onClick={() => setView('dashboard')} className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white"><X size={24}/></button>
                    </div>
                  </div>
                  <div className="w-full grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-3 p-6 border-t border-white/5 max-h-48 overflow-y-auto bg-slate-950/50">
                    {[
                      { id: 'logistics-grid', label: 'Classic', icon: TableIcon, color: 'bg-emerald-600' },
                      { id: 'swiss-modern', label: 'Swiss', icon: Grid3X3, color: 'bg-red-600' },
                      { id: 'brutalist', label: 'Brutal', icon: Square, color: 'bg-zinc-900' },
                      { id: 'minimalist', label: 'Minimal', icon: Feather, color: 'bg-slate-300 text-slate-900' },
                      { id: 'neon-glow', label: 'Neon', icon: Zap, color: 'bg-cyan-500' },
                      { id: 'blueprint', label: 'Draft', icon: DraftingCompass, color: 'bg-blue-700' },
                      { id: 'vintage', label: 'Vintage', icon: ScrollText, color: 'bg-amber-800' },
                      { id: 'industrial', label: 'Factory', icon: HardHat, color: 'bg-yellow-500 text-slate-900' },
                      { id: 'glass', label: 'Glass', icon: Droplets, color: 'bg-blue-400' },
                      { id: 'royal', icon: ShieldCheck, label: 'Royal', color: 'bg-purple-800' },
                      { id: 'midnight-pro', label: 'Night', icon: Wind, color: 'bg-slate-950' },
                      { id: 'modern-cards', label: 'Cards', icon: Activity, color: 'bg-red-500' },
                      { id: 'corporate', label: 'Corp', icon: Briefcase, color: 'bg-slate-900' },
                      { id: 'elegant', label: 'Elegant', icon: Award, color: 'bg-amber-100 text-amber-900' },
                      { id: 'soft-clay', label: 'Clay', icon: Cloud, color: 'bg-rose-200 text-rose-900' },
                      { id: 'eco-green', label: 'Eco', icon: Leaf, color: 'bg-green-600' },
                      { id: 'sunset-vibe', label: 'Sunset', icon: Sun, color: 'bg-orange-500' },
                      { id: 'high-contrast', label: 'Sharp', icon: Contrast, color: 'bg-black text-white' },
                      { id: 'deep-ocean', label: 'Ocean', icon: Waves, color: 'bg-blue-900' },
                      { id: 'pastel-dream', label: 'Pastel', icon: Heart, color: 'bg-pink-300 text-pink-900' },
                      { id: 'luxury-gold', label: 'Gold', icon: Gem, color: 'bg-yellow-600' },
                      { id: 'urban-street', label: 'Urban', icon: MapPinIcon, color: 'bg-slate-500' },
                      { id: 'paper-texture', label: 'Parch', icon: StickyNote, color: 'bg-orange-100 text-orange-900' },
                      { id: 'monochrome', label: 'Mono', icon: Newspaper, color: 'bg-zinc-800' },
                      { id: 'vivid-spectrum', label: 'Spectrum', icon: Rainbow, color: 'bg-indigo-600' },
                      { id: 'classic-ledger', label: 'Ledger', icon: List, color: 'bg-teal-700' },
                      { id: 'modern-serif', label: 'Serif', icon: Type, color: 'bg-stone-800' },
                      { id: 'compact-list', label: 'Slim', icon: Layout, color: 'bg-sky-600' },
                      { id: 'technical-draft', label: 'Tech', icon: Terminal, color: 'bg-slate-700' },
                      { id: 'sidebar-pro', label: 'Side', icon: LayoutPanelLeft, color: 'bg-indigo-600' }
                    ].map(t => (
                      <button key={t.id} onClick={() => updateActiveInvoiceTheme(t.id as InvoiceTheme)} className={`group relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95 shrink-0 ${templateConfig.theme === t.id ? 'bg-white/10 ring-2 ring-emerald-500' : 'hover:bg-white/5'}`}><div className={`p-2 rounded-lg ${t.color} text-white shadow-lg group-hover:scale-110 transition-transform`}><t.icon size={16}/></div><span className={`text-[9px] font-black uppercase tracking-tighter ${templateConfig.theme === t.id ? 'text-white' : 'text-slate-500'}`}>{t.label}</span></button>
                    ))}
                  </div>
               </div>
               <InvoiceDocument invoice={activeInvoice} />
             </div>
          )}

          {view === 'profile' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
               <div className="flex justify-between items-end"><div><h2 className="text-4xl font-black text-slate-900 tracking-tight">Identity</h2><p className="text-slate-500 font-medium mt-1">Brand assets and official watermark.</p></div><button onClick={() => {localStorage.setItem('user_profile', JSON.stringify(profile)); alert('Identity Saved!');}} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl uppercase text-xs">Save Identity</button></div>
               <div className="grid grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-6 h-fit">
                    <h3 className="text-xl font-black text-slate-900 pb-4 border-b uppercase tracking-tight">Business Info</h3>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Entity Name</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.companyName} onChange={e => setProfile({...profile, companyName: e.target.value})} /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Tax Identifier</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.taxId} onChange={e => setProfile({...profile, taxId: e.target.value})} /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Officer Name</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Address</label><textarea rows={3} className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none resize-none" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} /></div>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center gap-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase w-full">Brand Logo</p>
                      {profile.logoUrl ? <img src={profile.logoUrl} className="h-40 w-full object-contain shadow-inner rounded-2xl border-2 border-slate-50 p-4" /> : <div className="h-40 w-full bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300"><ImageIcon size={48}/></div>}
                      <label className="cursor-pointer bg-slate-100 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-emerald-600 hover:text-white">Upload Logo<input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} /></label>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center gap-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase w-full">Official Signature</p>
                      {profile.signatureUrl ? <img src={profile.signatureUrl} className="h-32 w-full object-contain shadow-inner rounded-2xl border-2 border-slate-50 p-4 bg-white" /> : <div className="h-32 w-full bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300"><PenTool size={48}/></div>}
                      <label className="cursor-pointer bg-slate-100 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-emerald-600 hover:text-white">Upload Signature<input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'signature')} /></label>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center gap-6">
                      <div className="w-full flex justify-between items-center mb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Watermark Layer</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400">{(profile.watermarkOpacity * 100).toFixed(0)}%</span>
                          <input type="range" min="0" max="0.3" step="0.01" value={profile.watermarkOpacity} onChange={e => setProfile({...profile, watermarkOpacity: parseFloat(e.target.value)})} className="w-24 accent-emerald-600" />
                        </div>
                      </div>
                      {profile.watermarkUrl ? (
                        <div className="relative h-40 w-full bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden">
                          <img src={profile.watermarkUrl} style={{ opacity: profile.watermarkOpacity }} className="max-h-full max-w-full object-contain grayscale" />
                        </div>
                      ) : (
                        <div className="h-40 w-full bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 border-2 border-dashed border-slate-200"><Sparkles size={48}/></div>
                      )}
                      <label className="cursor-pointer bg-slate-100 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-emerald-600 hover:text-white">Upload Watermark<input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'watermark')} /></label>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {view === 'edit-invoice' && activeInvoice && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100"><div className="flex items-center gap-4"><button onClick={() => setView('dashboard')} className="p-3 bg-slate-50 rounded-2xl text-slate-400"><ChevronLeft size={24} /></button><div><h2 className="text-3xl font-black text-slate-900">Finalize Billing</h2><p className="text-slate-500 font-bold uppercase text-[10px]">Serial: {activeInvoice.invoiceNumber}</p></div></div><button onClick={handleSaveInvoice} className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl uppercase text-xs">Confirm & Save</button></header>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6"><h3 className="text-xl font-black text-slate-900 pb-4 border-b">Bill Info</h3><div className="space-y-4"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Invoice Number</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={activeInvoice.invoiceNumber} onChange={e => setActiveInvoice({...activeInvoice, invoiceNumber: e.target.value})} /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Issue Date</label><input type="date" className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={activeInvoice.date} onChange={e => setActiveInvoice({...activeInvoice, date: e.target.value})} /></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Due Date</label><input type="date" className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-red-600 outline-none" value={activeInvoice.dueDate} onChange={e => setActiveInvoice({...activeInvoice, dueDate: e.target.value})} /></div></div></div></div>
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100"><h3 className="text-xl font-black text-slate-900 pb-4 border-b mb-6">Line Items</h3><div className="space-y-4">{activeInvoice.items.map((item, idx) => (<div key={item.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-4 gap-4 items-center"><div className="col-span-2"><p className="text-[9px] font-black text-slate-400 uppercase">Ref: {item.bookingNo}</p><p className="font-mono font-black text-emerald-600">{item.reeferNumber}</p></div><div><label className="text-[10px] font-black text-slate-400 uppercase">Rate</label><input type="number" className="w-full bg-white p-2 rounded-lg font-black border border-slate-200 outline-none text-sm" value={item.rateValue} onChange={e => { const val = parseFloat(e.target.value) || 0; const newItems = [...activeInvoice.items]; newItems[idx] = { ...item, rateValue: val, rate: val.toString() }; const sub = newItems.reduce((acc, curr) => acc + curr.rateValue, 0); setActiveInvoice({...activeInvoice, items: newItems, subtotal: sub, tax: sub * 0.14, total: sub * 1.14}); }} /></div><button onClick={() => { const newItems = activeInvoice.items.filter((_, i) => i !== idx); if(newItems.length === 0) {setView('dashboard'); return;} const sub = newItems.reduce((acc, curr) => acc + curr.rateValue, 0); setActiveInvoice({...activeInvoice, items: newItems, subtotal: sub, tax: sub * 0.14, total: sub * 1.14}); }} className="p-3 text-red-300 ml-auto"><Trash2 size={20}/></button></div>))}</div></div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showActionModal && activeInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-12 space-y-10 relative">
            <button onClick={() => setShowActionModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500"><X size={32} /></button>
            <div className="flex items-center gap-6"><div className="bg-emerald-600 p-4 rounded-3xl text-white shadow-xl"><FileCheck size={32} /></div><div><h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Manifest Logged</h3><p className="text-slate-400 font-bold uppercase text-xs">Official Records Updated</p></div></div>
            <div className="flex flex-col gap-4 pt-6"><button onClick={() => {setShowActionModal(false); setView('invoice-preview');}} className="w-full bg-slate-100 py-6 rounded-2xl font-black uppercase text-sm">Review Layout</button><button onClick={() => window.print()} className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black uppercase text-sm shadow-xl">Print Now</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
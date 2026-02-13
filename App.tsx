import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  FileUp, Search, Plus, FileText, CheckCircle2, XCircle, Clock, Printer, 
  ChevronLeft, Layout, Eye, EyeOff, ArrowUp, ArrowDown, Users, UserCircle, 
  Download, Trash2, Edit3, Image as ImageIcon, Table as TableIcon,
  Save, X, CheckCircle, Anchor, FileSpreadsheet, ClipboardCheck, 
  FilePlus, ToggleLeft, ToggleRight, Settings as SettingsIcon,
  MapPin, Package, Truck, SlidersHorizontal, ChevronUp, ChevronDown, 
  ArrowRightLeft, Building2, User, Upload, ShieldCheck, Mail, CreditCard,
  Briefcase, Hash, ExternalLink, TrendingUp, DollarSign, Info
} from 'lucide-react';
import { Booking, Invoice, InvoiceSectionId, TemplateConfig, UserProfile, SavedTemplate, InvoiceTheme, CustomerSettings, TemplateFields } from './types';
import { parseCurrency, formatCurrency, exportToCSV } from './utils/formatters';
import InvoiceDocument from './components/InvoiceDocument';

const MAJOR_PORTS = ['ALEX', 'DAM', 'GOUDA', 'SCCT', 'SOKHNA'];
const DEFAULT_COMPANY_LOGO = "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=300&h=300";

const App: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('invoice_bookings');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeQuickPort, setActiveQuickPort] = useState<string | null>(null);

  const [view, setView] = useState<'dashboard' | 'config' | 'invoice-preview' | 'profile' | 'portfolio' | 'operations' | 'field-master'>('dashboard');
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<Booking | null>(null);

  const [customerSettings, setCustomerSettings] = useState<Record<string, CustomerSettings>>(() => {
    const saved = localStorage.getItem('customer_settings');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('customer_settings', JSON.stringify(customerSettings));
  }, [customerSettings]);

  useEffect(() => {
    localStorage.setItem('invoice_bookings', JSON.stringify(bookings));
  }, [bookings]);

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('user_profile');
    if (saved) return JSON.parse(saved);
    return {
      name: 'Authorized Signatory',
      companyName: 'Logistics Pro Egypt',
      address: 'Industrial Zone 4, Plot 12\nAlexandria, Egypt',
      taxId: '412-100-XXX',
      email: 'billing@logisticspro.com.eg',
      signatureUrl: null,
      logoUrl: DEFAULT_COMPANY_LOGO
    };
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = () => {
    localStorage.setItem('user_profile', JSON.stringify(profile));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

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
    theme: 'logistics-grid',
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
      
      const findCol = (keys: string[]) => {
        let idx = headers.findIndex(h => keys.some(k => h === k));
        if (idx !== -1) return idx;
        return headers.findIndex(h => keys.some(k => {
          if (k === 'po' || k === 'ref') {
            const regex = new RegExp(`\\b${k}\\b`, 'i');
            return regex.test(h);
          }
          return h.includes(k);
        }));
      };

      const mapping = {
        customer: findCol(['customer', 'client']),
        bookingNo: findCol(['booking no', 'booking #', 'bk no', 'booking']),
        rate: findCol(['rate', 'amount', 'price', 'value']),
        vat: findCol(['vat', 'tax']),
        bookingDate: findCol(['booking date', 'date']),
        reefer: findCol(['reefer', 'container']),
        genset: findCol(['genset']),
        goPort: findCol(['port in', 'go port', 'origin', 'from', 'clip on', 'entry port']),
        giPort: findCol(['port out', 'gi port', 'destination', 'to', 'clip off', 'exit port']),
        beneficiary: findCol(['beneficiary', 'attention']),
        shipperAddress: findCol(['address', 'shipper']),
        status: findCol(['status']),
        customerRef: findCol(['ref', 'customer ref', 'po', 'reference']),
        trucker: findCol(['trucker', 'driver', 'transporter']),
        invNo: findCol(['inv no', 'invoice no', 'invoice #']),
      };

      if (mapping.customer === -1) mapping.customer = 0;
      if (mapping.rate === -1) mapping.rate = 3;

      const dataRows = allRows.slice(headerIdx + 1).filter(r => r.length > 2 && r[mapping.customer]?.trim());

      const timestamp = Date.now();
      const parsed: Booking[] = dataRows.map((row, idx) => {
        const clean = (valIdx: number) => {
          if (valIdx === -1 || !row[valIdx]) return '';
          return row[valIdx].replace(/"/g, '').trim();
        };
        const rateStr = clean(mapping.rate);
        const vatStr = clean(mapping.vat);
        return {
          id: `booking-${idx}-${timestamp}`,
          totalBooking: '', customer: clean(mapping.customer), bookingDate: clean(mapping.bookingDate),
          customerRef: clean(mapping.customerRef), gops: '', dateOfClipOn: '', goPort: clean(mapping.goPort),
          giPort: clean(mapping.giPort), clipOffDate: '', trucker: clean(mapping.trucker), bookingNo: clean(mapping.bookingNo),
          beneficiaryName: clean(mapping.beneficiary), reeferNumber: clean(mapping.reefer), gensetNo: clean(mapping.genset),
          res: '', gaz: '', shipperAddress: clean(mapping.shipperAddress), status: clean(mapping.status), rate: rateStr,
          rateValue: parseCurrency(rateStr), vat: vatStr, vatValue: parseCurrency(vatStr), remarks: '',
          gensetFaultDescription: '', invNo: clean(mapping.invNo), invDate: '', invIssueDate: '',
        };
      });
      setBookings(prev => [...prev, ...parsed]);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const finalizeInvoice = useCallback(() => {
    const selectedItems = bookings.filter(b => selectedIds.has(b.id));
    if (selectedItems.length === 0) return;
    
    const firstItem = selectedItems[0];
    const generatedInvNo = invConfig.number || `INV-${Date.now().toString().slice(-6)}`;
    const subtotal = selectedItems.reduce((acc, curr) => acc + curr.rateValue, 0);
    const tax = selectedItems.reduce((acc, curr) => acc + curr.vatValue, 0);
    
    setBookings(prev => prev.map(b => selectedIds.has(b.id) ? { ...b, invNo: generatedInvNo } : b));

    const newInvoice: Invoice = {
      id: `INV-${Date.now()}`, 
      invoiceNumber: generatedInvNo, 
      date: invConfig.date, 
      dueDate: invConfig.dueDate,
      customerName: firstItem.customer, 
      customerAddress: invConfig.address || firstItem.shipperAddress || '', 
      beneficiaryName: firstItem.beneficiaryName,
      items: selectedItems, 
      subtotal, 
      tax, 
      total: subtotal + tax, 
      currency: invConfig.currency, 
      notes: invConfig.notes,
      templateConfig: { ...templateConfig, hiddenSections: new Set(templateConfig.hiddenSections) }, 
      userProfile: profile
    };

    setActiveInvoice(newInvoice);
    setInvConfig(prev => ({ ...prev, number: generatedInvNo, address: newInvoice.customerAddress || '' }));
    setSelectedIds(new Set());
    setView('invoice-preview');
  }, [bookings, selectedIds, invConfig, templateConfig, profile]);

  // Update active invoice when internal config changes in the preview sidebar
  useEffect(() => {
    if (activeInvoice && view === 'invoice-preview') {
      setActiveInvoice(prev => prev ? {
        ...prev,
        invoiceNumber: invConfig.number,
        date: invConfig.date,
        dueDate: invConfig.dueDate,
        customerAddress: invConfig.address,
        notes: invConfig.notes,
        currency: invConfig.currency
      } : null);
    }
  }, [invConfig.number, invConfig.date, invConfig.dueDate, invConfig.address, invConfig.notes, invConfig.currency]);

  const handleManualAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rateStr = (formData.get('rate') as string) || '0';
    const rateValue = parseCurrency(rateStr);
    
    const newBooking: Booking = {
      id: `manual-${Date.now()}`,
      customer: (formData.get('customer') as string) || '',
      bookingNo: (formData.get('bookingNo') as string) || '',
      customerRef: (formData.get('ref') as string) || '',
      bookingDate: (formData.get('date') as string) || new Date().toISOString().split('T')[0],
      reeferNumber: (formData.get('reefer') as string) || '',
      rate: rateStr,
      rateValue: rateValue,
      vat: '0',
      vatValue: 0,
      status: 'UNBILLED',
      totalBooking: '', gops: '', dateOfClipOn: '', goPort: (formData.get('goPort') as string) || '', giPort: (formData.get('giPort') as string) || '', clipOffDate: '',
      trucker: (formData.get('trucker') as string) || '', beneficiaryName: '', gensetNo: '', res: '', gaz: '', shipperAddress: '',
      remarks: '', gensetFaultDescription: '', invNo: '', invDate: '', invIssueDate: ''
    };
    
    setBookings(prev => [...prev, newBooking]);
    setShowManualAddModal(false);
  };

  const toggleBookingSelection = (booking: Booking) => {
    const next = new Set(selectedIds);
    const relatedBookings = (booking.bookingNo && booking.bookingNo.trim() !== '') 
      ? bookings.filter(b => b.bookingNo === booking.bookingNo) : [booking];
    const isCurrentlySelected = next.has(booking.id);
    relatedBookings.forEach(b => { if (isCurrentlySelected) next.delete(b.id); else next.add(b.id); });
    setSelectedIds(next);
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'signature') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setProfile(prev => ({ ...prev, [type === 'logo' ? 'logoUrl' : 'signatureUrl']: url }));
    };
    reader.readAsDataURL(file);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = b.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.bookingNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.reeferNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.invNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.customerRef?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || b.status?.toUpperCase().includes(statusFilter);
      let matchesQuickPort = true;
      if (activeQuickPort) matchesQuickPort = b.goPort?.toUpperCase().includes(activeQuickPort) || b.giPort?.toUpperCase().includes(activeQuickPort);
      return matchesSearch && matchesStatus && matchesQuickPort;
    });
  }, [bookings, searchTerm, statusFilter, activeQuickPort]);

  const customerStats = useMemo(() => {
    const map = new Map<string, { count: number; total: number; latestDate: string; bookings: Booking[] }>();
    bookings.forEach(b => {
      const existing = map.get(b.customer) || { count: 0, total: 0, latestDate: '', bookings: [] };
      existing.count += 1; 
      existing.total += b.rateValue; 
      existing.bookings.push(b);
      if (!existing.latestDate || b.bookingDate > existing.latestDate) {
        existing.latestDate = b.bookingDate;
      }
      map.set(b.customer, existing);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [bookings]);

  return (
    <div className="min-h-screen flex antialiased bg-slate-50">
      <aside className="no-print w-72 bg-slate-900 flex flex-col sticky top-0 h-screen shadow-2xl z-[60]">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-xl shadow-blue-600/20"><Briefcase size={24} strokeWidth={2.5} /></div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase">InvoicePro</h1>
          </div>
          <div className="space-y-1.5">
            {[
              { id: 'dashboard', icon: Layout, label: 'Dashboard' },
              { id: 'field-master', icon: SettingsIcon, label: 'Templates' },
              { id: 'portfolio', icon: Users, label: 'Clients' },
              { id: 'operations', icon: TableIcon, label: 'History' },
              { id: 'profile', icon: UserCircle, label: 'Account' },
            ].map(item => (
              <button key={item.id} onClick={() => setView(item.id as any)} className={`flex items-center gap-3 w-full px-5 py-3.5 rounded-2xl transition-all font-bold text-sm ${view === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <item.icon size={20} strokeWidth={view === item.id ? 2.5 : 2} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-auto p-8">
           <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-900 font-black overflow-hidden border-2 border-white/10">
               {profile.logoUrl ? <img src={profile.logoUrl} className="w-full h-full object-cover" /> : profile.companyName.charAt(0)}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-black text-white truncate">{profile.companyName}</p>
               <p className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-widest">{profile.name}</p>
             </div>
           </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full p-12 print:p-0">
          {view === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex justify-between items-end">
                <div><h2 className="text-4xl font-black text-slate-900 tracking-tight">Booking Dashboard</h2><p className="text-slate-500 font-medium mt-1 text-lg">Process cargo manifests and generate professional billing.</p></div>
                <div className="flex gap-4">
                  <button onClick={() => setBookings([])} className="flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-400 px-6 py-3.5 rounded-2xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-black text-xs active:scale-95 uppercase tracking-widest"><Trash2 size={18} /> Clear All</button>
                  <button onClick={() => setShowManualAddModal(true)} className="flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-700 px-6 py-3.5 rounded-2xl hover:bg-slate-100 transition-all font-black text-xs active:scale-95 uppercase tracking-widest"><Plus size={18} /> Manual Entry</button>
                  <label className="group flex items-center gap-3 cursor-pointer bg-blue-600 text-white px-8 py-3.5 rounded-2xl hover:bg-blue-700 transition-all font-black text-sm shadow-xl shadow-blue-600/20 active:scale-95 uppercase tracking-widest"><FileUp size={18} /> Import Manifest<input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} /></label>
                </div>
              </header>

              <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-6 flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input type="text" placeholder="Search manifest by Client, Booking ID, Container, or PO..." className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-[1.5rem] font-bold outline-none transition-all placeholder:text-slate-300 text-lg shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <button disabled={selectedIds.size === 0} onClick={finalizeInvoice} className="bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black disabled:opacity-30 disabled:grayscale transition-all hover:bg-blue-600 active:scale-95 shadow-xl uppercase tracking-widest text-sm h-full">Generate Invoice ({selectedIds.size})</button>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">
                    <tr>
                      <th className="py-6 px-8 w-16 text-center"><input type="checkbox" className="w-6 h-6 rounded-lg text-blue-600 focus:ring-0 cursor-pointer border-slate-200" checked={selectedIds.size === filteredBookings.length && filteredBookings.length > 0} onChange={() => { if (selectedIds.size === filteredBookings.length) setSelectedIds(new Set()); else setSelectedIds(new Set(filteredBookings.map(b => b.id))); }} /></th>
                      <th className="py-6 px-4">Consignee / Client</th>
                      <th className="py-6 px-4">Manifest Info</th>
                      <th className="py-6 px-4">Port Path</th>
                      <th className="py-6 px-4 text-right">Service Rate</th>
                      <th className="py-6 px-4 text-center">Invoicing</th>
                      <th className="py-6 px-4 text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="bg-slate-100 p-6 rounded-full text-slate-300"><FileText size={48} /></div>
                            <p className="text-slate-400 font-bold text-lg">No shipments found. Upload a CSV manifest to begin.</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredBookings.map(b => (
                      <tr key={b.id} className={`hover:bg-slate-50 transition-all cursor-pointer ${selectedIds.has(b.id) ? 'bg-blue-50/50' : ''}`} onClick={() => toggleBookingSelection(b)}>
                        <td className="py-6 px-8 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="w-6 h-6 rounded-lg text-blue-600 focus:ring-0 cursor-pointer border-slate-200" checked={selectedIds.has(b.id)} onChange={() => toggleBookingSelection(b)} /></td>
                        <td className="py-6 px-4"><p className="font-black text-slate-900 text-base">{b.customer}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{b.bookingDate}</p></td>
                        <td className="py-6 px-4"><p className="font-mono text-xs text-slate-900 font-black">BK: {b.bookingNo || '---'}</p>{b.customerRef && <p className="text-[10px] text-blue-600 font-black uppercase mt-1 tracking-tighter">PO/REF: {b.customerRef}</p>}</td>
                        <td className="py-6 px-4"><div className="flex items-center gap-2"><span className="uppercase text-[10px] font-black bg-blue-50 px-2 py-1 rounded text-blue-700 border border-blue-100">{b.goPort || '---'}</span><ArrowRightLeft size={10} className="text-slate-300" /><span className="uppercase text-[10px] font-black bg-red-50 px-2 py-1 rounded text-red-700 border border-red-100">{b.giPort || '---'}</span></div></td>
                        <td className="py-6 px-4 text-right font-black text-slate-900 text-base">{b.rate}</td>
                        <td className="py-6 px-4 text-center"><span className={`font-mono text-[10px] px-2 py-1 rounded-full font-black uppercase ${b.invNo ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>{b.invNo ? `BILL: ${b.invNo}` : 'PENDING'}</span></td>
                        <td className="py-6 px-4 text-center" onClick={(e) => e.stopPropagation()}><button onClick={() => setSelectedOperation(b)} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><Info size={20} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'portfolio' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <header className="flex justify-between items-end">
                  <div><h2 className="text-4xl font-black text-slate-900 tracking-tight">Client Portfolio</h2><p className="text-slate-500 font-medium mt-1 text-lg">Detailed billing analytics and shipment history per customer.</p></div>
                  <div className="flex gap-4">
                     <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                        <TrendingUp className="text-emerald-500" />
                        <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Clients</p><p className="text-xl font-black text-slate-900">{customerStats.length}</p></div>
                     </div>
                  </div>
               </header>

               <div className="grid grid-cols-1 gap-6">
                  {customerStats.length === 0 ? (
                    <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-4">
                       <Users size={64} className="opacity-20" />
                       <p className="font-bold text-xl">No client data available yet.</p>
                       <button onClick={() => setView('dashboard')} className="text-blue-600 font-black uppercase text-sm tracking-widest hover:underline">Go to Manifest Dashboard</button>
                    </div>
                  ) : (
                    customerStats.map(([name, stats], idx) => (
                      <div key={idx} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center justify-between group hover:border-blue-300 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-900 font-black text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">{name.charAt(0)}</div>
                           <div>
                              <h3 className="text-xl font-black text-slate-900 mb-1">{name}</h3>
                              <div className="flex items-center gap-4">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Clock size={12}/> Last activity: {stats.latestDate || '---'}</span>
                                 <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1"><Package size={12}/> {stats.count} Shipments</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-12">
                           <div className="text-right">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue Generated</p>
                              <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.total)}</p>
                           </div>
                           <button onClick={() => { setSearchTerm(name); setView('dashboard'); }} className="p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all"><ExternalLink size={24} /></button>
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          )}

          {view === 'operations' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <header className="flex justify-between items-end">
                  <div><h2 className="text-4xl font-black text-slate-900 tracking-tight">Billing History</h2><p className="text-slate-500 font-medium mt-1 text-lg">Audit trail of all generated invoices and their shipment items.</p></div>
                  <button onClick={() => exportToCSV(bookings.filter(b => b.invNo), 'billing_history.csv')} className="bg-white border-2 border-slate-200 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-100 transition-all"><Download size={18}/> Export History</button>
               </header>

               <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">
                      <tr>
                        <th className="py-6 px-8">Bill Ref</th>
                        <th className="py-6 px-4">Consignee</th>
                        <th className="py-6 px-4">Equipment</th>
                        <th className="py-6 px-4">Ops Port</th>
                        <th className="py-6 px-4 text-right">Settled Amount</th>
                        <th className="py-6 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {bookings.filter(b => b.invNo).length === 0 ? (
                         <tr>
                           <td colSpan={6} className="py-20 text-center text-slate-300">
                              <ClipboardCheck size={48} className="mx-auto mb-4 opacity-20" />
                              <p className="font-bold text-lg">No invoices generated yet.</p>
                           </td>
                         </tr>
                       ) : (
                         bookings.filter(b => b.invNo).map((b, i) => (
                           <tr key={i} className="hover:bg-slate-50 transition-all">
                              <td className="py-6 px-8"><span className="font-mono text-xs font-black bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">{b.invNo}</span></td>
                              <td className="py-6 px-4 font-black text-slate-900">{b.customer}</td>
                              <td className="py-6 px-4"><p className="font-mono text-xs text-slate-500">{b.reeferNumber || 'UNIT-X'}</p></td>
                              <td className="py-6 px-4"><span className="font-black text-[10px] uppercase text-slate-400">{b.goPort} → {b.giPort}</span></td>
                              <td className="py-6 px-4 text-right font-black text-slate-900">{b.rate}</td>
                              <td className="py-6 px-4 text-center flex items-center justify-center gap-2">
                                <button onClick={() => setSelectedOperation(b)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg transition-all"><Info size={18}/></button>
                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Printer size={18}/></button>
                              </td>
                           </tr>
                         ))
                       )}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {view === 'profile' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
               <div className="flex justify-between items-end">
                  <div><h2 className="text-4xl font-black text-slate-900 tracking-tight">Organization Profile</h2><p className="text-slate-500 font-medium text-lg">Configure your corporate identity and billing authorities.</p></div>
                  <button onClick={handleSaveProfile} className={`px-10 py-4 rounded-2xl font-black shadow-xl uppercase tracking-widest text-xs flex items-center gap-2 transition-all ${saveSuccess ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-slate-900'}`}>
                    {saveSuccess ? <CheckCircle size={18}/> : <Save size={18}/>} 
                    {saveSuccess ? 'Successfully Saved' : 'Update Profile'}
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 space-y-8 border border-slate-100">
                     <h3 className="text-xl font-black text-slate-900 flex items-center gap-3"><Building2 className="text-blue-600" /> Basic Information</h3>
                     <div className="space-y-6">
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal Entity Name</label><div className="relative"><Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/><input type="text" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl pl-12 pr-6 py-4 font-bold outline-none shadow-inner" value={profile.companyName} onChange={e => setProfile({...profile, companyName: e.target.value})} /></div></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax ID / Registry</label><div className="relative"><ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/><input type="text" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl pl-12 pr-6 py-4 font-bold outline-none shadow-inner" value={profile.taxId} onChange={e => setProfile({...profile, taxId: e.target.value})} /></div></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Support Email</label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/><input type="email" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl pl-12 pr-6 py-4 font-bold outline-none shadow-inner" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} /></div></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Headquarters Address</label><textarea className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl px-6 py-4 font-bold outline-none min-h-[120px] shadow-inner" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} /></div>
                     </div>
                  </div>

                  <div className="space-y-8">
                     <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 space-y-6 border border-slate-100">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3"><ImageIcon className="text-blue-600" /> Branding (Company Logo)</h3>
                        <div className="flex flex-col items-center gap-6 p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 group hover:border-blue-300 transition-all">
                           {profile.logoUrl ? (
                              <img src={profile.logoUrl} className="h-32 w-auto object-contain drop-shadow-md rounded-lg" />
                           ) : (
                              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200"><ImageIcon size={40} /></div>
                           )}
                           <label className="cursor-pointer bg-white text-slate-900 px-8 py-3.5 rounded-2xl font-black text-xs shadow-md border hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2">
                             <Upload size={16}/> {profile.logoUrl ? 'Replace Logo' : 'Upload Official Logo'}
                             <input type="file" className="hidden" accept="image/*" onChange={(e) => handleProfileImageUpload(e, 'logo')} />
                           </label>
                        </div>
                     </div>

                     <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 space-y-6 border border-slate-100">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3"><Edit3 className="text-blue-600" /> Digital Signature</h3>
                        <div className="space-y-4">
                           <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signer Authority Name</label><input type="text" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-xl px-6 py-4 font-bold outline-none shadow-inner" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} /></div>
                           <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 group">
                              {profile.signatureUrl ? (
                                 <img src={profile.signatureUrl} className="h-20 w-auto object-contain grayscale" />
                              ) : (
                                 <div className="h-20 w-full flex items-center justify-center text-slate-300 text-[10px] font-black uppercase tracking-widest italic">Authorized Signature Required</div>
                              )}
                              <label className="cursor-pointer text-blue-600 font-black text-xs hover:underline uppercase tracking-widest">
                                {profile.signatureUrl ? 'Change Signature' : 'Upload Digital Copy'}
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleProfileImageUpload(e, 'signature')} />
                              </label>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {view === 'field-master' && (
            <div className="space-y-10 animate-in fade-in duration-500 no-print">
               <div className="flex justify-between items-end">
                  <div><h2 className="text-4xl font-black text-slate-900 tracking-tight">Invoice Templates</h2><p className="text-slate-500 font-medium text-lg">Switch between industry-standard visual themes.</p></div>
                  <button onClick={() => setView('dashboard')} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl uppercase tracking-widest text-xs">Exit Designer</button>
               </div>

               <div className="space-y-6">
                 <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-widest text-sm opacity-60">Visual Themes</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                   {[
                     { id: 'logistics-grid', label: 'Logistics Master', color: 'bg-emerald-600' },
                     { id: 'modern', label: 'Classic Pro', color: 'bg-blue-600' },
                     { id: 'minimalist', label: 'Swiss Minimal', color: 'bg-slate-900' },
                     { id: 'corporate', label: 'Executive Elite', color: 'bg-indigo-950' },
                     { id: 'elegant', label: 'Luxury Serif', color: 'bg-emerald-900' },
                     { id: 'technical-draft', label: 'Operation Draft', color: 'bg-blue-900' },
                     { id: 'blueprint', label: 'Navy Blueprint', color: 'bg-[#002b5c]' },
                     { id: 'royal', label: 'Midnight Gold', color: 'bg-amber-600' },
                   ].map(t => (
                     <button key={t.id} onClick={() => setTemplateConfig({...templateConfig, theme: t.id as any})} className={`group p-4 rounded-3xl border-4 transition-all relative overflow-hidden flex flex-col items-center gap-3 ${templateConfig.theme === t.id ? 'border-blue-600 bg-white shadow-xl' : 'border-transparent bg-white hover:border-slate-200'}`}>
                        <div className={`w-12 h-12 rounded-2xl ${t.color} shadow-lg transition-transform group-hover:scale-110`} />
                        <span className="font-black text-[10px] uppercase tracking-tighter text-slate-900">{t.label}</span>
                        {templateConfig.theme === t.id && <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full"><CheckCircle size={12}/></div>}
                     </button>
                   ))}
                 </div>
               </div>

               <div className="space-y-6">
                 <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-widest text-sm opacity-60">Field Visibility (Show/Hide)</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   {Object.entries(templateConfig.fields).map(([key, val]) => (
                     <button key={key} onClick={() => setTemplateConfig(prev => ({ ...prev, fields: { ...prev.fields, [key as keyof TemplateFields]: !val } }))} className={`p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${val ? 'bg-white border-blue-600 shadow-md' : 'bg-white border-slate-100 opacity-60 hover:opacity-100 hover:border-slate-200'}`}>
                       <span className={`font-black text-[10px] uppercase tracking-widest ${val ? 'text-blue-900' : 'text-slate-500'}`}>{key.replace('show', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                       {val ? <ToggleRight size={32} className="text-blue-600" /> : <ToggleLeft size={32} className="text-slate-300" />}
                     </button>
                   ))}
                 </div>
               </div>
            </div>
          )}

          {view === 'invoice-preview' && activeInvoice && (
            <div className="animate-in fade-in duration-500 pb-20 flex gap-8">
               <div className="flex-1">
                 <header className="no-print flex justify-between items-center mb-10 bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
                    <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-slate-600 font-bold hover:text-blue-600 transition-all px-4"><ChevronLeft size={20} /> Manifest Dashboard</button>
                    <div className="flex gap-4">
                      <button onClick={() => window.print()} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 hover:bg-blue-700 active:scale-95 transition-all"><Printer size={20}/> Print A4 Export</button>
                    </div>
                 </header>
                 <InvoiceDocument invoice={activeInvoice} />
               </div>

               {/* Integrated Settlement Config Drawer */}
               <div className="no-print w-96 space-y-6 animate-in slide-in-from-right duration-500">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 sticky top-8">
                    <h3 className="text-xl font-black text-slate-900 border-b pb-4">Settlement Config</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Serial #</label>
                        <input type="text" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 p-4 rounded-xl font-bold outline-none" value={invConfig.number} onChange={e => setInvConfig({...invConfig, number: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Date</label>
                        <input type="date" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 p-4 rounded-xl font-bold outline-none" value={invConfig.date} onChange={e => setInvConfig({...invConfig, date: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</label>
                        <input type="date" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 p-4 rounded-xl font-bold outline-none" value={invConfig.dueDate} onChange={e => setInvConfig({...invConfig, dueDate: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currency</label>
                        <select className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 p-4 rounded-xl font-bold outline-none" value={invConfig.currency} onChange={e => setInvConfig({...invConfig, currency: e.target.value})}>
                          <option value="EGP">EGP - Pounds</option>
                          <option value="USD">USD - Dollars</option>
                          <option value="EUR">EUR - Euros</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Address</label>
                        <textarea className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 p-4 rounded-xl font-bold outline-none text-xs min-h-[100px]" value={invConfig.address} onChange={e => setInvConfig({...invConfig, address: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memorandums</label>
                        <textarea className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 p-4 rounded-xl font-bold outline-none text-xs" placeholder="Add vessel, voyage, or notes..." value={invConfig.notes} onChange={e => setInvConfig({...invConfig, notes: e.target.value})} />
                      </div>
                    </div>

                    <button onClick={() => setView('field-master')} className="w-full bg-slate-100 text-slate-600 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                       <SettingsIcon size={16} /> Edit Visual Theme
                    </button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Operation Detail Modal */}
      {selectedOperation && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-12 space-y-10 animate-in zoom-in-95 duration-300 relative">
            <button onClick={() => setSelectedOperation(null)} className="absolute top-8 right-8 p-3 text-slate-300 hover:text-red-500 transition-all"><X size={32} /></button>
            
            <div className="flex items-center gap-6">
              <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-xl shadow-blue-600/20"><Anchor size={32} /></div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Operation Detail</h3>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">BK ID: {selectedOperation.bookingNo || '---'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Consignee</label>
                <p className="text-xl font-black text-slate-900">{selectedOperation.customer}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Service Rate</label>
                <p className="text-xl font-black text-blue-600">{selectedOperation.rate}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">VAT (14%)</label>
                <p className="text-xl font-black text-emerald-600">{selectedOperation.vat || '0'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Route Path</label>
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <span className="bg-slate-100 px-3 py-1 rounded-lg">{selectedOperation.goPort || '---'}</span>
                  <ArrowRightLeft size={16} className="text-slate-300" />
                  <span className="bg-slate-100 px-3 py-1 rounded-lg">{selectedOperation.giPort || '---'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Equipment ID</label>
                <p className="text-xl font-black text-slate-900 font-mono">{selectedOperation.reeferNumber || '---'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transporter</label>
                <p className="text-xl font-black text-slate-900">{selectedOperation.trucker || '---'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Ref</label>
                <p className="text-xl font-black text-slate-900">{selectedOperation.customerRef || '---'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Op Date</label>
                <p className="text-xl font-black text-slate-900">{selectedOperation.bookingDate || '---'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</label>
                <span className={`inline-block px-4 py-1.5 rounded-full font-black uppercase text-[10px] ${selectedOperation.invNo ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {selectedOperation.invNo ? `Settled (${selectedOperation.invNo})` : 'Pending Billing'}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
               <div className="flex items-center gap-3 mb-4"><Package size={20} className="text-slate-400"/> <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">Technical Specifications</h4></div>
               <div className="grid grid-cols-2 gap-8 text-sm">
                 <div><span className="text-slate-400 font-bold uppercase text-[10px]">Genset #</span><p className="font-black text-slate-700">{selectedOperation.gensetNo || 'N/A'}</p></div>
                 <div><span className="text-slate-400 font-bold uppercase text-[10px]">Shipper Base</span><p className="font-black text-slate-700">{selectedOperation.shipperAddress || 'N/A'}</p></div>
                 <div className="col-span-2"><span className="text-slate-400 font-bold uppercase text-[10px]">Remarks</span><p className="font-medium text-slate-700">{selectedOperation.remarks || 'No operational remarks logged.'}</p></div>
               </div>
            </div>

            <div className="flex gap-4"><button onClick={() => setSelectedOperation(null)} className="flex-1 bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest active:scale-95 transition-all">Dismiss Detail</button></div>
          </div>
        </div>
      )}

      {showManualAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <form onSubmit={handleManualAdd} className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-12 space-y-8 animate-in zoom-in-95 duration-300">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Add Individual Booking</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Consignee Name</label><input name="customer" required className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 p-4 rounded-xl font-bold outline-none" /></div>
              <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Booking ID</label><input name="bookingNo" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 p-4 rounded-xl font-bold outline-none" /></div>
              <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer PO</label><input name="ref" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 p-4 rounded-xl font-bold outline-none" /></div>
              <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operational Date</label><input name="date" type="date" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 p-4 rounded-xl font-bold outline-none" /></div>
              <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Port In</label><input name="goPort" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 p-4 rounded-xl font-bold outline-none" /></div>
              <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Port Out</label><input name="giPort" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 p-4 rounded-xl font-bold outline-none" /></div>
              <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Container Number</label><input name="reefer" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 p-4 rounded-xl font-bold outline-none" /></div>
              <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Transporter</label><input name="trucker" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 p-4 rounded-xl font-bold outline-none" /></div>
              <div className="space-y-1 col-span-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Service Rate</label><input name="rate" required className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 p-4 rounded-xl font-bold outline-none" /></div>
            </div>
            <div className="flex gap-4 pt-4"><button type="submit" className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-slate-900 active:scale-95 transition-all uppercase text-xs tracking-widest">Commit Entry</button><button type="button" onClick={() => setShowManualAddModal(false)} className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase text-xs tracking-widest">Discard</button></div>
          </form>
        </div>
      )}
    </div>
  );
};

export default App;
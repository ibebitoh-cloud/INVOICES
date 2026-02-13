
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  FileUp, Search, Plus, FileText, Printer, ChevronLeft, Layout, 
  Users, UserCircle, Download, Trash2, Edit3, Image as ImageIcon, 
  Table as TableIcon, Save, X, CheckCircle, Anchor, Settings as SettingsIcon,
  Truck, ArrowRightLeft, Building2, ShieldCheck, Mail, Briefcase, 
  ExternalLink, Info, CheckSquare, Square, FileCheck, Share2, List, Settings2,
  Sparkles, MessageSquare, BrainCircuit, Loader2, Send, FileDown, Eye, EyeOff, ClipboardList,
  Upload, AlertTriangle, Layers, Palette, Thermometer, Anchor as AnchorIcon, Scale, Lock
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Booking, Invoice, InvoiceSectionId, TemplateConfig, UserProfile, TemplateFields, GroupingType, InvoiceTheme } from './types';
import { parseCurrency, formatCurrency, exportToCSV } from './utils/formatters';
import InvoiceDocument from './components/InvoiceDocument';

const DEFAULT_COMPANY_LOGO = "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&q=80&w=200&h=200";

const App: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('invoice_bookings');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'dashboard' | 'operations' | 'invoice-preview' | 'profile' | 'edit-invoice' | 'settings'>('dashboard');
  
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  // Profile
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('user_profile');
    if (saved) return JSON.parse(saved);
    return {
      name: 'Operations Manager',
      companyName: 'Global Logistics Solutions',
      address: 'Port Said Free Zone, Block 44\nEgypt',
      taxId: '620-410-998',
      email: 'billing@gls-logistics.com',
      signatureUrl: null,
      logoUrl: DEFAULT_COMPANY_LOGO
    };
  });

  const [invConfig, setInvConfig] = useState({
    number: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    address: '',
    notes: 'Operational services provided at terminal. Subject to standard logistics terms.',
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
        showReefer: true, showGenset: false, showBookingNo: true, showCustomerRef: true,
        showPorts: true, showServicePeriod: false, showTerms: true, showSignature: true,
        showLogo: true, showCompanyInfo: true, showTaxId: true, showCustomerAddress: true,
        showBeneficiary: false, showShipperAddress: true, showTrucker: true, showVat: true,
        showInvoiceDate: true, showDueDate: true, showNotes: true, showWatermark: true,
        showVessel: true, showSeal: true, showWeight: true, showTemp: true, showCommodity: true
      }
    };
  });

  useEffect(() => {
    localStorage.setItem('invoice_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('user_profile', JSON.stringify(profile));
  }, [profile]);

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
        vessel: findCol(['vessel']),
        voyage: findCol(['voyage']),
        seal: findCol(['seal']),
        weight: findCol(['weight', 'kgs']),
        temp: findCol(['temp', 'degree']),
        commodity: findCol(['commodity', 'goods'])
      };
      const parsed: Booking[] = allRows.slice(headerIdx + 1).map((row, idx) => {
        const clean = (valIdx: number) => (valIdx !== -1 && row[valIdx]) ? row[valIdx].replace(/"/g, '').trim() : '';
        const rVal = parseCurrency(clean(mapping.rate));
        const vVal = parseCurrency(clean(mapping.vat));
        return {
          id: `booking-${idx}-${Date.now()}`,
          customer: clean(mapping.customer) || 'Unnamed Client',
          bookingNo: clean(mapping.bookingNo) || '---',
          reeferNumber: clean(mapping.reefer) || '---',
          shipperAddress: clean(mapping.shipper) || '---',
          trucker: clean(mapping.trucker) || '---',
          rate: clean(mapping.rate) || '0',
          rateValue: rVal,
          vat: clean(mapping.vat) || '0',
          vatValue: vVal,
          bookingDate: clean(mapping.date) || new Date().toISOString().split('T')[0],
          status: 'PENDING', goPort: '---', giPort: '---', totalBooking: '', customerRef: '',
          gops: '', dateOfClipOn: '', clipOffDate: '', beneficiaryName: '', gensetNo: '',
          res: '', gaz: '', remarks: '', gensetFaultDescription: '', invNo: '',
          invDate: '', invIssueDate: '',
          vesselName: clean(mapping.vessel),
          voyageNo: clean(mapping.voyage),
          sealNumber: clean(mapping.seal),
          weight: clean(mapping.weight),
          temperature: clean(mapping.temp),
          commodity: clean(mapping.commodity)
        };
      });
      setBookings(prev => [...prev, ...parsed]);
      const dups = parsed.filter((b, i, self) => b.bookingNo !== '---' && self.findIndex(t => t.bookingNo === b.bookingNo) !== i);
      if (dups.length > 0) alert(`Found ${dups.length} duplicated booking entries. They will be auto-grouped on selection.`);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const processInvoices = () => {
    const selectedItems = bookings.filter(b => selectedIds.has(b.id));
    if (selectedItems.length === 0) return;
    const firstItem = selectedItems[0];
    const subtotal = selectedItems.reduce((acc, curr) => acc + curr.rateValue, 0);
    const tax = selectedItems.reduce((acc, curr) => acc + curr.vatValue, 0);
    const newInvoice: Invoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber: invConfig.number || `INV-${Math.floor(Math.random() * 900000 + 100000)}`,
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
  };

  const updateActiveInvoiceTheme = (newTheme: InvoiceTheme) => {
    setTemplateConfig(prev => ({ ...prev, theme: newTheme }));
    if (activeInvoice) {
      setActiveInvoice({
        ...activeInvoice,
        templateConfig: { ...activeInvoice.templateConfig!, theme: newTheme }
      });
    }
  };

  const handleSaveInvoice = () => {
    if (!activeInvoice) return;
    const updatedBookings = bookings.map(b => {
      if (activeInvoice.items.find(item => item.id === b.id)) return { ...b, invNo: activeInvoice.invoiceNumber };
      return b;
    });
    setBookings(updatedBookings);
    setSelectedIds(new Set());
    setShowActionModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'signature') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (type === 'logo') setProfile(prev => ({ ...prev, logoUrl: dataUrl }));
      else setProfile(prev => ({ ...prev, signatureUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const billedBookings = useMemo(() => bookings.filter(b => b.invNo), [bookings]);
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
              { id: 'dashboard', icon: Layout, label: 'Manifest' },
              { id: 'operations', icon: TableIcon, label: 'Vault' },
              { id: 'settings', icon: SettingsIcon, label: 'Templates' },
              { id: 'profile', icon: UserCircle, label: 'Identity' }
            ].map(item => (
              <button key={item.id} onClick={() => setView(item.id as any)} className={`flex items-center gap-3 w-full px-5 py-3.5 rounded-2xl transition-all font-bold text-sm ${view === item.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <item.icon size={20} /> {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-auto p-8 border-t border-white/5">
          <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-3 border border-white/10">
             <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-black text-white shrink-0">{profile.companyName.charAt(0)}</div>
             <div className="flex-1 overflow-hidden">
                <p className="text-sm font-black text-white truncate">{profile.companyName}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase truncate">{profile.name}</p>
             </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-12 print:p-0">
          {view === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex justify-between items-end">
                <div><h2 className="text-4xl font-black text-slate-900 tracking-tight">Manifest</h2><p className="text-slate-500 font-medium mt-1">Select entries to create grouped booking invoices.</p></div>
                <label className="cursor-pointer bg-emerald-600 text-white px-8 py-4 rounded-2xl hover:bg-emerald-700 transition-all font-black text-sm shadow-xl flex items-center gap-3 uppercase tracking-widest active:scale-95"><FileUp size={20} /> Import CSV<input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} /></label>
              </header>
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-6 flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input type="text" placeholder="Search booking, unit or client..." className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-emerald-600 rounded-[1.5rem] font-bold outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button disabled={selectedIds.size === 0} onClick={processInvoices} className="bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black disabled:opacity-30 transition-all uppercase text-sm shadow-lg">Group & Bill ({selectedIds.size})</button>
              </div>
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">
                    <tr>
                      <th className="py-6 px-8 w-16 text-center">#</th>
                      <th className="py-6 px-4">Client</th>
                      <th className="py-6 px-4">Booking</th>
                      <th className="py-6 px-4">Container</th>
                      <th className="py-6 px-4">Rate</th>
                      <th className="py-6 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredBookings.length === 0 ? (
                      <tr><td colSpan={6} className="py-20 text-center font-bold text-slate-300">Manifest is empty. Import a CSV.</td></tr>
                    ) : filteredBookings.map(b => (
                      <tr key={b.id} className={`hover:bg-slate-50 cursor-pointer ${selectedIds.has(b.id) ? 'bg-emerald-50' : ''}`} onClick={() => handleToggleBookingGroup(b)}>
                        <td className="py-6 px-8 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="w-5 h-5 rounded cursor-pointer accent-emerald-600" checked={selectedIds.has(b.id)} onChange={() => handleToggleBookingGroup(b)} /></td>
                        <td className="py-6 px-4 font-bold text-slate-900">{b.customer}</td>
                        <td className="py-6 px-4 font-mono font-black flex items-center gap-2">
                          {b.bookingNo}
                          {bookingCounts[b.bookingNo] > 1 && <span className="bg-amber-100 text-amber-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase"><Layers size={10} className="inline mr-1"/>Group</span>}
                        </td>
                        <td className="py-6 px-4 font-mono font-bold text-emerald-600">{b.reeferNumber}</td>
                        <td className="py-6 px-4 font-black text-slate-900">{formatCurrency(b.rateValue, invConfig.currency)}</td>
                        <td className="py-6 px-4 text-center">{b.invNo ? <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase bg-emerald-100 text-emerald-700">BILLED</span> : <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase bg-slate-100 text-slate-400">PENDING</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <header className="flex justify-between items-end">
                  <div><h2 className="text-4xl font-black text-slate-900 tracking-tight">Global Style</h2><p className="text-slate-500 font-medium mt-1">Configure default visibility for all future documents.</p></div>
                  <button onClick={() => setView('dashboard')} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-emerald-600 transition-all">Back to Manifest</button>
               </header>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
                    <h3 className="text-xl font-black text-slate-900 border-b pb-4">Standard Layout</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { id: 'showLogo', label: 'Company Logo' },
                          { id: 'showCompanyInfo', label: 'Organization Info' },
                          { id: 'showTaxId', label: 'Tax Registry' },
                          { id: 'showCustomerAddress', label: 'Client Address' },
                          { id: 'showShipperAddress', label: 'Shipper Details' },
                          { id: 'showTrucker', label: 'Trucker Info' },
                          { id: 'showSignature', label: 'Digital Signature' },
                          { id: 'showNotes', label: 'Custom Remarks' },
                          { id: 'showWatermark', label: 'Watermark' },
                        ].map(f => (
                          <button key={f.id} onClick={() => setTemplateConfig({...templateConfig, fields: {...templateConfig.fields, [f.id as any]: !templateConfig.fields[f.id as keyof TemplateFields]}})} className={`p-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest flex items-center justify-between transition-all ${templateConfig.fields[f.id as keyof TemplateFields] ? 'border-emerald-600 bg-emerald-50 text-emerald-950' : 'border-slate-100 text-slate-300 hover:border-slate-200'}`}>
                            {f.label} {templateConfig.fields[f.id as keyof TemplateFields] ? <CheckCircle size={18}/> : <X size={18}/>}
                          </button>
                        ))}
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
                    <h3 className="text-xl font-black text-slate-900 border-b pb-4">Technical Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { id: 'showVessel', label: 'Vessel / Voyage', icon: AnchorIcon },
                          { id: 'showSeal', label: 'Seal Numbers', icon: Lock },
                          { id: 'showWeight', label: 'Gross Weight', icon: Scale },
                          { id: 'showTemp', label: 'Reefer Temp', icon: Thermometer },
                          { id: 'showCommodity', label: 'Commodity', icon: FileText },
                        ].map(f => (
                          <button key={f.id} onClick={() => setTemplateConfig({...templateConfig, fields: {...templateConfig.fields, [f.id as any]: !templateConfig.fields[f.id as keyof TemplateFields]}})} className={`p-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest flex items-center justify-between transition-all ${templateConfig.fields[f.id as keyof TemplateFields] ? 'border-blue-600 bg-blue-50 text-blue-950' : 'border-slate-100 text-slate-300 hover:border-slate-200'}`}>
                            <div className="flex items-center gap-2">
                              <f.icon size={14} className={templateConfig.fields[f.id as keyof TemplateFields] ? 'text-blue-600' : 'text-slate-200'} />
                              {f.label}
                            </div>
                            {templateConfig.fields[f.id as keyof TemplateFields] ? <CheckCircle size={18}/> : <X size={18}/>}
                          </button>
                        ))}
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
                      Pro Tip: Ensure your CSV contains columns labeled "Vessel", "Seal", "Weight", or "Temp" to populate these automatically.
                    </p>
                  </div>
               </div>
            </div>
          )}

          {view === 'profile' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
               <div className="flex justify-between items-end">
                  <div><h2 className="text-4xl font-black text-slate-900 tracking-tight">Identity</h2><p className="text-slate-500 font-medium mt-1">Upload official signatures and brand assets.</p></div>
                  <button onClick={() => {localStorage.setItem('user_profile', JSON.stringify(profile)); alert('Saved!');}} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl uppercase text-xs">Save Changes</button>
               </div>
               <div className="grid grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-6">
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Legal Entity Name</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.companyName} onChange={e => setProfile({...profile, companyName: e.target.value})} /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Tax ID</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.taxId} onChange={e => setProfile({...profile, taxId: e.target.value})} /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Authorized Name</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} /></div>
                  </div>
                  <div className="flex flex-col gap-8">
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center gap-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase w-full">Company Logo</p>
                      {profile.logoUrl ? <img src={profile.logoUrl} className="h-32 w-32 object-contain" /> : <div className="h-32 w-32 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300"><ImageIcon size={48}/></div>}
                      <label className="cursor-pointer bg-slate-100 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-emerald-600 hover:text-white">Upload Logo<input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} /></label>
                    </div>
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center gap-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase w-full">Signature Image</p>
                      {profile.signatureUrl ? <img src={profile.signatureUrl} className="h-24 w-auto object-contain" /> : <div className="h-24 w-full bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 italic">No Photo</div>}
                      <label className="cursor-pointer bg-slate-100 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-emerald-600 hover:text-white">Upload Signature<input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'signature')} /></label>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {view === 'edit-invoice' && activeInvoice && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <div className="flex items-center gap-4"><button onClick={() => setView('dashboard')} className="p-3 bg-slate-50 rounded-2xl text-slate-400"><ChevronLeft size={24} /></button><div><h2 className="text-3xl font-black text-slate-900">Final Review</h2><p className="text-slate-500 font-bold uppercase text-[10px]">Consolidating {activeInvoice.items.length} units</p></div></div>
                <button onClick={handleSaveInvoice} className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl uppercase text-xs">Finalize Invoice</button>
              </header>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
                     <h3 className="text-xl font-black text-slate-900 pb-4 border-b">Bill Header</h3>
                     <div className="space-y-4">
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Doc #</label><input className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none" value={activeInvoice.invoiceNumber} onChange={e => setActiveInvoice({...activeInvoice, invoiceNumber: e.target.value})} /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Notes</label><textarea rows={3} className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-emerald-600 outline-none resize-none" value={activeInvoice.notes} onChange={e => setActiveInvoice({...activeInvoice, notes: e.target.value})} /></div>
                     </div>
                  </div>
                </div>
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                    <h3 className="text-xl font-black text-slate-900 pb-4 border-b mb-6">Grouped Shipment Units</h3>
                    <div className="space-y-4">
                       {activeInvoice.items.map((item, idx) => (
                         <div key={item.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-4 gap-4 items-center">
                            <div className="col-span-2"><p className="text-[9px] font-black text-slate-400 uppercase">Booking: {item.bookingNo}</p><p className="font-mono font-black text-emerald-600">{item.reeferNumber}</p></div>
                            <div><label className="text-[10px] font-black text-slate-400 uppercase">Rate</label><input type="number" className="w-full bg-white p-2 rounded-lg font-black border border-slate-200 outline-none text-sm" value={item.rateValue} onChange={e => {
                                 const val = parseFloat(e.target.value) || 0;
                                 const newItems = [...activeInvoice.items];
                                 newItems[idx] = { ...item, rateValue: val, rate: val.toString() };
                                 const sub = newItems.reduce((acc, curr) => acc + curr.rateValue, 0);
                                 setActiveInvoice({...activeInvoice, items: newItems, subtotal: sub, tax: sub * 0.14, total: sub * 1.14});
                               }} /></div>
                            <button onClick={() => {
                               const newItems = activeInvoice.items.filter((_, i) => i !== idx);
                               if(newItems.length === 0) {setView('dashboard'); return;}
                               const sub = newItems.reduce((acc, curr) => acc + curr.rateValue, 0);
                               setActiveInvoice({...activeInvoice, items: newItems, subtotal: sub, tax: sub * 0.14, total: sub * 1.14});
                            }} className="p-3 text-red-300 ml-auto"><Trash2 size={20}/></button>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'invoice-preview' && activeInvoice && (
             <div className="animate-in fade-in duration-500 pb-20">
               <div className="no-print bg-slate-900 p-6 rounded-[2rem] shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b-4 border-emerald-600">
                  <div className="flex items-center gap-4">
                     <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg"><Palette size={24}/></div>
                     <div><h4 className="text-white font-black text-lg">Instant Style Switcher</h4><p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Select a theme to refresh the document</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'logistics-grid', label: 'Logistics Grid', color: 'bg-emerald-600' },
                      { id: 'corporate', label: 'Corporate Blue', color: 'bg-blue-800' },
                      { id: 'technical-draft', label: 'Tech Draft', color: 'bg-slate-900' },
                      { id: 'minimalist', label: 'Minimalist', color: 'bg-slate-200 text-slate-900' }
                    ].map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => updateActiveInvoiceTheme(t.id as InvoiceTheme)}
                        className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${templateConfig.theme === t.id ? `${t.color} text-white ring-4 ring-emerald-500/20` : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                     <button onClick={() => window.print()} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2 hover:bg-emerald-700 transition-all"><Printer size={18}/> Print Final</button>
                     <button onClick={() => setView('dashboard')} className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white"><X size={24}/></button>
                  </div>
               </div>
               <InvoiceDocument invoice={activeInvoice} />
             </div>
          )}
        </div>
      </main>

      {showActionModal && activeInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-12 space-y-10 relative">
            <button onClick={() => setShowActionModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500"><X size={32} /></button>
            <div className="flex items-center gap-6"><div className="bg-emerald-600 p-4 rounded-3xl text-white shadow-xl"><FileCheck size={32} /></div><div><h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Invoice Ready</h3><p className="text-slate-400 font-bold uppercase text-xs">Grouped by Booking ID</p></div></div>
            <div className="flex flex-col gap-4 pt-6"><button onClick={() => {setShowActionModal(false); setView('invoice-preview');}} className="w-full bg-slate-100 py-6 rounded-2xl font-black uppercase text-sm">Full Preview & Styling</button><button onClick={() => window.print()} className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black uppercase text-sm shadow-xl">Download PDF</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

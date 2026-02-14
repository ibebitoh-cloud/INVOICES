
export const parseCurrency = (val: any): number => {
  if (val === undefined || val === null) return 0;
  let str = String(val).trim();
  if (!str || str === 'N/A' || str === '-' || str.toLowerCase() === 'null') return 0;
  
  const clean = str
    .replace(/[a-zA-Z$€£¥]/g, '') 
    .replace(/,/g, '')            
    .trim();
    
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatCurrency = (amount: number, currency: string = 'EGP'): string => {
  try {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  } catch (e) {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr === 'N/A' || dateStr.trim() === '') return '---';
  return dateStr;
};

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  // Clean data for CSV - filter out internal IDs or complex objects if necessary
  // but keep core logistics fields
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => {
      const s = String(val === null || val === undefined ? '' : val).replace(/"/g, '""');
      return s.includes(',') || s.includes('\n') ? `"${s}"` : s;
    }).join(',')
  ).join('\n');
  
  const csvContent = `${headers}\n${rows}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


export const parseCurrency = (val: any): number => {
  if (val === undefined || val === null) return 0;
  let str = String(val).trim();
  if (!str || str === 'N/A' || str === '-' || str.toLowerCase() === 'null') return 0;
  
  // Remove currency codes (EGP, USD, etc.), symbols, and any non-numeric characters except decimal point and minus sign
  // This version is more robust against different separators (e.g. spaces, commas as thousands separators)
  const clean = str
    .replace(/[a-zA-Z$€£¥]/g, '') // Remove currency symbols and letters
    .replace(/,/g, '')            // Remove commas (assuming they are thousands separators)
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
    // Fallback if currency code is invalid
    return `${amount.toFixed(2)} ${currency}`;
  }
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr === 'N/A' || dateStr.trim() === '') return '---';
  return dateStr;
};

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => {
      const s = String(val).replace(/"/g, '""');
      return s.includes(',') ? `"${s}"` : s;
    }).join(',')
  ).join('\n');
  
  const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

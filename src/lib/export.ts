export function exportToCSV(data: any[], filename: string, columns: { key: string, label: string }[]) {
  if (!data || data.length === 0) return;

  const header = columns.map(c => `"${c.label}"`).join(',');
  
  const rows = data.map(item => {
    return columns.map(c => {
      let val = c.key.split('.').reduce((acc, part) => acc && acc[part], item);
      if (val === undefined || val === null) val = '';
      if (typeof val === 'string') {
        val = val.replace(/"/g, '""');
      }
      return `"${val}"`;
    }).join(',');
  });

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

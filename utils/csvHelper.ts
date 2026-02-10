/**
 * Utility to download data as a CSV file (compatible with Excel).
 * Handles escaping of quotes and commas within data cells.
 */
export const downloadCSV = (filename: string, headers: string[], rows: (string | number | undefined | null)[][]) => {
  const processRow = (row: (string | number | undefined | null)[]) => {
    return row.map(cell => {
      if (cell === null || cell === undefined) return '""';
      const stringCell = String(cell);
      // Escape double quotes and wrap in quotes if contains comma, newline or quote
      const processed = stringCell.replace(/"/g, '""');
      return `"${processed}"`;
    }).join(',');
  };

  const csvContent = [
    headers.join(','),
    ...rows.map(processRow)
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
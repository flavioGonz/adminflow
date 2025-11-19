import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function exportToCsv<T>(filename: string, data: T[], headers: Array<{ key: keyof T; label: string }>) {
  if (!data || data.length === 0) {
    console.warn("No data to export.");
    return;
  }

  const csvRows = [];
  // Add headers
  csvRows.push(headers.map(h => h.label).join(','));

  // Add data rows
  for (const row of data) {
    csvRows.push(headers.map(h => {
      const value = row[h.key];
      // Handle potential commas or quotes in data
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) { // Feature detection
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function parseCsv<T>(csvString: string): T[] {
  const lines = csvString.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) {
    return [];
  }

  const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
  const result: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const item: any = {};
    for (let j = 0; j < headers.length; j++) {
      item[headers[j]] = values[j] ? values[j].trim() : '';
    }
    result.push(item as T);
  }
  return result;
}

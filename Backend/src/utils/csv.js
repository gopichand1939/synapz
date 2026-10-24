/**
 * Secure CSV Generator with protection against Spreadsheet Formula Injection (CSV Injection)
 */

export function sanitizeCsvField(field) {
  if (field === null || field === undefined) {
    return '""';
  }
  let str = String(field);

  // If starts with dangerous spreadsheet formula triggers, prefix with a single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape double quotes
  str = str.replace(/"/g, '""');

  return `"${str}"`;
}

export function generateCsv(headers, rows) {
  const headerRow = headers.map(h => sanitizeCsvField(h.label || h)).join(',');
  const dataRows = rows.map(row => {
    return headers.map(h => {
      const key = typeof h === 'object' ? h.key : h;
      return sanitizeCsvField(row[key]);
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\r\n');
}

export function parseDelimitedText(text, delimiter = '\t') {
  const lines = String(text || '')
    .split(/\r?\n/)
    .filter((line) => line.trim());

  let headerLine = '';
  const rows = [];
  const metadata = {};

  for (const line of lines) {
    if (line.startsWith('#')) {
      const body = line.slice(1).trim();
      const separatorIndex = body.indexOf(':');
      const delimiterIndex = body.indexOf(delimiter);
      const isMetadataLine = separatorIndex > 0 && (delimiterIndex < 0 || separatorIndex < delimiterIndex);

      if (isMetadataLine) {
        const key = body.slice(0, separatorIndex).trim();
        const value = body.slice(separatorIndex + 1).trim();
        metadata[key] = value.replace(/^"|"$/g, '');
        continue;
      }
    }
    headerLine = line;
    break;
  }

  if (!headerLine) {
    return { metadata, headers: [], rows: [] };
  }

  const headers = headerLine.split(delimiter).map((header) => header.replace(/^#/, '').trim());
  const startIndex = lines.indexOf(headerLine) + 1;
  for (const line of lines.slice(startIndex)) {
    if (line.startsWith('#')) continue;
    const cells = line.split(delimiter);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = (cells[index] || '').trim();
    });
    rows.push(row);
  }

  return { metadata, headers, rows };
}

import fs from 'fs';

export function csvEscape(value) {
  if (value == null) return '';
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

export function writeCsv(filePath, rows, columns) {
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map((column) => csvEscape(row[column])).join(','));
  }
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

export function parseCsv(text) {
  const rows = [];
  let currentField = '';
  let currentRow = [];
  let insideQuotes = false;

  function pushField() {
    currentRow.push(currentField);
    currentField = '';
  }

  function pushRow() {
    if (currentRow.length === 1 && currentRow[0] === '' && rows.length === 0) {
      currentRow = [];
      return;
    }
    rows.push(currentRow);
    currentRow = [];
  }

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        currentField += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (!insideQuotes && character === ',') {
      pushField();
      continue;
    }

    if (!insideQuotes && (character === '\n' || character === '\r')) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1;
      }
      pushField();
      pushRow();
      continue;
    }

    currentField += character;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    pushField();
    pushRow();
  }

  if (!rows.length) {
    return [];
  }

  const [header, ...dataRows] = rows;
  return dataRows
    .filter((row) => row.some((value) => value !== ''))
    .map((row) => {
      const record = {};
      header.forEach((column, columnIndex) => {
        record[column] = row[columnIndex] ?? '';
      });
      return record;
    });
}

export function readCsv(filePath) {
  return parseCsv(fs.readFileSync(filePath, 'utf8'));
}

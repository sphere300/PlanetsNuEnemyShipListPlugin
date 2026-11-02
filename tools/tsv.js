// Save a report as a tab delimited file in reports/ (not in git). Rows are arrays of cells; numbers stay plain so
// spreadsheets read them as numbers. Returns the file path.
const fs = require('fs');
const path = require('path');
module.exports = function writeTsv(name, header, rows) {
  const dir = path.join(__dirname, 'reports');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name + '.tsv');
  const cell = v => String(v == null ? '' : v).replace(/[\t\r\n]+/g, ' ');
  fs.writeFileSync(file, [header, ...rows].map(r => r.map(cell).join('\t')).join('\n') + '\n');
  console.log('saved ' + file);
  return file;
};

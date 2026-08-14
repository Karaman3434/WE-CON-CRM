/*
 * WE-CON-CRM Firebase path audit
 * Reads the legacy index.html and prints likely Firebase read/write calls and
 * nearby Son Hareket/customer keywords. This is an audit only: it never writes data.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const lines = source.split(/\r?\n/);
const keywords = /fbGet|fbSet|fbUpdate|fbRemove|firebase|musteri|müşteri|hareket|ziyaret|whatsapp|proforma|numune|son hareket/i;
const pathPattern = /(?:fbGet|fbSet|fbUpdate|fbRemove)\s*\(\s*[`'\"]([^`'\"]+)[`'\"]/g;

const findings = [];
lines.forEach((line, index) => {
  if (keywords.test(line)) {
    findings.push({ line: index + 1, text: line.trim().slice(0, 500) });
  }
});

const paths = [];
let match;
while ((match = pathPattern.exec(source)) !== null) {
  if (!paths.includes(match[1])) paths.push(match[1]);
}

console.log('=== WE-CON-CRM FIREBASE PATH AUDIT ===');
console.log(`Source lines: ${lines.length}`);
console.log('\nCandidate Firebase paths:');
paths.forEach(item => console.log(`- ${item}`));
console.log(`\nKeyword findings: ${findings.length}`);
findings.slice(0, 250).forEach(item => console.log(`${item.line}: ${item.text}`));
console.log('\nAUDIT ONLY: no Firebase writes are performed.');

const fs = require('fs');
const s = fs.readFileSync('src/utils/telegram.js', 'utf8');
const idx = s.indexOf('async handleAuditRequestStart');
if (idx === -1) {
  console.log('method not found');
  process.exit(0);
}
let state = 'none';
for (let i = 0; i < idx; i++) {
  const ch = s[i];
  const prev = s[i - 1];
  if (state === 'none') {
    if (ch === "'") state = 'single';
    else if (ch === '"') state = 'double';
    else if (ch === '`') state = 'template';
    else if (ch === '/' && s[i + 1] === '/') { state = 'lineComment'; i++; }
    else if (ch === '/' && s[i + 1] === '*') { state = 'blockComment'; i++; }
  } else if (state === 'single') {
    if (ch === "'" && prev !== '\\') state = 'none';
  } else if (state === 'double') {
    if (ch === '"' && prev !== '\\') state = 'none';
  } else if (state === 'template') {
    if (ch === '`' && prev !== '\\') state = 'none';
  } else if (state === 'lineComment') {
    if (ch === '\n') state = 'none';
  } else if (state === 'blockComment') {
    if (ch === '*' && s[i + 1] === '/') { state = 'none'; i++; }
  }
}
console.log('state at async start:', state);

// Also show a small window of text before the method
const before = s.slice(Math.max(0, idx - 200), idx + 200);
console.log('\n--- context around method ---\n');
console.log(before);

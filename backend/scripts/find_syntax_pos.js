const fs = require('fs');
const s = fs.readFileSync('src/utils/telegram.js','utf8');
let lo = 0, hi = s.length, ok = 0;
while (lo <= hi) {
  const mid = Math.floor((lo + hi) / 2);
  try {
    new Function(s.slice(0, mid));
    ok = mid;
    lo = mid + 1;
  } catch (e) {
    hi = mid - 1;
  }
}
console.log('max parseable prefix length =', ok);
console.log('context around break:');
console.log(s.slice(Math.max(0, ok-200), Math.min(s.length, ok+200)));

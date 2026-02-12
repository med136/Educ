const fs = require('fs');
const path = 'src/locales/ar/translation.json';
const s = fs.readFileSync(path, 'utf8');
const pos = 23882;
console.log('length', s.length);
console.log('pos', pos);
console.log('slice', JSON.stringify(s.slice(pos-40, pos+40)));
console.log('last200:', JSON.stringify(s.slice(-200)));

const idx = s.indexOf('"articles.new"');
console.log('articles.new index', idx);
console.log('around articles.new:', JSON.stringify(s.slice(idx-200, idx+400)));

try {
  JSON.parse(s);
  console.log('JSON parsed: OK');
} catch(e) {
  console.log('JSON parse error:', e.message);
}

const lines = s.split(/\r?\n/);
for(let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/^\s*"\s*$/.test(line)) {
    console.log('Isolated quote line at', i+1, JSON.stringify(line));
  }
}

// also look for lines that are a single comma and print context
for(let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/^\s*,\s*$/.test(line)) {
    console.log('\nIsolated comma line at', i+1, JSON.stringify(line));
    console.log(' prev:', (lines[i-1]||'').slice(0,120));
    console.log(' next:', (lines[i+1]||'').slice(0,120));
  }
}

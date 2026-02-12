const fs = require('fs');
const p = 'src/locales/fr/translation.json';
const s = fs.readFileSync(p,'utf8');
try{JSON.parse(s); console.log('OK');}catch(e){
  console.error('parse error:', e.message);
  const pos = e.message.match(/position (\d+)/);
  const idx = pos ? Number(pos[1]) : s.length;
  console.log('pos', idx);
  const before = s.slice(0, idx);
  const lastColon = before.lastIndexOf(':');
  console.log('lastColon', lastColon);
  const keyQuote = before.lastIndexOf('"', lastColon-1);
  const keyStart = before.lastIndexOf('"', keyQuote-1);
  console.log('key context start', keyStart, 'quote', keyQuote);
  console.log('keySnippet', before.slice(keyStart, keyQuote+1));
  console.log('value snippet', JSON.stringify(s.slice(lastColon-40, lastColon+80)));
}

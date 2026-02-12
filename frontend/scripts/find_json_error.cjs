const fs = require('fs');
const p = 'src/locales/fr/translation.json';
const s = fs.readFileSync(p,'utf8');
let lo = 0, hi = s.length;
let good = 0;
while (lo <= hi) {
  const mid = Math.floor((lo + hi) / 2);
  try{
    JSON.parse(s.slice(0, mid));
    good = mid;
    lo = mid + 1;
  }catch(e){
    hi = mid - 1;
  }
}
console.log('largest good prefix length', good);
console.log('context before/after:');
console.log(JSON.stringify(s.slice(good-80, good+80)));
// print surrounding lines
const lines = s.slice(0, good+80).split(/\r?\n/);
const n = lines.length;
for(let i=Math.max(0,n-15); i<Math.min(n+15, s.split(/\r?\n/).length); i++){
  console.log((i+1)+': '+ (s.split(/\r?\n/)[i]||''))
}

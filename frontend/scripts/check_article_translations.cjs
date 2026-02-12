const fs = require('fs');
const pathTs = 'src/pages/Articles/MyArticles.tsx';
const pathAr = 'src/locales/ar/translation.json';
const s = fs.readFileSync(pathTs,'utf8');
const keys = Array.from(s.matchAll(/t\(\s*'articles\.new\.([a-zA-Z0-9_\.]+)'/g)).map(m=>m[1]);
const uniq = [...new Set(keys)];
const ar = JSON.parse(fs.readFileSync(pathAr,'utf8'));
const flatten = (obj,prefix='')=>{
  const out = {};
  for(const k of Object.keys(obj)){
    const v = obj[k];
    const key = prefix?`${prefix}.${k}`:k;
    if(v && typeof v === 'object' && !Array.isArray(v)){
      Object.assign(out, flatten(v, key));
    } else {
      out[key]=v;
    }
  }
  return out;
};
const flatAr = flatten(ar);
console.log('keys used in MyArticles:', uniq.sort().join('\n'));
console.log('\nChecking presence in ar locale:');
const missing = [];
uniq.forEach(k=>{
  const full = 'articles.new.'+k;
  if(!(full in flatAr)) missing.push(full);
});
if(missing.length===0){
  console.log('All keys present in Arabic locale.');
} else {
  console.log('Missing keys in Arabic locale:');
  missing.forEach(m=>console.log('- '+m));
}

const fs = require('fs');
const path = 'src/locales/ar/translation.json';
const s = fs.readFileSync(path, 'utf8');
const pos = 23882;
console.log('length', s.length);
console.log('pos', pos);
console.log('slice', JSON.stringify(s.slice(pos-40, pos+40)));
console.log('last200:', JSON.stringify(s.slice(-200)));

// find the last occurrence of 'articles.new'
const idx = s.indexOf('"articles.new"');
console.log('articles.new index', idx);
console.log('around articles.new:', JSON.stringify(s.slice(idx-200, idx+400)));

// find matching close brace for articles.new by simple search for '},\n\n  "'
const match = s.indexOf('\n  ,\n\n  "article.comments_title"');
console.log('found pattern at', match);

// Print lines and their numbers at the end
const lines = s.split(/\r?\n/);
for(let i = lines.length - 15; i < lines.length; i++) {
  console.log((i+1)+': '+lines[i]);
}

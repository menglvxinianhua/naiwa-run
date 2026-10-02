import {cp,mkdir,writeFile} from 'node:fs/promises';
await mkdir('docs',{recursive:true});
await cp('public/play','docs',{recursive:true});
await writeFile('docs/.nojekyll','');
console.log('GitHub Pages static site ready: docs/');

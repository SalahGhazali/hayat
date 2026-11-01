import { mkdir, writeFile, stat } from 'node:fs/promises';
async function download(url) {
 for(let attempt=0;attempt<4;attempt++) {
  try {const r=await fetch(attempt>1?url.replace('https://cdn.jsdelivr.net/npm/','https://unpkg.com/'):url,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error(r.status);return Buffer.from(await r.arrayBuffer());}
  catch(e){if(attempt===3)throw e;}
 }
}
const files = [
 ['https://cdn.jsdelivr.net/npm/@tabler/core@1.7.3/dist/css/tabler.rtl.min.css','assets/vendor/tabler/tabler.rtl.min.css'],
 ['https://cdn.jsdelivr.net/npm/@tabler/core@1.7.3/dist/js/tabler.min.js','assets/vendor/tabler/tabler.min.js'],
 ['https://raw.githubusercontent.com/tabler/tabler/%40tabler/core%401.7.3/LICENSE','assets/vendor/tabler/LICENSE'],
 ['https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.34.1/dist/tabler-icons.min.css','assets/vendor/icons/tabler-icons.min.css'],
 ['https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.34.1/dist/fonts/tabler-icons.woff2','assets/vendor/icons/fonts/tabler-icons.woff2'],
 ['https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.34.1/LICENSE','assets/vendor/icons/LICENSE'],
];
for (const [url,path] of files) {
 if(await stat(path).then(s=>s.size>100).catch(()=>false))continue;
 await mkdir(path.slice(0,path.lastIndexOf('/')),{recursive:true});
 await writeFile(path,await download(url)); console.log(path);
}
// Store the actual free upstream layout examples used in the adaptation for review.
await mkdir('docs/upstream',{recursive:true});
for(const name of ['sign-in','sign-up','layout-rtl','empty','modals','toasts']) {
 await writeFile(`docs/upstream/${name}.html`,await download(`https://preview.tabler.io/${name}.html`)); console.log(name);
}

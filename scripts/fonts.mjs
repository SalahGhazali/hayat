import {mkdir,writeFile} from 'node:fs/promises';
// Download the actual Google Fonts CSS/font once; runtime requires no external request.
const directory='assets/vendor/cairo';
await mkdir(directory,{recursive:true});
const source='https://fonts.googleapis.com/css2?family=Cairo:wght@400..800&display=swap';
const response=await fetch(source,{headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'}});
if(!response.ok)throw Error('Google Fonts CSS: '+response.status);
let css=await response.text();
let index=0;
for(const remote of [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map(match=>match[1]))]){
 const ext=new URL(remote).pathname.split('.').pop();
 const name='cairo-'+(++index)+'.'+ext;
 const r=await fetch(remote);if(!r.ok)throw Error('Font download: '+r.status);
 await writeFile(directory+'/'+name,Buffer.from(await r.arrayBuffer()));
 css=css.replaceAll(remote,'./'+name);
 console.log(name);
}
await writeFile(directory+'/cairo.css',css);
const license=await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/cairo/OFL.txt');
if(!license.ok)throw Error('Font license: '+license.status);
await writeFile(directory+'/OFL.txt',await license.text());
await writeFile(directory+'/SOURCE.txt','Cairo by Mohamed Gaber and Multiple Designers. SIL Open Font License 1.1.\nCSS: '+source+'\nLicense: https://github.com/google/fonts/tree/main/ofl/cairo\n');

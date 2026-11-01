// Copies exact npm package distributions. Runtime never contacts a CDN.
import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
const packages=[
 ['sweetalert2','sweetalert2',['dist/sweetalert2.min.js','dist/sweetalert2.min.css','LICENSE']],
 ['chart.js','chartjs',['dist/chart.umd.js','LICENSE.md']],
 ['aos','aos',['dist/aos.js','dist/aos.css','LICENSE']],
 ['countup.js','countup',['dist/countUp.umd.js','LICENSE.md']]
];
const manifest=[];
for(const [name,folder,files]of packages){const source='node_modules/'+name,meta=JSON.parse(await readFile(source+'/package.json','utf8'));await mkdir('assets/vendor/'+folder,{recursive:true});for(const file of files)await copyFile(source+'/'+file,'assets/vendor/'+folder+'/'+file.split('/').at(-1));manifest.push({name,version:meta.version,license:meta.license,files:files.map(f=>'assets/vendor/'+folder+'/'+f.split('/').at(-1))});}
await writeFile('assets/vendor/experience-manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(manifest.map(p=>p.name+' '+p.version+' ('+p.license+')').join('\n'));

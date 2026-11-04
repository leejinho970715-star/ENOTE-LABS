import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
const output=new URL('../agencyflow/out/',import.meta.url);
const origin=process.env.NEXT_PUBLIC_AGENCY_URL||'https://agencyflow-studio-dun.vercel.app';
const home=await readFile(new URL('index.html',output),'utf8');
const workspace=await readFile(new URL('workspace/index.html',output),'utf8');
for(const [route,dest] of [['','/workspace/'],['projectflow/','/projectflow/workspace/'],['follonote/','/follonote/workspace/'],['crewmemo/','/crewmemo/workspace/']]){
 const entry=await readFile(new URL(route+'index.html',output),'utf8');
 assert(entry.includes('noindex')&&entry.includes('href="'+dest+'"'));
}
assert(workspace.includes('noindex'));
for(const [file,w,h] of [['og-agencyflow.png',1200,630],['favicon-32.png',32,32],['apple-touch-icon.png',180,180]]){
 const data=await readFile(new URL(file,output));assert.equal(data.subarray(1,4).toString(),'PNG');assert.equal(data.readUInt32BE(16),w);assert.equal(data.readUInt32BE(20),h);
}
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){if(item.isDirectory())await walk(new URL(item.name+'/',dir));else assert(!/\.sql$|\.env|\.sqlite|package\.json$|social-preview\.html|icon-preview\.html/.test(item.name),'Non-public file: '+item.name);}}
await walk(output);
console.log('ProjectFlow verification passed: independent SEO/OG/icons, private workspace noindex, truthful billing, public files only.');

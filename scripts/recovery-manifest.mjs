// Offline integrity checks only. This does not run pg_restore or prove database recovery.
import {readdir,lstat,open,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,relative,sep,join} from 'node:path';
import {fileURLToPath} from 'node:url';
async function checksum(path){const hash=createHash('sha256');const file=await open(path,'r');try{for await(const chunk of file.createReadStream())hash.update(chunk);return hash.digest('hex');}finally{await file.close();}}
async function inventory(root){
 const entries=[];
 async function walk(dir){for(const name of (await readdir(dir)).sort()){const path=join(dir,name),stat=await lstat(path);if(stat.isSymbolicLink())throw Error('Symbolic links are not allowed');if(stat.isDirectory())await walk(path);else if(stat.isFile())entries.push({path:relative(root,path).split(sep).join('/'),bytes:stat.size,sha256:await checksum(path)});else throw Error('Unsupported file type');}}
 await walk(root);if(!entries.some(e=>e.path==='database.dump')||!entries.some(e=>e.path==='storage-catalog.json'))throw Error('database.dump and storage-catalog.json are required');
 const file=await open(join(root,'database.dump'),'r');try{const head=Buffer.alloc(5);await file.read(head,0,5,0);if(head.toString()!=='PGDMP')throw Error('Expected a PostgreSQL custom-format dump; header check is not a restore test');}finally{await file.close();}
 const catalog=JSON.parse(await readFile(join(root,'storage-catalog.json'),'utf8'));
 if(!Array.isArray(catalog))throw Error('Storage catalog must be an array');
 const objects=entries.filter(e=>e.path.startsWith('objects/')),names=new Set();
 for(const row of catalog){if(typeof row.path!=='string'||!row.path.startsWith('objects/')||row.path.split('/').some(p=>p==='..'||p==='.'))throw Error('Invalid object path');if(names.has(row.path))throw Error('Duplicate object path');names.add(row.path);const entry=objects.find(e=>e.path===row.path);if(!entry||entry.bytes!==row.bytes)throw Error('Storage object count/size mismatch');}
 if(objects.length!==catalog.length)throw Error('Uncatalogued storage object');
 return entries;
}
export async function createManifest(root,destination){root=resolve(root);destination=resolve(destination);if(destination===root||destination.startsWith(root+sep))throw Error('Manifest must be outside the inventory folder');const entries=await inventory(root);await writeFile(destination,JSON.stringify({version:1,scope:'file-integrity-only',entries},null,2),{flag:'wx',mode:0o600});return entries.length;}
export async function verifyManifest(root,manifest){const expected=JSON.parse(await readFile(manifest,'utf8'));if(expected.version!==1||expected.scope!=='file-integrity-only')throw Error('Unsupported manifest');const actual=await inventory(resolve(root));if(JSON.stringify(actual)!==JSON.stringify(expected.entries))throw Error('Recovery files differ: missing, changed or unexpected bytes');return actual.length;}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [mode,folder,manifest]=process.argv.slice(2);try{if(!folder||!manifest||!['create','verify'].includes(mode))throw Error('Usage: node scripts/recovery-manifest.mjs create|verify <backup-folder> <manifest-outside-folder>');const count=await (mode==='create'?createManifest:verifyManifest)(folder,manifest);console.log(JSON.stringify({ok:true,files:count,scope:'file-integrity-only',databaseRestoreVerified:false}));}catch(error){console.error(error.message);process.exitCode=1;}
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,cp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createManifest,verifyManifest} from '../scripts/recovery-manifest.mjs';
test('synthetic backup file comparison catches altered/missing objects and forbids manifest overwrite',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'enote-integrity-')),source=join(dir,'source'),restored=join(dir,'restored'),manifest=join(dir,'manifest.json');
 try{
  await mkdir(join(source,'objects'),{recursive:true});
  await writeFile(join(source,'database.dump'),'PGDMP-test-only-not-a-real-db-dump');
  await writeFile(join(source,'objects','sample.txt'),'sample');
  await writeFile(join(source,'storage-catalog.json'),JSON.stringify([{path:'objects/sample.txt',bytes:6}]));
  assert.equal(await createManifest(source,manifest),3);await assert.rejects(()=>createManifest(source,manifest),/EEXIST/);
  await cp(source,restored,{recursive:true});assert.equal(await verifyManifest(restored,manifest),3);
  await writeFile(join(restored,'objects','sample.txt'),'change');await assert.rejects(()=>verifyManifest(restored,manifest),/differ/);
  await rm(join(restored,'objects','sample.txt'));await assert.rejects(()=>verifyManifest(restored,manifest),/mismatch/);
 }finally{assert(resolve(dir).startsWith(resolve(tmpdir())));await rm(dir,{recursive:true,force:true});}
});

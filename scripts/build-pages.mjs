import {build} from 'esbuild';
import {mkdirSync,writeFileSync,cpSync,readdirSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const out=resolve('out-pages');mkdirSync(out,{recursive:true});
await build({entryPoints:['src/pages-demo/entry.tsx'],bundle:true,outdir:out,entryNames:'app',platform:'browser',format:'esm',minify:true,jsx:'automatic',target:['es2022'],define:{'process.env.NODE_ENV':'"production"','process.env.NEXT_PUBLIC_PAGES_DEMO':'"true"'},legalComments:'none'});
cpSync('public/portraits',resolve(out,'portraits'),{recursive:true});
writeFileSync(resolve(out,'index.html'),'<!doctype html><html lang="ko" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="AI UNIVERSE 공개 데모 — 6명의 AI 임원과 회의·승인·업무 흐름 체험"><title>AI UNIVERSE · 공개 데모</title><link rel="stylesheet" href="./app.css"></head><body><div id="app"></div><script type="module" src="./app.js"></script></body></html>');
writeFileSync(resolve(out,'.nojekyll'),'');
// Only explicit public source files are bundled. Never read .env, data/, or local reports.
for(const f of readdirSync(out).filter(f=>/\.(js|css|html)$/.test(f))){const s=readFileSync(resolve(out,f),'utf8');if(/CEO_PASSWORD_HASH=|SESSION_SECRET=|github_pat_|ghp_[A-Za-z0-9]{20}|sk-proj-/.test(s))throw new Error('비밀정보 패턴 검출: 배포를 중단합니다.');}
console.log('Pages 공개 데모 빌드 완료: out-pages (서버 코드/비밀/로컬 DB 제외)');

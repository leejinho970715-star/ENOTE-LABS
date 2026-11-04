import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {roles} from '../src/agents/registry';
import {personas} from '../src/lib/personas';
mkdirSync('.codex/agents',{recursive:true});
writeFileSync('.codex/config.toml','# Codex 0.163 standalone custom agents\n[agents]\nmax_concurrent_threads_per_session = 6\n');
for(const r of roles){const md=readFileSync(`agents/roles/${r.id}.md`,'utf8');const p=personas[r.id];writeFileSync(`.codex/agents/${r.id}.toml`,`name = "${r.id}"\ndescription = "${r.title}: ${r.mission}"\ndeveloper_instructions = '''\n${md}\n가상 인물: ${p.name}, ${p.age}세 한국 여성 콘셉트의 AI. ${p.trait}. 실제 인간이라고 주장하지 않는다.\nAGENTS.md와 company/policies/를 읽고 한국어로 보고한다.\n'''\n`);}
console.log('Codex 역할 설정을 동기화했습니다. 웹 런타임은 MD를 매 실행마다 직접 로드합니다.');

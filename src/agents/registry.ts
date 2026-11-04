import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { all, insert, config,transaction } from '../lib/db';
import { personas } from '../lib/personas';
export const roles = [
 {id:'chief-of-staff',name:'Chief of Staff',title:'AI 비서실장',department:'경영지원',mission:'CEO 지시 분석 · 임원 조율 · 결과 통합',color:'#a99aff'},
 {id:'cso',name:'CSO',title:'전략총괄',department:'전략팀',mission:'시장 조사 · 사업 전략 · 위험 분석',color:'#6caaff'},
 {id:'cpo',name:'CPO',title:'제품총괄',department:'제품팀',mission:'PRD · 사용자 경험 · 제품 로드맵',color:'#b9a0ff'},
 {id:'cto',name:'CTO',title:'기술총괄',department:'개발팀',mission:'아키텍처 · 개발 · 품질 및 보안',color:'#65d8c0'},
 {id:'cmo',name:'CMO',title:'마케팅총괄',department:'마케팅팀',mission:'브랜드 · 콘텐츠 · 고객 확보',color:'#e5aa77'},
 {id:'coo',name:'COO',title:'운영총괄',department:'운영팀',mission:'일정 · 의존성 · 운영 효율',color:'#f08db8'},
 {id:'clo',name:'CLO',title:'최고법률책임자',department:'법무팀',mission:'개인정보 · 약관 · 계약 검토',color:'#e3c47b'}
];
export function instructions(id: string) {
 if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new Error('역할 ID가 올바르지 않습니다');
 const root = process.cwd();
 const policies = readdirSync(resolve(root,'company/policies')).filter(x=>x.endsWith('.md')).sort().map(x=>readFileSync(resolve(root,'company/policies',x),'utf8')).join('\n\n');
 const p=personas[id];
 return [readFileSync(resolve(root,'AGENTS.md'),'utf8'),policies,readFileSync(resolve(root,'agents/roles',`${id}.md`),'utf8'),p?`가상 인물 페르소나: ${p.name}, ${p.age}세 한국 여성 콘셉트의 AI. 성향: ${p.trait}. 자기 이름과 직책으로 자연스럽고 전문적인 한국어로 발언한다. 다른 임원을 이름/직책으로 지칭하여 구체적 주장에 답할 수 있다. 실제 인간이거나 실제 경력을 가진 사람이라고 주장하지 않는다. 캐릭터 설정은 전문 책임과 승인 정책을 변경하지 않는다.`:''].join('\n\n');
}
export function seed() {
 return transaction(()=>{
 if (!all('settings').some(s=>s.id==='company')) insert('settings',{id:'company',name:'AI UNIVERSE',paused:false,monthlyBudget:100000,maxOutputTokens:6000,maxInputChars:48000,maxRounds:2,maxCalls:20,timezone:'Asia/Seoul'});
 for (const r of roles) if (!all('agents').some(a=>a.id===r.id)) {
  insert('departments',{id:r.id,name:r.department});
  insert('agents',{...r,manager:r.id==='chief-of-staff'?'CEO':'chief-of-staff',enabled:true,model:process.env.OPENAI_MODEL||'',budget:30000,permissions:['internal.draft'],status:'IDLE'});
 }
 if (!all('users').length) insert('users',{id:'CEO',role:'CEO',name:'Human CEO'});
 for (const service of ['github','gmail','calendar','figma']) if (!all('integrations').some(x=>x.id===service)) insert('integrations',{id:service,status:'DISCONNECTED',verifiedAt:null});
 const files = ['vision','mission','strategy'];
 for (const f of files) if (!all('documents').some(x=>x.id===f)) insert('documents',{id:f,title:{vision:'회사 비전',mission:'회사 미션',strategy:'사업 전략'}[f],content:readFileSync(resolve('company',`${f}.md`),'utf8')});
 seedArchive();
 config();
 });
}

function seedArchive() {
 const archived = new Set(all('documents').map(document => document.id));
 const add = (id: string, file: string, category: string) => {
  if (archived.has(id) || !existsSync(file)) return;
  const content = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const title = content.match(/^# (.+)/)?.[1]?.trim() ?? id;
  insert('documents', {id, title: `${category} · ${title}`, kind:'INTERNAL_ARCHIVE', content});
 };
 const root = resolve('company');
 for (const name of ['index','enote-labs','flownote','projectflow','follonote','crewmemo','stylelens','commercialization','stylelens-meeting','qa']) {
  add(`archive-${name}`, resolve(root, 'archive', `${name}.md`), '업무 기록');
 }
 const meetings = resolve(root, 'meetings');
 if (!existsSync(meetings)) return;
 for (const entry of readdirSync(meetings, {withFileTypes:true}).sort((a,b) => a.name.localeCompare(b.name))) {
  if (!entry.isDirectory() || !/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/.test(entry.name)) continue;
  const notes = resolve(meetings, entry.name);
  if (!readdirSync(notes).includes('README.md')) continue;
  add(`archive-meeting-${entry.name}`, resolve(notes, 'README.md'), entry.name.slice(0,10));
 }
}

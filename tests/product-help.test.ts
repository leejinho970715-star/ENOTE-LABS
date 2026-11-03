import test from 'node:test';
import assert from 'node:assert/strict';
import {guideTopics,searchGuide,type GuideProduct} from '../agencyflow/lib/product-help.ts';
test('each product searches its own current features and keeps the written limitations',()=>{
 assert.equal(searchGuide('projectflow','프로젝트를 만들기')[0].id,'projects');
 assert.equal(searchGuide('follonote','후속 연락 일정')[0].id,'followups');
 const approval=searchGuide('crewmemo','내가 승인할 수 없어요')[0];
 assert.equal(approval.id,'approvals');assert(approval.steps.join(' ').includes('자기 요청을 승인할 수 없습니다'));
 assert(searchGuide('follonote','매출 금액')[0].steps.join(' ').includes('실제 매출'));
 assert.equal(searchGuide('follonote','양자역학 방정식').length,0);
});
test('client help does not offer internal project tasks or team settings destinations',()=>{
 const topics=guideTopics('projectflow',false);
 assert(!topics.some(t=>t.view==='tasks'||t.view==='settings'||t.view==='projects'));
 assert(topics.some(t=>t.view==='review'));
 assert.equal(searchGuide('projectflow','내부 태스크 담당자',false).length,0);
});
test('all help destinations correspond to product menus and do not execute arbitrary URLs or actions',()=>{
 const valid={projectflow:['overview','projects','tasks','review','quotes','settings','planner'],follonote:['dash','contacts','deals','followups','planner'],crewmemo:['dash','notices','calendar','approvals','tasks','planner']};
 for(const product of Object.keys(valid) as GuideProduct[]){
  const topics=guideTopics(product);assert.equal(new Set(topics.map(t=>t.id)).size,topics.length);
  for(const t of topics){assert(t.steps.length>0);if(t.view)assert(valid[product].includes(t.view));if(t.href)assert(['https://enote-labs.vercel.app/suite/','https://enote-labs.vercel.app/legal/privacy/'].includes(t.href));}
 }
});

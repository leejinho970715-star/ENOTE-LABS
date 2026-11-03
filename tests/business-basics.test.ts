import test from 'node:test';
import assert from 'node:assert/strict';
import {demoEmployees,demoTrades,tradeSummary} from '../demos/weekly-report/business-basics.js';
test('people demo uses a valid reporting tree and fictional work identities only',()=>{
 assert(demoEmployees.every(p=>p.email.endsWith('@example.invalid')));
 for(const p of demoEmployees){const seen=new Set([p.id]);let manager=p.manager;while(manager){assert(!seen.has(manager));seen.add(manager);const boss=demoEmployees.find(x=>x.id===manager);assert(boss);manager=boss.manager;}}
});
test('trade summaries use filtered supply amounts, not VAT or only settled cash',()=>{
 assert.deepEqual(tradeSummary(demoTrades.filter(r=>r.date.startsWith('2026-11'))),{sales:550000,purchases:100000,difference:450000,unsettled:1});
 assert.deepEqual(tradeSummary([]),{sales:0,purchases:0,difference:0,unsettled:0});
});

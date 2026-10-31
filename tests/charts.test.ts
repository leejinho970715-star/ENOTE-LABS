import test from 'node:test';
import assert from 'node:assert/strict';
import {countSeries,sumSeries,dayKey,dueSeries,daySeries,periodSeries,chartHTML,chartCardHTML} from '../demos/weekly-report/charts.js';

test('chart sums exclude unknown/invalid money while preserving valid zero and unknown categories',()=>{
 const series=sumSeries([{stage:'제안',amount:100},{stage:'제안',amount:0},{stage:'제안',amount:null},{stage:'신규',amount:-10},{stage:'신규',amount:'oops'},{amount:5}],'stage','amount',['신규','제안']);
 assert.deepEqual(series,[{label:'신규',value:0,count:2,missing:2},{label:'제안',value:100,count:3,missing:1},{label:'미지정',value:5,count:1,missing:0}]);
 assert.match(chartHTML(sumSeries([{stage:'신규',amount:0}],'stage','amount')),/등록 자료의 집계 값은 0/);
 assert.match(chartHTML(countSeries([],'status',['완료'])),/집계할 자료가 없습니다/);
 assert.match(chartHTML(series),/형식 확인 3건/);
});
test('schedule summaries use Korean calendar dates and separate overdue, unknown and completed',()=>{
 assert.equal(dayKey('2026-10-31T15:30:00Z'),'2026-11-01');
 assert.equal(dayKey('2026-02-30'),'');
 const rows=[{due:'2026-10-30'},{due:'2026-10-31'},{due:'2026-11-07'},{due:'2026-11-08'},{due:'bad'},{due:'2026-10-29',status:'완료'}];
 assert.deepEqual(dueSeries(rows,'due','2026-10-31').map(r=>r.value),[1,1,1,1,1,1]);
 assert.deepEqual(daySeries([{at:'2026-10-31T15:30:00Z'},{at:'2026-10-31'},{at:'bad'}],'at','2026-10-31',2).map(r=>r.value),[1,1]);
 assert.throws(()=>daySeries([],'at','bad'));
 assert.throws(()=>periodSeries([],'a','b','bad'));
 assert.deepEqual(periodSeries([{a:'2026-10-01',b:'2026-10-31'},{a:'2026-10-01',b:'2026-10-30'},{a:'2026-11-01',b:'2026-11-10'},{a:'bad',b:''}],'a','b','2026-10-31').map(r=>r.value),[1,1,1,1]);
});
test('chart calculations only consume supplied scoped rows and never mutate them',()=>{
 const all=[{org:'a',status:'진행중'},{org:'b',status:'완료'}];
 const before=structuredClone(all);
 assert.deepEqual(countSeries(all.filter(r=>r.org==='a'),'status').map(r=>r.label),['진행중']);
 assert.deepEqual(all,before);
});
test('chart renderer escapes persisted input, provides numeric table, rejects invalid styles and retains grouped values',()=>{
 const html=chartCardHTML('<script>bad()</script>',[{label:'<img src=x onerror="x">',value:3}],{note:'<b>bad</b>',kind:'donut'});
 assert(!html.includes('<script>')&&!html.includes('<img')&&!html.includes('<b>bad</b>'));
 assert(html.includes('&lt;img')&&html.includes('scope="row"')&&html.includes('수치표 보기'));
 assert.match(chartHTML([{label:'x',value:NaN}]),/확인해 주세요/);
 assert.match(chartHTML([{label:'x',value:-1}]),/확인해 주세요/);
 const many=Array.from({length:12},(_,i)=>({label:'분류'+i,value:i}));
 const grouped=chartHTML(many);
 assert(grouped.includes('그 외 3항목')&&grouped.includes('분류11'));
 assert.equal((grouped.match(/scope="row"/g)||[]).length,12);
});

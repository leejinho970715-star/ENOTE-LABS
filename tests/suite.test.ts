import test from 'node:test';
import assert from 'node:assert/strict';
import {suiteEmpty,suiteDemoCommand} from '../agencyflow/lib/suite.ts';
import {readOnly,type Org} from '../agencyflow/lib/domain.ts';
test('free entitlement removes expiry without granting access to a missing organization',()=>{
 assert.equal(readOnly(undefined),true);
 assert.equal(readOnly({free_access:true,subscription_status:'trialing',trial_ends_at:'2000-01-01'} as Org),false);
 assert.equal(readOnly({free_access:false,subscription_status:'past_due',trial_ends_at:'2000-01-01'} as Org),true);
});
test('demo links CRM, PMS, team work and report basis without duplicates or invented revenue',()=>{
 let n=0;const id=()=>String(++n);let d=structuredClone(suiteEmpty);
 d.contacts=[{id:'c',org_id:'demo-org',name:'Client'}];d.deals=[{id:'d',contact_id:'c',stage:'수주',title:'Project',amount:8000000}];d.members=[{user_id:'u',role:'member'}];
 d=suiteDemoCommand(d,'connect_company',{company_id:'co'},id);
 d=suiteDemoCommand(d,'project_from_deal',{deal_id:'d',starts_on:'2026-11-01',due_on:'2026-11-20'},id);
 const before=structuredClone(d);
 d=suiteDemoCommand(d,'project_from_deal',{deal_id:'d',starts_on:'2026-11-01',due_on:'2026-11-20'},id);
 assert.deepEqual(d,before);assert.equal(d.projects[0].amount,0);assert.equal(d.clients.length,1);
 d=suiteDemoCommand(d,'customer_to_flownote',{client_id:d.clients[0].id!,csv_client_id:'C01'},id);
 d=suiteDemoCommand(d,'project_to_flownote',{project_id:d.projects[0].id!,campaigns:'A|B'},id);
 d.tasks=[{id:'t',org_id:'demo-org',title:'Task',status:'진행중',priority:'낮음'}];
 d=suiteDemoCommand(d,'task_to_crew',{task_id:'t',assignee_id:'u'},id);
 assert.deepEqual(d.fn_projects[0].campaigns,['A','B']);assert.equal(d.team_tasks[0].project_task_id,'t');assert.equal(d.team_tasks[0].status,'진행중');
 assert.equal(before.fn_projects.length,0);
});
test('handoffs require won opportunity, explicit mapping and internal assignee',()=>{
 const d=structuredClone(suiteEmpty);d.deals=[{id:'d',stage:'제안'}];d.tasks=[{id:'t'}];d.members=[{user_id:'c',role:'client'}];
 assert.throws(()=>suiteDemoCommand(d,'project_from_deal',{deal_id:'d'},()=>''));
 assert.throws(()=>suiteDemoCommand(d,'customer_to_flownote',{client_id:'x',csv_client_id:'C01'},()=>''));
 assert.throws(()=>suiteDemoCommand(d,'task_to_crew',{task_id:'t',assignee_id:'c'},()=>''));
});

-- Explicit, idempotent hand-offs within one organization. No implicit membership grants.
create schema suite_private;
revoke all on schema suite_private from public,anon;
grant usage on schema suite_private to authenticated;
create table public.suite_companies(
 org_id uuid primary key references public.af_orgs,
 company_id uuid not null unique references public.companies,
 created_by uuid not null references auth.users,created_at timestamptz not null default now());
create table public.suite_customers(
 org_id uuid not null references public.af_orgs,
 contact_id uuid not null references public.studio_contacts,
 client_id uuid not null references public.af_clients,
 flownote_client_id uuid references public.clients,
 primary key(org_id,contact_id),unique(client_id),unique(flownote_client_id));
create table public.suite_projects(
 org_id uuid not null references public.af_orgs,
 project_id uuid primary key references public.af_projects,
 deal_id uuid unique references public.studio_deals,
 flownote_project_id uuid unique references public.projects);
alter table public.studio_team_tasks add column project_task_id uuid unique references public.af_tasks;
create index suite_companies_creator_idx on public.suite_companies(created_by);
create index suite_customers_org_idx on public.suite_customers(org_id,client_id);
create index suite_projects_org_idx on public.suite_projects(org_id);
do $$declare t text;begin foreach t in array array['suite_companies','suite_customers','suite_projects'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy suite_staff_read on public.%I for select to authenticated using(af_private.role_for(org_id) in (''admin'',''member''))',t);
end loop;end$$;

create function suite_private.command(action text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();o uuid:=(p->>'org_id')::uuid;c uuid;cid uuid;aid uuid;pid uuid;rid uuid;obj jsonb;
 contact public.studio_contacts; customer public.af_clients;deal public.studio_deals;project public.af_projects;task public.af_tasks;link public.suite_customers;
begin
 if u is null or not exists(select 1 from auth.users where id=u and email_confirmed_at is not null and not coalesce(is_anonymous,false)) then raise exception '이메일을 확인한 계정으로 로그인하세요.';end if;
 perform 1 from public.af_orgs where id=o for update;
 if af_private.role_for(o) not in ('admin','member') or af_private.role_for(o) is null then raise exception '이 회사의 내부 팀 권한이 필요합니다.';end if;
 if not af_private.writable(o) then raise exception '현재 회사는 조회 전용입니다.';end if;
 if action='connect_company' then
  c:=(p->>'company_id')::uuid;
  if af_private.role_for(o)<>'admin' or app_private.company_role(c) is distinct from 'owner' then raise exception '양쪽 회사의 대표 관리자 권한이 필요합니다.';end if;
  if exists(select 1 from public.suite_companies where (org_id=o and company_id<>c) or (company_id=c and org_id<>o)) then raise exception '이미 연결된 회사입니다. 기존 연결을 덮어쓰지 않습니다.';end if;
  insert into public.suite_companies values(o,c,u,now()) on conflict do nothing;obj:=jsonb_build_object('company_id',c);
 elsif action='customer_from_crm' then
  select * into contact from public.studio_contacts where id=(p->>'contact_id')::uuid and org_id=o and not archived;
  if not found then raise exception '이 회사의 활성 CRM 고객을 선택하세요.';end if;
  select client_id into aid from public.suite_customers where org_id=o and contact_id=contact.id;
  if aid is null then
   obj:=af_private.command('save_client',jsonb_build_object('org_id',o,'name',left(contact.name,120),'contact',contact.contact,'email',contact.email,'phone',contact.phone,'memo',left(contact.memo,3000)));
   aid:=(obj->>'id')::uuid;
   insert into public.suite_customers(org_id,contact_id,client_id) values(o,contact.id,aid);
  end if;obj:=jsonb_build_object('client_id',aid);
 elsif action='customer_from_pms' then
  select * into customer from public.af_clients where id=(p->>'client_id')::uuid and org_id=o and not archived;
  if not found then raise exception '이 회사의 활성 프로젝트 고객을 선택하세요.';end if;
  select contact_id into cid from public.suite_customers where org_id=o and client_id=customer.id;
  if cid is null then
   obj:=studio_private.command('save_contact',jsonb_build_object('org_id',o,'name',customer.name,'contact',customer.contact,'email',customer.email,'phone',customer.phone,'memo',customer.memo,'source','ProjectFlow'));
   cid:=(obj->>'id')::uuid;
   insert into public.suite_customers(org_id,contact_id,client_id) values(o,cid,customer.id);
  end if;obj:=jsonb_build_object('contact_id',cid);
 elsif action='customer_to_flownote' then
  select company_id into c from public.suite_companies where org_id=o;
  if c is null or app_private.company_role(c) is null or app_private.company_role(c) not in ('owner','editor') then raise exception '연결된 Flownote 회사의 작성 권한이 필요합니다.';end if;
  select * into link from public.suite_customers where org_id=o and client_id=(p->>'client_id')::uuid;
  if not found then raise exception '먼저 CRM과 프로젝트 고객을 연결하세요.';end if;
  if link.flownote_client_id is null then
   select * into customer from public.af_clients where id=link.client_id and org_id=o and not archived;
   if not found then raise exception '활성 고객이 아닙니다.';end if;
   obj:=app_private.command('create_client',jsonb_build_object('company_id',c,'name',customer.name,'csv_client_id',p->>'csv_client_id'));
   update public.suite_customers set flownote_client_id=(obj->>'id')::uuid where org_id=o and client_id=link.client_id;
  else obj:=jsonb_build_object('id',link.flownote_client_id);end if;
 elsif action='project_from_deal' then
  select * into deal from public.studio_deals where org_id=o and id=(p->>'deal_id')::uuid and not archived and stage='수주';
  if not found then raise exception '수주 상태의 영업기회를 선택하세요.';end if;
  select project_id into pid from public.suite_projects where org_id=o and deal_id=deal.id;
  if pid is null then
   obj:=suite_private.command('customer_from_crm',jsonb_build_object('org_id',o,'contact_id',deal.contact_id));aid:=(obj->>'client_id')::uuid;
   obj:=af_private.command('save_project',jsonb_build_object('org_id',o,'client_id',aid,'name',deal.title,'owner_name',deal.owner_name,'starts_on',p->>'starts_on','due_on',p->>'due_on','stage','견적','amount',0));
   pid:=(obj->>'id')::uuid;insert into public.suite_projects(org_id,project_id,deal_id) values(o,pid,deal.id);
  end if;obj:=jsonb_build_object('project_id',pid);
 elsif action='project_to_flownote' then
  select company_id into c from public.suite_companies where org_id=o;
  if c is null or app_private.company_role(c) is null or app_private.company_role(c) not in ('owner','editor') then raise exception '연결된 Flownote 회사의 작성 권한이 필요합니다.';end if;
  select * into project from public.af_projects where id=(p->>'project_id')::uuid and org_id=o and not archived;
  if not found then raise exception '활성 프로젝트를 선택하세요.';end if;
  select * into link from public.suite_customers where org_id=o and client_id=project.client_id;
  if link.flownote_client_id is null then raise exception '고객을 먼저 Flownote에 연결하세요.';end if;
  select flownote_project_id into pid from public.suite_projects where org_id=o and project_id=project.id;
  if pid is null then
   obj:=app_private.command('create_project',jsonb_build_object('company_id',c,'client_id',link.flownote_client_id,'name',project.name,'campaigns',p->'campaigns','starts_on',project.starts_on,'ends_on',project.due_on));
   pid:=(obj->>'id')::uuid;
   insert into public.suite_projects(org_id,project_id,flownote_project_id) values(o,project.id,pid) on conflict(project_id) do update set flownote_project_id=excluded.flownote_project_id;
  end if;obj:=jsonb_build_object('flownote_project_id',pid);
 elsif action='task_to_crew' then
  select t.* into task from public.af_tasks t join public.af_projects x on x.id=t.project_id and x.org_id=t.org_id where t.org_id=o and t.id=(p->>'task_id')::uuid and not x.archived;
  if not found then raise exception '이 회사의 활성 프로젝트 작업을 선택하세요.';end if;
  select id into rid from public.studio_team_tasks where org_id=o and project_task_id=task.id;
  if rid is null then
   obj:=studio_private.command('team_task',jsonb_build_object('org_id',o,'title',task.title,'assignee_id',p->>'assignee_id','due_on',task.due_on,'priority',case when task.priority='낮음' then '보통' else task.priority end));
   rid:=(obj->>'id')::uuid;update public.studio_team_tasks set project_task_id=task.id,status=task.status where id=rid and org_id=o;
  end if;obj:=jsonb_build_object('crew_task_id',rid);
 else raise exception '지원하지 않는 연결 작업입니다.';end if;
 insert into public.studio_activity(org_id,actor_id,action) values(o,u,'suite_'||action);
 return obj;
end$$;
revoke all on function suite_private.command(text,jsonb) from public,anon;
grant execute on function suite_private.command(text,jsonb) to authenticated;
create function public.suite_command(p_action text,p_payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select suite_private.command(p_action,p_payload)$$;
revoke all on function public.suite_command(text,jsonb) from public,anon;
grant execute on function public.suite_command(text,jsonb) to authenticated;

-- Only linked task status follows changes. Do not overwrite titles, owners or dates.
create function suite_private.task_status() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_table_name='af_tasks' then
  update public.studio_team_tasks set status=new.status where project_task_id=new.id and org_id=new.org_id and status is distinct from new.status;
 else
  update public.af_tasks set status=new.status where id=new.project_task_id and org_id=new.org_id and status is distinct from new.status;
 end if;return new;
end$$;
revoke all on function suite_private.task_status() from public,anon,authenticated;
create trigger suite_pms_task_status after update of status on public.af_tasks for each row when(old.status is distinct from new.status) execute function suite_private.task_status();
create trigger suite_crew_task_status after update of status on public.studio_team_tasks for each row when(old.status is distinct from new.status) execute function suite_private.task_status();

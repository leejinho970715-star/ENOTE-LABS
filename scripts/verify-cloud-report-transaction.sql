-- Synthetic transaction-only fixtures. No real customer records are read or changed.
begin;
do $$
declare writer uuid:=gen_random_uuid();reviewer uuid:=gen_random_uuid();outsider uuid:=gen_random_uuid();company uuid;customer uuid;project uuid;version_id uuid;obj jsonb;payload jsonb;denied boolean;review_email text;
begin
 review_email:='report-check-'||reviewer||'@example.invalid';
 insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values(writer,'report-check-'||writer||'@example.invalid',now(),'{}'),(reviewer,review_email,now(),'{}'),(outsider,'report-check-'||outsider||'@example.invalid',now(),'{}');
 perform set_config('request.jwt.claim.sub',writer::text,true);
 obj:=public.flownote_command('create_company',jsonb_build_object('name','Report transaction verification'));company:=(obj->>'company_id')::uuid;
 perform public.flownote_command('add_member',jsonb_build_object('company_id',company,'email',review_email,'role','reviewer'));
 obj:=public.flownote_command('create_client',jsonb_build_object('company_id',company,'name','Synthetic client','csv_client_id','TEST1'));customer:=(obj->>'id')::uuid;
 obj:=public.flownote_command('create_project',jsonb_build_object('company_id',company,'client_id',customer,'name','Synthetic report project','campaigns',jsonb_build_array('Search'),'starts_on','2026-11-01','ends_on','2026-12-31'));project:=(obj->>'id')::uuid;
 payload:=jsonb_build_object('company_id',company,'project_id',project,'period_start','2026-11-02','period_end','2026-11-08','filename','synthetic.csv','source_row_count',2,'excluded_row_count',1,'excluded_reasons',jsonb_build_array(jsonb_build_object('line',3,'code','PROJECT_SCOPE','message','Not selected')),'rows',jsonb_build_array(jsonb_build_object('source_line',2,'date','2026-11-02','campaign','Search','currency','KRW','impressions',100,'clicks',10,'spend_cents',1234,'leads',1)));
 obj:=public.flownote_command('save_report',payload);version_id:=(obj->>'id')::uuid;
 if (select snapshot->'current'->>'spend_cents' from public.report_versions where id=version_id)<>'1234' then raise exception 'Stored totals do not match rows';end if;
 perform public.flownote_command('transition_report',jsonb_build_object('company_id',company,'version_id',version_id,'transition','submit'));
 denied:=false;begin perform public.flownote_command('transition_report',jsonb_build_object('company_id',company,'version_id',version_id,'transition','approve'));exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'Self approval was permitted';end if;
 perform set_config('request.jwt.claim.sub',outsider::text,true);
 denied:=false;begin perform public.flownote_command('transition_report',jsonb_build_object('company_id',company,'version_id',version_id,'transition','approve'));exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'Foreign company access was permitted';end if;
 perform set_config('request.jwt.claim.sub',reviewer::text,true);
 perform public.flownote_command('transition_report',jsonb_build_object('company_id',company,'version_id',version_id,'transition','approve','note','Verified source totals'));
 if (select status from public.report_versions where id=version_id)<>'APPROVED' then raise exception 'Independent approval failed';end if;
 perform set_config('request.jwt.claim.sub',writer::text,true);
 perform public.flownote_command('transition_report',jsonb_build_object('company_id',company,'version_id',version_id,'transition','mark_delivered','note','Manual handoff record; no mail sent'));
 if (select count(*) from public.report_events where report_version_id=version_id)<>3 then raise exception 'Review event trail is incomplete';end if;
 payload:=jsonb_set(payload,'{rows,0,spend_cents}','1500');
 obj:=public.flownote_command('save_report',payload);
 if (select version from public.report_versions where id=(obj->>'id')::uuid)<>2 then raise exception 'Next report version was not created';end if;
 if (select status from public.report_versions where id=(obj->>'id')::uuid)<>'DRAFT' then raise exception 'New version inherited old approval';end if;
 if (select snapshot->'current'->>'spend_cents' from public.report_versions where id=version_id)<>'1234' then raise exception 'Old snapshot changed';end if;
 perform set_config('test.report_company',company::text,true);
 perform set_config('request.jwt.claim.sub',outsider::text,true);
end$$;
set local role authenticated;
do $$begin
 if exists(select 1 from public.report_versions where company_id=current_setting('test.report_company')::uuid) then raise exception 'RLS exposed foreign reports';end if;
end$$;
reset role;
select 'PASS: server totals, independent approval, company isolation, manual delivery trail, immutable prior version, v2 draft and RLS' as verification;
rollback;

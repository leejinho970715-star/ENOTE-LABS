-- Synthetic users, private configuration changes and sessions all roll back.
begin;
do $$
declare owner_id uuid:=gen_random_uuid(); admin_id uuid:=gen_random_uuid(); outsider_id uuid:=gen_random_uuid();
 owner_session uuid:=gen_random_uuid(); admin_session uuid:=gen_random_uuid(); outsider_session uuid:=gen_random_uuid();
 test_email text; result jsonb;
begin
 test_email:='admin-check-'||owner_id||'@example.invalid';
 insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
  (owner_id,test_email,now(),'{}'),
  (admin_id,'admin-check-'||admin_id||'@example.invalid',now(),'{}'),
  (outsider_id,'admin-check-'||outsider_id||'@example.invalid',now(),'{"role":"owner","is_admin":true}');
 insert into auth.sessions(id,user_id,created_at) values(owner_session,owner_id,now()),(admin_session,admin_id,now()),(outsider_session,outsider_id,now());
 update enote_private.admin_config set owner_email=test_email,owner_user_id=null,password_hash=extensions.crypt('TEST-ONLY-admin-2026',extensions.gen_salt('bf',12));
 perform set_config('request.jwt.claim.sub',outsider_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',outsider_id,'session_id',outsider_session,'role','authenticated')::text,true);
 result:=public.enote_admin('unlock','TEST-ONLY-admin-2026');
 if result->>'error'<>'not_granted' then raise exception 'Correct password or metadata gave outsider access';end if;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'session_id',owner_session,'role','authenticated')::text,true);
 for i in 1..5 loop result:=public.enote_admin('unlock','wrong');end loop;
 if (select failures from enote_private.admin_attempts where user_id=owner_id)<>5 then raise exception 'Failures were not recorded';end if;
 result:=public.enote_admin('unlock','TEST-ONLY-admin-2026');
 if result->>'error'<>'temporarily_locked' then raise exception 'Rate limit not enforced';end if;
 update enote_private.admin_attempts set locked_until=now()-interval '1 minute',window_start=now()-interval '16 minutes' where user_id=owner_id;
 result:=public.enote_admin('unlock','TEST-ONLY-admin-2026');
 if result->>'role'<>'owner' or (select owner_user_id from enote_private.admin_config where id=true)<>owner_id then raise exception 'Owner binding failed';end if;
 result:=public.enote_admin('grant','TEST-ONLY-admin-2026',jsonb_build_object('email','admin-check-'||admin_id||'@example.invalid'));
 if result->>'ok'<>'true' then raise exception 'Owner grant failed: %',result;end if;
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'session_id',admin_session,'role','authenticated')::text,true);
 result:=public.enote_admin('unlock','TEST-ONLY-admin-2026');
 if result->>'role'<>'admin' then raise exception 'Granted admin rejected';end if;
 result:=public.enote_admin('grant','TEST-ONLY-admin-2026',jsonb_build_object('email',test_email));
 if result->>'error'<>'owner_only' then raise exception 'Admin could grant roles';end if;
 update auth.users set email_confirmed_at=null where id=admin_id;
 result:=public.enote_admin('status');
 if result->>'error'<>'verified_login_required' then raise exception 'Unconfirmed user permitted';end if;
 update auth.users set email_confirmed_at=now() where id=admin_id;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'session_id',owner_session,'role','authenticated')::text,true);
 result:=public.enote_admin('revoke','TEST-ONLY-admin-2026',jsonb_build_object('email','admin-check-'||admin_id||'@example.invalid'));
 if result->>'ok'<>'true' then raise exception 'Revoke failed';end if;
 if (select count(*) from enote_private.admin_audit where actor_id=owner_id)<>2 then raise exception 'Grant audit missing';end if;
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'session_id',admin_session,'role','authenticated')::text,true);
 result:=public.enote_admin('unlock','TEST-ONLY-admin-2026');
 if result->>'error'<>'not_granted' then raise exception 'Revoked user retained access';end if;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'session_id',gen_random_uuid(),'role','authenticated')::text,true);
 result:=public.enote_admin('unlock','TEST-ONLY-admin-2026');
 if result->>'error'<>'session_expired' then raise exception 'Fake session accepted';end if;
 if has_function_privilege('anon','public.enote_admin(text,text,jsonb)','EXECUTE') then raise exception 'Anonymous RPC grant';end if;
 if has_table_privilege('authenticated','enote_private.admin_config','SELECT') then raise exception 'Configuration exposed';end if;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'session_id',owner_session,'role','authenticated')::text,true);
end$$;
set local role authenticated;
do $$begin
 if public.enote_admin('status')->>'role'<>'owner' then raise exception 'Invoker wrapper failed as authenticated';end if;
end$$;
reset role;
select 'PASS: role grants, verification, session binding, rate limit, revocation, private access and invoker wrapper' as result;
rollback;

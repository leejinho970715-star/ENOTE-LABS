begin;
do $$
declare owner_id uuid:=gen_random_uuid(); owner_session uuid:=gen_random_uuid(); n text:='owner_test_'||substr(replace(gen_random_uuid()::text,'-',''),1,8); result jsonb; blocked boolean:=false;
begin
 if has_function_privilege('anon','public.enote_username_registration(text,text,text,text,uuid)','EXECUTE')
  or has_function_privilege('authenticated','public.enote_username_registration(text,text,text,text,uuid)','EXECUTE') then raise exception 'Enrollment service RPC exposed';end if;
 if has_table_privilege('authenticated','enote_private.login_accounts','SELECT') then raise exception 'Private login registry exposed';end if;
 begin
  insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values(gen_random_uuid(),'fakeuser@id.enote-labs.invalid',now(),'{"enote_login":"username","username":"fakeuser"}');
  set constraints all immediate;
 exception when others then if sqlerrm not like 'Internal username identities%' then raise;end if;blocked:=true;
 end;
 set constraints all deferred;
 if not blocked then raise exception 'User editable metadata bypassed alias protection';end if;
 update enote_private.admin_config set owner_username=n,owner_user_id=null,password_hash=extensions.crypt('test-only-owner-password',extensions.gen_salt('bf',12)) where id=true;
 delete from enote_private.registration_limits where key='owner';
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 result:=public.enote_username_registration('guard',n,repeat('a',64),'wrong');
 if result->>'error'<>'owner_password_required' then raise exception 'Owner reservation bypass';end if;
 result:=public.enote_username_registration('guard',n,repeat('a',64),'test-only-owner-password');
 if result->>'ok'<>'true' then raise exception 'Owner registration guard failed';end if;
 insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data) values(owner_id,n||'@id.enote-labs.invalid',now(),jsonb_build_object('enote_login','username','username',n));
 result:=public.enote_username_registration('finish',n,null,'test-only-owner-password',owner_id);
 if result->>'ok'<>'true' then raise exception 'Owner binding failed';end if;
 insert into auth.sessions(id,user_id,created_at) values(owner_session,owner_id,now());
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated','session_id',owner_session)::text,true);
 if public.enote_admin('status')->>'role'<>'owner' then raise exception 'Username owner role failed';end if;
 if public.enote_admin('unlock','test-only-owner-password')->>'unlocked'<>'true' then raise exception 'Owner unlock failed';end if;
 perform set_config('request.jwt.claims','{"role":"service_role"}',true);
 for i in 1..9 loop result:=public.enote_username_registration('guard','rate_test',repeat('b',64));end loop;
 if result->>'error'<>'rate_limited' then raise exception 'Registration rate limit failed';end if;
 set constraints all immediate;
end$$;
select 'PASS: private service RPC, alias protection, owner bootstrap, UUID authority and registration throttling' as result;
rollback;

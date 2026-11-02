-- Platform administrator shortcuts do not grant access to any company data.
-- Configure password_hash separately with a locally generated bcrypt hash.
create schema enote_private;
revoke all on schema enote_private from public, anon, authenticated;
grant usage on schema enote_private to authenticated;
create table enote_private.admin_config (
 id boolean primary key default true check(id),
 owner_email text not null,
 owner_user_id uuid,
 password_hash text check(password_hash is null or password_hash ~ '^\$2[aby]\$12\$')
);
insert into enote_private.admin_config(id,owner_email) values(true,'leejinho970715@gmail.com');
create table enote_private.admin_grants (
 user_id uuid primary key references auth.users(id) on delete cascade,
 active boolean not null default true,
 granted_by uuid not null,
 updated_at timestamptz not null default now()
);
create table enote_private.admin_attempts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 failures integer not null default 0,
 window_start timestamptz not null default now(),
 locked_until timestamptz
);
create table enote_private.admin_audit (
 id bigint generated always as identity primary key,
 actor_id uuid not null,
 target_id uuid not null,
 action text not null check(action in ('grant','revoke')),
 created_at timestamptz not null default now()
);
alter table enote_private.admin_config enable row level security;
alter table enote_private.admin_grants enable row level security;
alter table enote_private.admin_attempts enable row level security;
alter table enote_private.admin_audit enable row level security;
revoke all on all tables in schema enote_private from public, anon, authenticated;
revoke all on all sequences in schema enote_private from public, anon, authenticated;

create function enote_private.admin_command(p_action text,p_password text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 v_uid uuid := auth.uid(); v_user auth.users%rowtype;
 v_config enote_private.admin_config%rowtype;
 v_attempt enote_private.admin_attempts%rowtype;
 v_role text := 'none'; v_target uuid; v_rows jsonb;
begin
 if v_uid is null then return jsonb_build_object('error','login_required'); end if;
 select * into v_user from auth.users where id=v_uid;
 if not found or v_user.email_confirmed_at is null or v_user.deleted_at is not null
    or v_user.banned_until > now() then return jsonb_build_object('error','verified_login_required'); end if;
 if not exists(select 1 from auth.sessions s where s.user_id=v_uid and s.id::text=auth.jwt()->>'session_id'
               and (s.not_after is null or s.not_after>now())) then
   return jsonb_build_object('error','session_expired');
 end if;
 -- Serializes first-owner binding and grants; no user-editable metadata is trusted.
 select * into v_config from enote_private.admin_config where id=true for update;
 if (v_config.owner_user_id=v_uid and lower(v_user.email)=lower(v_config.owner_email))
    or (v_config.owner_user_id is null and lower(v_user.email)=lower(v_config.owner_email)) then v_role:='owner';
 elsif exists(select 1 from enote_private.admin_grants where user_id=v_uid and active) then v_role:='admin'; end if;
 if p_action='status' then return jsonb_build_object('role',v_role,'configured',v_config.password_hash is not null); end if;
 if v_role='none' then return jsonb_build_object('error','not_granted'); end if;
 if v_config.password_hash is null then return jsonb_build_object('error','not_configured'); end if;
 insert into enote_private.admin_attempts(user_id) values(v_uid) on conflict do nothing;
 select * into v_attempt from enote_private.admin_attempts where user_id=v_uid for update;
 if v_attempt.locked_until>now() then return jsonb_build_object('error','temporarily_locked'); end if;
 if v_attempt.window_start<now()-interval '15 minutes' then
  update enote_private.admin_attempts set failures=0,window_start=now(),locked_until=null where user_id=v_uid;
  v_attempt.failures:=0;
 end if;
 if p_password is null or octet_length(p_password)>72 or extensions.crypt(p_password,v_config.password_hash)<>v_config.password_hash then
  update enote_private.admin_attempts set failures=v_attempt.failures+1,
   locked_until=case when v_attempt.failures+1>=5 then now()+interval '15 minutes' else null end where user_id=v_uid;
  -- Return an error object so failed-attempt writes commit rather than rolling back.
  return jsonb_build_object('error','invalid_admin_password');
 end if;
 update enote_private.admin_attempts set failures=0,window_start=now(),locked_until=null where user_id=v_uid;
 if p_action='unlock' then
  if v_role='owner' and v_config.owner_user_id is null then
    update enote_private.admin_config set owner_user_id=v_uid where id=true;
  end if;
  return jsonb_build_object('role',v_role,'unlocked',true);
 end if;
 if v_role<>'owner' then return jsonb_build_object('error','owner_only'); end if;
 if p_action='list' then
  select coalesce(jsonb_agg(jsonb_build_object('user_id',g.user_id,'email',u.email,'active',g.active,'updated_at',g.updated_at) order by g.updated_at desc),'[]'::jsonb)
   into v_rows from enote_private.admin_grants g join auth.users u on u.id=g.user_id;
  return jsonb_build_object('admins',v_rows);
 end if;
 if p_action not in ('grant','revoke') then return jsonb_build_object('error','unknown_action'); end if;
 select id into v_target from auth.users where lower(email)=lower(trim(p_payload->>'email'))
  and email_confirmed_at is not null and deleted_at is null and (banned_until is null or banned_until<=now());
 if v_target is null then return jsonb_build_object('error','confirmed_account_required'); end if;
 if v_target=v_uid or v_target=v_config.owner_user_id or lower(trim(p_payload->>'email'))=lower(v_config.owner_email) then
  return jsonb_build_object('error','owner_cannot_change');
 end if;
 insert into enote_private.admin_grants(user_id,active,granted_by) values(v_target,p_action='grant',v_uid)
  on conflict(user_id) do update set active=excluded.active,granted_by=excluded.granted_by,updated_at=now();
 insert into enote_private.admin_audit(actor_id,target_id,action) values(v_uid,v_target,p_action);
 return jsonb_build_object('ok',true);
end $$;
revoke all on function enote_private.admin_command(text,text,jsonb) from public,anon,authenticated;
grant execute on function enote_private.admin_command(text,text,jsonb) to authenticated;
create function public.enote_admin(p_action text,p_password text default null,p_payload jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path = '' as $$
 select enote_private.admin_command(p_action,p_password,p_payload);
$$;
revoke all on function public.enote_admin(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.enote_admin(text,text,jsonb) to authenticated;

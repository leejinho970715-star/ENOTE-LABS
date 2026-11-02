-- Email-free identities use server-created internal aliases; real email confirmation stays enabled.
alter table enote_private.admin_config add column owner_username text not null default 'dudrhkddmlcn';
-- Public native signUp cannot reserve internal aliases by editing user_metadata.
create function enote_private.protect_username_alias() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if lower(coalesce(new.email,'')) like '%@id.enote-labs.invalid' and
   (coalesce(new.raw_app_meta_data->>'enote_login','')<>'username' or
    coalesce(new.raw_app_meta_data->>'username','') !~ '^[a-z][a-z0-9_]{3,23}$' or
    new.email<>coalesce(new.raw_app_meta_data->>'username','')||'@id.enote-labs.invalid') then
   raise exception 'Internal username identities must be created by the registration service';
 end if;
 return new;
end$$;
revoke all on function enote_private.protect_username_alias() from public,anon,authenticated;
grant execute on function enote_private.protect_username_alias() to supabase_auth_admin;
create trigger enote_protect_username_alias before insert or update of email,raw_app_meta_data on auth.users
for each row execute function enote_private.protect_username_alias();
create table enote_private.login_accounts (
 username text primary key check(username ~ '^[a-z][a-z0-9_]{3,23}$'),
 user_id uuid not null unique references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table enote_private.registration_limits (
 key text not null, window_start timestamptz not null, count integer not null default 1,
 primary key(key,window_start)
);
alter table enote_private.login_accounts enable row level security;
alter table enote_private.registration_limits enable row level security;
revoke all on enote_private.login_accounts,enote_private.registration_limits from public,anon,authenticated;
grant usage on schema enote_private to service_role;
create function enote_private.username_registration(p_action text,p_username text,p_ip_hash text,p_owner_password text,p_user_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_config enote_private.admin_config%rowtype; v_count integer; v_key text; v_user auth.users%rowtype;
 v_window timestamptz:=date_bin(interval '15 minutes',now(),timestamptz '2026-01-01 00:00:00+00');
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then return jsonb_build_object('error','service_only');end if;
 if p_username is null or p_username !~ '^[a-z][a-z0-9_]{3,23}$' then return jsonb_build_object('error','invalid_username');end if;
 select * into v_config from enote_private.admin_config where id=true for update;
 if p_action='guard' then
  if p_ip_hash is null or p_ip_hash !~ '^[a-f0-9]{64}$' then return jsonb_build_object('error','invalid_request');end if;
  delete from enote_private.registration_limits where window_start<now()-interval '1 day';
  foreach v_key in array array['ip:'||p_ip_hash,'global'] loop
   insert into enote_private.registration_limits(key,window_start) values(v_key,v_window)
    on conflict(key,window_start) do update set count=registration_limits.count+1 returning count into v_count;
   if v_count>(case when v_key='global' then 100 else 8 end) then return jsonb_build_object('error','rate_limited');end if;
  end loop;
  if p_username=v_config.owner_username then
   insert into enote_private.registration_limits(key,window_start) values('owner',v_window)
    on conflict(key,window_start) do update set count=registration_limits.count+1 returning count into v_count;
   if v_count>5 then return jsonb_build_object('error','rate_limited');end if;
   if v_config.owner_user_id is not null then return jsonb_build_object('error','username_unavailable');end if;
   if p_owner_password is null or octet_length(p_owner_password)>72 or v_config.password_hash is null
     or extensions.crypt(p_owner_password,v_config.password_hash)<>v_config.password_hash then
    return jsonb_build_object('error','owner_password_required');
   end if;
  elsif p_username in ('admin','administrator','owner','enote','enote_labs','root') then return jsonb_build_object('error','username_unavailable');end if;
  if exists(select 1 from auth.users where email=p_username||'@id.enote-labs.invalid') then return jsonb_build_object('error','username_unavailable');end if;
  return jsonb_build_object('ok',true);
 elsif p_action='finish' then
  select * into v_user from auth.users where id=p_user_id and email=p_username||'@id.enote-labs.invalid'
   and email_confirmed_at is not null and deleted_at is null
   and raw_app_meta_data->>'enote_login'='username' and raw_app_meta_data->>'username'=p_username;
  if not found then return jsonb_build_object('error','invalid_identity');end if;
  if p_username=v_config.owner_username then
   if v_config.owner_user_id is not null and v_config.owner_user_id<>p_user_id then return jsonb_build_object('error','username_unavailable');end if;
   if p_owner_password is null or octet_length(p_owner_password)>72 or v_config.password_hash is null
     or extensions.crypt(p_owner_password,v_config.password_hash)<>v_config.password_hash then return jsonb_build_object('error','owner_password_required');end if;
   update enote_private.admin_config set owner_user_id=p_user_id where id=true;
  end if;
  insert into enote_private.login_accounts(username,user_id) values(p_username,p_user_id);
  return jsonb_build_object('ok',true);
 end if;
 return jsonb_build_object('error','unknown_action');
end $$;
revoke all on function enote_private.username_registration(text,text,text,text,uuid) from public,anon,authenticated;
grant execute on function enote_private.username_registration(text,text,text,text,uuid) to service_role;
create function public.enote_username_registration(p_action text,p_username text,p_ip_hash text default null,p_owner_password text default null,p_user_id uuid default null)
returns jsonb language sql security invoker set search_path='' as $$
 select enote_private.username_registration(p_action,p_username,p_ip_hash,p_owner_password,p_user_id);
$$;
revoke all on function public.enote_username_registration(text,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.enote_username_registration(text,text,text,text,uuid) to service_role;

-- Bind owner authority to its server-verified UUID after bootstrap, not to a user-editable address.
do $$declare definition text;begin
 select pg_get_functiondef('enote_private.admin_command(text,text,jsonb)'::regprocedure) into definition;
 definition:=replace(definition,'(v_config.owner_user_id=v_uid and lower(v_user.email)=lower(v_config.owner_email))','(v_config.owner_user_id=v_uid)');
 execute definition;
end$$;

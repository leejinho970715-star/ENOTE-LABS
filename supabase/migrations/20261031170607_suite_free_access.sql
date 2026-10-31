-- Free access is a product entitlement, not an authorization bypass.
-- Membership, project access, file validation and all resource caps remain enforced.
alter table public.af_orgs add column free_access boolean not null default true;
comment on column public.af_orgs.free_access is 'Implemented features are free without trial expiry; operational quotas and roles still apply.';
create or replace function af_private.writable(o uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.af_orgs where id=o
   and af_private.role_for(o) is not null
   and (free_access or subscription_status='active'
     or (subscription_status='trialing' and trial_ends_at>now())))
$$;
revoke all on function af_private.writable(uuid) from public,anon;
grant execute on function af_private.writable(uuid) to authenticated;

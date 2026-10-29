-- StockBit Pro — invite preview reports a full team
--
-- preview_staff_invite() is the pre-signup check: it used to bless codes for
-- businesses that had already hit their plan's staff limit, so the joiner only
-- discovered the problem AFTER creating an account (accept_staff_invite
-- rejects them). Now a full team fails fast with a clear reason.

create or replace function public.preview_staff_invite(p_code text)
returns table (valid boolean, company_name text, reason text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_inv public.staff_invites;
  v_company text;
  v_staff int;
  v_limit int;
begin
  select * into v_inv from public.staff_invites where code = upper(trim(p_code));
  if not found then
    return query select false, null::text, 'Invite code not found.'::text; return;
  end if;
  select p.company_name into v_company from public.profiles p where p.id = v_inv.owner_id;
  if v_inv.status = 'revoked' then
    return query select false, v_company, 'This invite was revoked by the business owner.'::text; return;
  end if;
  if v_inv.status = 'accepted' then
    return query select false, v_company, 'This invite has already been used.'::text; return;
  end if;
  if v_inv.expires_at < now() then
    return query select false, v_company, 'This invite has expired. Ask the owner for a new one.'::text; return;
  end if;
  select count(*) into v_staff from public.profiles where parent_id = v_inv.owner_id and role = 'staff';
  v_limit := public.staff_limit_for(v_inv.owner_id);
  if v_staff >= v_limit then
    return query select false, v_company, 'This business has reached its team limit. Ask the owner to upgrade.'::text; return;
  end if;
  return query select true, v_company, null::text;
end;
$$;

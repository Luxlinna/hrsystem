-- The dashboard and payroll pages now query payroll_records for the
-- current calendar month dynamically (previously hardcoded to '2026-05').
-- Backfill payroll for the current month so those views aren't empty.

do $$
declare
  emp record;
  base numeric;
  bonus numeric;
  ded numeric;
  this_month text := to_char(current_date, 'YYYY-MM');
begin
  if exists (select 1 from payroll_records where month = this_month) then
    return;
  end if;

  for emp in select id, role from employees where status in ('active','on_leave') loop
    base := case
      when emp.role ilike '%CEO%' or emp.role ilike '%CFO%' or emp.role ilike '%COO%' or emp.role ilike '%CTO%' then 3500
      when emp.role ilike '%Manager%' then 1800
      else 900
    end + floor(random()*300);
    bonus := round((base * (random()*0.15))::numeric, 2);
    ded := round((base * 0.08)::numeric, 2);
    insert into payroll_records (employee_id, month, base_salary, bonus, deductions, gross_pay, net_pay, status)
    values (emp.id, this_month, base, bonus, ded, base + bonus, base + bonus - ded, 'processed');
  end loop;
end $$;

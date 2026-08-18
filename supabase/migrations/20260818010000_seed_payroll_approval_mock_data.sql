-- Mock data for Payroll and Pay Approval screens.
-- Safe to run more than once: the current-period run is created only once.

do $$
declare
  this_period text := to_char(current_date, 'YYYY-MM');
  run_id uuid;
begin
  -- The current-month payroll records are populated by the current-month seed.
  -- Create a reviewable run from those records when one does not exist yet.
  select id into run_id
  from payroll_runs
  where period = this_period and department = 'All Departments'
  limit 1;

  if run_id is null and exists (select 1 from payroll_records where month = this_period) then
    insert into payroll_runs (
      period, department, total_base, total_bonus, total_deductions,
      total_net, employee_count, status, submitted_by, submitted_at, notes
    )
    select
      this_period,
      'All Departments',
      coalesce(sum(base_salary), 0),
      coalesce(sum(bonus), 0),
      coalesce(sum(deductions), 0),
      coalesce(sum(net_pay), 0),
      count(*),
      'pending_approval',
      'HR Manager',
      now() - interval '2 hours',
      'Monthly payroll submitted for finance review.'
    from payroll_records
    where month = this_period
    returning id into run_id;

    insert into payroll_approvals (
      run_id, approver_name, approver_role, status, notes
    ) values (
      run_id, 'Chenda Sok', 'CFO', 'pending', null
    );
  end if;
end $$;

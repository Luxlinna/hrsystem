-- Backfill phone numbers for the 9 demo-account employee records added in
-- 20260729070000_link_demo_accounts_to_employees.sql, so the Profile page's
-- Phone Number field shows a real value instead of an empty placeholder.

update employees set phone = case email
  when 'admin@hrnexus.com' then '+855 12 345 001'
  when 'chairman@hrnexus.com' then '+855 12 345 002'
  when 'ceo@hrnexus.com' then '+855 12 345 003'
  when 'adminmanager@hrnexus.com' then '+855 12 345 004'
  when 'deptmanager@hrnexus.com' then '+855 12 345 005'
  when 'manager@hrnexus.com' then '+855 12 345 006'
  when 'hrstaff@hrnexus.com' then '+855 12 345 007'
  when 'employee@hrnexus.com' then '+855 12 345 008'
  when 'staff@hrnexus.com' then '+855 12 345 009'
end
where email in (
  'admin@hrnexus.com','chairman@hrnexus.com','ceo@hrnexus.com','adminmanager@hrnexus.com',
  'deptmanager@hrnexus.com','manager@hrnexus.com','hrstaff@hrnexus.com','employee@hrnexus.com','staff@hrnexus.com'
);

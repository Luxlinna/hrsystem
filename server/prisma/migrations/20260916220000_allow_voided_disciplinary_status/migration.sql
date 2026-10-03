-- Allow 'voided' and 'void' status in disciplinary_records
alter table disciplinary_records drop constraint if exists disciplinary_records_status_check;
alter table disciplinary_records add constraint disciplinary_records_status_check 
  check (status in ('open','in_progress','resolved','escalated','closed','voided','void'));

-- Update default and existing hiring request company to UNI
alter table hiring_requests alter column company set default 'UNI';
update hiring_requests set company = 'UNI' where company is null or company = 'HRM_OPS' or company = 'HRM_OPS Group';

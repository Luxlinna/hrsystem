-- Migration: Add register_nssf to employees table
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS register_nssf BOOLEAN DEFAULT FALSE;

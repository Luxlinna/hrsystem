-- =========================================================================
-- Performance Indexes for Attendance & Employee Directory
-- =========================================================================

-- 1. ATTENDANCE RECORDS INDEXES
-- Optimizes: Filtering attendance by employee IDs (team / individual), ordered by date descending
CREATE INDEX IF NOT EXISTS idx_attendance_records_employee_date_active
  ON attendance_records (employee_id, date DESC)
  WHERE deleted_at IS NULL;

-- Optimizes: Range queries on dates (e.g. today, weekly, monthly logs)
CREATE INDEX IF NOT EXISTS idx_attendance_records_date_active
  ON attendance_records (date DESC)
  WHERE deleted_at IS NULL;

-- Optimizes: Branch-scoped attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_records_branch_date_active
  ON attendance_records (clock_in_branch_id, date DESC)
  WHERE deleted_at IS NULL;

-- Optimizes: Work site / location attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_records_work_location_active
  ON attendance_records (work_location_id, date DESC)
  WHERE deleted_at IS NULL;

-- Optimizes: Attendance status queries (late, ontime, absent, half_day)
CREATE INDEX IF NOT EXISTS idx_attendance_records_status_date_active
  ON attendance_records (status, date DESC)
  WHERE deleted_at IS NULL;


-- 2. EMPLOYEES (EMPLOYEE DIRECTORY) INDEXES
-- Optimizes: Branch employee listings sorted by first name
CREATE INDEX IF NOT EXISTS idx_employees_branch_active_name
  ON employees (branch_id, first_name, last_name)
  WHERE deleted_at IS NULL;

-- Optimizes: Overall employee alphabetical sorting
CREATE INDEX IF NOT EXISTS idx_employees_active_first_name
  ON employees (first_name, last_name)
  WHERE deleted_at IS NULL;

-- Optimizes: Biometric Device ID lookups
CREATE INDEX IF NOT EXISTS idx_employees_biometric_user_id
  ON employees (biometric_user_id)
  WHERE deleted_at IS NULL AND biometric_user_id IS NOT NULL;

-- Optimizes: Employee Code lookups
CREATE INDEX IF NOT EXISTS idx_employees_employee_code
  ON employees (employee_code)
  WHERE deleted_at IS NULL AND employee_code IS NOT NULL;

-- Optimizes: Line manager / Reports To hierarchy lookups
CREATE INDEX IF NOT EXISTS idx_employees_reports_to_active
  ON employees (reports_to)
  WHERE deleted_at IS NULL;

-- Optimizes: Department filtering
CREATE INDEX IF NOT EXISTS idx_employees_department_active
  ON employees (department)
  WHERE deleted_at IS NULL;

-- Optimizes: Division filtering
CREATE INDEX IF NOT EXISTS idx_employees_division_active
  ON employees (division)
  WHERE deleted_at IS NULL;

-- Optimizes: Status filtering (active, inactive, exited, suspended, onboarding)
CREATE INDEX IF NOT EXISTS idx_employees_status_active
  ON employees (status)
  WHERE deleted_at IS NULL;

-- Optimizes: Default work location / site lookups
CREATE INDEX IF NOT EXISTS idx_employees_default_work_location_active
  ON employees (default_work_location_id)
  WHERE deleted_at IS NULL;


-- 3. EMPLOYEE EXITS INDEXES
-- Optimizes: Team exit exclusion queries in Attendance & Employee Directory
CREATE INDEX IF NOT EXISTS idx_employee_exits_employee_status
  ON employee_exits (employee_id, status);


-- 4. BIOMETRIC DEVICES & RAW LOGS INDEXES
-- Optimizes: Fetching biometric devices by branch
CREATE INDEX IF NOT EXISTS idx_biometric_devices_branch_id
  ON biometric_devices (branch_id);

-- Optimizes: Fetching raw device logs by biometric ID and punch timestamp
CREATE INDEX IF NOT EXISTS idx_biometric_raw_logs_user_punch
  ON biometric_raw_logs (biometric_user_id, punch_time DESC);

CREATE INDEX IF NOT EXISTS idx_biometric_raw_logs_device_punch
  ON biometric_raw_logs (device_id, punch_time DESC);

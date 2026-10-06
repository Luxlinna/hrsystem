-- =========================================================================
-- Ideal Database Cache Table & Supporting Performance Indexes
-- =========================================================================

-- 1. DEDICATED DATABASE CACHE TABLE (app_cache)
-- Provides persistent key-value / JSON caching with TTL and tag invalidation
CREATE TABLE IF NOT EXISTS app_cache (
  key VARCHAR(255) PRIMARY KEY,
  tag VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  ttl_seconds INT NOT NULL DEFAULT 300,
  expires_at TIMESTAMPTZ(6) NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- Fast lookup for cache expiry sweeps and active validation
CREATE INDEX IF NOT EXISTS idx_app_cache_expires_at
  ON app_cache (expires_at);

-- Fast tag-based cache invalidation (e.g. invalidate all 'attendance' or 'employees' cache)
CREATE INDEX IF NOT EXISTS idx_app_cache_tag_expires
  ON app_cache (tag, expires_at);


-- 2. LEAVE REQUESTS SUPPORTING INDEXES
-- Optimizes: Attendance status computation and leave directory queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_dates
  ON leave_requests (employee_id, start_date, end_date)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_leave_requests_status_dates
  ON leave_requests (status, start_date DESC)
  WHERE deleted_at IS NULL;


-- 3. SHIFT ASSIGNMENTS SUPPORTING INDEXES
-- Optimizes: Fast lookup of employee roster / shifts during clock-in
CREATE INDEX IF NOT EXISTS idx_shift_assignments_employee_status
  ON shift_assignments (employee_id, status)
  WHERE deleted_at IS NULL;


-- 4. HOLIDAYS SUPPORTING INDEXES
-- Optimizes: Attendance day-type verification against branch holidays
CREATE INDEX IF NOT EXISTS idx_holidays_date_branch
  ON holidays (date, branch_id)
  WHERE deleted_at IS NULL;

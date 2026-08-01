-- Self-Service's "Enroll in Plan" inserted status='active', while the
-- Benefits Administration page (and its stats: Total Enrolled, per-plan
-- enrolled counts, enrollment % bars) filters on status='enrolled'. Every
-- self-enrollment was silently invisible to those counts. Normalize
-- existing rows and the app code now writes 'enrolled' consistently.

update benefit_enrollments set status = 'enrolled' where status = 'active';

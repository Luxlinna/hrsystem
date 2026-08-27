SELECT count(*) as task_count FROM tasks WHERE assigned_to IN ('bbdc857d-3d9b-4f8d-9baa-da1a995d506d', '55d667aa-7944-4007-880f-93f10da7cd69') AND deleted_at IS NULL;

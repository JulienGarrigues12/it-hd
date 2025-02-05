/*
  # Add Statistics Functions

  1. New Functions
    - get_ticket_stats: Returns ticket statistics by status, priority, and type
    - get_response_times: Calculates average response and resolution times
    - get_technician_stats: Returns statistics about technician performance
    - get_computer_stats: Returns computer inventory statistics

  2. Security
    - Functions are accessible to authenticated users with appropriate roles
*/

-- Create function to get ticket statistics
CREATE OR REPLACE FUNCTION get_ticket_stats(
  start_date timestamptz DEFAULT (NOW() - INTERVAL '30 days'),
  end_date timestamptz DEFAULT NOW()
)
RETURNS TABLE (
  status text,
  priority text,
  type text,
  count bigint
) SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.status::text,
    t.priority::text,
    t.type::text,
    COUNT(*)::bigint
  FROM tickets t
  WHERE t.created_at BETWEEN start_date AND end_date
  GROUP BY t.status, t.priority, t.type;
END;
$$;

-- Create function to get response times
CREATE OR REPLACE FUNCTION get_response_times(
  start_date timestamptz DEFAULT (NOW() - INTERVAL '30 days'),
  end_date timestamptz DEFAULT NOW()
)
RETURNS TABLE (
  avg_first_response interval,
  avg_resolution_time interval,
  tickets_resolved bigint
) SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    AVG(first_response_time)::interval as avg_first_response,
    AVG(resolution_time)::interval as avg_resolution_time,
    COUNT(*)::bigint as tickets_resolved
  FROM (
    SELECT
      t.id,
      (
        SELECT MIN(c.created_at) - t.created_at
        FROM ticket_comments c
        WHERE c.ticket_id = t.id
        AND c.user_id IN (
          SELECT id FROM users WHERE role IN ('technician', 'admin')
        )
      ) as first_response_time,
      CASE
        WHEN t.status = 'resolved' THEN
          t.updated_at - t.created_at
        ELSE NULL
      END as resolution_time
    FROM tickets t
    WHERE t.created_at BETWEEN start_date AND end_date
  ) stats;
END;
$$;

-- Create function to get technician statistics
CREATE OR REPLACE FUNCTION get_technician_stats(
  start_date timestamptz DEFAULT (NOW() - INTERVAL '30 days'),
  end_date timestamptz DEFAULT NOW()
)
RETURNS TABLE (
  technician_id uuid,
  technician_name text,
  tickets_assigned bigint,
  tickets_resolved bigint,
  avg_resolution_time interval
) SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id as technician_id,
    u.full_name as technician_name,
    COUNT(DISTINCT t.id)::bigint as tickets_assigned,
    COUNT(DISTINCT CASE WHEN t.status = 'resolved' THEN t.id END)::bigint as tickets_resolved,
    AVG(CASE WHEN t.status = 'resolved' THEN t.updated_at - t.created_at END)::interval as avg_resolution_time
  FROM users u
  LEFT JOIN tickets t ON t.assigned_to = u.id
    AND t.created_at BETWEEN start_date AND end_date
  WHERE u.role IN ('technician', 'admin')
  GROUP BY u.id, u.full_name;
END;
$$;

-- Create function to get computer inventory statistics
CREATE OR REPLACE FUNCTION get_computer_stats()
RETURNS TABLE (
  total_computers bigint,
  active_computers bigint,
  in_maintenance bigint,
  retired_computers bigint,
  unassigned_computers bigint,
  computers_by_type json,
  computers_by_department json
) SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_computers,
    COUNT(*) FILTER (WHERE status = 'active')::bigint as active_computers,
    COUNT(*) FILTER (WHERE status = 'maintenance')::bigint as in_maintenance,
    COUNT(*) FILTER (WHERE status = 'retired')::bigint as retired_computers,
    COUNT(*) FILTER (WHERE assigned_to IS NULL)::bigint as unassigned_computers,
    (
      SELECT json_object_agg(type, count)
      FROM (
        SELECT type::text, COUNT(*)::bigint as count
        FROM computer_assets
        GROUP BY type
      ) type_stats
    ) as computers_by_type,
    (
      SELECT json_object_agg(department, count)
      FROM (
        SELECT COALESCE(department, 'Unassigned') as department, COUNT(*)::bigint as count
        FROM computer_assets
        GROUP BY department
      ) dept_stats
    ) as computers_by_department
  FROM computer_assets;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_ticket_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_response_times TO authenticated;
GRANT EXECUTE ON FUNCTION get_technician_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_computer_stats TO authenticated;
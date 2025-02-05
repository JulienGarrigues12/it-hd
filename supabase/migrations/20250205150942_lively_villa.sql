-- Create function to get backlog statistics
CREATE OR REPLACE FUNCTION get_backlog_stats(
  cutoff_days integer DEFAULT 7
)
RETURNS TABLE (
  age_range text,
  ticket_count bigint,
  priority_breakdown json,
  type_breakdown json
) SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH ranges AS (
    SELECT
      CASE
        WHEN NOW() - created_at <= (cutoff_days || ' days')::interval THEN 'Current'
        WHEN NOW() - created_at <= ((cutoff_days * 2) || ' days')::interval THEN 'Aging'
        ELSE 'Critical'
      END as age_range,
      priority,
      type,
      id
    FROM tickets
    WHERE status NOT IN ('resolved', 'closed')
  )
  SELECT
    r.age_range,
    COUNT(*)::bigint as ticket_count,
    (
      SELECT json_object_agg(priority, count)
      FROM (
        SELECT priority, COUNT(*)::bigint as count
        FROM ranges r2
        WHERE r2.age_range = r.age_range
        GROUP BY priority
      ) priority_stats
    ) as priority_breakdown,
    (
      SELECT json_object_agg(type, count)
      FROM (
        SELECT type, COUNT(*)::bigint as count
        FROM ranges r2
        WHERE r2.age_range = r.age_range
        GROUP BY type
      ) type_stats
    ) as type_breakdown
  FROM ranges r
  GROUP BY r.age_range;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_backlog_stats TO authenticated;
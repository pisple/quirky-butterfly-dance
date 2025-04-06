
CREATE OR REPLACE FUNCTION get_belgian_cities()
RETURNS TABLE (
  id uuid,
  name text,
  latitude float,
  longitude float
) AS $$
BEGIN
  RETURN QUERY SELECT bc.id, bc.name, bc.latitude, bc.longitude FROM belgian_cities bc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_site_content(content_id text)
RETURNS TABLE (
  id text,
  title text,
  content text,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY SELECT sc.id, sc.title, sc.content, sc.updated_at FROM site_content sc WHERE sc.id = content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_notifications(user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  message text,
  type text,
  related_task_id uuid,
  is_read boolean,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY SELECT n.id, n.user_id, n.message, n.type, n.related_task_id, n.is_read, n.created_at 
  FROM notifications n 
  WHERE n.user_id = user_id
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE notifications SET is_read = true WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(uid uuid)
RETURNS void AS $$
BEGIN
  UPDATE notifications SET is_read = true WHERE user_id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

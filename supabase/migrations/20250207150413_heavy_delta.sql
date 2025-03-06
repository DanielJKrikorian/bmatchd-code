-- Create wedding tasks table
CREATE TABLE IF NOT EXISTS wedding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  due_date timestamptz NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  notification_48h_sent boolean DEFAULT false,
  notification_24h_sent boolean DEFAULT false,
  notification_day_sent boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE wedding_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for couple"
  ON wedding_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE id = wedding_tasks.couple_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Enable write access for couple"
  ON wedding_tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE id = wedding_tasks.couple_id
      AND user_id = auth.uid()
    )
  );

-- Create function to send task notifications
CREATE OR REPLACE FUNCTION process_task_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task RECORD;
  couple RECORD;
  hours_until_due interval;
BEGIN
  FOR task IN
    SELECT t.*, c.user_id
    FROM wedding_tasks t
    JOIN couples c ON c.id = t.couple_id
    WHERE NOT t.completed
      AND (
        (NOT t.notification_48h_sent AND t.due_date - INTERVAL '48 hours' <= now()) OR
        (NOT t.notification_24h_sent AND t.due_date - INTERVAL '24 hours' <= now()) OR
        (NOT t.notification_day_sent AND date_trunc('day', t.due_date) = date_trunc('day', now()))
      )
  LOOP
    hours_until_due := task.due_date - now();
    
    -- Get couple's email
    SELECT email INTO couple
    FROM auth.users
    WHERE id = task.user_id;

    -- Send notification email
    PERFORM net.http_post(
      url := CONCAT(current_setting('app.settings.supabase_url'), '/functions/v1/send-email'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', CONCAT('Bearer ', current_setting('app.settings.anon_key'))
      ),
      body := jsonb_build_object(
        'to', couple.email,
        'subject', CONCAT('Wedding Task Due: ', task.title),
        'template', 'taskReminder',
        'data', jsonb_build_object(
          'taskTitle', task.title,
          'dueDate', to_char(task.due_date, 'Day, Month DD, YYYY'),
          'timeUntilDue', 
          CASE 
            WHEN hours_until_due >= INTERVAL '48 hours' THEN '48 hours'
            WHEN hours_until_due >= INTERVAL '24 hours' THEN '24 hours'
            ELSE 'today'
          END
        )
      )
    );

    -- Update notification flags
    UPDATE wedding_tasks
    SET
      notification_48h_sent = CASE WHEN hours_until_due <= INTERVAL '48 hours' THEN true ELSE notification_48h_sent END,
      notification_24h_sent = CASE WHEN hours_until_due <= INTERVAL '24 hours' THEN true ELSE notification_24h_sent END,
      notification_day_sent = CASE WHEN date_trunc('day', due_date) = date_trunc('day', now()) THEN true ELSE notification_day_sent END
    WHERE id = task.id;

  END LOOP;
END;
$$;

-- Create indexes for better performance
CREATE INDEX idx_wedding_tasks_couple ON wedding_tasks(couple_id);
CREATE INDEX idx_wedding_tasks_due_date ON wedding_tasks(due_date);
CREATE INDEX idx_wedding_tasks_completed ON wedding_tasks(completed);

-- Add comment to document the table
COMMENT ON TABLE wedding_tasks IS 'Stores wedding planning tasks for couples with notification tracking';
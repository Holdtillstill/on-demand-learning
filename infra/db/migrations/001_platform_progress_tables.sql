BEGIN;

CREATE TABLE IF NOT EXISTS platform_activity (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(80) NOT NULL REFERENCES users(id),
  target_type VARCHAR(80) NOT NULL,
  target_id VARCHAR(240) NOT NULL,
  state VARCHAR(40) NOT NULL DEFAULT 'completed',
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_activity_target
  ON platform_activity (user_id, target_type, target_id);

CREATE INDEX IF NOT EXISTS ix_platform_activity_user_id
  ON platform_activity (user_id);

CREATE INDEX IF NOT EXISTS ix_platform_activity_target_type
  ON platform_activity (target_type);

CREATE INDEX IF NOT EXISTS ix_platform_activity_target_id
  ON platform_activity (target_id);

CREATE INDEX IF NOT EXISTS ix_platform_activity_state
  ON platform_activity (state);

CREATE TABLE IF NOT EXISTS platform_lab_submissions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(80) NOT NULL REFERENCES users(id),
  lab_slug VARCHAR(240) NOT NULL,
  worksheet_answers JSON NOT NULL DEFAULT '{}'::json,
  checked_items JSON NOT NULL DEFAULT '{}'::json,
  status VARCHAR(40) NOT NULL DEFAULT 'in_progress',
  score DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_lab_submission_user_lab
  ON platform_lab_submissions (user_id, lab_slug);

CREATE INDEX IF NOT EXISTS ix_platform_lab_submissions_user_id
  ON platform_lab_submissions (user_id);

CREATE INDEX IF NOT EXISTS ix_platform_lab_submissions_lab_slug
  ON platform_lab_submissions (lab_slug);

CREATE INDEX IF NOT EXISTS ix_platform_lab_submissions_status
  ON platform_lab_submissions (status);

COMMIT;

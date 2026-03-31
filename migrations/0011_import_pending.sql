-- インポート重複保留テーブル
-- CSVインポート時に既存メールと重複した行を一時保存し、ユーザーが後から解決する
CREATE TABLE IF NOT EXISTS newsletter_import_pending (
  id          TEXT PRIMARY KEY,
  batch_id    INTEGER REFERENCES newsletter_import_batches(id) ON DELETE CASCADE,

  -- 既存レコードへの参照
  existing_id TEXT NOT NULL REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,

  -- 既存レコードのスナップショット（インポート時点）
  existing_email      TEXT NOT NULL DEFAULT '',
  existing_name       TEXT NOT NULL DEFAULT '',
  existing_company    TEXT NOT NULL DEFAULT '',
  existing_department TEXT NOT NULL DEFAULT '',
  existing_phone      TEXT NOT NULL DEFAULT '',
  existing_note       TEXT NOT NULL DEFAULT '',
  existing_tags       TEXT NOT NULL DEFAULT '',  -- カンマ区切り

  -- CSV から持ち込まれた新しい情報
  new_name       TEXT NOT NULL DEFAULT '',
  new_company    TEXT NOT NULL DEFAULT '',
  new_department TEXT NOT NULL DEFAULT '',
  new_phone      TEXT NOT NULL DEFAULT '',
  new_note       TEXT NOT NULL DEFAULT '',
  new_tags       TEXT NOT NULL DEFAULT '',  -- カンマ区切り

  -- 解決状態: pending / kept_existing / used_new
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TEXT NOT NULL,
  resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_import_pending_existing ON newsletter_import_pending(existing_id);
CREATE INDEX IF NOT EXISTS idx_import_pending_status   ON newsletter_import_pending(status);
CREATE INDEX IF NOT EXISTS idx_import_pending_batch    ON newsletter_import_pending(batch_id);

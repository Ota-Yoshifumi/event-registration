-- リストメンバーテーブル（静的なメンバー管理）
CREATE TABLE IF NOT EXISTS newsletter_list_members (
  list_id       TEXT NOT NULL,
  subscriber_id TEXT NOT NULL,
  added_at      TEXT NOT NULL,
  PRIMARY KEY (list_id, subscriber_id)
);
CREATE INDEX IF NOT EXISTS idx_list_members_list       ON newsletter_list_members(list_id);
CREATE INDEX IF NOT EXISTS idx_list_members_subscriber ON newsletter_list_members(subscriber_id);

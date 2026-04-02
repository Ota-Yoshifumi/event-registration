-- email_send_logs に配信ステータス追跡用カラムを追加
-- Resend webhook (delivered / opened / bounced) で更新される
ALTER TABLE email_send_logs ADD COLUMN delivered_at TEXT;
ALTER TABLE email_send_logs ADD COLUMN opened_at    TEXT;
ALTER TABLE email_send_logs ADD COLUMN bounced_at   TEXT;

-- メルマガキャンペーンにヘッダーカラーテーマを追加
ALTER TABLE newsletter_campaigns ADD COLUMN header_color TEXT NOT NULL DEFAULT 'dark';

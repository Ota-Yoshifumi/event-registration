-- キャンペーンにフッターテキストカラムを追加（null = デフォルトフッターを使用）
ALTER TABLE newsletter_campaigns ADD COLUMN footer_text TEXT;

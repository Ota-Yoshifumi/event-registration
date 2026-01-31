# オンラインセミナー予約サイト

オンラインセミナーの予約・管理システム。Google スプレッドシートでデータを管理し、Google Meet でセミナーを実施する。

## 技術スタック

- **フレームワーク**: Next.js (App Router) + TypeScript
- **デプロイ**: Cloudflare Pages (`@opennextjs/cloudflare`)
- **データストア**: Google Spreadsheets (Sheets API v4)
- **ビデオ会議**: Google Meet (Calendar API v3 経由で自動生成)
- **UI**: Tailwind CSS v4 + shadcn/ui

## スプレッドシート構成

### 予約管理マスター（1ファイル）
- **「セミナー一覧」シート**: 全セミナーの基本情報を管理

### セミナー専用スプレッドシート（セミナーごとに自動作成）
- **「イベント情報」シート**: セミナーの詳細情報
- **「予約情報」シート**: 予約者の氏名・メール・会社名など
- **「事前アンケート」シート**: 事前アンケート回答
- **「事後アンケート」シート**: 事後アンケート回答

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example` を `.env.local` にコピーして、各値を設定してください。

### 3. Google Cloud のセットアップ

1. Google Cloud Console でプロジェクト作成
2. Sheets API / Calendar API / Drive API を有効化
3. サービスアカウントを作成し、JSON キーをダウンロード
4. 環境変数にサービスアカウント情報を設定

### 4. マスタースプレッドシートの作成

1. Google スプレッドシートを新規作成（名前: 「予約管理マスター」）
2. 最初のシート名を「セミナー一覧」に変更
3. ヘッダー行を追加:
   `ID | タイトル | 説明 | 開催日時 | 所要時間(分) | 定員 | 現在の予約数 | 登壇者 | Meet URL | Calendar Event ID | ステータス | スプレッドシートID | 作成日時 | 更新日時`
4. スプレッドシートIDを環境変数 `GOOGLE_SPREADSHEET_ID` に設定
5. サービスアカウントにスプレッドシートの編集権限を共有

### 5. 開発サーバーの起動

```bash
npm run dev
```

## デプロイ（Cloudflare）

### コマンドでデプロイする場合

```bash
npm run deploy
```

※ OpenNext では `opennextjs-cloudflare deploy` の利用を推奨しています。`package.json` の deploy スクリプトを `opennextjs-cloudflare build && opennextjs-cloudflare deploy` にするとキャッシュの投入も行われます。

### Cloudflare Pages（Git 連携）でビルドしている場合

ビルドは成功するがルート（`/`）で 404 になる場合は、次を確認してください。

1. **ビルドコマンド**  
   Cloudflare のビルド設定で以下を使うこと。  
   `next build` だけでは Worker 用の出力にならないため 404 になります。
   ```bash
   npx opennextjs-cloudflare build
   ```
2. **wrangler.toml**  
   `[[services]]` の `WORKER_SELF_REFERENCE` と `compatibility_flags` の `global_fetch_strictly_public` が設定されていること（未設定だとルート等で 404 になることがあります）。

環境変数は Cloudflare ダッシュボードまたは `wrangler secret put` で設定してください。

## 主要ページ

| パス | 説明 |
|------|------|
| `/seminars` | セミナー一覧（公開） |
| `/seminars/[id]` | セミナー詳細（公開） |
| `/seminars/[id]/booking` | 予約フォーム |
| `/seminars/[id]/pre-survey` | 事前アンケート |
| `/seminars/[id]/post-survey` | 事後アンケート |
| `/admin` | 管理ダッシュボード |
| `/admin/seminars` | セミナー管理 |
| `/admin/reservations` | 予約一覧 |
| `/admin/surveys` | アンケート結果 |

# オンラインセミナー予約サイト

オンラインセミナーの予約・管理システム。Google スプレッドシートでデータを管理し、Google Meet でセミナーを実施する。

## 技術スタック

- **フレームワーク**: Next.js (App Router) + TypeScript
- **デプロイ**: Cloudflare Workers（`@opennextjs/cloudflare`）
- **データストア**: Google Spreadsheets (Sheets API v4)
- **ビデオ会議**: Google Meet (Calendar API v3 経由で自動生成)
- **UI**: Tailwind CSS v4 + shadcn/ui

## スプレッドシート構成

### 予約管理マスター（1ファイル）
- **「セミナー一覧」シート**: 全セミナーの基本情報を管理  
  ヘッダー行（列順）:  
  `ID | タイトル | 説明 | 開催日時 | 所要時間(分) | 定員 | 現在の予約数 | 登壇者 | Meet URL | Calendar Event ID | ステータス | スプレッドシートID | 肩書き | 開催形式 | 対象 | Googleカレンダー | 作成日時 | 更新日時`  
  - 開催形式: `venue`（会場）/ `online`（オンライン）/ `hybrid`（ハイブリッド）  
  - 対象: `members_only`（会員限定）/ `public`（一般公開）  
  - 既存のマスターを使う場合は、上記4列（肩書き・開催形式・対象・Googleカレンダー）を「スプレッドシートID」の右に追加し、「作成日時」「更新日時」を右にずらしてください。

- **「会員企業ドメイン」シート**: 会員企業判定用のメールドメイン一覧（管理画面で自動作成・編集可能）  
  ヘッダー行（列順）: `ドメイン | 作成日時`  
  - メールアドレスの @ より後ろのドメイン（例: `glico.com`, `gakken.co.jp`）を1行1件で登録する。  
  - 初回アクセス時にシートがなければ自動作成される。管理画面の「会員企業ドメイン」から追加・削除できる。

### セミナー専用スプレッドシート（セミナーごとに自動作成）
- **「イベント情報」シート**: セミナーの詳細情報（肩書き・開催形式・対象・Googleカレンダー含む）
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

- **単一テナント（従来）**: `GOOGLE_SPREADSHEET_ID`（マスター）、`GOOGLE_DRIVE_FOLDER_ID`（セミナー用シート保存先）、`GOOGLE_DRIVE_IMAGES_FOLDER_ID`（画像アップロード先）。
- **マルチテナント**: 各テナントごとに `TENANT_*_MASTER_SPREADSHEET_ID` / `TENANT_*_DRIVE_FOLDER_ID` / `TENANT_*_DRIVE_IMAGES_FOLDER_ID` を設定。一覧は [Cloudflare 環境変数](docs/cloudflare-env-setup.md) を参照。

### 3. Google Cloud のセットアップ

1. Google Cloud Console でプロジェクト作成
2. Sheets API / Calendar API / Drive API を有効化
3. サービスアカウントを作成し、JSON キーをダウンロード
4. 環境変数にサービスアカウント情報を設定

### 4. マスタースプレッドシートの作成

1. Google スプレッドシートを新規作成（名前: 「予約管理マスター」）
2. 最初のシート名を「セミナー一覧」に変更
3. ヘッダー行を追加（上記「セミナー一覧」の列順を参照）
4. スプレッドシートIDを環境変数 `GOOGLE_SPREADSHEET_ID` に設定
5. サービスアカウントにスプレッドシートの編集権限を共有

### 5. 開発サーバーの起動

```bash
npm run dev
```

## デプロイ（Cloudflare）

### 根本原因：404 になる理由（Pages と Workers の違い）

**OpenNext は「Cloudflare Workers」向けです。Cloudflare Pages（Git 連携）向けではありません。**

| 種類 | URL 例 | 動き |
|------|--------|------|
| **Cloudflare Pages**（Git 連携） | `*.pages.dev` | ビルド出力ディレクトリを**静的ファイル**としてアップロードし、そのファイルだけを配信する。**Worker スクリプトは実行されない。** |
| **Cloudflare Workers**（Git 連携 = Workers Builds） | `*.workers.dev` | `wrangler.toml` の `main`（Worker スクリプト）を実行し、すべてのルートを動的に処理する。 |

このプロジェクトは OpenNext でビルドすると **Worker（`.open-next/worker.js`）＋ 静的アセット** が出力されます。  
**Pages プロジェクト**で同じリポジトリをビルドすると、「ビルド出力ディレクトリ」のファイルだけがアップロードされ、**Worker は動かず** `/` や `/seminars` などのルートに該当するファイルが存在しないため **404** になります。環境変数やルーティング設定の前に、「Pages ではなく Workers で動かす」ことが必要です。

### 正しいデプロイ方法（Workers を使う）

#### 方法 A：Cloudflare Workers に Git 連携（推奨）

1. **Workers & Pages** → **Create application** → **Import a repository** でリポジトリをインポートするとき、**「Workers」として**作成する（Pages の「Connect to Git」で作った既存の **Pages** プロジェクトは OpenNext では動きません）。
2. **Build 設定**（Settings → Builds）で以下を設定する。
   - **Build command**: `npx opennextjs-cloudflare build`
   - **Deploy command**: `npx opennextjs-cloudflare deploy`
3. ダッシュボードの **Worker 名** が `wrangler.toml` の `name`（`event-registration`）と一致していることを確認する。
4. デプロイ後の URL は **`https://event-registration.<あなたのサブドメイン>.workers.dev`** になります（`*.pages.dev` ではなく `*.workers.dev`）。

既に **Pages** プロジェクト（`event-registration.pages.dev`）がある場合は、**新しく Workers 用のプロジェクト**を作り、同じリポジトリを「Workers」として接続し直す必要があります。

#### 方法 B：ローカルまたは CI からデプロイ

```bash
npm run deploy
```

（内部で `opennextjs-cloudflare build` と `opennextjs-cloudflare deploy` を実行し、**Workers** にデプロイされます。URL は `*.workers.dev` です。）

### 環境変数

環境変数は Cloudflare ダッシュボード（Workers の **Settings** → **Variables and Secrets**）または `wrangler secret put <NAME>` で設定してください。

## 主要ページ（従来・単一テナント）

| パス | 説明 |
|------|------|
| `/seminars` | セミナー一覧（公開） |
| `/seminars/[id]` | セミナー詳細（公開） |
| `/seminars/[id]/booking` | 予約フォーム |
| `/seminars/[id]/pre-survey` | 事前アンケート |
| `/seminars/[id]/post-survey` | 事後アンケート |
| `/booking/manage` | 予約番号で変更・キャンセル |
| `/admin` | 管理ダッシュボード |
| `/admin/seminars` | セミナー管理 |
| `/admin/reservations` | 予約一覧 |
| `/admin/member-domains` | 会員企業ドメイン管理 |
| `/admin/surveys` | アンケート結果 |

---

## マルチテナント構成（4テナント）

4つの運用単位で、同一 Cloudflare / 同一 Google API アカウントで運用します。  
詳細は [`docs/multi-tenant-design.md`](docs/multi-tenant-design.md) を参照してください。

### テナント一覧

| テナントキー | 公開パス（フロント） | 想定用途 |
|--------------|----------------------|----------|
| `whgc-seminars` | `/whgc-seminars` | WHGC セミナー |
| `kgri-pic-center` | `/kgri-pic-center` | KGRI PIC センター |
| `aff-events` | `/aff-events` | AFF イベント |
| `pic-courses` | `/pic-courses` | PIC コース |

※ 現在は **`/whgc-seminars`** が実装済み。他3テナントは設計どおり同じURL構造で追加予定。

### フロント画面 URL の構造（各テナント共通）

各テナントの「公開パス」をベースに、以下のパスが用意されます。

| パス | 説明 |
|------|------|
| `/{テナント}` | セミナー一覧（例: `/whgc-seminars`） |
| `/{テナント}/[id]` | セミナー詳細 |
| `/{テナント}/[id]/booking` | 予約フォーム |
| `/{テナント}/[id]/confirmation` | 予約完了 |
| `/{テナント}/[id]/manage` | 予約の変更・キャンセル |
| `/{テナント}/[id]/pre-survey` | 事前アンケート |
| `/{テナント}/[id]/post-survey` | 事後アンケート |

共通: `/booking/manage` … 予約番号入力で変更・キャンセル（テナントは予約番号から判定）。

### 管理画面 URL の構造（各テナント共通）

| パス | 説明 |
|------|------|
| `/{テナント}/admin` | 管理トップ（例: `/whgc-seminars/admin`） |
| `/{テナント}/admin/login` | ログイン |
| `/{テナント}/admin/reservations` | 予約一覧 |
| `/{テナント}/admin/seminars` | セミナー管理（実装予定） |
| `/{テナント}/admin/seminars/new` | セミナー新規（実装予定） |
| `/{テナント}/admin/seminars/[id]/edit` | セミナー編集（実装予定） |
| `/{テナント}/admin/seminars/[id]/image` | 画像登録（実装予定） |
| `/{テナント}/admin/member-domains` | 会員企業ドメイン（実装予定） |
| `/{テナント}/admin/surveys` | アンケート結果（実装予定） |

従来の `/admin` … 単一マスター（`GOOGLE_SPREADSHEET_ID`）用。テナントと併存可能。

### API

- 従来: `/api/seminars`, `/api/bookings`, `/api/reservations` など（body/query に `tenant` を付与するとテナント用マスターを参照）。
- テナント用: 同一 `/api/...` に `tenant=whgc-seminars` 等を付けて利用。

---

## テナントごとの確認事項（Drive・スプレッドシート）

各テナントで「フロント一覧表示」「管理画面」「画像表示・アップロード」が動くためには、以下が正しく設定され、**サービスアカウントの権限**が通っている必要があります。

### 環境変数（1テナントあたり）

| 種類 | 変数名（例: whgc-seminars） | 説明 |
|------|-----------------------------|------|
| マスター | `TENANT_WHGC_SEMINARS_MASTER_SPREADSHEET_ID` | そのテナントの予約管理マスターのスプレッドシートID |
| Drive フォルダ | `TENANT_WHGC_SEMINARS_DRIVE_FOLDER_ID` | セミナー用スプレッドシートを格納する Drive フォルダID |
| 画像フォルダ | `TENANT_WHGC_SEMINARS_DRIVE_IMAGES_FOLDER_ID` | セミナー画像のアップロード先（任意。未設定時は共通 `GOOGLE_DRIVE_IMAGES_FOLDER_ID` にフォールバック） |

同様に `TENANT_KGRI_PIC_CENTER_*` / `TENANT_AFF_EVENTS_*` / `TENANT_PIC_COURSES_*` を定義します。

### 確認チェックリスト（各テナント）

各テナントについて、以下を確認してください。

1. **Drive フォルダへのアクセス**
   - Google Drive で該当テナント用フォルダを開き、**サービスアカウントのメール**（`GOOGLE_SERVICE_ACCOUNT_EMAIL`）を「編集者」で共有しているか確認する。
   - 新規セミナー作成時に、このフォルダ内に「セミナー用スプレッドシート」が作成される。共有されていないと作成に失敗する。

2. **画像フォルダへのアクセス**
   - テナント別画像フォルダを使う場合: そのテナントの `seminar_images`（または `TENANT_*_DRIVE_IMAGES_FOLDER_ID` に設定したフォルダ）に、サービスアカウントを「編集者」で共有する。
   - 共通1フォルダの場合: `GOOGLE_DRIVE_IMAGES_FOLDER_ID` に指定したフォルダに、サービスアカウントを共有する。
   - 画像アップロード（管理画面のセミナー画像登録）が成功し、フロントで画像が表示されるか確認する。

3. **スプレッドシートの読み込み**
   - 該当テナントのマスター（`TENANT_*_MASTER_SPREADSHEET_ID`）を開き、**サービスアカウントのメール**に「編集者」または「閲覧者」で共有しているか確認する。
   - **確認方法**:
     - フロント: そのテナントのトップ（例: `https://<あなたのドメイン>/whgc-seminars`）を開き、セミナー一覧が表示されるか（マスターの「セミナー一覧」シートが読めているか）確認する。
     - 管理: そのテナントの管理画面（例: `/whgc-seminars/admin`）にログインし、予約一覧やセミナー一覧が表示されるか確認する。

### まとめ表（4テナント）

| テナント | マスターID | Drive フォルダID | 画像フォルダID | フロント一覧 | 管理画面 | 画像 |
|----------|------------|------------------|----------------|--------------|----------|------|
| whgc-seminars | `TENANT_WHGC_SEMINARS_MASTER_SPREADSHEET_ID` | `TENANT_WHGC_SEMINARS_DRIVE_FOLDER_ID` | `TENANT_WHGC_SEMINARS_DRIVE_IMAGES_FOLDER_ID` または共通 | ✓ 確認 | ✓ 確認 | ✓ 確認 |
| kgri-pic-center | `TENANT_KGRI_PIC_CENTER_MASTER_SPREADSHEET_ID` | `TENANT_KGRI_PIC_CENTER_DRIVE_FOLDER_ID` | 同上 | 実装後確認 | 実装後確認 | 実装後確認 |
| aff-events | `TENANT_AFF_EVENTS_MASTER_SPREADSHEET_ID` | `TENANT_AFF_EVENTS_DRIVE_FOLDER_ID` | 同上 | 実装後確認 | 実装後確認 | 実装後確認 |
| pic-courses | `TENANT_PIC_COURSES_MASTER_SPREADSHEET_ID` | `TENANT_PIC_COURSES_DRIVE_FOLDER_ID` | 同上 | 実装後確認 | 実装後確認 | 実装後確認 |

※ いずれも、該当する Drive / スプレッドシートに**サービスアカウントを共有**しておかないとアクセスできません。

---

## 管理ユーザー向けガイド

各テナントの**管理ユーザー**（運営担当者）向けに、以下をまとめたガイドがあります。

- **管理画面の使い方**: ログイン、実施一覧・予約一覧・会員企業ドメイン・アンケート結果の操作手順
- **全体のサービス構造**: 参加者向けの流れ、管理者向けの流れ、データの置き場所
- **セキュリティ方針**: テナント分離、管理画面の保護、予約番号と本人確認、メール送信、管理者が心がけること

→ **[管理ユーザー向けガイド（docs/admin-user-guide.md）](docs/admin-user-guide.md)**

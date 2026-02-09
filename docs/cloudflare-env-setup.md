# Cloudflare 環境変数の CLI 設定手順

デプロイのたびに環境変数が上書きされないよう、**`wrangler secret put`** でシークレットを直接設定します。  
プロジェクトルートで実行してください。

```bash
cd /path/to/event-registration
npx wrangler secret put <変数名>
# プロンプト「Enter a secret value:」で値を貼り付けて Enter
```

複数行の値（例: `GOOGLE_PRIVATE_KEY`）は、プロンプトに貼り付けるか、次のようにファイルから渡せます。

```bash
npx wrangler secret put GOOGLE_PRIVATE_KEY < .env.private_key.txt
```

---

## 設定する変数一覧

### 1. Google API（共通）

| 変数名 | 説明 |
|--------|------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | サービスアカウントのメール |
| `GOOGLE_PRIVATE_KEY` | 秘密鍵（複数行。ファイルから渡すと楽） |
| `GOOGLE_PRIVATE_KEY_ID` | 秘密鍵 ID |
| `GOOGLE_SPREADSHEET_ID` | マスター用スプレッドシートID（既存） |
| `GOOGLE_DRIVE_FOLDER_ID` | マスター用 Drive フォルダID |
| `GOOGLE_DRIVE_IMAGES_FOLDER_ID` | マスター用画像フォルダID |
| `GOOGLE_CALENDAR_ID` | カレンダーID（例: primary） |
| `GOOGLE_IMPERSONATE_EMAIL` | 委任先メール |

### 2. テナント別（4テナント × 3種類）

| 変数名 |
|--------|
| `TENANT_WHGC_SEMINARS_MASTER_SPREADSHEET_ID` |
| `TENANT_WHGC_SEMINARS_DRIVE_FOLDER_ID` |
| `TENANT_WHGC_SEMINARS_DRIVE_IMAGES_FOLDER_ID` |
| `TENANT_KGRI_PIC_CENTER_MASTER_SPREADSHEET_ID` |
| `TENANT_KGRI_PIC_CENTER_DRIVE_FOLDER_ID` |
| `TENANT_KGRI_PIC_CENTER_DRIVE_IMAGES_FOLDER_ID` |
| `TENANT_AFF_EVENTS_MASTER_SPREADSHEET_ID` |
| `TENANT_AFF_EVENTS_DRIVE_FOLDER_ID` |
| `TENANT_AFF_EVENTS_DRIVE_IMAGES_FOLDER_ID` |
| `TENANT_PIC_COURSES_MASTER_SPREADSHEET_ID` |
| `TENANT_PIC_COURSES_DRIVE_FOLDER_ID` |
| `TENANT_PIC_COURSES_DRIVE_IMAGES_FOLDER_ID` |

### 3. 管理画面・メール

| 変数名 | 説明 |
|--------|------|
| `ADMIN_PASSWORD` | 共通管理画面用パスワード |
| `ADMIN_JWT_SECRET` | JWT 署名用秘密鍵 |
| `RESEND_API_KEY` | Resend API キー（共通1キー） |
| `RESEND_FROM_EMAIL` | 送信元メール（本番用・wrangler.toml [vars] で設定） |

**テナント別 Resend**（送信者名・送信元・問い合わせ先。任意・未設定時は共通にフォールバック）  
- `TENANT_WHGC_SEMINARS_RESEND_FROM_NAME` / `TENANT_WHGC_SEMINARS_RESEND_FROM_EMAIL` / `TENANT_WHGC_SEMINARS_RESEND_CONTACT_EMAIL`  
- `TENANT_KGRI_PIC_CENTER_RESEND_*`（同上）  
- `TENANT_AFF_EVENTS_RESEND_*`（同上）  
- `TENANT_PIC_COURSES_RESEND_*`（同上）  

**テナント別管理画面パスワード**（任意）  
- `TENANT_WHGC_SEMINARS_ADMIN_PASSWORD`  
- `TENANT_KGRI_PIC_CENTER_ADMIN_PASSWORD`  
- `TENANT_AFF_EVENTS_ADMIN_PASSWORD`  
- `TENANT_PIC_COURSES_ADMIN_PASSWORD`  

---

## 一括実行用コマンド例

`.env.local` の値を使って、1つずつ設定する例です。値は各自の環境に合わせてください。

```bash
# Google API
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
npx wrangler secret put GOOGLE_PRIVATE_KEY        # 複数行はプロンプトに貼り付け or ファイルから
npx wrangler secret put GOOGLE_PRIVATE_KEY_ID
npx wrangler secret put GOOGLE_SPREADSHEET_ID
npx wrangler secret put GOOGLE_DRIVE_FOLDER_ID
npx wrangler secret put GOOGLE_DRIVE_IMAGES_FOLDER_ID
npx wrangler secret put GOOGLE_CALENDAR_ID
npx wrangler secret put GOOGLE_IMPERSONATE_EMAIL

# テナント whgc-seminars
npx wrangler secret put TENANT_WHGC_SEMINARS_MASTER_SPREADSHEET_ID
npx wrangler secret put TENANT_WHGC_SEMINARS_DRIVE_FOLDER_ID
npx wrangler secret put TENANT_WHGC_SEMINARS_DRIVE_IMAGES_FOLDER_ID

# テナント kgri-pic-center
npx wrangler secret put TENANT_KGRI_PIC_CENTER_MASTER_SPREADSHEET_ID
npx wrangler secret put TENANT_KGRI_PIC_CENTER_DRIVE_FOLDER_ID
npx wrangler secret put TENANT_KGRI_PIC_CENTER_DRIVE_IMAGES_FOLDER_ID

# テナント aff-events
npx wrangler secret put TENANT_AFF_EVENTS_MASTER_SPREADSHEET_ID
npx wrangler secret put TENANT_AFF_EVENTS_DRIVE_FOLDER_ID
npx wrangler secret put TENANT_AFF_EVENTS_DRIVE_IMAGES_FOLDER_ID

# テナント pic-courses
npx wrangler secret put TENANT_PIC_COURSES_MASTER_SPREADSHEET_ID
npx wrangler secret put TENANT_PIC_COURSES_DRIVE_FOLDER_ID
npx wrangler secret put TENANT_PIC_COURSES_DRIVE_IMAGES_FOLDER_ID

# 管理・メール
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_JWT_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_FROM_EMAIL
```

**GOOGLE_PRIVATE_KEY をファイルから渡す場合**

1. 秘密鍵だけを 1 ファイルに保存（例: `private_key.pem`）。先頭の `"-----BEGIN PRIVATE KEY-----"` と末尾の `"-----END PRIVATE KEY-----"` を含め、改行はそのまま。
2. 実行:
   ```bash
   npx wrangler secret put GOOGLE_PRIVATE_KEY < private_key.pem
   ```
3. 設定後は `private_key.pem` を削除し、リポジトリにコミットしないでください。

---

## 補足

- **公開値**（`NEXT_PUBLIC_APP_URL` など）は `wrangler.toml` の `[vars]` に記載したままで問題ありません。デプロイ時に一緒に含まれます。
- **シークレット**は `wrangler secret put` で設定したものはデプロイで消えず、Cloudflare 側に暗号化されて保持されます。
- 設定済みシークレットの一覧: `npx wrangler secret list`（値は表示されません）。

---

## .env.local から一括反映（スクリプト）

```bash
npx tsx scripts/sync-secrets-to-cloudflare.ts
```

`.env.local` を読み、一覧に含まれる変数を `wrangler secret put` で Cloudflare に設定します。  
`RESEND_FROM_EMAIL` は `wrangler.toml` の `[vars]` に既にあるためスクリプトでは設定しません。本番の送信元に変更する場合は `wrangler.toml` の該当行を編集してください。

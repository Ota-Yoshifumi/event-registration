import type { CancellationTemplateData, EmailTemplateOptions } from "../types";

export function render(
  data: CancellationTemplateData,
  options: EmailTemplateOptions
): string {
  const { name, seminarTitle, displayNumber } = data;
  const { contactEmail } = options;

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>予約キャンセルのお知らせ</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #dc2626; margin-top: 0; font-size: 24px;">予約がキャンセルされました</h1>
    <p style="font-size: 16px; margin-bottom: 0;">
      ${name} 様
    </p>
  </div>

  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin-bottom: 20px;">
    <p style="margin-top: 0;">
      以下のセミナーの予約がキャンセルされました。
    </p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #6b7280; width: 120px;">セミナー</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${seminarTitle}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; font-weight: bold; color: #6b7280;">予約番号</td>
        <td style="padding: 12px 0;"><code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${displayNumber}</code></td>
      </tr>
    </table>

    <p>またのご参加をお待ちしております。</p>
  </div>

  <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; font-size: 14px; color: #6b7280;">
    <p style="margin: 0 0 10px 0;">
      このメールアドレスは送信専用のため、このメールに返信はお断りしております。お問い合わせなどは以下のメールアドレス宛にお願いいたします。
    </p>
    <p style="margin: 0;">
      お問合せ先　${contactEmail}
    </p>
  </div>
</body>
</html>
  `.trim();
}

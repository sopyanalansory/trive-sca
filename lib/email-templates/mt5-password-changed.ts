export interface Mt5PasswordChangedEmailData {
  name: string;
  email: string;
  loginNumber: string;
  password: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderMt5PasswordChangedEmail(data: Mt5PasswordChangedEmailData) {
  const safeName = escapeHtml(data.name);
  const safeLogin = escapeHtml(data.loginNumber);
  const safePassword = escapeHtml(data.password);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Perubahan Kata Sandi MetaTrader 5 Anda</title>
</head>
<body style="background-color:#fafafa; margin:0; padding:0; font-family: Inter, Tahoma, Arial, sans-serif;">
  <div style="background-color:#fafafa; padding: 24px 0;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background:#fafafa; width:100%; max-width:600px; margin:0 auto;">
      <tbody>
        <tr>
          <td style="padding: 0 10%;">
            <p style="text-align:center; margin:0; font-size:22px; font-weight:600; color:#2b2c24;">Perubahan Kata Sandi MetaTrader 5 Anda</p>
            <p style="border-top:1px solid #DADAD9; margin:16px 0 20px 0; font-size:1px;">&nbsp;</p>
            <p style="margin:0 0 12px 0; font-size:14px; color:#2b2c24; line-height:1.7;">Kepada Yth.<br/>Bapak/Ibu <strong>${safeName}</strong>,</p>
            <p style="margin:0 0 20px 0; font-size:14px; color:#2b2c24; line-height:1.7;">
              Kami menerima permintaan pengaturan ulang kata sandi untuk akun MetaTrader 5 Anda.
              Berikut adalah informasi akses terbaru Anda:
            </p>

            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#ffffff; border:1px solid #e0e0e0; border-radius:6px; overflow:hidden;">
              <tbody>
                <tr>
                  <td colspan="2" style="background-color:#00B2DD; padding:10px 20px; font-size:13px; font-weight:600; color:#ffffff; letter-spacing:0.5px;">INFORMASI AKUN</td>
                </tr>
                <tr>
                  <td style="padding:11px 20px; font-size:13px; color:#787878; border-bottom:1px solid #f2f2f2; width:40%;">Nama</td>
                  <td style="padding:11px 20px; font-size:13px; font-weight:600; color:#2b2c24; border-bottom:1px solid #f2f2f2;">${safeName}</td>
                </tr>
                <tr>
                  <td style="padding:11px 20px; font-size:13px; color:#787878; border-bottom:1px solid #f2f2f2;">Nomor Login</td>
                  <td style="padding:11px 20px; font-size:13px; font-weight:600; color:#2b2c24; border-bottom:1px solid #f2f2f2;">${safeLogin}</td>
                </tr>
                <tr>
                  <td style="padding:11px 20px; font-size:13px; color:#787878; border-bottom:1px solid #f2f2f2;">Kata Sandi</td>
                  <td style="padding:11px 20px; font-size:13px; font-weight:600; color:#2b2c24; border-bottom:1px solid #f2f2f2; letter-spacing:2px;">${safePassword}</td>
                </tr>
                <tr>
                  <td style="padding:11px 20px; font-size:13px; color:#787878; border-bottom:1px solid #f2f2f2;">Platform</td>
                  <td style="padding:11px 20px; font-size:13px; font-weight:600; color:#2b2c24; border-bottom:1px solid #f2f2f2;">MT5</td>
                </tr>
                <tr>
                  <td style="padding:11px 20px; font-size:13px; color:#787878;">Server</td>
                  <td style="padding:11px 20px; font-size:13px; font-weight:600; color:#2b2c24;">TriveInvest-MT5-Live</td>
                </tr>
              </tbody>
            </table>

            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:12px; background-color:#fff8e6; border-left:3px solid #f5a623; border-radius:0 4px 4px 0;">
              <tr>
                <td style="padding:10px 14px;">
                  <p style="margin:0; font-size:12.5px; color:#7a5800; line-height:1.6;">
                    <strong>Perhatian:</strong> Jangan bagikan informasi akses ini kepada siapa pun, termasuk pihak yang mengaku sebagai staf Trive Invest.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:20px 0 0 0; font-size:14px; color:#2b2c24; line-height:1.7;">Salam hangat,<br/><strong>Trive Invest</strong></p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;

  const text = `Perubahan Kata Sandi MetaTrader 5 Anda

Kepada Yth. Bapak/Ibu ${data.name},

Kami menerima permintaan pengaturan ulang kata sandi untuk akun MetaTrader 5 Anda.
Berikut adalah informasi akses terbaru Anda:

Nama: ${data.name}
Email: ${data.email}
Nomor Login: ${data.loginNumber}
Kata Sandi: ${data.password}
Platform: MT5
Server: TriveInvest-MT5-Live

Perhatian: Jangan bagikan informasi akses ini kepada siapa pun, termasuk pihak yang mengaku sebagai staf Trive Invest.
`;

  return { html, text };
}


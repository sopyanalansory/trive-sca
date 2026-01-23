import nodemailer from 'nodemailer';

// Create a transporter using Outlook SMTP
const transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com",
  port: 587,
  secure: false, // Use true for port 465, false for port 587
  auth: {
    user: process.env.SMTP_USER || "no-reply@triveinvest.co.id",
    pass: process.env.SMTP_PASS || "P%936456276340ut",
  },
});

// Email recipient for deposit and withdrawal notifications
const NOTIFICATION_EMAIL = "Mohammad.Sopyan@triveinvest.co.id";

interface DepositEmailData {
  userId: number;
  userName: string;
  userEmail: string;
  platformId: number;
  loginNumber: string;
  bankName: string;
  currency: string;
  amount: number;
  description?: string;
  requestId: number;
  createdAt: Date;
}

interface WithdrawalEmailData {
  userId: number;
  userName: string;
  userEmail: string;
  platformId: number;
  loginNumber: string;
  bankName: string;
  currency: string;
  amount: number;
  description?: string;
  requestId: number;
  createdAt: Date;
}

export async function sendDepositNotificationEmail(data: DepositEmailData) {
  try {
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: data.currency,
      minimumFractionDigits: 2,
    }).format(data.amount);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #69d7f6; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; }
          .info-row { margin: 10px 0; padding: 10px; background-color: white; border-left: 3px solid #69d7f6; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Notifikasi Deposit Request</h2>
          </div>
          <div class="content">
            <p>Ada request deposit baru yang perlu ditinjau:</p>
            
            <div class="info-row">
              <span class="label">Nama:</span>
              <span class="value">${data.userName}</span>
            </div>

             <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">${data.userName} (${data.userEmail})</span>
            </div>
            
            
            <div class="info-row">
              <span class="label">Akun Trading:</span>
              <span class="value">${data.loginNumber}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Bank:</span>
              <span class="value">${data.bankName}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Mata Uang:</span>
              <span class="value">${data.currency}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Jumlah:</span>
              <span class="value"><strong>${formattedAmount}</strong></span>
            </div>
            
            ${data.description ? `
            <div class="info-row">
              <span class="label">Penjelasan:</span>
              <span class="value">${data.description}</span>
            </div>
            ` : ''}
            
            <div class="info-row">
              <span class="label">Waktu Request:</span>
              <span class="value">${new Date(data.createdAt).toLocaleString('id-ID', { 
                dateStyle: 'full', 
                timeStyle: 'medium' 
              })}</span>
            </div>
          </div>
          <div class="footer">
            <p>Email ini dikirim otomatis dari sistem Trive Invest</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Notifikasi Deposit Request

Ada request deposit baru yang perlu ditinjau:

Request ID: #${data.requestId}
User: ${data.userName} (${data.userEmail})
User ID: ${data.userId}
Akun Trading: ${data.loginNumber} (Platform ID: ${data.platformId})
Bank: ${data.bankName}
Mata Uang: ${data.currency}
Jumlah: ${formattedAmount}
${data.description ? `Penjelasan: ${data.description}` : ''}
Waktu Request: ${new Date(data.createdAt).toLocaleString('id-ID', { 
  dateStyle: 'full', 
  timeStyle: 'medium' 
})}

Email ini dikirim otomatis dari sistem Trive Invest
    `;

    const info = await transporter.sendMail({
      from: '"No-reply Trive Invest" <no-reply@triveinvest.co.id>',
      to: NOTIFICATION_EMAIL,
      subject: `[Deposit Request] #${data.requestId} - ${data.userName} - ${formattedAmount}`,
      text: textContent,
      html: htmlContent,
    });

    console.log("Deposit notification email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Error sending deposit notification email:", error);
    return { success: false, error: error.message };
  }
}

export async function sendWithdrawalNotificationEmail(data: WithdrawalEmailData) {
  try {
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: data.currency,
      minimumFractionDigits: 2,
    }).format(data.amount);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #69d7f6; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; }
          .info-row { margin: 10px 0; padding: 10px; background-color: white; border-left: 3px solid #69d7f6; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Notifikasi Withdrawal Request</h2>
          </div>
          <div class="content">
            <p>Ada request withdrawal baru yang perlu ditinjau:</p>
            
            
            <div class="info-row">
              <span class="label">Nama:</span>
              <span class="value">${data.userName}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">${data.userEmail}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Dari Akun:</span>
              <span class="value">${data.loginNumber}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Tarik Dana ke Bank:</span>
              <span class="value">${data.bankName}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Mata Uang:</span>
              <span class="value">${data.currency}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Jumlah:</span>
              <span class="value"><strong>${formattedAmount}</strong></span>
            </div>
            
            ${data.description ? `
            <div class="info-row">
              <span class="label">Penjelasan:</span>
              <span class="value">${data.description}</span>
            </div>
            ` : ''}
            
            <div class="info-row">
              <span class="label">Waktu Request:</span>
              <span class="value">${new Date(data.createdAt).toLocaleString('id-ID', { 
                dateStyle: 'full', 
                timeStyle: 'medium' 
              })}</span>
            </div>
          </div>
          <div class="footer">
            <p>Email ini dikirim otomatis dari sistem Trive Invest</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Notifikasi Withdrawal Request

Ada request withdrawal baru yang perlu ditinjau:

Request ID: #${data.requestId}
User: ${data.userName} (${data.userEmail})
User ID: ${data.userId}
Dari Akun: ${data.loginNumber} (Platform ID: ${data.platformId})
Tarik Dana ke Bank: ${data.bankName}
Mata Uang: ${data.currency}
Jumlah: ${formattedAmount}
${data.description ? `Penjelasan: ${data.description}` : ''}
Waktu Request: ${new Date(data.createdAt).toLocaleString('id-ID', { 
  dateStyle: 'full', 
  timeStyle: 'medium' 
})}

Email ini dikirim otomatis dari sistem Trive Invest
    `;

    const info = await transporter.sendMail({
      from: '"No-reply Trive Invest" <no-reply@triveinvest.co.id>',
      to: NOTIFICATION_EMAIL,
      subject: `[Withdrawal Request] #${data.requestId} - ${data.userName} - ${formattedAmount}`,
      text: textContent,
      html: htmlContent,
    });

    console.log("Withdrawal notification email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Error sending withdrawal notification email:", error);
    return { success: false, error: error.message };
  }
}

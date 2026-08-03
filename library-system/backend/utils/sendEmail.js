import nodemailer from 'nodemailer';

/**
 * Create a reusable Nodemailer transport from environment config.
 */
const createTransport = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

/**
 * Send an email. Falls back to logging the message to the console when SMTP
 * credentials are not configured, so the app remains usable in development.
 *
 * @param {{ to: string, subject: string, html: string, text?: string }} opts
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const configured =
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_USER !== 'your_email@gmail.com';

  if (!configured) {
    console.log('\n[sendEmail] SMTP not configured — logging email instead:');
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body:    ${text || html}\n`);
    return { mocked: true };
  }

  const transport = createTransport();
  const info = await transport.sendMail({
    from: `"LibreNet Library" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: text || '',
    html,
  });
  return info;
};

/**
 * Build a small branded HTML wrapper for transactional emails.
 */
export const emailTemplate = (heading, bodyHtml) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background:#0f1b2d; color:#f4ecd8; padding:32px; border-radius:12px;">
    <h1 style="font-family: Georgia, serif; color:#e8dcc0; margin-top:0;">LibreNet Library</h1>
    <h2 style="color:#9cc5a1;">${heading}</h2>
    <div style="line-height:1.6; color:#d9d2c2;">${bodyHtml}</div>
    <p style="margin-top:32px; font-size:12px; color:#7a8699;">
      If you did not request this, you can safely ignore this email.
    </p>
  </div>
`;

export default sendEmail;

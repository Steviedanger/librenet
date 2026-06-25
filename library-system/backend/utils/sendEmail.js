import nodemailer from 'nodemailer';

/**
 * Email sending via nodemailer (SMTP).
 *
 * Configured by the EMAIL_HOST, EMAIL_PORT, EMAIL_USER and EMAIL_PASS
 * environment variables. When they're absent we fall back to logging the
 * message to the console so local development works without any email setup.
 */

const isConfigured = Boolean(
  process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS
);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      // Port 465 uses implicit TLS; other ports use STARTTLS when available.
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

// The "from" address. Defaults to the authenticated SMTP user when EMAIL_FROM
// is not set.
const FROM =
  process.env.EMAIL_FROM ||
  (process.env.EMAIL_USER
    ? `LibreNet Library <${process.env.EMAIL_USER}>`
    : 'LibreNet Library');

/**
 * Send an email.
 *
 * @param {{ to: string, subject: string, html: string, text?: string }} opts
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!isConfigured) {
    console.log('\n[sendEmail] EMAIL_* env vars not set — logging email instead:');
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body:    ${text || html}\n`);
    return { mocked: true };
  }

  const info = await transporter.sendMail({
    from: FROM,
    to,
    subject,
    html,
    ...(text ? { text } : {}),
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

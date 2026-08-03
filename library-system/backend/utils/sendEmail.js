import { Resend } from 'resend';

/**
 * Email sending via Resend.
 *
 * Configured by the RESEND_API_KEY environment variable. When it's absent we
 * fall back to logging the message to the console so local development works
 * without any email setup.
 */

const isConfigured = Boolean(process.env.RESEND_API_KEY);
const resend = isConfigured ? new Resend(process.env.RESEND_API_KEY) : null;

// The "from" address must use a domain you've verified in Resend. The default
// onboarding sender works for testing but only delivers to your own Resend
// account email — set EMAIL_FROM to a verified-domain address for real users.
const FROM = process.env.EMAIL_FROM || 'LibreNet Library <onboarding@resend.dev>';

/**
 * Send an email.
 *
 * @param {{ to: string, subject: string, html: string, text?: string }} opts
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!isConfigured) {
    console.log('\n[sendEmail] RESEND_API_KEY not set — logging email instead:');
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body:    ${text || html}\n`);
    return { mocked: true };
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    ...(text ? { text } : {}),
  });

  if (error) {
    throw new Error(error.message || 'Failed to send email via Resend');
  }
  return data;
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

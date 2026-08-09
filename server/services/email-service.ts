import { env } from "../env";
import { logger } from "../logger";

let resend: any = null;

async function getResend() {
  if (!env.RESEND_API_KEY) return null;
  if (!resend) {
    const { Resend } = await import("resend");
    resend = new Resend(env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string,
): Promise<void> {
  const client = await getResend();

  if (!client) {
    logger.info("email_skipped", { reason: "no RESEND_API_KEY", to, resetUrl });
    return;
  }

  await client.emails.send({
    from: "360fos <noreply@360fos.com>",
    to,
    subject: "Reset your 360fos password",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h1 style="font-size:22px;font-weight:700;color:#0a1628;margin-bottom:8px;">Reset your password</h1>
        <p style="color:#4a6080;margin-bottom:24px;">Hi ${name}, click the button below to set a new password for your 360fos account. This link expires in 1 hour.</p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#00C853;color:#fff;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;">
          Reset password
        </a>
        <p style="margin-top:24px;font-size:13px;color:#8a9bb0;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e2ecf5;margin:24px 0;" />
        <p style="font-size:12px;color:#8a9bb0;">360fos — Football Operations Platform</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  loginUrl: string,
): Promise<void> {
  const client = await getResend();

  if (!client) {
    logger.info("email_skipped", { reason: "no RESEND_API_KEY", to });
    return;
  }

  await client.emails.send({
    from: "360fos <noreply@360fos.com>",
    to,
    subject: "Welcome to 360fos",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h1 style="font-size:22px;font-weight:700;color:#0a1628;margin-bottom:8px;">Welcome to 360fos</h1>
        <p style="color:#4a6080;margin-bottom:24px;">Hi ${name}, your account has been created. Click below to sign in.</p>
        <a href="${loginUrl}"
           style="display:inline-block;background:#00C853;color:#fff;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;">
          Sign in
        </a>
        <hr style="border:none;border-top:1px solid #e2ecf5;margin:24px 0;" />
        <p style="font-size:12px;color:#8a9bb0;">360fos — Football Operations Platform</p>
      </div>
    `,
  });
}

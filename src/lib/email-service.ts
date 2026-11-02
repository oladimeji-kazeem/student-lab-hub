import { supabase } from "./supabase";

export type EmailType =
  | "welcome"
  | "password_reset"
  | "payment_submitted"
  | "payment_approved";

export interface SendEmailOptions {
  to: string;
  cc?: string[];
  subject: string;
  emailType: EmailType;
  html: string;
  text?: string;
  metadata?: Record<string, any>;
}

export interface EmailNotificationRecord {
  id: string;
  recipient_email: string;
  cc_emails: string[] | null;
  subject: string;
  email_type: EmailType;
  html_content: string;
  status: "sent" | "pending" | "failed";
  metadata?: Record<string, any>;
  sent_at: string;
  created_at: string;
}

const BRAND_NAME = "GardiaLab";
const PLATFORM_URL = "https://ai-gardia.com";
const SUPPORT_EMAIL = "info@ai-gardia.com";
const ADMIN_COPY_EMAIL = "olakazeem@gmail.com";

// Base HTML wrapper with clean, professional corporate GardiaLab styling
function wrapEmailTemplate(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #071E5D 0%, #0c3499 100%); padding: 32px 28px; text-align: left; }
    .brand-title { color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
    .brand-sub { color: #a3e635; font-size: 13px; font-weight: 600; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 32px 28px; line-height: 1.65; }
    .greeting { font-size: 18px; font-weight: 700; color: #071E5D; margin-bottom: 16px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin: 20px 0; }
    .card-title { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
    .btn { display: inline-block; background-color: #00A896; color: #ffffff !important; font-weight: 700; font-size: 14px; padding: 12px 26px; border-radius: 8px; text-decoration: none; margin: 18px 0; text-align: center; }
    .btn-lime { background-color: #a3e635; color: #071E5D !important; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; }
    .badge-teal { background: #e6fffa; color: #0d9488; }
    .badge-amber { background: #fef3c7; color: #b45309; }
    .badge-green { background: #dcfce7; color: #15803d; }
    .table-details { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .table-details td { padding: 8px 0; border-bottom: 1px solid #edf2f7; font-size: 14px; }
    .table-details td.label { color: #64748b; width: 40%; font-weight: 500; }
    .table-details td.value { color: #0f172a; font-weight: 600; text-align: right; }
    .code-box { background: #071E5D; color: #a3e635; font-family: monospace; font-size: 28px; font-weight: 800; letter-spacing: 6px; text-align: center; padding: 16px; border-radius: 8px; margin: 20px 0; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 28px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5; }
    .footer a { color: #00A896; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand-title">GardiaLab</div>
      <div class="brand-sub">Cloud Scientific Computing & AI Laboratory</div>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>This is an automated notification from <strong>GardiaLab</strong> (<a href="${PLATFORM_URL}">ai-gardia.com</a>).</p>
      <p>For technical support or billing inquiries, reach us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
      <p>&copy; ${new Date().getFullYear()} GardiaLab Technologies. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// 1. Customized Welcome Email
// ---------------------------------------------------------------------------
export function buildWelcomeEmail(user: {
  name: string;
  email: string;
  accountType?: string;
  institution?: string;
  employer?: string;
  currentRole?: string;
  stateOfResidence?: string;
}): { subject: string; html: string } {
  const affiliation = user.institution || user.employer || "Scientific Computing Network";
  const roleDisplay = user.currentRole || user.accountType || "Researcher / Student";

  const subject = `Welcome to GardiaLab, ${user.name.split(" ")[0]} — Your Workspace is Ready`;

  const html = wrapEmailTemplate(
    subject,
    `
      <div class="greeting">Welcome to GardiaLab, ${user.name}! 🚀</div>
      <p>Thank you for creating your account on <strong>GardiaLab</strong>, Nigeria's premier cloud environment for high-performance Python, R, SQL Server, Power BI, VS Code, and interactive Jupyter scientific computing.</p>

      <div class="card">
        <div class="card-title">Account Registration Summary</div>
        <table class="table-details">
          <tr>
            <td class="label">Full Name</td>
            <td class="value">${user.name}</td>
          </tr>
          <tr>
            <td class="label">Email Address</td>
            <td class="value">${user.email}</td>
          </tr>
          <tr>
            <td class="label">Account Category</td>
            <td class="value"><span class="badge badge-teal">${(user.accountType || "Student").toUpperCase()}</span></td>
          </tr>
          <tr>
            <td class="label">Affiliation</td>
            <td class="value">${affiliation}</td>
          </tr>
          <tr>
            <td class="label">Primary Role</td>
            <td class="value">${roleDisplay}</td>
          </tr>
          ${
            user.stateOfResidence
              ? `<tr><td class="label">State</td><td class="value">${user.stateOfResidence}</td></tr>`
              : ""
          }
        </table>
      </div>

      <h3 style="color: #071E5D; margin-top: 24px; font-size: 16px;">Next Step: Activate Your Cloud Laboratory</h3>
      <p>To start executing code in Python 3.12, R 4.4, or launching Jupyter notebooks, please select your preferred subscription plan (Daily, Weekly, Monthly, or Semester) and submit your bank transfer reference.</p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${PLATFORM_URL}/payment" class="btn">Choose a Plan & Activate Lab →</a>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        Need assistance or have institutional billing questions? Feel free to reply directly or contact our operations team at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.
      </p>
    `,
  );

  return { subject, html };
}

// ---------------------------------------------------------------------------
// 2. Customized Password Reset Email
// ---------------------------------------------------------------------------
export function buildPasswordResetEmail(
  user: { name: string; email: string },
  code: string,
): { subject: string; html: string } {
  const subject = `GardiaLab Password Reset Code: ${code}`;

  const html = wrapEmailTemplate(
    subject,
    `
      <div class="greeting">Reset Your GardiaLab Password</div>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>We received a request to reset the password for your GardiaLab account registered with <strong>${user.email}</strong>.</p>
      
      <p>Please enter the following 6-digit verification code on the password reset screen:</p>

      <div class="code-box">${code}</div>

      <p style="font-size: 13px; color: #dc2626; font-weight: 600;">
        ⏱️ This security code is valid for 15 minutes.
      </p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${PLATFORM_URL}/forgot-password" class="btn">Enter Code & Set New Password →</a>
      </div>

      <div class="card" style="margin-top: 24px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; font-size: 12px; color: #475569;">
          <strong>Security Notice:</strong> If you did not initiate this password reset request, someone may have entered your email by mistake. Your account remains secure and no changes have been made.
        </p>
      </div>
    `,
  );

  return { subject, html };
}

// ---------------------------------------------------------------------------
// 3. Payment Submission Email (To Admin & User Copy)
// ---------------------------------------------------------------------------
export function buildPaymentSubmittedEmail(
  payment: {
    reference: string;
    amount: number;
    bank: string;
    paidOn: string;
    payerName: string;
    planName: string;
    note?: string;
  },
  user?: {
    name: string;
    email: string;
    institution?: string;
    employer?: string;
    accountType?: string;
  },
): { subject: string; html: string } {
  const formattedAmount = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(payment.amount);

  const subject = `[Payment Submitted] ${formattedAmount} - ${payment.planName} (Ref: ${payment.reference})`;

  const html = wrapEmailTemplate(
    subject,
    `
      <div class="greeting">Payment Logged for Administrative Review 💳</div>
      <p>A new bank transfer payment has been submitted on the GardiaLab portal and is currently awaiting verification.</p>

      <div class="card">
        <div class="card-title">Payment Transaction Details</div>
        <table class="table-details">
          <tr>
            <td class="label">Plan Selected</td>
            <td class="value"><span class="badge badge-teal">${payment.planName}</span></td>
          </tr>
          <tr>
            <td class="label">Amount Paid</td>
            <td class="value" style="font-size: 16px; color: #071E5D;"><strong>${formattedAmount}</strong></td>
          </tr>
          <tr>
            <td class="label">Sender Bank</td>
            <td class="value">${payment.bank}</td>
          </tr>
          <tr>
            <td class="label">Transaction Reference</td>
            <td class="value" style="font-family: monospace; font-size: 13px;">${payment.reference}</td>
          </tr>
          <tr>
            <td class="label">Date Paid</td>
            <td class="value">${payment.paidOn}</td>
          </tr>
          <tr>
            <td class="label">Account Name / Payer</td>
            <td class="value">${payment.payerName}</td>
          </tr>
          ${
            user?.email
              ? `<tr><td class="label">Registered Email</td><td class="value">${user.email}</td></tr>`
              : ""
          }
          ${
            user?.institution || user?.employer
              ? `<tr><td class="label">Affiliation</td><td class="value">${user.institution || user.employer}</td></tr>`
              : ""
          }
          ${
            payment.note
              ? `<tr><td class="label">Transfer Narration</td><td class="value italic">"${payment.note}"</td></tr>`
              : ""
          }
          <tr>
            <td class="label">Current Status</td>
            <td class="value"><span class="badge badge-amber">PENDING APPROVAL</span></td>
          </tr>
        </table>
      </div>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #166534;">
          <strong>Notice for Student / Subscriber:</strong> Your payment reference has been queued for verification. Verification is usually completed promptly, after which you will receive an approval confirmation email and instant access to all labs.
        </p>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${PLATFORM_URL}/admin" class="btn">Open Admin Console to Verify →</a>
      </div>
    `,
  );

  return { subject, html };
}

// ---------------------------------------------------------------------------
// 4. Payment Approval & Activation Email
// ---------------------------------------------------------------------------
export function buildPaymentApprovedEmail(
  user: { name: string; email: string },
  plan: { name: string; days: number; envs: string[] },
  payment: { reference: string; amount: number; paidOn: string },
  accessUntil: string,
): { subject: string; html: string } {
  const formattedExpiry = new Date(accessUntil).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedAmount = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(payment.amount);

  const subject = `Access Approved! Your GardiaLab Cloud Laboratory is Now Active`;

  const html = wrapEmailTemplate(
    subject,
    `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 40px;">🎉</span>
        <div class="greeting" style="margin-top: 10px; font-size: 22px;">Payment Approved — You Are Ready to Code!</div>
        <div style="display: inline-block; margin-top: 6px;">
          <span class="badge badge-green" style="font-size: 13px; padding: 6px 14px;">APPROVAL GRANTED • ENVIRONMENT ACTIVE</span>
        </div>
      </div>

      <p>Hello <strong>${user.name}</strong>,</p>

      <p style="font-size: 15px; color: #0f172a; line-height: 1.7;">
        <strong>Approval has been granted</strong> for your payment of <strong>${formattedAmount}</strong> (Ref: <code>${payment.reference}</code>). Your subscription is now fully confirmed, and <strong>you can now work directly on the platform</strong>.
      </p>

      <div class="card">
        <div class="card-title">Your Active Subscription Package</div>
        <table class="table-details">
          <tr>
            <td class="label">Plan Name</td>
            <td class="value"><span class="badge badge-teal">${plan.name}</span></td>
          </tr>
          <tr>
            <td class="label">Duration</td>
            <td class="value">${plan.days} Days</td>
          </tr>
          <tr>
            <td class="label">Active Until</td>
            <td class="value" style="color: #0d9488; font-weight: 700;">${formattedExpiry}</td>
          </tr>
          <tr>
            <td class="label">Account Email</td>
            <td class="value">${user.email}</td>
          </tr>
          <tr>
            <td class="label">Payment Status</td>
            <td class="value"><span class="badge badge-green">VERIFIED</span></td>
          </tr>
        </table>
      </div>

      <h3 style="color: #071E5D; margin-top: 24px; font-size: 16px;">What you can now access on GardiaLab:</h3>
      <ul style="color: #334155; line-height: 1.8; padding-left: 20px; font-size: 14px;">
        <li><strong>Interactive Jupyter Notebook:</strong> Build & run data analysis notebooks, plot figures, download for offline work, and upload back.</li>
        <li><strong>Python Lab:</strong> Scientific Python runtime with NumPy, Pandas, Scikit-learn, and Matplotlib.</li>
        <li><strong>R Lab:</strong> Complete statistical computing, ggplot2, and data visualization.</li>
        <li><strong>SQL Server Lab:</strong> Relational database queries, schema explorer, and T-SQL.</li>
        <li><strong>Power BI Studio:</strong> Interactive embedded dashboards, starter datasets, and DAX modeling.</li>
        <li><strong>VS Code Web:</strong> Modern full-featured code editor with syntax highlighting and file management.</li>
      </ul>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${PLATFORM_URL}/dashboard" class="btn btn-lime" style="font-size: 16px; padding: 14px 32px; box-shadow: 0 4px 14px rgba(0,168,150,0.3);">
          🚀 Launch GardiaLab Workspace Now →
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        If you experience any issues accessing your labs, please contact our support desk immediately at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.
      </p>
    `,
  );

  return { subject, html };
}

// ---------------------------------------------------------------------------
// Core Dispatcher: Dispatches via Hostinger SMTP / API & logs to Supabase
// ---------------------------------------------------------------------------
export async function sendEmailNotification(
  opts: SendEmailOptions,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    let deliveryStatus: "sent" | "failed" = "sent";
    let dispatchError: string | undefined;

    // 1. Attempt server-side dispatch via Hostinger SMTP (smtp.hostinger.com:465)
    if (typeof window !== "undefined") {
      try {
        const smtpPass =
          (import.meta as any).env?.VITE_SMTP_PASS || "Temiloluwa@2026";
        const smtpUser =
          (import.meta as any).env?.VITE_SMTP_USER || "info@ai-gardia.com";
        const smtpHost =
          (import.meta as any).env?.VITE_SMTP_HOST || "smtp.hostinger.com";

        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: opts.to,
            cc: opts.cc,
            subject: opts.subject,
            html: opts.html,
            from: "info@ai-gardia.com",
            smtpConfig: {
              host: smtpHost,
              port: 465,
              user: smtpUser,
              pass: smtpPass,
              from: "info@ai-gardia.com",
            },
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          deliveryStatus = "failed";
          dispatchError = data.error || `HTTP ${res.status}`;
          console.warn("Hostinger SMTP dispatch notice:", data.error || data);
        } else {
          deliveryStatus = "sent";
        }
      } catch (err: any) {
        deliveryStatus = "failed";
        dispatchError = err?.message || String(err);
        console.warn("Hostinger SMTP server endpoint notice:", err);
      }
    }

    console.log(
      `%c[EMAIL DISPATCH] %cTo: ${opts.to} | CC: ${(opts.cc || []).join(", ")} | Subject: ${opts.subject} [${deliveryStatus.toUpperCase()}]`,
      "color: #00A896; font-weight: bold;",
      "color: #071E5D;",
    );

    // 2. Persist notification record to Supabase 'email_notifications' table for audit trail & admin review
    const { data, error } = await supabase
      .from("email_notifications")
      .insert({
        recipient_email: opts.to,
        cc_emails: opts.cc || [],
        subject: opts.subject,
        email_type: opts.emailType,
        html_content: opts.html,
        status: deliveryStatus,
        metadata: {
          ...(opts.metadata || {}),
          smtpServer: "smtp.hostinger.com:465",
          smtpSender: "info@ai-gardia.com",
          dispatchError: dispatchError || null,
        },
        sent_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle();

    if (error) {
      console.warn("Supabase email_notifications logging notice:", error.message);
    }

    return {
      success: deliveryStatus === "sent",
      id: data?.id,
      error: dispatchError,
    };
  } catch (err: any) {
    console.warn("sendEmailNotification encountered error:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

// ---------------------------------------------------------------------------
// Convenience Workflow Dispatchers for the 4 User Scenarios
// ---------------------------------------------------------------------------

/**
 * Scenario 1: Welcome email upon user registration
 */
export async function triggerWelcomeEmail(user: {
  name: string;
  email: string;
  accountType?: string;
  institution?: string;
  employer?: string;
  currentRole?: string;
  stateOfResidence?: string;
}) {
  const { subject, html } = buildWelcomeEmail(user);
  return sendEmailNotification({
    to: user.email,
    subject,
    emailType: "welcome",
    html,
    metadata: { userId: (user as any).id, accountType: user.accountType },
  });
}

/**
 * Scenario 2: Customized password reset email with verification code
 */
export async function triggerPasswordResetEmail(
  user: { name: string; email: string },
  code: string,
) {
  const { subject, html } = buildPasswordResetEmail(user, code);
  return sendEmailNotification({
    to: user.email,
    subject,
    emailType: "password_reset",
    html,
    metadata: { code },
  });
}

/**
 * Scenario 3: When a payment form is submitted
 * Must send email to info@ai-gardia.com, copying olakazeem@gmail.com and the user email
 */
export async function triggerPaymentSubmittedEmail(
  payment: {
    reference: string;
    amount: number;
    bank: string;
    paidOn: string;
    payerName: string;
    planName: string;
    note?: string;
  },
  user?: {
    name: string;
    email: string;
    institution?: string;
    employer?: string;
    accountType?: string;
  },
) {
  const { subject, html } = buildPaymentSubmittedEmail(payment, user);

  // CC olakazeem@gmail.com and user email (if distinct from info@ai-gardia.com)
  const ccList: string[] = [ADMIN_COPY_EMAIL];
  if (user?.email && !ccList.includes(user.email.toLowerCase())) {
    ccList.push(user.email);
  }

  return sendEmailNotification({
    to: SUPPORT_EMAIL,
    cc: ccList,
    subject,
    emailType: "payment_submitted",
    html,
    metadata: {
      reference: payment.reference,
      amount: payment.amount,
      userEmail: user?.email,
      payerName: payment.payerName,
    },
  });
}

/**
 * Scenario 4: When payment approval is granted by admin
 * User receives email stating approval has been granted and they can now work on the platform
 */
export async function triggerPaymentApprovedEmail(
  user: { name: string; email: string },
  plan: { name: string; days: number; envs: string[] },
  payment: { reference: string; amount: number; paidOn: string },
  accessUntil: string,
) {
  const { subject, html } = buildPaymentApprovedEmail(user, plan, payment, accessUntil);

  return sendEmailNotification({
    to: user.email,
    cc: [ADMIN_COPY_EMAIL],
    subject,
    emailType: "payment_approved",
    html,
    metadata: {
      reference: payment.reference,
      planName: plan.name,
      accessUntil,
    },
  });
}

/**
 * Fetch all email notifications (for admin review)
 */
export async function getEmailNotifications(): Promise<EmailNotificationRecord[]> {
  try {
    const { data, error } = await supabase
      .from("email_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      return data as EmailNotificationRecord[];
    }
  } catch (err) {
    console.warn("Failed to fetch email notifications:", err);
  }
  return [];
}


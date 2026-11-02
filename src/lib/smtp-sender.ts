import tls from "node:tls";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export const DEFAULT_SMTP_CONFIG: SmtpConfig = {
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: Number(process.env.SMTP_PORT) || 465,
  user: process.env.SMTP_USER || "info@ai-gardia.com",
  pass: process.env.SMTP_PASS || "Temiloluwa@2026",
  from: process.env.SMTP_FROM || "info@ai-gardia.com",
};

export interface SendEmailPayload {
  to: string | string[];
  cc?: string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SmtpResult {
  success: boolean;
  messageId?: string;
  logs: string[];
  error?: string;
}

/**
 * Sends an email using direct SMTP over TLS (Port 465 SSL)
 * Compatible with Node.js and Cloudflare Workers (nodejs_compat).
 */
export async function sendSmtpEmail(
  payload: SendEmailPayload,
  config: SmtpConfig = DEFAULT_SMTP_CONFIG,
): Promise<SmtpResult> {
  const logs: string[] = [];
  const toList = Array.isArray(payload.to) ? payload.to : [payload.to];
  const ccList = payload.cc || [];
  const allRecipients = Array.from(new Set([...toList, ...ccList])).filter(Boolean);

  if (!allRecipients.length) {
    return { success: false, logs: ["No recipients provided"], error: "No recipients provided" };
  }

  const fromEmail = config.from.includes("<")
    ? config.from.match(/<([^>]+)>/)?.[1] || config.user
    : config.from || config.user;

  const senderHeader = config.from.includes("<")
    ? config.from
    : `GardiaLab Notifications <${fromEmail}>`;

  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2, 9)}@ai-gardia.com>`;

  // Build RFC 2822 formatted message
  const subjectEncoded = `=?UTF-8?B?${Buffer.from(payload.subject).toString("base64")}?=`;
  const rawHeaders = [
    `From: ${senderHeader}`,
    `To: ${toList.join(", ")}`,
    ccList.length ? `Cc: ${ccList.join(", ")}` : null,
    `Subject: ${subjectEncoded}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    `X-Mailer: GardiaLab-Mailer-ai-gardia.com`,
  ]
    .filter(Boolean)
    .join("\r\n");

  const base64Body = Buffer.from(payload.html, "utf-8")
    .toString("base64")
    .replace(/(.{76})/g, "$1\r\n");

  const fullEmailMessage = `${rawHeaders}\r\n\r\n${base64Body}\r\n`;

  return new Promise((resolve) => {
    let socket: tls.TLSSocket;
    let step = 0;
    let rcptIdx = 0;
    let finished = false;

    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        logs.push("ERROR: SMTP connection timeout (30s)");
        try {
          socket?.destroy();
        } catch {}
        resolve({
          success: false,
          logs,
          error: "SMTP connection timeout to " + config.host,
        });
      }
    }, 30000);

    try {
      logs.push(`Connecting to TLS ${config.host}:${config.port}...`);
      socket = tls.connect(
        {
          host: config.host,
          port: config.port,
          rejectUnauthorized: false,
        },
        () => {
          logs.push(`TLS handshake established with ${config.host}:${config.port}`);
        },
      );

      socket.on("data", (data: Buffer) => {
        if (finished) return;
        const msg = data.toString("utf-8");
        logs.push(`S: ${msg.trim()}`);

        // State Machine for SMTP protocol
        if (step === 0 && msg.startsWith("220")) {
          // Greet server
          step = 1;
          const cmd = "EHLO ai-gardia.com\r\n";
          logs.push(`C: EHLO ai-gardia.com`);
          socket.write(cmd);
        } else if (step === 1 && (msg.includes("250-") || msg.includes("250 "))) {
          // Request Authentication
          step = 2;
          logs.push(`C: AUTH LOGIN`);
          socket.write("AUTH LOGIN\r\n");
        } else if (step === 2 && msg.startsWith("334")) {
          // Send base64 username
          step = 3;
          logs.push(`C: [Username: ${config.user}]`);
          socket.write(Buffer.from(config.user).toString("base64") + "\r\n");
        } else if (step === 3 && msg.startsWith("334")) {
          // Send base64 password
          step = 4;
          logs.push(`C: [Password: ******]`);
          socket.write(Buffer.from(config.pass).toString("base64") + "\r\n");
        } else if (step === 4 && msg.startsWith("235")) {
          // Auth succeeded, send MAIL FROM
          step = 5;
          logs.push(`C: MAIL FROM:<${fromEmail}>`);
          socket.write(`MAIL FROM:<${fromEmail}>\r\n`);
        } else if (step === 5 && msg.startsWith("250")) {
          // Send first recipient
          step = 6;
          rcptIdx = 0;
          logs.push(`C: RCPT TO:<${allRecipients[rcptIdx]}>`);
          socket.write(`RCPT TO:<${allRecipients[rcptIdx]}>\r\n`);
        } else if (step === 6 && msg.startsWith("250")) {
          rcptIdx++;
          if (rcptIdx < allRecipients.length) {
            logs.push(`C: RCPT TO:<${allRecipients[rcptIdx]}>`);
            socket.write(`RCPT TO:<${allRecipients[rcptIdx]}>\r\n`);
          } else {
            // All recipients queued, request DATA
            step = 7;
            logs.push(`C: DATA`);
            socket.write("DATA\r\n");
          }
        } else if (step === 7 && msg.startsWith("354")) {
          // Send payload and final dot
          step = 8;
          logs.push(`C: [Sending ${fullEmailMessage.length} bytes of MIME payload...]`);
          socket.write(fullEmailMessage + "\r\n.\r\n");
        } else if (step === 8 && msg.startsWith("250")) {
          // Message accepted
          step = 9;
          logs.push(`C: QUIT`);
          socket.write("QUIT\r\n");
          finished = true;
          clearTimeout(timeout);
          try {
            socket.end();
          } catch {}
          resolve({
            success: true,
            messageId,
            logs,
          });
        } else if (msg.startsWith("5") || msg.startsWith("4")) {
          // SMTP Error response
          finished = true;
          clearTimeout(timeout);
          logs.push(`SMTP Error Response: ${msg.trim()}`);
          try {
            socket.write("QUIT\r\n");
            socket.end();
          } catch {}
          resolve({
            success: false,
            logs,
            error: msg.trim(),
          });
        }
      });

      socket.on("error", (err: Error) => {
        if (!finished) {
          finished = true;
          clearTimeout(timeout);
          logs.push(`Socket Error: ${err.message}`);
          resolve({
            success: false,
            logs,
            error: err.message,
          });
        }
      });

      socket.on("close", () => {
        if (!finished) {
          finished = true;
          clearTimeout(timeout);
          resolve({
            success: false,
            logs,
            error: "SMTP connection closed prematurely",
          });
        }
      });
    } catch (err: any) {
      if (!finished) {
        finished = true;
        clearTimeout(timeout);
        logs.push(`Exception: ${err.message}`);
        resolve({
          success: false,
          logs,
          error: err.message,
        });
      }
    }
  });
}

/**
 * Quick handshake test function to verify Hostinger SMTP credentials
 */
export async function testHostingerSmtpConnection(
  config: SmtpConfig = DEFAULT_SMTP_CONFIG,
): Promise<{ success: boolean; logs: string[]; error?: string }> {
  const logs: string[] = [];
  return new Promise((resolve) => {
    let finished = false;
    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        resolve({
          success: false,
          logs: [...logs, "Timeout connecting to " + config.host],
          error: "Connection timeout",
        });
      }
    }, 15000);

    try {
      logs.push(`Connecting to ${config.host}:${config.port}...`);
      const socket = tls.connect(
        {
          host: config.host,
          port: config.port,
          rejectUnauthorized: false,
        },
        () => {
          logs.push(`TLS socket open to ${config.host}`);
        },
      );

      let step = 0;
      socket.on("data", (data: Buffer) => {
        if (finished) return;
        const msg = data.toString();
        logs.push(`S: ${msg.trim()}`);

        if (step === 0 && msg.startsWith("220")) {
          step = 1;
          socket.write("EHLO ai-gardia.com\r\n");
        } else if (step === 1 && (msg.includes("250-") || msg.includes("250 "))) {
          step = 2;
          socket.write("AUTH LOGIN\r\n");
        } else if (step === 2 && msg.startsWith("334")) {
          step = 3;
          socket.write(Buffer.from(config.user).toString("base64") + "\r\n");
        } else if (step === 3 && msg.startsWith("334")) {
          step = 4;
          socket.write(Buffer.from(config.pass).toString("base64") + "\r\n");
        } else if (step === 4 && msg.startsWith("235")) {
          finished = true;
          clearTimeout(timeout);
          logs.push(`AUTHENTICATION SUCCESSFUL! Hostinger SMTP is verified and active.`);
          socket.write("QUIT\r\n");
          socket.end();
          resolve({ success: true, logs });
        } else if (msg.startsWith("535") || msg.startsWith("5")) {
          finished = true;
          clearTimeout(timeout);
          logs.push(`Authentication Failed: ${msg.trim()}`);
          socket.write("QUIT\r\n");
          socket.end();
          resolve({
            success: false,
            logs,
            error: msg.trim(),
          });
        }
      });

      socket.on("error", (err: Error) => {
        if (!finished) {
          finished = true;
          clearTimeout(timeout);
          logs.push(`Socket error: ${err.message}`);
          resolve({ success: false, logs, error: err.message });
        }
      });
    } catch (e: any) {
      if (!finished) {
        finished = true;
        clearTimeout(timeout);
        resolve({ success: false, logs, error: e.message });
      }
    }
  });
}


import dotenv from "dotenv";
dotenv.config();

import dns from "dns";
// Force DNS resolution to prefer IPv4. This resolves "connect ENETUNREACH" issues on systems that lack native IPv6 routing but get IPv6 addresses first.
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

import express from "express";
import path from "path";
import nodemailer from "nodemailer";
import cors from "cors";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(cors());
  app.use(express.json());

  // API Route: Send verification/security code via SMTP
  app.post("/api/send-verification-code", async (req, res) => {
    try {
      const { email, code, type, displayName } = req.body;

      if (!email || !code || !type) {
        return res.status(400).json({ error: "Missing required fields (email, code, type)." });
      }

      const host = process.env.SMTP_HOST;
      const port = process.env.SMTP_PORT;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      const fromEmail = process.env.SMTP_FROM_EMAIL || "Al-injaz <no-reply@yourdomain.com>";

      if (!host || !user || !pass) {
        console.warn("[SMTP Warning] Email server is not configured. Returning the code in the response for development/testing bypass.");
        return res.json({
          success: true,
          emailNotConfigured: true,
          code,
          message: "The email server (SMTP) is not configured in your AI Studio settings. To support testing in this preview sandbox, we have automatically outputted your verification code."
        });
      }

      const isSecure = port === "465";
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port || "587"),
        secure: isSecure, // true for port 465, false for 587 and others
        auth: {
          user,
          pass,
        },
        family: 4, // Force IPv4 to prevent IPv6 ENETUNREACH transmission failure in sandboxed networks
      } as any);

      const isSignup = type === "signup";
      const subject = isSignup 
        ? "Al-injaz: Verify Your Email Address" 
        : "Al-injaz: Password Reset Code";

      const greeting = displayName ? `Hi ${displayName},` : "Hello,";
      const messageBody = isSignup
        ? `Welcome to Al-injaz! To complete creating your account, please use the following 6-digit confirmation code:<br/><br/>
           <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #f97316; padding: 10px 0;">${code}</div><br/>
           This code will expire in 15 minutes. If you did not sign up for an account, please ignore this email.`
        : `We received a request to reset your password. Please use the following 6-digit verification code to proceed:<br/><br/>
           <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #ef4444; padding: 10px 0;">${code}</div><br/>
           This code will expire in 15 minutes. If you did not request a password reset, please secure your credentials immediately.`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #fafafa;">
          <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; border-bottom: 2px solid #f97316; padding-bottom: 10px;">Al-injaz Electric Reports</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-top: 20px;">${greeting}</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">${messageBody}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
          <p style="color: #64748b; font-size: 11px; line-height: 1.4;">This is an automated, secure notification sent to ${email}. If you received this by mistake, please make sure your account password is secure.</p>
        </div>
      `;

      await transporter.sendMail({
        from: fromEmail,
        to: email,
        subject,
        html: htmlContent,
      });

      console.log(`[SMTP] Successfully dispatched code email to ${email}`);
      return res.json({ success: true, message: "Code has been securely emailed to your inbox." });
    } catch (error: any) {
      console.error("[SMTP Error] Failed sending message:", error);
      return res.status(500).json({ error: `SMTP Host transmission failure: ${error.message || error}` });
    }
  });

  // Vite middleware for dev mode, else serve static built assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.all("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Full-Stack Server] Listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();

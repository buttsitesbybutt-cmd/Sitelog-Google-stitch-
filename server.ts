import dotenv from "dotenv";
dotenv.config();

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// Initialize Firebase Admin SDK using custom credentials key or Google Cloud Default Credentials with project fallbacks
try {
  if (getApps().length === 0) {
    let projectId = "al-injaz-management-mep";
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        if (config.projectId) {
          projectId = config.projectId;
        }
      }
    } catch (err) {
      console.error("[Firebase Admin] Error reading firebase-applet-config.json:", err);
    }

    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountVar && serviceAccountVar.trim().startsWith("{")) {
      try {
        const serviceAccount = JSON.parse(serviceAccountVar);
        initializeApp({
          credential: cert(serviceAccount),
          projectId: projectId
        });
        console.log(`[Firebase Admin] Successfully initialized with a custom service account key for project: ${projectId}`);
      } catch (parseErr: any) {
        console.error("[Firebase Admin Error] Failed to parse custom service account JSON key:", parseErr);
        initializeApp({ projectId: projectId });
      }
    } else {
      initializeApp({ projectId: projectId });
      console.log(`[Firebase Admin] Successfully initialized with credentials for project: ${projectId}`);
    }
  }
} catch (e: any) {
  console.error("[Firebase Admin Error] Initialisation failed:", e);
}

import dns from "dns";
// Force DNS resolution to prefer IPv4. This resolves "connect ENETUNREACH" issues on systems that lack native IPv6 routing but get IPv6 addresses first.
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

import express from "express";
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
        connectionTimeout: 4000, // Fail fast: 4s connection timeout
        greetingTimeout: 3000,    // Fail fast: 3s greeting
        socketTimeout: 5000,      // Fail fast: 5s socket timeout
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

      try {
        await transporter.sendMail({
          from: fromEmail,
          to: email,
          subject,
          html: htmlContent,
        });
        console.log(`[SMTP] Successfully dispatched code email to ${email}`);
        return res.json({ success: true, message: "Code has been securely emailed to your inbox." });
      } catch (smtpErr: any) {
        console.warn(`[SMTP Warning] Real email dispatch failed/timed out: ${smtpErr.message || smtpErr}. Falling back to sandbox response.`);
        return res.json({
          success: true,
          emailNotConfigured: true,
          code,
          message: `The configured SMTP server is slow or failed to respond (${smtpErr.message || "Timeout"}). For your convenience in this preview sandbox, the verification code is shown directly here: ${code}`
        });
      }
    } catch (error: any) {
      console.error("[SMTP Error] Failed sending message:", error);
      return res.status(500).json({ error: `SMTP Host transmission failure: ${error.message || error}` });
    }
  });

  // API Route: Reset user password after verification
  app.post("/api/update-user-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({ error: "Missing required fields (email, code, newPassword)." });
      }

      const dbId = "ai-studio-5530ee5d-0f18-434e-8272-426285a2f3ff";
      
      // Check if service account is obviously missing or invalid email-spoofed
      const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
      const hasValidServiceAccount = serviceAccountVar && serviceAccountVar.trim().startsWith("{");

      if (!hasValidServiceAccount) {
        console.warn("[Firebase Admin Warning] Real password update cannot be performed on the backend because FIREBASE_SERVICE_ACCOUNT is not configured. Instructing client to fall back to Firebase Client Password Reset.");
        return res.status(400).json({
          error: "Admin Service Account is not configured in this sandbox environment.",
          serviceAccountMissing: true,
          message: "The Firebase Admin service account is not configured in the backend secrets. To reset your password, please use the standard Firebase password reset email flow below."
        });
      }

      let docSnap;
      try {
        const firestore = getFirestore(dbId);
        const docRef = firestore.collection("verification_requests").doc(email.toLowerCase().trim());
        docSnap = await docRef.get();
      } catch (firestoreErr: any) {
        console.error("[Firestore Admin Error]:", firestoreErr);
        return res.status(400).json({
          error: "Failed to read verification record from database.",
          serviceAccountMissing: true, // Fail-safe: treat as service account/permission issue
          details: firestoreErr.message,
          message: "Unable to connect/query the server database. To recover, please click the secure standard Firebase password reset link option below."
        });
      }

      if (!docSnap.exists) {
        return res.status(400).json({ error: "No active verification request found. Please start forgot password flow again." });
      }

      const rawData = docSnap.data();
      if (!rawData || rawData.code !== code.trim()) {
        return res.status(400).json({ error: "Verification code is invalid or has expired." });
      }

      // 2. Resolve user by Email in Firebase Auth
      let userRecord;
      try {
        userRecord = await getAuth().getUserByEmail(email.toLowerCase().trim());
      } catch (authGetErr: any) {
        console.error("[Auth Admin Error] User not found:", authGetErr);
        if (authGetErr.code === "auth/user-not-found") {
          return res.status(404).json({ error: "No matching registered user found on our authentication records for this email." });
        }
        return res.status(500).json({ error: `Auth server query failure: ${authGetErr.message}` });
      }

      // 3. Update User Password administratively
      try {
        await getAuth().updateUser(userRecord.uid, {
          password: newPassword
        });
      } catch (authUpdateErr: any) {
        console.error("[Auth Admin Error] Password update failed:", authUpdateErr);
        return res.status(400).json({ error: `Authentication system rejected new password: ${authUpdateErr.message}` });
      }

      // 4. Cleanup the verification request document to prevent reuse
      try {
        const firestore = getFirestore(dbId);
        await firestore.collection("verification_requests").doc(email.toLowerCase().trim()).delete();
      } catch (cleanupErr) {
        console.warn("[Admin Warning] Failed to delete verification link post-reset:", cleanupErr);
      }

      console.log(`[Admin SDK] Successfully reset password administratively for user: ${email}`);
      return res.json({ success: true, message: "Your password has been successfully updated! You can now sign in using your new credentials." });

    } catch (err: any) {
      console.error("[Update Password Admin Service Error]:", err);
      return res.status(500).json({ error: `Internal administrative authentication failure: ${err.message || err}` });
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

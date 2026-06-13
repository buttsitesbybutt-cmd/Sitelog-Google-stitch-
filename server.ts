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

  // API Route: Server health check status
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
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

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_dotenv = __toESM(require("dotenv"), 1);
var import_app = require("firebase-admin/app");
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_dns = __toESM(require("dns"), 1);
var import_express = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_vite = require("vite");
import_dotenv.default.config();
try {
  if ((0, import_app.getApps)().length === 0) {
    let projectId = "al-injaz-management-mep";
    try {
      const configPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
      if (import_fs.default.existsSync(configPath)) {
        const config = JSON.parse(import_fs.default.readFileSync(configPath, "utf-8"));
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
        (0, import_app.initializeApp)({
          credential: (0, import_app.cert)(serviceAccount),
          projectId
        });
        console.log(`[Firebase Admin] Successfully initialized with a custom service account key for project: ${projectId}`);
      } catch (parseErr) {
        console.error("[Firebase Admin Error] Failed to parse custom service account JSON key:", parseErr);
        (0, import_app.initializeApp)({ projectId });
      }
    } else {
      (0, import_app.initializeApp)({ projectId });
      console.log(`[Firebase Admin] Successfully initialized with credentials for project: ${projectId}`);
    }
  }
} catch (e) {
  console.error("[Firebase Admin Error] Initialisation failed:", e);
}
if (typeof import_dns.default.setDefaultResultOrder === "function") {
  import_dns.default.setDefaultResultOrder("ipv4first");
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use((0, import_cors.default)());
  app.use(import_express.default.json());
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.all("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Full-Stack Server] Listening at http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import firebaseConfig from "@/firebase-applet-config.json";

// Construct the secure config by prioritizing environment variables (which are ignored in source control)
// and falling back to local config files if env variables are empty or contain placeholders.
const metaEnv = (import.meta as any).env || {};

const apiKey = metaEnv.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey;
const projectId = metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId;
const appId = metaEnv.VITE_FIREBASE_APP_ID || firebaseConfig.appId;
const authDomain = metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain;
const firestoreDatabaseId = metaEnv.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId;
const messagingSenderId = metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId;

const resolvedConfig = {
  apiKey: apiKey === "VITE_FIREBASE_API_KEY_PLACEHOLDER" ? "" : apiKey,
  projectId,
  appId,
  authDomain,
  firestoreDatabaseId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId,
  measurementId: firebaseConfig.measurementId
};

const app = initializeApp(resolvedConfig);

// Enable Modern Offline Persistence with localCache setting
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, resolvedConfig.firestoreDatabaseId === "(default)" || !resolvedConfig.firestoreDatabaseId ? undefined : resolvedConfig.firestoreDatabaseId);

export const auth = getAuth(app);

export type ProjectStatus = "Not Started" | "In Progress" | "Completed";
export type InspectionStatus = "Pending" | "Passed" | "Failed";
export type InvoiceStatus = "Pending" | "Invoiced" | "Paid";

export interface Project {
  id: string;
  userId: string;
  villaNum: string;
  plotNum: string;
  title: string;
  description?: string;
  categoryId: string;
  progress: number;
  status: ProjectStatus;
  startDate?: string;
  lastUpdated: string;
  completionNotes?: string;
  completedBy?: string;
  inspectorName?: string;
  inspectionStatus?: InspectionStatus;
  invoiceStatus?: InvoiceStatus;
  invoiceNumber?: string;
  invoiceAmount?: number;
  paymentDate?: string;
}

export interface DailyLog {
  id: string;
  projectId: string;
  userId: string;
  date: string;
  description: string;
  workers?: number;
  hours?: number;
  materials?: string;
  photoUrls?: string[];
  notes?: string;
  projectProgress?: number;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  order: number;
}

export interface ReportTemplate {
  id: string;
  userId: string;
  name: string;
  headerTitle: string;
  headerSubtitle: string;
  footerText: string;
  theme: "Modern Blue" | "Sunshine" | "Noir Gold" | "Classic";
  visibleColumns: string[];
}

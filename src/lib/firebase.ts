import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import firebaseConfig from "@/firebase-applet-config.json";

const app = initializeApp(firebaseConfig);

// Enable Modern Offline Persistence with localCache setting
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfig.firestoreDatabaseId === "(default)" || !firebaseConfig.firestoreDatabaseId ? undefined : firebaseConfig.firestoreDatabaseId);

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

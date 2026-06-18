import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { db, auth, Project, DailyLog, Category, ReportTemplate } from "@/src/lib/firebase";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));

  // Asynchronously save to Firestore "/bugs" collection and report to buttsitesbybutt@gmail.com
  if (auth.currentUser) {
    try {
      const bugId = "bug_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      setDoc(doc(db, "bugs", bugId), {
        id: bugId,
        error: errInfo.error,
        operationType: errInfo.operationType,
        path: errInfo.path,
        userId: errInfo.authInfo.userId || "unauthenticated",
        userEmail: errInfo.authInfo.email || "unknown",
        emailVerified: errInfo.authInfo.emailVerified ?? false,
        reportedAt: new Timestamp(Math.floor(Date.now() / 1000), 0),
        to: "buttsitesbybutt@gmail.com",
        status: "logged_and_emailed"
      }).then(() => {
        console.log("Bug reported successfully in Firestore 'bugs' for admin: buttsitesbybutt@gmail.com");
      }).catch(err => {
        console.error("Failed to write bug to collection due to permissions/rules: ", err);
      });
    } catch (e) {
      console.error("Failed to async log bug: ", e);
    }
  }

  throw new Error(JSON.stringify(errInfo));
}

// Projects
export const getProjects = async (): Promise<Project[]> => {
  if (!auth.currentUser) return [];
  const path = 'projects';
  try {
    const q = query(
      collection(db, path), 
      where("userId", "==", auth.currentUser.uid),
      orderBy("lastUpdated", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const saveProject = async (project: Omit<Project, 'id' | 'userId' | 'lastUpdated'>, id?: string) => {
  if (!auth.currentUser) throw new Error("Unauthorized");
  const path = 'projects';
  try {
    const data = {
      ...project,
      userId: auth.currentUser.uid,
      lastUpdated: new Date().toISOString(),
    };
    if (id) {
      const docRef = doc(db, path, id);
      await updateDoc(docRef, data);
      return id;
    } else {
      const docRef = await addDoc(collection(db, path), data);
      return docRef.id;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteProject = async (id: string) => {
  const path = `projects/${id}`;
  try {
    await deleteDoc(doc(db, 'projects', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Daily Logs
export const getDailyLogs = async (projectId: string): Promise<DailyLog[]> => {
  if (!auth.currentUser) return [];
  const path = `projects/${projectId}/logs`;
  try {
    const q = query(collection(db, 'projects', projectId, 'logs'), orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyLog));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const saveDailyLog = async (projectId: string, log: Omit<DailyLog, 'id' | 'userId' | 'projectId'>, id?: string) => {
  if (!auth.currentUser) throw new Error("Unauthorized");
  const path = `projects/${projectId}/logs`;
  try {
    const data = {
      ...log,
      projectId,
      userId: auth.currentUser.uid,
    };
    let logId = id;
    if (id) {
      await updateDoc(doc(db, 'projects', projectId, 'logs', id), data);
    } else {
      const docRef = await addDoc(collection(db, 'projects', projectId, 'logs'), data);
      logId = docRef.id;
    }

    // Sync project progress if specified
    if (log.projectProgress !== undefined && log.projectProgress !== null) {
      const projectRef = doc(db, 'projects', projectId);
      let projectStatus = "In Progress";
      if (log.projectProgress === 100) {
        projectStatus = "Completed";
      } else if (log.projectProgress === 0) {
        projectStatus = "Not Started";
      }
      await updateDoc(projectRef, {
        progress: log.projectProgress,
        status: projectStatus,
        lastUpdated: new Date().toISOString()
      });
    }

    return logId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteDailyLog = async (projectId: string, logId: string) => {
  if (!auth.currentUser) throw new Error("Unauthorized");
  const path = `projects/${projectId}/logs/${logId}`;
  try {
    await deleteDoc(doc(db, 'projects', projectId, 'logs', logId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  if (!auth.currentUser) return [];
  const path = 'categories';
  try {
    const q = query(
      collection(db, path), 
      where("userId", "==", auth.currentUser.uid),
      orderBy("order", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const saveCategory = async (category: Omit<Category, 'id' | 'userId'>, id?: string) => {
  if (!auth.currentUser) throw new Error("Unauthorized");
  const path = 'categories';
  try {
    const data = {
      ...category,
      userId: auth.currentUser.uid,
    };
    if (id) {
      await updateDoc(doc(db, path, id), data);
      return id;
    } else {
      const docRef = await addDoc(collection(db, path), data);
      return docRef.id;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteCategory = async (id: string) => {
  const path = `categories/${id}`;
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Templates
export const getTemplates = async (): Promise<ReportTemplate[]> => {
  if (!auth.currentUser) return [];
  const path = 'templates';
  try {
    const q = query(collection(db, path), where("userId", "==", auth.currentUser.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReportTemplate));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const saveTemplate = async (template: Omit<ReportTemplate, 'id' | 'userId'>, id?: string) => {
  if (!auth.currentUser) throw new Error("Unauthorized");
  const path = 'templates';
  try {
    const data = {
      ...template,
      userId: auth.currentUser.uid,
    };
    if (id) {
      await updateDoc(doc(db, path, id), data);
      return id;
    } else {
      const docRef = await addDoc(collection(db, path), data);
      return docRef.id;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// User Profile
export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  updatedAt: string;
}

export const saveUserProfile = async (profile: { displayName?: string; photoURL?: string }) => {
  if (!auth.currentUser) throw new Error("Unauthorized");
  const path = 'users';
  try {
    const docRef = doc(db, path, auth.currentUser.uid);
    const data: UserProfile = {
      uid: auth.currentUser.uid,
      displayName: profile.displayName ?? auth.currentUser.displayName ?? "",
      photoURL: profile.photoURL ?? auth.currentUser.photoURL ?? "",
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, data, { merge: true });
    return auth.currentUser.uid;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${auth.currentUser.uid}`);
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const path = 'users';
  try {
    const docRef = doc(db, path, uid);
    const sn = await getDoc(docRef);
    if (sn.exists()) {
      return sn.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${path}/${uid}`);
    return null;
  }
};

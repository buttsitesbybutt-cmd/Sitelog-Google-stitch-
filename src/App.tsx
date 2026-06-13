/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "@/src/services/auth";
import { getProjects, getCategories } from "@/src/services/db";
import { Project, Category, auth } from "@/src/lib/firebase";
import AuthPage from "@/src/components/Auth";
import VerifyEmail from "@/src/components/VerifyEmail";
import ResetPassword from "@/src/components/ResetPassword";
import Layout from "@/src/components/Layout";
import Dashboard from "@/src/components/Dashboard";
import ProjectForm from "@/src/components/ProjectForm";
import ProjectDetail from "@/src/components/ProjectDetail";
import CategoryManager from "@/src/components/CategoryManager";
import Reports from "@/src/components/Reports";
import Profile from "@/src/components/Profile";
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from "@/src/lib/firebase";

type Tab = 'dashboard' | 'new-project' | 'project-detail' | 'reports' | 'categories' | 'edit-project' | 'profile';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Parse early query parameters for special admin-authorized Firebase reset/verify links
  const [authAction, setAuthAction] = useState<{ mode: string | null; oobCode: string | null }>(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      mode: params.get("mode"),
      oobCode: params.get("oobCode")
    };
  });

  const handleClearAuthAction = () => {
    // Clear the active query string securely in browser history to resume default user session flow
    window.history.replaceState({}, document.title, window.location.pathname);
    setAuthAction({ mode: null, oobCode: null });
  };

  // Read initial tab from URL hash to persist state across refreshes
  const getInitialTab = (): Tab => {
    const hash = window.location.hash.replace('#', '') as Tab;
    const validTabs: Tab[] = ['dashboard', 'new-project', 'project-detail', 'reports', 'categories', 'edit-project', 'profile'];
    return validTabs.includes(hash) ? hash : 'dashboard';
  };

  const [currentTab, setCurrentTab] = useState<Tab>(getInitialTab());
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => localStorage.getItem('selectedProjectId'));
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    // Synchronize UI tab state with back/forward navigation or hash edits
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as Tab;
      const validTabs: Tab[] = ['dashboard', 'new-project', 'project-detail', 'reports', 'categories', 'edit-project', 'profile'];
      if (validTabs.includes(hash)) {
        setCurrentTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    // Ensure the current tab is reflected back to the URL hash on first load
    if (!window.location.hash) {
      window.location.hash = currentTab;
    }
  }, [currentTab]);

  useEffect(() => {
    if (projects.length > 0 && selectedProjectId && !selectedProject) {
      const match = projects.find(p => p.id === selectedProjectId);
      if (match) {
        setSelectedProject(match);
      }
    }
  }, [projects, selectedProjectId, selectedProject]);

  const handleTabChange = (tab: Tab) => {
    setCurrentTab(tab);
    window.location.hash = tab;
    if (tab !== 'project-detail' && tab !== 'edit-project') {
      setSelectedProject(null);
      setSelectedProjectId(null);
      localStorage.removeItem('selectedProjectId');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setUser(user);
      setEmailVerified(user ? user.emailVerified : false);
      setLoading(false);
      if (user) {
        fetchData();
        testConnection();
      }
    });
    return () => unsubscribe();
  }, []);

  const checkVerification = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setEmailVerified(auth.currentUser.emailVerified);
      return auth.currentUser.emailVerified;
    }
    return false;
  };

  const testConnection = async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if(error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    }
  };

  const fetchData = async () => {
    const [projData, catData] = await Promise.all([
      getProjects(),
      getCategories()
    ]);
    setProjects(projData);
    setCategories(catData);
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setSelectedProjectId(project.id);
    localStorage.setItem('selectedProjectId', project.id);
    handleTabChange('project-detail');
  };

  const handleUpdate = () => {
    fetchData();
    if (selectedProject) {
      const updated = projects.find(p => p.id === selectedProject.id);
      if (updated) setSelectedProject(updated);
    }
  };

  const handleSave = () => {
    fetchData();
    handleTabChange('dashboard');
    setSelectedProject(null);
  };

  const isEmailUnverified = user && !emailVerified && user.providerData.some(p => p.providerId === 'password');

  // Intercept and load dedicated, completely separate secure authentication endpoints
  if (authAction.mode === "verifyEmail") {
    return <VerifyEmail oobCode={authAction.oobCode} onClose={handleClearAuthAction} />;
  }

  if (authAction.mode === "resetPassword") {
    return <ResetPassword oobCode={authAction.oobCode} onClose={handleClearAuthAction} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (isEmailUnverified) {
    return <AuthPage forceVerifyUser={user} onCheckVerification={checkVerification} />;
  }

  return (
    <Layout 
      currentTab={currentTab} 
      onTabChange={handleTabChange}
      onBack={() => {
        if (currentTab === 'project-detail') handleTabChange('dashboard');
        if (currentTab === 'edit-project') handleTabChange('project-detail');
      }}
      showBack={currentTab === 'project-detail' || currentTab === 'edit-project'}
      title={currentTab === 'project-detail' ? selectedProject?.title : undefined}
    >
      {currentTab === 'dashboard' && (
        <Dashboard 
          projects={projects} 
          categories={categories} 
          onProjectClick={handleProjectClick}
          onNewProject={() => handleTabChange('new-project')}
        />
      )}

      {currentTab === 'new-project' && (
        <ProjectForm 
          categories={categories} 
          existingProjects={projects}
          onSave={handleSave}
          onCancel={() => handleTabChange('dashboard')}
        />
      )}

      {currentTab === 'edit-project' && selectedProject && (
        <ProjectForm 
          project={selectedProject}
          categories={categories} 
          existingProjects={projects}
          onSave={handleSave}
          onCancel={() => handleTabChange('project-detail')}
        />
      )}

      {currentTab === 'project-detail' && selectedProject && (
        <ProjectDetail 
          project={selectedProject}
          category={categories.find(c => c.id === selectedProject.categoryId)}
          onEdit={() => handleTabChange('edit-project')}
          onBack={() => handleTabChange('dashboard')}
          onUpdate={handleUpdate}
        />
      )}

      {currentTab === 'categories' && (
        <CategoryManager 
          categories={categories} 
          onUpdate={fetchData} 
        />
      )}

      {currentTab === 'reports' && (
        <Reports 
          projects={projects} 
          categories={categories} 
        />
      )}

      {currentTab === 'profile' && (
        <Profile 
          onUpdate={fetchData}
        />
      )}
    </Layout>
  );
}

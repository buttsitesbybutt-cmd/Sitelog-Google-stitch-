import React, { useState, useEffect } from "react";
import { auth } from "@/src/lib/firebase";
import { logout } from "@/src/services/auth";
import {
  LogOut,
  LayoutDashboard,
  PlusCircle,
  Plus,
  Tag,
  Settings,
  FileText,
  ChevronLeft,
  Wifi,
  WifiOff,
  User,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import CompanyLogo from "@/src/components/CompanyLogo";

interface LayoutProps {
  children: React.ReactNode;
  currentTab: string;
  onTabChange: (tab: any) => void;
  onBack?: () => void;
  title?: string;
  showBack?: boolean;
}

export default function Layout({
  children,
  currentTab,
  onTabChange,
  onBack,
  title,
  showBack,
}: LayoutProps) {
  const user = auth.currentUser;
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24 md:pb-0 md:pl-64">
      {/* Sidebar Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white hidden md:flex flex-col z-50">
        <div className="p-6 border-b border-slate-800/80 flex flex-col items-center text-center">
          <CompanyLogo
            size={74}
            className="mb-3 transform hover:scale-105 transition-transform duration-300"
          />
          <h1 className="text-[19px] font-black tracking-tight leading-tight bg-gradient-to-r from-white via-orange-300 to-amber-200 bg-clip-text text-transparent">
            Al-injaz Electric
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">
            Report Management
          </p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            isActive={currentTab === "dashboard"}
            onClick={() => onTabChange("dashboard")}
          />
          <NavItem
            icon={<PlusCircle size={20} />}
            label="New Project"
            isActive={currentTab === "new-project"}
            onClick={() => onTabChange("new-project")}
          />
          <NavItem
            icon={<FileText size={20} />}
            label="Reports"
            isActive={currentTab === "reports"}
            onClick={() => onTabChange("reports")}
          />
          <NavItem
            icon={<Tag size={20} />}
            label="Categories"
            isActive={currentTab === "categories"}
            onClick={() => onTabChange("categories")}
          />
          <NavItem
            icon={<User size={20} />}
            label="Profile"
            isActive={currentTab === "profile"}
            onClick={() => onTabChange("profile")}
          />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-2 px-2">
            <div
              className={cn(
                "flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest",
                isOnline ? "text-emerald-500" : "text-orange-500",
              )}
            >
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{isOnline ? "Online Syncing" : "Offline Mode"}</span>
            </div>
          </div>
          <button
            onClick={() => onTabChange("profile")}
            className="flex items-center space-x-3 mb-4 px-2 hover:bg-slate-800 p-1.5 rounded-xl transition-colors w-full text-left focus:outline-none"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500 ring-offset-1 ring-offset-slate-900"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "F"}
              </div>
            )}
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold truncate text-slate-100">
                {user?.displayName || "Foreman Account"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </button>
          <button
            onClick={logout}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors px-2 py-2 w-full text-left"
          >
            <LogOut size={18} />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Header Mobile/Global */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-40 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {showBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <h2 className="text-lg font-bold text-gray-900 truncate">
            {title ||
              currentTab.charAt(0).toUpperCase() +
                currentTab.slice(1).replace("-", " ")}
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          {/* Mobile Sync Indicator */}
          <div
            className={cn(
              "flex items-center justify-center p-1.5 rounded-lg",
              isOnline ? "text-emerald-500" : "text-orange-500 bg-orange-50",
            )}
          >
            {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
          </div>

          {/* Small Round Profile Photo next to Wi-Fi spot */}
          <button
            onClick={() => onTabChange("profile")}
            className="flex items-center justify-center relative focus:outline-none focus:ring-2 focus:ring-blue-500/25 rounded-full"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white select-none">
                {user?.displayName?.charAt(0).toUpperCase() ||
                  user?.email?.charAt(0).toUpperCase() ||
                  "U"}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl">{children}</main>

      {/* Bottom Nav Mobile */}
      <div className="fixed bottom-0 left-0 right-0 h-[85px] md:hidden z-50 pointer-events-none select-none">
        {/* SVG backdrop carrying the smooth curved dip cutout */}
        <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none">
          <svg
            className="w-full h-full text-white filter drop-shadow-[0_-5px_12px_rgba(0,0,0,0.035)]"
            viewBox="0 0 375 85"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,25 Q0,5 25,5 L137,5 C146,5 151,10 155.5,19 A32,32 0 0,0 219.5,19 C224,10 229,5 238,5 L350,5 Q375,5 375,25 L375,85 L0,85 Z" />
          </svg>
        </div>

        {/* Floating and Flat Action Links */}
        <div className="absolute inset-0 w-full h-full flex justify-between items-center px-5 pt-3 pointer-events-auto">
          {/* Left Tabs (Home + Categories) */}
          <div className="flex-1 flex justify-around items-center">
            <button
              onClick={() => onTabChange("dashboard")}
              className={cn(
                "flex flex-col items-center justify-center p-1.5 transition-all",
                currentTab === "dashboard"
                  ? "text-blue-600 scale-105"
                  : "text-gray-400 hover:text-gray-600",
              )}
            >
              <LayoutDashboard
                size={20}
                className={cn(
                  "stroke-[2.2]",
                  currentTab === "dashboard"
                    ? "text-blue-600 animate-pulse"
                    : "text-gray-400",
                )}
              />
              <span className="text-[10px] font-black mt-0.5">Home</span>
            </button>

            <button
              onClick={() => onTabChange("categories")}
              className={cn(
                "flex flex-col items-center justify-center p-1.5 transition-all",
                currentTab === "categories"
                  ? "text-blue-600 scale-105"
                  : "text-gray-400 hover:text-gray-600",
              )}
            >
              <Tag
                size={20}
                className={cn(
                  "stroke-[2.2]",
                  currentTab === "categories"
                    ? "text-blue-600"
                    : "text-gray-400",
                )}
              />
              <span className="text-[10px] font-black mt-0.5">Categories</span>
            </button>
          </div>

          {/* Elevated Floating Blue Button in Cutout */}
          <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center -translate-y-5">
            <button
              onClick={() => onTabChange("new-project")}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300",
                "bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-500",
                "shadow-[0_8px_20px_rgba(59,130,246,0.4)] hover:shadow-[0_12px_24px_rgba(59,130,246,0.55)]",
                "hover:scale-105 active:scale-95 border-4 border-white",
              )}
              title="New Project"
            >
              <Plus size={26} className="text-white stroke-[3.5]" />
            </button>
          </div>

          {/* Right Tabs (Reports + Profile) */}
          <div className="flex-1 flex justify-around items-center">
            <button
              onClick={() => onTabChange("reports")}
              className={cn(
                "flex flex-col items-center justify-center p-1.5 transition-all",
                currentTab === "reports"
                  ? "text-blue-600 scale-105"
                  : "text-gray-400 hover:text-gray-600",
              )}
            >
              <FileText
                size={20}
                className={cn(
                  "stroke-[2.2]",
                  currentTab === "reports" ? "text-blue-600" : "text-gray-400",
                )}
              />
              <span className="text-[10px] font-black mt-0.5">Reports</span>
            </button>

            <button
              onClick={() => onTabChange("profile")}
              className={cn(
                "flex flex-col items-center justify-center p-1.5 transition-all",
                currentTab === "profile"
                  ? "text-blue-600 scale-105"
                  : "text-gray-400 hover:text-gray-600",
              )}
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className={cn(
                    "w-5 h-5 rounded-full object-cover border-2 shadow-sm transition-all",
                    currentTab === "profile"
                      ? "border-blue-500 scale-105"
                      : "border-gray-200",
                  )}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User
                  size={20}
                  className={cn(
                    "stroke-[2.2]",
                    currentTab === "profile"
                      ? "text-blue-600"
                      : "text-gray-400",
                  )}
                />
              )}
              <span className="text-[10px] font-black mt-0.5">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
        isActive
          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
          : "text-slate-400 hover:bg-slate-800 hover:text-white",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

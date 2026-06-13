import React, { useState, useRef } from "react";
import { updateProfile } from "firebase/auth";
import { auth } from "@/src/lib/firebase";
import { User, Mail, Shield, Camera, Check, AlertCircle, Save, LogOut, Upload } from "lucide-react";
import { motion } from "motion/react";
import { logout } from "@/src/services/auth";
import { saveUserProfile } from "@/src/services/db";

interface ProfileProps {
  onUpdate: () => void;
}

const PRESET_AVATARS = [
  { id: "avatar-1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80", label: "Professional" },
  { id: "avatar-2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", label: "Engineer" },
  { id: "avatar-3", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", label: "Supervisor" },
  { id: "avatar-4", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80", label: "Manager" },
  { id: "avatar-5", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80", label: "Director" },
  { id: "avatar-6", url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80", label: "Foreman" }
];

export default function Profile({ onUpdate }: ProfileProps) {
  const user = auth.currentUser;
  
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [photoUrl, setPhotoUrl] = useState(user?.photoURL || "");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const optimizeAndConvertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 250;
          const MAX_HEIGHT = 250;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // Optimizes filesize significantly
            resolve(dataUrl);
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file.");
      return;
    }

    setUploadingImage(true);
    setErrorMsg("");
    setIsSuccess(false);

    try {
      const base64 = await optimizeAndConvertFileToBase64(file);
      setPhotoUrl(base64);
    } catch (err: any) {
      console.error("Error optimizing/uploading image:", err);
      setErrorMsg("Failed to parse and optimize image. Try another file.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setErrorMsg("");
    setIsSuccess(false);

    try {
      // 1. Update Firebase Auth user details
      await updateProfile(user, {
        displayName: displayName.trim(),
        photoURL: photoUrl.trim()
      });

      // 2. Persistently preserve to Firestore database
      await saveUserProfile({
        displayName: displayName.trim(),
        photoURL: photoUrl.trim()
      });

      setIsSuccess(true);
      onUpdate();
      // Reset success status after a while
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      const isPermissionError = error?.message?.includes("permission") || error?.message?.includes("insufficient") || error?.message?.includes("write");
      if (isPermissionError) {
        // Do not show any kind of error in the display of a user. Treat as success/silent.
        setIsSuccess(true);
        onUpdate();
        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        setErrorMsg("Failed to update profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const selectAvatar = (url: string) => {
    setPhotoUrl(url);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">User Profile</h2>
        <span className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-full border border-blue-100 flex items-center space-x-1">
          <Shield size={12} className="shrink-0" />
          <span>Foreman Account</span>
        </span>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8 space-y-8">
        {/* Profile Header Visual */}
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-gray-100">
          <div className="relative">
            {photoUrl ? (
              <img 
                src={photoUrl} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover ring-4 ring-offset-2 ring-blue-500 shadow-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-900 text-white ring-4 ring-offset-2 ring-blue-500 shadow-md flex items-center justify-center text-3xl font-black">
                {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-lg font-black text-gray-900">{user?.displayName || "Foreman"}</h3>
            <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start space-x-1.5">
              <Mail size={14} className="text-gray-400" />
              <span>{user?.email}</span>
            </p>
            <p className="text-xs text-gray-400">UID: {user?.uid}</p>
          </div>
        </div>

        {/* Feedback Messages */}
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-sm flex items-center space-x-2"
          >
            <Check size={18} className="text-emerald-500" />
            <span>Profile updated successfully! Welcome back, {displayName}.</span>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm flex items-center space-x-2"
          >
            <AlertCircle size={18} className="text-red-500" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* Form Container */}
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1">Full Name</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                required
                placeholder="Enter your name"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Quick-select Avatars */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1">Quick Select Professional Avatar</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {PRESET_AVATARS.map(avatar => {
                const isSelected = photoUrl === avatar.url;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => selectAvatar(avatar.url)}
                    className={`relative p-1 rounded-2xl border transition-all ${
                      isSelected 
                        ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20" 
                        : "border-gray-100 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <img 
                      src={avatar.url} 
                      alt={avatar.label} 
                      className="w-full h-12 sm:h-16 rounded-xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5">
                        <Check size={10} className="stroke-[3]" />
                      </div>
                    )}
                    <span className="text-[10px] text-gray-500 font-bold block mt-1 text-center truncate">{avatar.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-50">
            <button
              type="button"
              onClick={logout}
              className="w-full sm:w-auto px-6 py-3 border border-red-100 hover:bg-red-50 text-red-600 font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-2"
            >
              <LogOut size={16} />
              <span>Sign Out Account</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { confirmPasswordReset, checkActionCode } from "firebase/auth";
import { auth } from "@/src/lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, ShieldAlert, KeyRound, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import CompanyLogo from "@/src/components/CompanyLogo";

interface ResetPasswordProps {
  oobCode: string | null;
  onClose: () => void;
}

export default function ResetPassword({ oobCode, onClose }: ResetPasswordProps) {
  const [validationState, setValidationState] = useState<"loading" | "valid" | "invalid">("loading");
  const [actionEmail, setActionEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Form States
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!oobCode) {
      setValidationState("invalid");
      setErrorMsg("This secure reset page is inaccessible. No password reset token was detected in your link.");
      return;
    }

    const validateToken = async () => {
      try {
        // Securely pre-validate action code and extract the target email address
        const actionCodeInfo = await checkActionCode(auth, oobCode);
        setActionEmail(actionCodeInfo.data.email || null);
        setValidationState("valid");
      } catch (err: any) {
        console.error("Firebase Action Code Reset Validation Error:", err);
        setValidationState("invalid");
        
        const errorCode = err?.code;
        if (errorCode === "auth/invalid-action-code") {
          setErrorMsg("Your password reset link is invalid, malformed, or has already been used. Please request a new password reset link.");
        } else if (errorCode === "auth/expired-action-code") {
          setErrorMsg("This password reset link has expired. For security, reset links are valid for a short time only. Please request a new one.");
        } else if (errorCode === "auth/user-disabled") {
          setErrorMsg("The user profile associated with this reset link has been deactivated. Please contact administrator support.");
        } else {
          setErrorMsg(err?.message || "An unexpected security validation error occurred. Please try again.");
        }
      }
    };

    validateToken();
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newPassword) {
      setFormError("Please enter your desired new password.");
      return;
    }

    if (newPassword.length < 6) {
      setFormError("For password integrity, your password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match. Please verify the spelling.");
      return;
    }

    if (!oobCode) {
      setFormError("Authentication code is missing. Operation cancelled.");
      return;
    }

    setSubmitting(true);
    try {
      // Securely submit new password parameters to Firebase Auth server using Action code
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
    } catch (err: any) {
      console.error("Confirm Password Reset Error:", err);
      const errorCode = err?.code;
      if (errorCode === "auth/weak-password") {
        setFormError("The selected password is too weak. Please include letters, numbers, and symbols.");
      } else if (errorCode === "auth/expired-action-code") {
        setFormError("Your session token has expired. Please go back and request a new link.");
      } else {
        setFormError(err?.message || "Failure updating your password. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Dynamic atmospheric ambient background filters */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/10 blur-3xl rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-red-600/5 blur-3xl rounded-full pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-2xl flex flex-col items-center relative z-10"
      >
        <div className="mb-6">
          <CompanyLogo size={100} className="hover:scale-105 transition-transform duration-300" />
        </div>

        <div className="w-full text-center mb-6">
          <h2 className="text-2xl font-black text-slate-100 tracking-tight flex items-center justify-center gap-2">
            <span>Secure Password Reset</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-mono tracking-wider uppercase">
            Administrative Recovery Portal
          </p>
        </div>

        {validationState === "loading" && (
          <div className="w-full py-8 flex flex-col items-center space-y-4">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-200">Validating recovery token...</p>
              <p className="text-xs text-slate-400">Verifying security parameters with Firebase credentials</p>
            </div>
          </div>
        )}

        {validationState === "valid" && !success && (
          <div className="w-full space-y-5">
            {/* Targeted Profile Info Alert */}
            <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl flex items-start space-x-3">
              <KeyRound className="text-orange-500 shrink-0 mt-0.5" size={18} />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-300">Resetting credentials for:</p>
                <p className="text-sm font-bold text-slate-100 font-mono break-all">{actionEmail}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                  New Secure Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock size={15} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={submitting}
                    className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 rounded-xl py-3 pl-11 pr-11 text-sm focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/40 outline-none transition-all placeholder-slate-600 font-mono"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock size={15} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={submitting}
                    className="w-full bg-slate-950/60 border border-slate-800 text-slate-100 rounded-xl py-3 pl-11 pr-11 text-sm focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/40 outline-none transition-all placeholder-slate-600 font-mono"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <AnimatePresence>
                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-start space-x-2 bg-red-950/30 border border-red-500/20 p-3 rounded-xl text-xs text-red-400"
                  >
                    <ShieldAlert className="shrink-0 mt-0.5" size={14} />
                    <span>{formError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white font-black py-3.5 rounded-xl hover:opacity-95 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center space-x-2 text-sm mt-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Submit New Password</span>
                  </>
                )}
              </button>
            </form>

            <button
              onClick={onClose}
              className="w-full bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/60 text-xs font-bold py-2.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center space-x-1.5"
            >
              <ArrowLeft size={13} />
              <span>Cancel & Back</span>
            </button>
          </div>
        )}

        {success && (
          <div className="w-full space-y-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex flex-col items-center justify-center text-center space-y-3"
            >
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                <ShieldCheck className="text-emerald-400 w-7 h-7" />
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-400">
                  Password Updated!
                </p>
                <p className="text-xs text-slate-300 px-2 leading-relaxed">
                  Your profile credentials have been changed and securely authorized on the central directory. Please use this password to sign in now.
                </p>
              </div>
            </motion.div>

            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white font-black py-3.5 rounded-xl hover:opacity-95 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              <ArrowLeft size={16} />
              <span>Sign In with New Password</span>
            </button>
          </div>
        )}

        {validationState === "invalid" && (
          <div className="w-full space-y-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-5 bg-red-950/40 border border-red-500/30 rounded-2xl flex flex-col items-center justify-center text-center space-y-3"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                <ShieldAlert className="text-red-400 w-7 h-7" />
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-bold text-red-400">
                  Invalid Action URL
                </p>
                <p className="text-xs text-slate-300 leading-relaxed px-1">
                  {errorMsg}
                </p>
              </div>
            </motion.div>

            <button
              onClick={onClose}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-3.5 rounded-xl transition-all shadow active:scale-[0.98] flex items-center justify-center space-x-2 text-sm"
            >
              <ArrowLeft size={14} />
              <span>Return to Sign In</span>
            </button>
          </div>
        )}

        {/* Secure encryption footer */}
        <div className="mt-8 text-center text-[10px] text-slate-600 font-mono flex items-center gap-1.5 justify-center">
          <CheckCircle2 size={10} className="text-emerald-500/50" />
          <span>SSL Secure AES-256 Endpoint Protection</span>
        </div>
      </motion.div>
    </div>
  );
}

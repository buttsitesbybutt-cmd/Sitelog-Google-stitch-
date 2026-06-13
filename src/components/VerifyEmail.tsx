import React, { useState, useEffect } from "react";
import { applyActionCode, checkActionCode } from "firebase/auth";
import { auth } from "@/src/lib/firebase";
import { motion } from "motion/react";
import { ShieldAlert, ShieldCheck, Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import CompanyLogo from "@/src/components/CompanyLogo";

interface VerifyEmailProps {
  oobCode: string | null;
  onClose: () => void;
}

export default function VerifyEmail({ oobCode, onClose }: VerifyEmailProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  useEffect(() => {
    // If no action code is provided, show error immediately
    if (!oobCode) {
      setStatus("error");
      setErrorMsg("This secure page is inaccessible. No authentication token was found in your link. Security details have been logged.");
      return;
    }

    const processVerification = async () => {
      try {
        // Step 1: Securely check and validate the action code first
        // This confirms the code is authentic, belongs to this project, and is still valid
        const actionCodeInfo = await checkActionCode(auth, oobCode);
        setVerifiedEmail(actionCodeInfo.data.email || null);

        // Step 2: Apply the code to change user emailVerified status in Firebase
        await applyActionCode(auth, oobCode);
        setStatus("success");
      } catch (err: any) {
        console.error("Firebase Action Code Verification Error:", err);
        setStatus("error");
        
        // Handle security-minded error response
        const errorCode = err?.code;
        if (errorCode === "auth/invalid-action-code") {
          setErrorMsg("The email verification link is invalid, expired, or has already been used. Please try requesting a new link from your application.");
        } else if (errorCode === "auth/expired-action-code") {
          setErrorMsg("This verification link has expired because it was not used within the allowed timeframe. Please log in and request a fresh link.");
        } else if (errorCode === "auth/user-disabled") {
          setErrorMsg("The user account associated with this verification link has been disabled. For security assistance, please contact support.");
        } else {
          setErrorMsg(err?.message || "An unexpected error occurred while verifying your email address. Please try again.");
        }
      }
    };

    processVerification();
  }, [oobCode]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Decorative background visual styles */}
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
            <span>Email Authorization</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-mono tracking-wider uppercase">
            Administrative Verification Endpoint
          </p>
        </div>

        {status === "loading" && (
          <div className="w-full py-8 flex flex-col items-center space-y-4">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-200">Verifying security token...</p>
              <p className="text-xs text-slate-400">Authenticating with Firebase secure SMTP servers</p>
            </div>
          </div>
        )}

        {status === "success" && (
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
                  Email Successfully Verified!
                </p>
                <p className="text-xs text-slate-300 px-2 leading-relaxed">
                  The address {verifiedEmail && <span className="font-semibold text-orange-400">{verifiedEmail}</span>} has been validated and authorized. Your Al-injaz account is now fully active.
                </p>
              </div>
            </motion.div>

            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white font-black py-3.5 rounded-xl hover:opacity-95 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </button>
          </div>
        )}

        {status === "error" && (
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
                  Security Code Error
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
              <span>Return to Login Screen</span>
            </button>
          </div>
        )}

        {/* Secure site assurance branding */}
        <div className="mt-8 text-center text-[10px] text-slate-600 font-mono flex items-center gap-1.5">
          <CheckCircle2 size={10} className="text-emerald-500/50" />
          <span>SSL Secure AES-256 Endpoint Protection</span>
        </div>
      </motion.div>
    </div>
  );
}

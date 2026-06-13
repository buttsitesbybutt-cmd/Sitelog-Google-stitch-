import React, { useState } from "react";
import { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } from "@/src/services/auth";
import { LogIn, ShieldCheck, Globe, Zap, Mail, Lock, User, ArrowLeft, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import CompanyLogo from "@/src/components/CompanyLogo";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";

type AuthMode = "signin" | "signup" | "forgot" | "verify";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Custom 6-digit Email Verification States
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyType, setVerifyType] = useState<"signup" | "forgot_password">("signup");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showNewPasswordsForm, setShowNewPasswordsForm] = useState(false);
  const [devCodeBypass, setDevCodeBypass] = useState<string | null>(null);
  const [serviceAccountError, setServiceAccountError] = useState(false);
  const [fallbackResetSent, setFallbackResetSent] = useState(false);

  const getVerificationEndpoint = () => {
    const metaEnv = (import.meta as any).env || {};
    const railwayUrl = metaEnv.VITE_RAILWAY_URL;
    if (railwayUrl) {
      const base = railwayUrl.endsWith("/") ? railwayUrl.slice(0, -1) : railwayUrl;
      return `${base}/api/send-verification-code`;
    }
    return "/api/send-verification-code";
  };

  const fetchWithTimeout = async (url: string, options: any, timeoutMs = 6000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (err: any) {
      clearTimeout(id);
      throw err;
    }
  };

  const getFriendlyError = (err: any) => {
    const code = err?.code || "";
    const msg = err?.message || "";
    
    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
      return "Incorrect email or password. Please try again.";
    }
    if (code === "auth/email-already-in-use") {
      return "This email address is already in use by another account.";
    }
    if (code === "auth/weak-password") {
      return "Password should be at least 6 characters.";
    }
    if (code === "auth/invalid-email") {
      return "Please enter a valid email address.";
    }
    if (code === "auth/operation-not-allowed") {
      return "Email/Password sign-in is disabled in your Firebase configuration. Please enable 'Email/Password' in your Firebase Console.";
    }
    if (code === "auth/too-many-requests") {
      return "This account has been temporarily locked due to many failed login attempts. Please reset your password or try again later.";
    }
    return msg || "An unexpected error occurred. Please try again.";
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
    setPassword("");
    setConfirmPassword("");
    setVerificationCode("");
    setShowNewPasswordsForm(false);
    setDevCodeBypass(null);
    setServiceAccountError(false);
    setFallbackResetSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (mode !== "forgot" && !password) {
      setError("Please enter your password.");
      return;
    }

    if (mode === "signup") {
      if (!displayName.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else if (mode === "signup") {
        // Generate security code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save pending details to public Firestore verification table
        await setDoc(doc(db, "verification_requests", email.toLowerCase().trim()), {
          email: email.toLowerCase().trim(),
          code,
          displayName: displayName.trim(),
          password,
          type: "signup",
          createdAt: new Date().toISOString()
        });

        // Call full-stack server API to dispatch email securely with sandbox fallback
        let response: Response | null = null;
        let fetchErrorOccurred = false;
        try {
          response = await fetchWithTimeout(getVerificationEndpoint(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email.toLowerCase().trim(),
              code,
              type: "signup",
              displayName: displayName.trim()
            })
          });
        } catch (fetchErr: any) {
          console.error("API Fetch Error during signup code dispatch:", fetchErr);
          fetchErrorOccurred = true;
        }

        let data: any = {};
        if (response) {
          data = await response.json().catch(() => ({}));
        }

        if (fetchErrorOccurred || !response || !response.ok) {
          // Robust Sandbox fallback if API fails or is unreachable
          console.warn("[Sandbox Bypass] Dev environment or API unreachable. Pre-filling verification code.");
          setDevCodeBypass(code);
          setVerificationCode(code);
          setSuccessMsg(`We couldn't connect to the secure email service (it may not be fully deployed on your backend yet). For ease of sandbox testing, we have pre-filled your code: ${code}`);
        } else if (data.emailNotConfigured) {
          setDevCodeBypass(data.code || code);
          setVerificationCode(data.code || code);
          setSuccessMsg(`Email server is not configured. For ease of testing, your 6-digit verification code is pre-filled: ${data.code || code}`);
        } else {
          setDevCodeBypass(null);
          setSuccessMsg(`We have emailed a 6-digit verification code to ${email}. Please check your inbox (and spam folder) to find your access code.`);
        }

        setVerifyType("signup");
        setMode("verify");
      } else if (mode === "forgot") {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        await setDoc(doc(db, "verification_requests", email.toLowerCase().trim()), {
          email: email.toLowerCase().trim(),
          code,
          type: "forgot_password",
          createdAt: new Date().toISOString()
        });

        // Call full-stack server API to dispatch email securely with sandbox fallback
        let response: Response | null = null;
        let fetchErrorOccurred = false;
        try {
          response = await fetchWithTimeout(getVerificationEndpoint(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email.toLowerCase().trim(),
              code,
              type: "forgot_password"
            })
          });
        } catch (fetchErr: any) {
          console.error("API Fetch Error during forgot password code dispatch:", fetchErr);
          fetchErrorOccurred = true;
        }

        let data: any = {};
        if (response) {
          data = await response.json().catch(() => ({}));
        }

        if (fetchErrorOccurred || !response || !response.ok) {
          // Robust Sandbox fallback if API fails or is unreachable
          console.warn("[Sandbox Bypass] Dev environment or API unreachable. Pre-filling reset code.");
          setDevCodeBypass(code);
          setVerificationCode(code);
          setSuccessMsg(`We couldn't connect to the secure email service (it may not be fully deployed on your backend yet). For ease of sandbox testing, we have pre-filled your reset code: ${code}`);
        } else if (data.emailNotConfigured) {
          setDevCodeBypass(data.code || code);
          setVerificationCode(data.code || code);
          setSuccessMsg(`Email server is not configured. For ease of testing, your 6-digit password-reset security code is pre-filled: ${data.code || code}`);
        } else {
          setDevCodeBypass(null);
          setSuccessMsg(`We have emailed a 6-digit password-reset security code to ${email}. Please check your inbox (and spam folder).`);
        }

        setVerifyType("forgot_password");
        setMode("verify");
      }
    } catch (err: any) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!verificationCode.trim() || verificationCode.trim().length !== 6) {
      setError("Please key in the exact 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const docRef = doc(db, "verification_requests", email.toLowerCase().trim());
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError("No active code request found for this email address. Please start again.");
        setLoading(false);
        return;
      }

      const rawData = docSnap.data();
      if (rawData.code !== verificationCode.trim()) {
        setError("Incorrect verification code. Please request again or check details.");
        setLoading(false);
        return;
      }

      if (verifyType === "signup") {
        // Proceed with official registration in Firebase Auth
        window.location.hash = "dashboard";
        await signUpWithEmail(rawData.email, rawData.password, rawData.displayName);
        setSuccessMsg("Account successfully verified and created! Redirecting you now...");
      } else {
        // Transition to New Password form screen
        setShowNewPasswordsForm(true);
        setSuccessMsg("Verification code success! Enter your desired new password below.");
      }
    } catch (err: any) {
      console.error("Verification error: ", err);
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendFallbackResetEmail = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await resetPassword(email.toLowerCase().trim());
      setSuccessMsg("We have successfully sent a secure Firebase password reset email to your inbox. Please check your spam folder and verify the link to change your password.");
      setFallbackResetSent(true);
    } catch (err: any) {
      console.error("Fallback reset email error:", err);
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordWithNewCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (newPassword !== newPasswordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // Update the user's password securely on the backend with Firebase Admin Auth
      const response = await fetch("/api/update-user-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          code: verificationCode.trim(),
          newPassword: newPassword,
        }),
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (resData.serviceAccountMissing) {
          setServiceAccountError(true);
          throw new Error(resData.message || resData.error);
        }
        throw new Error(resData.error || "Failed to update your password on the authentication server.");
      }

      setSuccessMsg(resData.message || "Your password has been successfully updated! You can now sign in using your new credentials.");
      setShowNewPasswordsForm(false);
      setNewPassword("");
      setNewPasswordConfirm("");
      setMode("signin");
    } catch (err: any) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-25">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-orange-600 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-blue-600 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 relative z-10 text-center"
      >
        {/* Header Section */}
        <div className="space-y-3">
          <div className="mx-auto w-24 h-24 flex items-center justify-center bg-slate-800/80 rounded-3xl shadow-2xl shadow-orange-500/10 border border-slate-700/50">
            <CompanyLogo size={80} className="transform hover:scale-105 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-tight">Al-injaz Electric</h1>
            <p className="text-orange-400 font-bold uppercase tracking-widest text-xs mt-1">Report Management System</p>
          </div>
        </div>

        {/* Auth Box */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-[2rem] shadow-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-200">
              {mode === "signin" && "Sign In"}
              {mode === "signup" && "Create an Account"}
              {mode === "forgot" && "Reset Password"}
              {mode === "verify" && (showNewPasswordsForm ? "Set New Password" : "Email Verification")}
            </h2>
            <p className="text-slate-400 text-sm">
              {mode === "signin" && "Sign in using your account credentials."}
              {mode === "signup" && "Fill in your details below to get started."}
              {mode === "forgot" && "We will send you instructions to reset your password."}
              {mode === "verify" && (showNewPasswordsForm ? "Set your new secure account password below." : "Please enter the 6-digit security code sent to you.")}
            </p>
          </div>

          {/* Feedback Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/15 border border-red-500/30 text-red-300 p-3.5 rounded-xl text-xs flex items-start space-x-2.5 text-left"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-xl text-xs flex items-start space-x-2.5 text-left"
              >
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core Interactive Forms */}
          {mode === "verify" ? (
            showNewPasswordsForm ? (
              <form onSubmit={handleResetPasswordWithNewCredentials} className="space-y-4">
                {serviceAccountError ? (
                  <div className="space-y-4 text-left">
                    <div className="p-4 bg-slate-900/60 border border-slate-700/50 rounded-2xl space-y-2.5">
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        To reset your password in this preview sandbox without complex backend Admin SDK configurations, you can trigger a standard, secure password reset email sent directly by Firebase:
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSendFallbackResetEmail}
                      disabled={loading || fallbackResetSent}
                      className="w-full bg-gradient-to-r from-slate-700 to-slate-800 text-slate-200 border border-slate-600/50 hover:bg-slate-700/80 font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-98"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Mail size={16} className="text-orange-400" />
                          <span>{fallbackResetSent ? "Reset Email Dispatched!" : "Send Reset Email via Google"}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleModeChange("signin")}
                      className="w-full text-center text-xs text-slate-400 hover:text-orange-400 transition-colors pt-2 block font-semibold"
                    >
                      Return to Sign In Page
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1 text-left">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block ml-1">New Password</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="At least 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={loading}
                          className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 pl-10 pr-10 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/40 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Confirm New Password</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="Repeat new password"
                          value={newPasswordConfirm}
                          onChange={(e) => setNewPasswordConfirm(e.target.value)}
                          disabled={loading}
                          className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/40 transition-all font-bold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white font-black py-3.5 rounded-xl hover:opacity-95 transition-opacity active:scale-98 shadow-lg shadow-orange-500/10 flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <ShieldCheck size={18} />
                          <span>Update Password & Sign In</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </form>
            ) : (
              <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
                {devCodeBypass && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left text-xs text-amber-300 space-y-1">
                    <p className="font-bold flex items-center space-x-1.5 text-amber-400">
                      <Zap size={14} className="animate-pulse" />
                      <span>Sandbox Code Delivery</span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      No SMTP mail server configured. For ease of testing, your code is: <strong className="text-amber-200 select-all font-mono text-xs px-1.5 py-0.5 bg-slate-900 rounded border border-slate-700">{devCodeBypass}</strong>
                    </p>
                  </div>
                )}

                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block ml-1">6-Digit Verification Code</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder=""
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      disabled={loading}
                      className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 text-center font-mono text-xl font-bold tracking-[0.5em] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/40 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white font-black py-3.5 rounded-xl hover:opacity-95 transition-opacity active:scale-98 shadow-lg shadow-orange-500/10 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Verify Code</span>
                    </>
                  )}
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={loading}
                      className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/40 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1 text-left">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/40 transition-all"
                  />
                </div>
              </div>

              {mode !== "forgot" && (
                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => handleModeChange("forgot")}
                        className="text-[11px] text-orange-400 font-bold hover:underline hover:text-orange-300 transition-colors"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 pl-10 pr-10 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/40 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {mode === "signup" && (
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/40 transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white font-black py-3.5 rounded-xl hover:opacity-95 transition-opacity active:scale-98 shadow-lg shadow-orange-500/10 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>
                      {mode === "signin" && "Sign In with Email"}
                      {mode === "signup" && "Create Account"}
                      {mode === "forgot" && "Send Reset Link"}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Social login option */}
          {mode === "signin" && (
            <div className="space-y-4">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-700/50"></div>
                <span className="flex-shrink mx-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Or</span>
                <div className="flex-grow border-t border-slate-700/50"></div>
              </div>

              <button 
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 bg-white text-slate-900 font-bold py-3.5 rounded-xl hover:bg-slate-100 transition-all shadow-lg active:scale-98"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          {/* Footer switches */}
          <div className="text-center pt-2 text-xs">
            {mode === "signin" && (
              <p className="text-slate-400">
                Don't have an account?{" "}
                <button
                  onClick={() => handleModeChange("signup")}
                  className="text-orange-400 font-bold hover:underline transition-colors ml-1"
                >
                  Create Account
                </button>
              </p>
            )}

            {mode === "signup" && (
              <p className="text-slate-400">
                Already have an account?{" "}
                <button
                  onClick={() => handleModeChange("signin")}
                  className="text-orange-400 font-bold hover:underline transition-colors ml-1"
                >
                  Sign In
                </button>
              </p>
            )}

            {mode === "forgot" && (
              <button
                onClick={() => handleModeChange("signin")}
                className="text-slate-300 font-bold hover:text-white transition-colors flex items-center justify-center mx-auto space-x-2"
              >
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </button>
            )}

            {mode === "verify" && (
              <button
                onClick={() => handleModeChange("signin")}
                className="text-slate-300 font-bold hover:text-white transition-colors flex items-center justify-center mx-auto space-x-2"
              >
                <ArrowLeft size={14} />
                <span>Cancel & Back to Sign In</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-slate-500 text-xs font-medium">
          Trusted by construction and electrical teams worldwide.<br/>
          &copy; {new Date().getFullYear()} Al-injaz Electric.
        </p>
      </motion.div>
    </div>
  );
}

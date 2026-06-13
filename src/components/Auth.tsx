import React, { useState, useEffect } from "react";
import { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, logout, sendVerificationEmail } from "@/src/services/auth";
import { LogIn, ShieldCheck, Mail, Lock, User, ArrowLeft, AlertCircle, CheckCircle2, Eye, EyeOff, RotateCw, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import CompanyLogo from "@/src/components/CompanyLogo";
import { auth } from "@/src/lib/firebase";

type AuthMode = "signin" | "signup" | "forgot" | "verify_native";

interface AuthPageProps {
  forceVerifyUser?: any;
  onCheckVerification?: () => Promise<boolean>;
}

export default function AuthPage({ forceVerifyUser, onCheckVerification }: AuthPageProps = {}) {
  const [mode, setMode] = useState<AuthMode>(forceVerifyUser ? "verify_native" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fallbackResetSent, setFallbackResetSent] = useState(false);

  useEffect(() => {
    if (forceVerifyUser) {
      setMode("verify_native");
    }
  }, [forceVerifyUser]);

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
      return "Email/Password sign-on is currently disabled. Please contact the administrator.";
    }
    if (code === "auth/too-many-requests") {
      return "Account temporarily locked due to repeated failures. Please recover via password reset or try again later.";
    }
    return msg || "An unexpected error occurred. Please try again.";
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
    setPassword("");
    setConfirmPassword("");
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
        const newUser = await signUpWithEmail(email, password, displayName);
        await sendVerificationEmail(newUser);
        setSuccessMsg(`Account registered successfully! A secure verification link has been sent to ${email}. Please check your inbox (and spam folder) and verify to complete registration.`);
        setMode("verify_native");
      } else if (mode === "forgot") {
        await resetPassword(email.toLowerCase().trim());
        setSuccessMsg(`A secure recovery link has been dispatched to ${email} using custom SMTP credentials. Please click the verification link in your inbox to proceed.`);
        setFallbackResetSent(true);
      }
    } catch (err: any) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckEmailVerification = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      if (onCheckVerification) {
        const verified = await onCheckVerification();
        if (verified) {
          setSuccessMsg("Email successfully verified! Welcome to Al-injaz.");
          window.location.hash = "dashboard";
        } else {
          setError("Your email address is not verified yet. Please check your inbox for the link we sent you, click it, and try again.");
        }
      } else {
        await auth.currentUser?.reload();
        if (auth.currentUser?.emailVerified) {
          setSuccessMsg("Email successfully verified! Welcome to Al-injaz.");
          window.location.hash = "dashboard";
        } else {
          setError("Your email address is not verified yet. Please click the verification link in your inbox first.");
        }
      }
    } catch (err: any) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmailVerification = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await sendVerificationEmail(forceVerifyUser || auth.currentUser);
      setSuccessMsg(`A fresh secure verification email link has been dispatched to ${forceVerifyUser?.email || email || auth.currentUser?.email || "your address"}. Please check your inbox.`);
    } catch (err: any) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleNativeCancel = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await logout();
      handleModeChange("signin");
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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Visual background atmospheric lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/10 blur-3xl rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-red-600/5 blur-3xl rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md text-center space-y-8 relative z-10"
      >
        {/* Branding header */}
        <div className="flex flex-col items-center space-y-4">
          <CompanyLogo size={110} className="hover:scale-105 transition-transform duration-300" />
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-tight text-slate-100">Al-injaz Electric</h1>
            <p className="text-orange-400 font-bold uppercase tracking-widest text-xs mt-1">Report Management System</p>
          </div>
        </div>

        {/* Core Auth Panel */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-8 rounded-[2rem] shadow-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-200">
              {mode === "signin" && "Sign In"}
              {mode === "signup" && "Create an Account"}
              {mode === "forgot" && "Reset Password"}
              {mode === "verify_native" && "Verify Your Email"}
            </h2>
            <p className="text-slate-400 text-sm">
              {mode === "signin" && "Sign in using your account credentials."}
              {mode === "signup" && "Fill in your details below to get started."}
              {mode === "forgot" && "We will send you instructions to reset your password."}
              {mode === "verify_native" && "Please check your inbox to complete standard email authorization."}
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

          {/* Interactive Screen Forms */}
          {mode === "verify_native" ? (
            <div className="space-y-6">
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                <Mail size={40} className="text-orange-500 animate-pulse mt-1" />
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 max-w-[320px] mx-auto leading-relaxed">
                    A secure authentication link is waiting in your inbox. Please click or tap the link to verify your profile credentials.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleCheckEmailVerification}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white font-black py-3.5 rounded-xl hover:opacity-95 transition-all shadow-lg active:scale-98 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>I Have Verified My Email</span>
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleResendEmailVerification}
                    disabled={loading}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:border-slate-600 font-bold py-2.5 px-3 rounded-xl border border-slate-700/80 flex items-center justify-center space-x-1.5 text-xs transition-all active:scale-[0.98]"
                  >
                    <RotateCw size={13} className={loading ? "animate-spin" : ""} />
                    <span>Resend Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNativeCancel}
                    disabled={loading}
                    className="flex-1 bg-slate-800/60 text-slate-400 hover:text-red-400 hover:border-red-500/30 font-bold py-2.5 px-3 rounded-xl border border-slate-700/60 flex items-center justify-center space-x-1.5 text-xs transition-all active:scale-[0.98]"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
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
                      className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 transition-all font-medium"
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
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 transition-all font-medium"
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
                      className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-3 pl-10 pr-10 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
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
                      className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white font-black py-3.5 rounded-xl hover:opacity-95 transition-opacity active:scale-98 shadow-lg shadow-orange-500/15 flex items-center justify-center space-x-2 text-sm mt-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn size={16} />
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
                <div className="flex-grow border-t border-slate-800/60"></div>
                <span className="flex-shrink mx-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Or</span>
                <div className="flex-grow border-t border-slate-800/60"></div>
              </div>

              <button 
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 bg-white text-slate-900 font-bold py-3.5 rounded-xl hover:bg-slate-100 transition-all shadow-lg active:scale-98 text-sm"
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
          </div>
        </div>

        <p className="text-slate-500 text-xs font-medium leading-relaxed">
          Trusted by construction and electrical teams worldwide.<br/>
          &copy; {new Date().getFullYear()} Al-injaz Electric.
        </p>
      </motion.div>
    </div>
  );
}

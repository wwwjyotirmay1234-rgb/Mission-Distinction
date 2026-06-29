import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation, Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentLogin, useStudentRegister, useAdminLogin, useAdminRegister } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Activity, ShieldCheck, TrendingUp, Award, Zap } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";


import { ODISHA_GOVT_COLLEGES, ODISHA_PRIVATE_COLLEGES, MBBS_YEARS, SESSION_YEARS, ACTIVE_SESSION_YEAR, ACTIVE_MBBS_YEAR } from "@/lib/colleges";

function getRoute(year: string | undefined, sessionYear: string | undefined) {
  return (
    (year === ACTIVE_MBBS_YEAR || year === "1st Year MBBS") &&
    sessionYear === ACTIVE_SESSION_YEAR
  ) ? "/student/dashboard" : "/coming-soon";
}

const studentLoginSchema = z.object({
  identifier: z.string().min(1, "Email or Mobile is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const studentRegisterSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  year: z.string().min(1, "Select your year"),
  sessionYear: z.string().min(1, "Select your session year"),
  college: z.string().min(1, "Select your college"),
  agreeTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const adminLoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

const adminRegisterSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  workEmail: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  inviteCode: z.string().min(1, "Invite code is required"),
  agreeTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function LandingPage() {
  const [role, setRole] = useState<"student" | "admin">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { login, isAuthenticated, isAdmin, user } = useAuth();

  // ── Already logged in — go straight to the right dashboard ─────────────────
  // This is what makes the app feel like a real app: open it and you're in,
  // no login screen every time.
  if (isAuthenticated) {
    if (isAdmin) return <Redirect to="/admin/dashboard" />;
    const year = user?.year ?? undefined;
    const sessionYear = (user as any)?.sessionYear ?? undefined;
    return <Redirect to={getRoute(year, sessionYear)} />;
  }

  const studentLoginMutation = useStudentLogin();
  const studentRegisterMutation = useStudentRegister();
  const adminLoginMutation = useAdminLogin();
  const adminRegisterMutation = useAdminRegister();

  const finishGoogleAuth = async (idToken: string) => {
    const res = await fetch(`/api/auth/google`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Server auth failed");
    }
    const data = await res.json();
    login(data);
    toast.success("Signed in with Google!");
    // Google users may not have a year set yet — always route to dashboard
    // (1st year content) and prompt them to complete their profile in Settings.
    const year = data.user?.year;
    const sessionYear = data.user?.sessionYear;
    if (!year || !sessionYear) {
      toast.info("Welcome! Please set your college, year & session in Settings.", { duration: 6000 });
      setLocation("/student/dashboard");
    } else {
      setLocation(getRoute(year, sessionYear));
    }
  };

  useEffect(() => {
    let active = true;
    // Only show loading if we're returning from a Google redirect
    const redirectPending = sessionStorage.getItem("md_google_redirect") === "1";
    if (redirectPending) {
      setGoogleLoading(true);
      sessionStorage.removeItem("md_google_redirect");
    }

    // Track whether getRedirectResult already handled the auth so the
    // onAuthStateChanged fallback below doesn't double-fire.
    let handledByRedirectResult = false;

    getRedirectResult(auth)
      .then(async (result) => {
        if (!result || !active) {
          if (redirectPending) setGoogleLoading(false);
          return;
        }
        handledByRedirectResult = true;
        try {
          const idToken = await result.user.getIdToken();
          await finishGoogleAuth(idToken);
        } catch (err: any) {
          toast.error(err?.message || "Google sign-in failed. Please try again.");
          setGoogleLoading(false);
        }
      })
      .catch((err: any) => {
        const code: string = err?.code ?? "";
        if (code === "auth/unauthorized-domain") {
          toast.error(
            `Google sign-in blocked: add "${window.location.hostname}" to Firebase Console → Authentication → Settings → Authorized domains.`
          );
          setGoogleLoading(false);
        } else if (code && code !== "auth/no-auth-event") {
          toast.error(`Google sign-in failed (${code}). Please try again.`);
          setGoogleLoading(false);
        } else {
          if (redirectPending) setGoogleLoading(false);
        }
      });

    // Fallback for iOS/Android browsers that drop the auth event on redirect:
    // If we came back from a Google redirect but getRedirectResult returned null
    // (auth/no-auth-event), Firebase still has the signed-in user in its local
    // persistence. Catch that here and finish the backend auth handshake.
    let unsubscribe: (() => void) | null = null;
    if (redirectPending) {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!active || handledByRedirectResult || !firebaseUser) return;
        // Give getRedirectResult a short head-start to avoid a race.
        await new Promise((r) => setTimeout(r, 500));
        if (!active || handledByRedirectResult) return;
        handledByRedirectResult = true;
        try {
          const idToken = await firebaseUser.getIdToken();
          await finishGoogleAuth(idToken);
        } catch (err: any) {
          toast.error(err?.message || "Google sign-in failed. Please try again.");
          setGoogleLoading(false);
        }
      });
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    // Cannot run inside an iframe (Replit canvas preview).
    if (window.self !== window.top) {
      window.open(window.location.href, "_blank");
      toast.info("Opening in a new tab — sign in with Google there.");
      return;
    }

    setGoogleLoading(true);

    // On mobile or PWA standalone mode, popups are always blocked by the OS/browser.
    // Skip straight to redirect so it works on the first tap every time.
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

    if (isMobile || isStandalone) {
      try {
        sessionStorage.setItem("md_google_redirect", "1");
        await signInWithRedirect(auth, googleProvider);
        // Page navigates away — result handled in useEffect via getRedirectResult.
      } catch {
        sessionStorage.removeItem("md_google_redirect");
        toast.error("Could not start Google sign-in. Please try again.");
        setGoogleLoading(false);
      }
      return;
    }

    // Desktop: popup is reliable and faster (no page reload needed).
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      await finishGoogleAuth(idToken);
    } catch (err: any) {
      const code: string = err?.code ?? "";
      if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user") {
        // Popup was blocked on desktop — fall back to redirect
        try {
          sessionStorage.setItem("md_google_redirect", "1");
          await signInWithRedirect(auth, googleProvider);
        } catch {
          sessionStorage.removeItem("md_google_redirect");
          toast.error("Popup blocked. Please allow popups for this site and try again.");
          setGoogleLoading(false);
        }
      } else if (code === "auth/unauthorized-domain") {
        toast.error(`Google sign-in blocked. Add "${window.location.hostname}" to Firebase Console → Authentication → Authorized domains.`);
        setGoogleLoading(false);
      } else if (code === "auth/cancelled-popup-request") {
        // User clicked the button multiple times — silently reset
        setGoogleLoading(false);
      } else if (code) {
        toast.error(`Google sign-in failed (${code}). Please try again.`);
        setGoogleLoading(false);
      } else {
        setGoogleLoading(false);
      }
    }
  };

  const studentLoginForm = useForm<z.infer<typeof studentLoginSchema>>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const studentRegisterForm = useForm<z.infer<typeof studentRegisterSchema>>({
    resolver: zodResolver(studentRegisterSchema),
    defaultValues: {
      fullName: "", email: "", password: "", confirmPassword: "", year: "", sessionYear: "", college: "", agreeTerms: false,
    },
  });

  const adminLoginForm = useForm<z.infer<typeof adminLoginSchema>>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const adminRegisterForm = useForm<z.infer<typeof adminRegisterSchema>>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      fullName: "", workEmail: "", password: "", confirmPassword: "", inviteCode: "", agreeTerms: false,
    },
  });

  function getApiError(err: unknown, fallback: string): string {
    const data = (err as any)?.data;
    if (data?.error && typeof data.error === "string") return data.error;
    if (data?.message && typeof data.message === "string") return data.message;
    return fallback;
  }

  const onStudentLogin = (values: z.infer<typeof studentLoginSchema>) => {
    studentLoginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        login(res);
        toast.success("Login successful!");
        setLocation(getRoute(res.user?.year ?? undefined, (res.user as any)?.sessionYear ?? undefined));
      },
      onError: (err) => {
        toast.error(getApiError(err, "Login failed. Please check your credentials."));
      }
    });
  };

  const onStudentRegister = (values: z.infer<typeof studentRegisterSchema>) => {
    studentRegisterMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        login(res);
        toast.success("Account created successfully!");
        setLocation(getRoute(values.year, values.sessionYear));
      },
      onError: (err) => {
        toast.error(getApiError(err, "Registration failed. Please try again."));
      }
    });
  };

  const onAdminLogin = (values: z.infer<typeof adminLoginSchema>) => {
    adminLoginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        login(res);
        toast.success("Admin login successful!");
        setLocation("/admin/dashboard");
      },
      onError: (err) => {
        toast.error(getApiError(err, "Admin login failed. Please check your credentials."));
      }
    });
  };

  const onAdminRegister = (values: z.infer<typeof adminRegisterSchema>) => {
    adminRegisterMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        login(res);
        toast.success("Admin account created!");
        setLocation("/admin/dashboard");
      },
      onError: (err) => {
        toast.error(getApiError(err, "Admin registration failed. Please try again."));
      }
    });
  };

  if (googleLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-5">
        <div className="relative flex items-center justify-center w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
          <svg className="w-7 h-7" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-foreground">Completing Google sign-in…</p>
          <p className="text-sm text-muted-foreground mt-1">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="container mx-auto px-4 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 min-w-0">
          <img src="/md-logo-new.png" alt="Mission Distinction" className="h-9 w-9 flex-shrink-0 object-contain rounded-xl" />
          <span className="text-base font-bold whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Mission Distinction
          </span>
        </div>
        
        <div className="flex items-center bg-card border border-border rounded-full p-1 ml-2 flex-shrink-0">
          <button
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${role === "student" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setRole("student")}
            data-testid="btn-role-student"
          >
            Student
          </button>
          <button
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${role === "admin" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setRole("admin")}
            data-testid="btn-role-admin"
          >
            Admin
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 py-2 gap-0 z-10">

        {/* ── Hero: open background, subtle arc, caduceus ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="relative w-full flex justify-center items-end"
          style={{ height: 210 }}
        >
          {/* Single faint arc beautifully curving behind caduceus */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 375 210" preserveAspectRatio="xMidYMax meet">
            <path d="M 0 210 A 188 220 0 0 1 375 210" fill="none" stroke="rgba(109,40,217,0.28)" strokeWidth="1"/>
          </svg>

          {/* Sparkle stars */}
          <div className="absolute" style={{top:18,left:"20%",width:4,height:4,borderRadius:"50%",background:"rgba(196,181,253,0.9)",boxShadow:"0 0 5px rgba(196,181,253,0.6)"}}/>
          <div className="absolute" style={{top:10,left:"31%",width:2,height:2,borderRadius:"50%",background:"rgba(167,139,250,0.7)"}}/>
          <div className="absolute" style={{top:16,right:"20%",width:4,height:4,borderRadius:"50%",background:"rgba(196,181,253,0.9)",boxShadow:"0 0 5px rgba(196,181,253,0.6)"}}/>
          <div className="absolute" style={{top:9,right:"32%",width:2,height:2,borderRadius:"50%",background:"rgba(167,139,250,0.7)"}}/>
          <div className="absolute" style={{top:48,left:"9%",width:2,height:2,borderRadius:"50%",background:"rgba(167,139,250,0.4)"}}/>
          <div className="absolute" style={{top:48,right:"9%",width:2,height:2,borderRadius:"50%",background:"rgba(167,139,250,0.4)"}}/>

          {/* ── Caduceus hero image ── */}
          <img
            src="/caduceus-hero-nobg.png"
            alt="Medical Caduceus"
            width={220}
            height={220}
            className="relative z-10"
            style={{ filter: "drop-shadow(0 0 18px rgba(124,58,237,0.65))" }}
          />
        </motion.div>

        {/* ── Title ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mt-2 mb-4 px-4"
        >
          <p className="font-normal text-white/75 mb-1" style={{fontSize:16}}>Welcome to</p>
          <h1 className="font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-400 to-secondary" style={{fontSize:"2.6rem",lineHeight:1.1}}>
            Mission Distinction
          </h1>
        </motion.div>

        {/* ── Motto Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-md text-center mb-5 px-4"
        >
          {/* Top ornate lotus divider — SVG, matches reference exactly */}
          <div className="flex justify-center mb-3">
            <svg width="320" height="36" viewBox="0 0 320 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Left line */}
              <line x1="0" y1="18" x2="118" y2="18" stroke="#C8A340" strokeWidth="0.8" opacity="0.85"/>
              {/* Left scroll ε */}
              <path d="M122 18 C124 14,130 12,132 16 C130 19,124 20,122 18Z" stroke="#C8A340" strokeWidth="0.85" fill="none"/>
              {/* Right scroll ɜ */}
              <path d="M198 18 C196 14,190 12,188 16 C190 19,196 20,198 18Z" stroke="#C8A340" strokeWidth="0.85" fill="none"/>
              {/* Right line */}
              <line x1="202" y1="18" x2="320" y2="18" stroke="#C8A340" strokeWidth="0.8" opacity="0.85"/>

              {/* ── Lotus petals (center 160, 20) ── */}
              {/* Center tall petal */}
              <path d="M160 5 C157 9,155 15,158 20 C160 22,162 20,162 20 C165 15,163 9,160 5Z" stroke="#C8A340" strokeWidth="0.9" fill="none"/>
              {/* Inner left petal */}
              <path d="M152 10 C147 11,144 16,147 20 C150 23,156 21,158 20" stroke="#C8A340" strokeWidth="0.9" fill="none"/>
              {/* Inner right petal */}
              <path d="M168 10 C173 11,176 16,173 20 C170 23,164 21,162 20" stroke="#C8A340" strokeWidth="0.9" fill="none"/>
              {/* Outer left petal */}
              <path d="M145 14 C139 12,136 18,140 23 C143 26,150 23,152 21" stroke="#C8A340" strokeWidth="0.9" fill="none"/>
              {/* Outer right petal */}
              <path d="M175 14 C181 12,184 18,180 23 C177 26,170 23,168 21" stroke="#C8A340" strokeWidth="0.9" fill="none"/>
              {/* Base horizontal stem */}
              <path d="M144 22 Q160 28 176 22" stroke="#C8A340" strokeWidth="0.8" fill="none"/>
              {/* Centre seed dot */}
              <circle cx="160" cy="24" r="1.4" fill="#C8A340"/>
            </svg>
          </div>

          {/* Sanskrit */}
          <p className="font-bold mb-2" style={{
            color:"#C8A340",
            fontSize:20,
            lineHeight:1.4,
            fontFamily:"sans-serif",
          }}>
            ।। ज्ञानेन आरोग्यं, आरोग्येन सेवा, सेवया मानवकल्याणम्।।
          </p>

          {/* Transliteration */}
          <p className="italic mb-3" style={{color:"#C8A340",fontSize:13,fontFamily:"Georgia, serif",lineHeight:1.5}}>
            (Jñānena Ārogyaṁ, Ārogyena Sevā, Sevayā Mānava-Kalyāṇam.)
          </p>

          {/* Middle divider — between transliteration and English */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-px" style={{background:"linear-gradient(to right, transparent, #C8A340)"}}/>
            <span style={{color:"#C8A340",fontSize:10}}>◇</span>
            <div className="flex-1 h-px" style={{background:"linear-gradient(to left, transparent, #C8A340)"}}/>
          </div>

          {/* English */}
          <p className="italic leading-relaxed" style={{color:"#C8A340",fontSize:13,fontFamily:"Georgia, serif",lineHeight:1.75}}>
            Through knowledge comes health,<br/>
            through health comes service,<br/>
            and through service comes the welfare of humanity.
          </p>

          {/* Bottom ornamental divider */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex-1 h-px" style={{background:"linear-gradient(to right, transparent, #C8A340)"}}/>
            <span style={{color:"#C8A340",fontSize:14}}>✾</span>
            <div className="flex-1 h-px" style={{background:"linear-gradient(to left, transparent, #C8A340)"}}/>
          </div>
        </motion.div>

        {/* ── Auth Forms ── */}
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl">
              {role === "student" ? (
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 bg-muted/50 rounded-t-lg rounded-b-none border-b border-border p-0 h-auto">
                    <TabsTrigger value="login" className="py-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Login</TabsTrigger>
                    <TabsTrigger value="register" className="py-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Register</TabsTrigger>
                  </TabsList>
                  
                  {/* Student Login */}
                  <TabsContent value="login" className="p-6 m-0">
                    <Form {...studentLoginForm}>
                      <form onSubmit={studentLoginForm.handleSubmit(onStudentLogin)} className="space-y-4">
                        <FormField
                          control={studentLoginForm.control}
                          name="identifier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email / Mobile</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your email or mobile" autoComplete="username" {...field} className="bg-background/50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={studentLoginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel>Password</FormLabel>
                                <a href="/forgot-password" className="text-xs text-primary hover:underline">Forgot Password?</a>
                              </div>
                              <FormControl>
                                <div className="relative">
                                  <Input type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" {...field} className="bg-background/50 pr-10" />
                                  <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={studentLoginMutation.isPending}>
                          {studentLoginMutation.isPending ? "Logging in..." : "Login"}
                        </Button>
                        <div className="relative my-1">
                          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/40" /></div>
                          <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
                        </div>
                        <Button type="button" variant="outline" className="w-full gap-2 bg-background/50" onClick={handleGoogleSignIn} disabled={googleLoading}>
                          <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                          {googleLoading ? "Signing in..." : "Continue with Google"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>

                  {/* Student Register */}
                  <TabsContent value="register" className="p-6 m-0">
                    <Form {...studentRegisterForm}>
                      <form onSubmit={studentRegisterForm.handleSubmit(onStudentRegister)} className="space-y-4">
                        <FormField
                          control={studentRegisterForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} className="bg-background/50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={studentRegisterForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="john@example.com" autoComplete="email" {...field} className="bg-background/50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={studentRegisterForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                  <Input type="password" autoComplete="new-password" {...field} className="bg-background/50" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={studentRegisterForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                  <Input type="password" autoComplete="new-password" {...field} className="bg-background/50" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={studentRegisterForm.control}
                            name="year"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Year <span className="text-destructive">*</span></FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-background/50">
                                      <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {MBBS_YEARS.map((y) => (
                                      <SelectItem key={y} value={y}>{y}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={studentRegisterForm.control}
                            name="sessionYear"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Session Year <span className="text-destructive">*</span></FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-background/50">
                                      <SelectValue placeholder="e.g. 2025-26" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {SESSION_YEARS.map((s) => (
                                      <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={studentRegisterForm.control}
                            name="college"
                            render={({ field }) => (
                              <FormItem className="col-span-2">
                                <FormLabel>College <span className="text-destructive">*</span></FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-background/50">
                                      <SelectValue placeholder="Select your medical college" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="max-h-64">
                                    <SelectGroup>
                                      <SelectLabel className="text-xs text-primary font-semibold px-2 py-1">🏛️ Government Colleges</SelectLabel>
                                      {ODISHA_GOVT_COLLEGES.map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                      ))}
                                    </SelectGroup>
                                    <SelectGroup>
                                      <SelectLabel className="text-xs text-secondary font-semibold px-2 py-1 mt-1">🏥 Private Colleges</SelectLabel>
                                      {ODISHA_PRIVATE_COLLEGES.map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                      ))}
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={studentRegisterForm.control}
                          name="agreeTerms"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal text-muted-foreground">
                                  I agree to the{" "}
                                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Terms of Service</a>
                                  {" "}and{" "}
                                  <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Privacy Policy</a>
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={studentRegisterMutation.isPending}>
                          {studentRegisterMutation.isPending ? "Creating Account..." : "Create Account"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              ) : (
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 bg-muted/50 rounded-t-lg rounded-b-none border-b border-border p-0 h-auto">
                    <TabsTrigger value="login" className="py-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-secondary rounded-none">Admin Login</TabsTrigger>
                    <TabsTrigger value="register" className="py-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-secondary rounded-none">Register</TabsTrigger>
                  </TabsList>
                  
                  {/* Admin Login */}
                  <TabsContent value="login" className="p-6 m-0">
                    <Form {...adminLoginForm}>
                      <form onSubmit={adminLoginForm.handleSubmit(onAdminLogin)} className="space-y-4">
                        <FormField
                          control={adminLoginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Work Email</FormLabel>
                              <FormControl>
                                <Input placeholder="admin@mission.edu" autoComplete="email" {...field} className="bg-background/50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={adminLoginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel>Password</FormLabel>
                                <a href="/forgot-password" className="text-xs text-secondary hover:underline">Forgot Password?</a>
                              </div>
                              <FormControl>
                                <div className="relative">
                                  <Input type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" {...field} className="bg-background/50 pr-10" />
                                  <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" variant="secondary" className="w-full" disabled={adminLoginMutation.isPending}>
                          {adminLoginMutation.isPending ? "Authenticating..." : "Login to Dashboard"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>

                  {/* Admin Register */}
                  <TabsContent value="register" className="p-6 m-0">
                    <Form {...adminRegisterForm}>
                      <form onSubmit={adminRegisterForm.handleSubmit(onAdminRegister)} className="space-y-4">
                        <FormField
                          control={adminRegisterForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Admin Name" {...field} className="bg-background/50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={adminRegisterForm.control}
                          name="workEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Work Email</FormLabel>
                              <FormControl>
                                <Input placeholder="admin@mission.edu" autoComplete="email" {...field} className="bg-background/50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={adminRegisterForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input type="password" autoComplete="new-password" {...field} className="bg-background/50" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={adminRegisterForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm</FormLabel>
                                <FormControl>
                                  <Input type="password" autoComplete="new-password" {...field} className="bg-background/50" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={adminRegisterForm.control}
                          name="inviteCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Invite Code</FormLabel>
                              <FormControl>
                                <Input placeholder="Provided by Super Admin" {...field} className="bg-background/50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={adminRegisterForm.control}
                          name="agreeTerms"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal text-muted-foreground">
                                  I agree to the{" "}
                                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Terms of Service</a>
                                  {" "}and{" "}
                                  <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Privacy Policy</a>
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                        <Button type="submit" variant="secondary" className="w-full" disabled={adminRegisterMutation.isPending}>
                          {adminRegisterMutation.isPending ? "Creating..." : "Create Admin Account"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              )}
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Features Bottom Bar */}
      <div className="container mx-auto px-4 py-8 z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card/40 backdrop-blur border border-border p-4 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-primary/20 text-primary rounded-lg"><ShieldCheck size={20} /></div>
            <div>
              <h4 className="text-sm font-semibold">MBBS-First Content</h4>
              <p className="text-xs text-muted-foreground">1st year syllabus, Odisha-curated</p>
            </div>
          </div>
          <div className="bg-card/40 backdrop-blur border border-border p-4 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-secondary/20 text-secondary rounded-lg"><Zap size={20} /></div>
            <div>
              <h4 className="text-sm font-semibold">Anatomy to Biochemistry</h4>
              <p className="text-xs text-muted-foreground">All pre-clinical subjects covered</p>
            </div>
          </div>
          <div className="bg-card/40 backdrop-blur border border-border p-4 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-green-500/20 text-green-500 rounded-lg"><TrendingUp size={20} /></div>
            <div>
              <h4 className="text-sm font-semibold">Beat the MBBS Curve</h4>
              <p className="text-xs text-muted-foreground">Track streaks & college rank</p>
            </div>
          </div>
          <div className="bg-card/40 backdrop-blur border border-border p-4 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 text-orange-500 rounded-lg"><Award size={20} /></div>
            <div>
              <h4 className="text-sm font-semibold">Doubt? Ask Instantly</h4>
              <p className="text-xs text-muted-foreground">Peer Q&A + senior mentors</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

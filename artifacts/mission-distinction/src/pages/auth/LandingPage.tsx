import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation } from "wouter";
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
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

const ODISHA_GOVT_COLLEGES = [
  "AIIMS Bhubaneswar",
  "SCB Medical College and Hospital, Cuttack",
  "MKCG Medical College and Hospital, Berhampur",
  "VSS Institute of Medical Sciences & Research (VIMSAR), Burla",
  "Pandit Raghunath Murmu Medical College & Hospital, Baripada",
  "Saheed Laxman Nayak Medical College & Hospital, Koraput",
  "Shri Jagannath Medical College & Research Institute, Puri",
  "Government Medical College, Bolangir",
  "Government Medical College, Balasore",
  "Government Medical College, Puri",
  "Government Medical College, Phulbani",
  "Government Medical College, Sundargarh",
];

const ODISHA_PRIVATE_COLLEGES = [
  "Hi-Tech Medical College & Hospital, Bhubaneswar",
  "IMS & SUM Hospital (SOA University), Bhubaneswar",
  "Kalinga Institute of Medical Sciences (KIMS), Bhubaneswar",
];

function getRouteByYear(year: string | undefined) {
  return (year === "1st Year" || year === "1st Year MBBS") ? "/student/dashboard" : "/coming-soon";
}

const studentLoginSchema = z.object({
  identifier: z.string().min(1, "Email or Mobile is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const studentRegisterSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  mobileNumber: z.string().optional(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  year: z.string().min(1, "Select your year"),
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
  const { login } = useAuth();

  const studentLoginMutation = useStudentLogin();
  const studentRegisterMutation = useStudentRegister();
  const adminLoginMutation = useAdminLogin();
  const adminRegisterMutation = useAdminRegister();

  const finishGoogleAuth = async (idToken: string) => {
    const res = await fetch(`/api/auth/google`, {
      method: "POST",
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
    setLocation(getRouteByYear(data.user?.year));
  };

  useEffect(() => {
    let active = true;
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result || !active) return;
        try {
          const idToken = await result.user.getIdToken();
          await finishGoogleAuth(idToken);
        } catch (err: any) {
          toast.error(err?.message || "Google sign-in failed after redirect. Please try again.");
        }
      })
      .catch((err: any) => {
        const code: string = err?.code ?? "";
        if (code === "auth/unauthorized-domain") {
          toast.error(
            `Google sign-in blocked: add "${window.location.hostname}" to Firebase Console → Authentication → Settings → Authorized domains.`
          );
        } else if (code && code !== "auth/no-auth-event") {
          toast.error(`Google sign-in failed (${code}). Please try again.`);
        }
      });
    return () => { active = false; };
  }, []);

  const handleGoogleSignIn = async () => {
    // Google sign-in cannot run inside an iframe (Replit canvas preview).
    // Open the app in a real top-level tab where popups and redirects work normally.
    if (window.self !== window.top) {
      window.open(window.location.href, "_blank");
      toast.info("Opening in a new tab — sign in with Google there.");
      return;
    }

    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      await finishGoogleAuth(idToken);
    } catch (err: any) {
      const code: string = err?.code ?? "";
      if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
        try {
          await signInWithRedirect(auth, googleProvider);
          // page navigates away — setGoogleLoading handled on return via useEffect
          return;
        } catch {
          toast.error("Google sign-in failed. Please allow popups or try a different browser.");
        }
      } else if (code === "auth/unauthorized-domain") {
        toast.error(
          `Google sign-in blocked: add "${window.location.hostname}" to Firebase Console → Authentication → Settings → Authorized domains.`
        );
      } else if (code === "auth/popup-closed-by-user") {
        // user dismissed — no toast needed
      } else if (err?.message) {
        toast.error(err.message);
      } else {
        toast.error("Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const studentLoginForm = useForm<z.infer<typeof studentLoginSchema>>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const studentRegisterForm = useForm<z.infer<typeof studentRegisterSchema>>({
    resolver: zodResolver(studentRegisterSchema),
    defaultValues: {
      fullName: "", email: "", mobileNumber: "", password: "", confirmPassword: "", year: "", college: "", agreeTerms: false,
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
        setLocation(getRouteByYear(res.user?.year));
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
        setLocation(getRouteByYear(values.year));
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="container mx-auto px-4 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 min-w-0">
          <img src="/logo.jpeg" alt="Mission Distinction" className="h-9 w-9 flex-shrink-0 object-contain rounded-xl" />
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
      <main className="flex-1 flex flex-col items-center justify-center container mx-auto px-4 py-2 gap-0 z-10">

        {/* Caduceus with arc background */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="relative flex items-center justify-center mb-2"
          style={{ width: 280, height: 190 }}
        >
          {/* Dark semi-circular arc behind the symbol */}
          <div className="absolute inset-0 flex items-start justify-center pointer-events-none">
            <div style={{
              width: 260,
              height: 160,
              borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
              background: "radial-gradient(ellipse at 50% 80%, rgba(109,40,217,0.18) 0%, rgba(15,10,40,0.55) 60%, transparent 100%)",
            }} />
          </div>
          {/* Sparkle dots */}
          <div className="absolute top-4 left-8 w-1 h-1 rounded-full bg-purple-300/60" />
          <div className="absolute top-8 left-16 w-0.5 h-0.5 rounded-full bg-purple-200/50" />
          <div className="absolute top-3 right-10 w-1 h-1 rounded-full bg-purple-300/60" />
          <div className="absolute top-10 right-14 w-0.5 h-0.5 rounded-full bg-purple-200/40" />
          <div className="absolute top-16 left-6 w-0.5 h-0.5 rounded-full bg-purple-400/40" />
          <div className="absolute top-16 right-6 w-0.5 h-0.5 rounded-full bg-purple-400/40" />
          {/* The caduceus SVG */}
          <svg width="200" height="185" viewBox="0 0 200 185" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
            {/* --- Wings --- */}
            {/* Left wing - outer feather */}
            <path d="M100 48 C85 40, 55 30, 20 35 C40 38, 60 44, 75 52Z" fill="#7C3AED" opacity="0.85"/>
            <path d="M100 48 C82 38, 48 24, 10 28 C32 33, 58 40, 78 50Z" fill="#6D28D9" opacity="0.65"/>
            <path d="M100 48 C80 36, 44 18, 5 20 C28 27, 56 36, 80 48Z" fill="#5B21B6" opacity="0.45"/>
            {/* Right wing - outer feather */}
            <path d="M100 48 C115 40, 145 30, 180 35 C160 38, 140 44, 125 52Z" fill="#7C3AED" opacity="0.85"/>
            <path d="M100 48 C118 38, 152 24, 190 28 C168 33, 142 40, 122 50Z" fill="#6D28D9" opacity="0.65"/>
            <path d="M100 48 C120 36, 156 18, 195 20 C172 27, 144 36, 120 48Z" fill="#5B21B6" opacity="0.45"/>

            {/* --- Laurel branches --- */}
            {/* Left branch stem */}
            <path d="M100 75 C88 78, 72 84, 55 95 C65 90, 78 86, 92 82Z" stroke="#6D28D9" strokeWidth="1.5" fill="none" opacity="0.8"/>
            <path d="M100 90 C85 93, 68 100, 48 114 C60 107, 76 101, 92 96Z" stroke="#6D28D9" strokeWidth="1.5" fill="none" opacity="0.7"/>
            <path d="M100 108 C84 112, 65 120, 44 136 C57 128, 74 121, 92 114Z" stroke="#5B21B6" strokeWidth="1.5" fill="none" opacity="0.6"/>
            {/* Left leaves */}
            <ellipse cx="70" cy="88" rx="10" ry="5" fill="#6D28D9" opacity="0.7" transform="rotate(-30 70 88)"/>
            <ellipse cx="56" cy="103" rx="10" ry="5" fill="#6D28D9" opacity="0.65" transform="rotate(-35 56 103)"/>
            <ellipse cx="50" cy="121" rx="10" ry="5" fill="#5B21B6" opacity="0.6" transform="rotate(-40 50 121)"/>
            {/* Right branch stem */}
            <path d="M100 75 C112 78, 128 84, 145 95 C135 90, 122 86, 108 82Z" stroke="#6D28D9" strokeWidth="1.5" fill="none" opacity="0.8"/>
            <path d="M100 90 C115 93, 132 100, 152 114 C140 107, 124 101, 108 96Z" stroke="#6D28D9" strokeWidth="1.5" fill="none" opacity="0.7"/>
            <path d="M100 108 C116 112, 135 120, 156 136 C143 128, 126 121, 108 114Z" stroke="#5B21B6" strokeWidth="1.5" fill="none" opacity="0.6"/>
            {/* Right leaves */}
            <ellipse cx="130" cy="88" rx="10" ry="5" fill="#6D28D9" opacity="0.7" transform="rotate(30 130 88)"/>
            <ellipse cx="144" cy="103" rx="10" ry="5" fill="#6D28D9" opacity="0.65" transform="rotate(35 144 103)"/>
            <ellipse cx="150" cy="121" rx="10" ry="5" fill="#5B21B6" opacity="0.6" transform="rotate(40 150 121)"/>

            {/* --- Staff --- */}
            <rect x="97" y="30" width="6" height="148" rx="3" fill="url(#staffGrad)"/>
            <defs>
              <linearGradient id="staffGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C4B5FD"/>
                <stop offset="100%" stopColor="#6D28D9"/>
              </linearGradient>
            </defs>

            {/* --- Snakes --- */}
            <path d="M100 45 C82 57, 118 72, 100 87 C82 102, 118 117, 100 132 C82 147, 118 162, 100 175" stroke="#A78BFA" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M100 45 C118 57, 82 72, 100 87 C118 102, 82 117, 100 132 C118 147, 82 162, 100 175" stroke="#8B5CF6" strokeWidth="3" fill="none" strokeLinecap="round"/>
            {/* Snake heads */}
            <circle cx="92" cy="177" r="4.5" fill="#A78BFA"/>
            <circle cx="108" cy="177" r="4.5" fill="#8B5CF6"/>
            {/* Tongue left */}
            <path d="M90 180 L87 183 M90 180 L88 184" stroke="#C4B5FD" strokeWidth="1" strokeLinecap="round"/>
            {/* Tongue right */}
            <path d="M110 180 L113 183 M110 180 L112 184" stroke="#DDD6FE" strokeWidth="1" strokeLinecap="round"/>

            {/* --- Orb / Star at top --- */}
            <circle cx="100" cy="26" r="7" fill="#C4B5FD" opacity="0.9"/>
            <circle cx="100" cy="26" r="4" fill="white" opacity="0.7"/>
            {/* Star rays */}
            <path d="M100 16 L101.5 22 L108 22 L103 26 L105 32 L100 28 L95 32 L97 26 L92 22 L98.5 22 Z" fill="#EDE9FE" opacity="0.95"/>
          </svg>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-3"
        >
          <p className="text-base text-foreground/70 mb-1 font-light">Welcome to</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-400 to-secondary">
            Mission Distinction
          </h1>
        </motion.div>

        {/* Motto Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-md text-center mb-5 px-3"
        >
          {/* Top divider — ornate lotus style */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-600/50 to-amber-500/70" />
            <span className="text-amber-500/80 text-xs">❧</span>
            <span className="text-amber-400 text-base leading-none">🪷</span>
            <span className="text-amber-500/80 text-xs">❧</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-600/50 to-amber-500/70" />
          </div>

          {/* Sanskrit */}
          <p className="text-amber-400 font-bold text-sm sm:text-base leading-relaxed mb-1">
            || ज्ञानेन आरोग्यं, आरोग्येन सेवा, सेवया मानवकल्याणम् ||
          </p>
          {/* Transliteration */}
          <p className="text-amber-300/65 text-xs sm:text-sm italic mb-2">
            (Jñānena Ārogyaṁ, Ārogyena Sevā, Sevayā Mānava-Kalyāṇam.)
          </p>
          {/* English */}
          <p className="text-foreground/55 text-xs sm:text-sm italic leading-relaxed">
            Through knowledge comes health,<br/>
            through health comes service,<br/>
            and through service comes the welfare of humanity.
          </p>

          {/* Bottom divider — diamond dots */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-600/40 to-amber-500/50" />
            <span className="text-amber-600/50 text-[8px]">◆</span>
            <span className="text-amber-500/60 text-xs">✦</span>
            <span className="text-amber-600/50 text-[8px]">◆</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-600/40 to-amber-500/50" />
          </div>
        </motion.div>

        {/* Auth Forms */}
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
                                <Input placeholder="Enter your email or mobile" {...field} className="bg-background/50" />
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
                                  <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" {...field} className="bg-background/50 pr-10" />
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
                              <FormLabel>Full Name</FormLabel>
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
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="john@example.com" {...field} className="bg-background/50" />
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
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} className="bg-background/50" />
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
                                <FormLabel>Confirm</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} className="bg-background/50" />
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
                                <FormLabel>Year</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-background/50">
                                      <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="1st Year">1st Year</SelectItem>
                                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                                    <SelectItem value="4th Year">4th Year</SelectItem>
                                    <SelectItem value="Final Year">Final Year</SelectItem>
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
                                <FormLabel>College</FormLabel>
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
                        <div className="relative my-1">
                          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/40" /></div>
                          <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
                        </div>
                        <Button type="button" variant="outline" className="w-full gap-2 bg-background/50" onClick={handleGoogleSignIn} disabled={googleLoading}>
                          <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                          {googleLoading ? "Signing in..." : "Sign up with Google"}
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
                                <Input placeholder="admin@mission.edu" {...field} className="bg-background/50" />
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
                                  <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" {...field} className="bg-background/50 pr-10" />
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
                                <Input placeholder="admin@mission.edu" {...field} className="bg-background/50" />
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
                                  <Input type="password" {...field} className="bg-background/50" />
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
                                  <Input type="password" {...field} className="bg-background/50" />
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

import React, { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Activity, ShieldCheck, TrendingUp, Award, Zap } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const studentLoginSchema = z.object({
  identifier: z.string().min(1, "Email or Mobile is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const studentRegisterSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  mobileNumber: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password"),
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
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password"),
  inviteCode: z.string().min(1, "Invite code is required"),
  agreeTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function LandingPage() {
  const [role, setRole] = useState<"student" | "admin">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const studentLoginMutation = useStudentLogin();
  const studentRegisterMutation = useStudentRegister();
  const adminLoginMutation = useAdminLogin();
  const adminRegisterMutation = useAdminRegister();

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

  const onStudentLogin = (values: z.infer<typeof studentLoginSchema>) => {
    studentLoginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        login(res);
        toast.success("Login successful!");
        setLocation("/student/dashboard");
      },
      onError: (err) => {
        toast.error("Login failed. Please check your credentials.");
      }
    });
  };

  const onStudentRegister = (values: z.infer<typeof studentRegisterSchema>) => {
    studentRegisterMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        login(res);
        toast.success("Account created successfully!");
        setLocation("/student/dashboard");
      },
      onError: (err) => {
        toast.error("Registration failed. Please try again.");
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
        toast.error("Admin login failed.");
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
        toast.error("Admin registration failed.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center border border-primary/30">
            <Activity size={24} className="text-primary" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Mission Distinction
          </span>
        </div>
        
        <div className="flex items-center bg-card border border-border rounded-full p-1">
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
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center container mx-auto px-4 py-12 gap-12 z-10">
        
        {/* Left Side: Hero Text */}
        <div className="flex-1 text-center lg:text-left max-w-2xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl lg:text-6xl font-extrabold tracking-tight mb-6"
          >
            Welcome to <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Mission Distinction
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg lg:text-xl text-muted-foreground mb-8"
          >
            Smart Learning. Better Results. Bright Future. <br/>
            The definitive medical education platform for 1st year MBBS students.
          </motion.p>
        </div>

        {/* Right Side: Auth Forms */}
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
                                <a href="#" className="text-xs text-primary hover:underline">Forgot Password?</a>
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
                                    <SelectItem value="1st Year MBBS">1st Year MBBS</SelectItem>
                                    <SelectItem value="2nd Year MBBS">2nd Year MBBS</SelectItem>
                                    <SelectItem value="3rd Year MBBS">3rd Year MBBS</SelectItem>
                                    <SelectItem value="4th Year MBBS">4th Year MBBS</SelectItem>
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
                              <FormItem>
                                <FormLabel>College</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-background/50">
                                      <SelectValue placeholder="Select College" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="AIIMS Delhi">AIIMS Delhi</SelectItem>
                                    <SelectItem value="MAMC Delhi">MAMC Delhi</SelectItem>
                                    <SelectItem value="AFMC Pune">AFMC Pune</SelectItem>
                                    <SelectItem value="JIPMER Pune">JIPMER Pune</SelectItem>
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
                                  I agree to the Terms & Conditions
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
                                <a href="#" className="text-xs text-secondary hover:underline">Forgot Password?</a>
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
                                  I agree to the Terms & Conditions
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
              <h4 className="text-sm font-semibold">Secure & Reliable</h4>
              <p className="text-xs text-muted-foreground">Trusted by thousands</p>
            </div>
          </div>
          <div className="bg-card/40 backdrop-blur border border-border p-4 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-secondary/20 text-secondary rounded-lg"><Zap size={20} /></div>
            <div>
              <h4 className="text-sm font-semibold">Seamless Learning</h4>
              <p className="text-xs text-muted-foreground">On any device</p>
            </div>
          </div>
          <div className="bg-card/40 backdrop-blur border border-border p-4 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-green-500/20 text-green-500 rounded-lg"><TrendingUp size={20} /></div>
            <div>
              <h4 className="text-sm font-semibold">Track Progress</h4>
              <p className="text-xs text-muted-foreground">Real-time analytics</p>
            </div>
          </div>
          <div className="bg-card/40 backdrop-blur border border-border p-4 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 text-orange-500 rounded-lg"><Award size={20} /></div>
            <div>
              <h4 className="text-sm font-semibold">Achieve More</h4>
              <p className="text-xs text-muted-foreground">Rank higher</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

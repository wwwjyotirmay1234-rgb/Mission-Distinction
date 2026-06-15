import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft, Mail, CheckCircle, Copy } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
      const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      setSent(true);
      if (data.devLink) setDevLink(data.devLink);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <img src="/logo.jpeg" alt="Mission Distinction" className="h-10 w-10 object-contain rounded-xl" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Mission Distinction
          </span>
        </div>

        <Card className="bg-card/80 border-border/50 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">
              {sent ? "Check your email" : "Forgot Password?"}
            </CardTitle>
            <CardDescription>
              {sent
                ? "If that email is registered, a reset link has been sent."
                : "Enter your registered email and we'll send you a reset link."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="text-green-500" size={28} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Check your inbox and click the link to reset your password. The link expires in <strong>1 hour</strong>.
                  </p>
                </div>

                {devLink && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-xs font-semibold text-yellow-400 mb-2 flex items-center gap-1">
                      <Mail size={12} /> Dev mode — email not configured
                    </p>
                    <p className="text-xs text-muted-foreground mb-2 break-all">{devLink}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => { navigator.clipboard.writeText(devLink); toast.success("Copied!"); }}
                    >
                      <Copy size={12} /> Copy Link
                    </Button>
                  </div>
                )}

                <Button asChild className="w-full" variant="outline">
                  <Link href="/">Back to Login</Link>
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="bg-background/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <Button asChild variant="ghost" className="w-full gap-2">
                    <Link href="/"><ArrowLeft size={14} /> Back to Login</Link>
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Activity, Clock, Rocket, LogOut, BookOpen, Star } from "lucide-react";

export default function ComingSoon() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
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
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut size={14} />
          Log Out
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg w-full"
        >
          {/* Animated clock icon */}
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <Clock size={48} className="text-primary" />
          </motion.div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Coming <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Soon...</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-2">
            Hey <span className="text-foreground font-medium">{user?.fullName?.split(" ")[0]}</span>! 👋
          </p>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            We're currently building an amazing learning experience for{" "}
            <span className="text-foreground font-semibold">{user?.year}</span> students.
            Our team is working hard to bring you the best content soon.
          </p>

          {/* Features teaser */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { icon: BookOpen, label: "Subject Notes", desc: "Detailed study material" },
              { icon: Rocket, label: "Practice Quizzes", desc: "Test your knowledge" },
              { icon: Star, label: "Peer Community", desc: "Learn together" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-card/40 border border-border/40 rounded-xl p-4 flex flex-col items-center gap-2"
              >
                <item.icon className="h-6 w-6 text-primary" />
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-card/40 border border-border/40 rounded-xl px-6 py-4 mb-8 text-sm text-muted-foreground">
            <p>
              🎯 Right now, Mission Distinction is focused on{" "}
              <span className="text-primary font-semibold">1st Year MBBS</span>. We'll be
              expanding to your year soon — follow us to stay updated!
            </p>
          </div>

          <Button onClick={handleLogout} variant="outline" className="gap-2">
            <LogOut size={14} />
            Log out and go back
          </Button>
        </motion.div>
      </main>
    </div>
  );
}

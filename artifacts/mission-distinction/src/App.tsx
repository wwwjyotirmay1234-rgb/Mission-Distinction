import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Component, type ReactNode, type ErrorInfo } from "react";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0d0f1a", color: "#a78bfa", fontFamily: "sans-serif", gap: 16, padding: 24 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ede9fe", margin: 0 }}>Something went wrong</h2>
          <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>Please refresh the page to continue.</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: 8, padding: "10px 24px", borderRadius: 8, background: "#7c3aed", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Pages
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/auth/LandingPage";
import ComingSoon from "@/pages/auth/ComingSoon";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";

// Layouts
import { StudentLayout } from "@/components/layout/StudentLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

// Student Pages
import StudentDashboard from "@/pages/student/Dashboard";
import StudentQuiz from "@/pages/student/Quiz";
import StudentNotes from "@/pages/student/Notes";
import StudentPDFs from "@/pages/student/PDFs";
import StudentCommunity from "@/pages/student/Community";
import StudentProgress from "@/pages/student/Progress";
import StudentBookmarks from "@/pages/student/Bookmarks";
import StudentCalendar from "@/pages/student/Calendar";
import StudentSettings from "@/pages/student/Settings";
// Student Pages (additional)
import StudentAnnouncements from "@/pages/student/Announcements";
import StudentLeaderboard from "@/pages/student/Leaderboard";
import StudentDoubts from "@/pages/student/Doubts";
import StudentTools from "@/pages/student/Tools";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminNotes from "@/pages/admin/Notes";
import AdminPDFs from "@/pages/admin/PDFs";
import AdminBooks from "@/pages/admin/Books";
import AdminQuizzes from "@/pages/admin/Quizzes";
import AdminAnnouncements from "@/pages/admin/Announcements";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminQuizEditor from "@/pages/admin/QuizEditor";
import AdminNews from "@/pages/admin/News";
import AdminSettings from "@/pages/admin/Settings";
import AdminReports from "@/pages/admin/Reports";
import AdminFeedback from "@/pages/admin/Feedback";
import SuperAdminPanel from "@/pages/admin/SuperAdmin";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/coming-soon" component={ComingSoon} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      
      {/* Student Routes */}
      <Route path="/student/*">
        <ProtectedRoute>
          <StudentLayout>
            <Switch>
              <Route path="/student/dashboard" component={StudentDashboard} />
              <Route path="/student/quiz" component={StudentQuiz} />
              <Route path="/student/notes" component={StudentNotes} />
              <Route path="/student/pdfs" component={StudentPDFs} />
              <Route path="/student/community" component={StudentCommunity} />
              <Route path="/student/announcements" component={StudentAnnouncements} />
              <Route path="/student/progress" component={StudentProgress} />
              <Route path="/student/leaderboard" component={StudentLeaderboard} />
              <Route path="/student/doubts" component={StudentDoubts} />
              <Route path="/student/bookmarks" component={StudentBookmarks} />
              <Route path="/student/calendar" component={StudentCalendar} />
              <Route path="/student/settings" component={StudentSettings} />
              <Route path="/student/tools" component={StudentTools} />
              <Route component={NotFound} />
            </Switch>
          </StudentLayout>
        </ProtectedRoute>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/*">
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <Switch>
              <Route path="/admin/dashboard" component={AdminDashboard} />
              <Route path="/admin/users" component={AdminUsers} />
              <Route path="/admin/content/notes" component={AdminNotes} />
              <Route path="/admin/content/pdfs" component={AdminPDFs} />
              <Route path="/admin/content/books" component={AdminBooks} />
              <Route path="/admin/quizzes/:id/edit" component={AdminQuizEditor} />
              <Route path="/admin/quizzes" component={AdminQuizzes} />
              <Route path="/admin/news" component={AdminNews} />
              <Route path="/admin/announcements" component={AdminAnnouncements} />
              <Route path="/admin/analytics" component={AdminAnalytics} />
              <Route path="/admin/reports" component={AdminReports} />
              <Route path="/admin/feedback" component={AdminFeedback} />
              <Route path="/admin/settings" component={AdminSettings} />
              <Route path="/admin/super" component={SuperAdminPanel} />
              <Route component={NotFound} />
            </Switch>
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster theme="dark" />
            <InstallPrompt />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
import { trackPage } from "@/lib/analytics";
import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OfflineBanner } from "@/components/OfflineBanner";
import { Component, type ReactNode, type ErrorInfo } from "react";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
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
import StudentAnatomyHub from "@/pages/student/AnatomyHub";
import StudentDashboard from "@/pages/student/Dashboard";
import StudentQuiz from "@/pages/student/Quiz";
import StudentNotes from "@/pages/student/Notes";
import StudentPDFs from "@/pages/student/PDFs";
import StudentCommunity from "@/pages/student/Community";
import StudentProgress from "@/pages/student/Progress";
import StudentBookmarks from "@/pages/student/Bookmarks";
import StudentCalendar from "@/pages/student/Calendar";
import StudentSettings from "@/pages/student/Settings";
import StudentAnnouncements from "@/pages/student/Announcements";
import StudentLeaderboard from "@/pages/student/Leaderboard";
import StudentDoubts from "@/pages/student/Doubts";
import StudentTools from "@/pages/student/Tools";
import StudentMusic from "@/pages/student/Music";
import StudentFlashcards from "@/pages/student/Flashcards";
import StudentMnemonics from "@/pages/student/Mnemonics";
import StudentExams from "@/pages/student/Exams";
import StudentConfessions from "@/pages/student/Confessions";
import StudentStudyRooms from "@/pages/student/StudyRooms";
import StudentAITools from "@/pages/student/AITools";
import StudentGames from "@/pages/student/Games";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminNotes from "@/pages/admin/Notes";
import AdminPDFs from "@/pages/admin/PDFs";
import AdminBooks from "@/pages/admin/Books";
import AdminPYQs from "@/pages/admin/PYQs";
import AdminQuizzes from "@/pages/admin/Quizzes";
import AdminAnnouncements from "@/pages/admin/Announcements";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminQuizEditor from "@/pages/admin/QuizEditor";
import AdminNews from "@/pages/admin/News";
import AdminSettings from "@/pages/admin/Settings";
import AdminReports from "@/pages/admin/Reports";
import AdminFeedback from "@/pages/admin/Feedback";
import SuperAdminPanel from "@/pages/admin/SuperAdmin";

// New Premium Admin Pages
import ActivityFeed from "@/pages/admin/ActivityFeed";
import ModerationCenter from "@/pages/admin/ModerationCenter";
import WarningsPage from "@/pages/admin/WarningsPage";
import AuditLog from "@/pages/admin/AuditLog";
import QuizIntelligence from "@/pages/admin/QuizIntelligence";
import NoticesPage from "@/pages/admin/NoticesPage";
import AdminMnemonics from "@/pages/admin/Mnemonics";
import AdminFlashcards from "@/pages/admin/Flashcards";
import QuizSubmissions from "@/pages/admin/QuizSubmissions";
import ProctoringReport from "@/pages/admin/ProctoringReport";

const queryClient = new QueryClient();

const ANATOMY_PREVIEW_EMAIL = "www.jyotirmay1234@gmail.com";

function AnatomyRoute() {
  const { user } = useAuth();
  if (user?.email !== ANATOMY_PREVIEW_EMAIL) {
    window.location.replace("/student/dashboard");
    return null;
  }
  return <StudentAnatomyHub />;
}

function PageTracker() {
  const [location] = useLocation();
  useEffect(() => { trackPage(location); }, [location]);
  return null;
}

function Router() {
  return (
    <>
    <PageTracker />
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
              <Route path="/student/anatomy" component={AnatomyRoute} />
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
              <Route path="/student/music" component={StudentMusic} />
              <Route path="/student/flashcards" component={StudentFlashcards} />
              <Route path="/student/mnemonics" component={StudentMnemonics} />
              <Route path="/student/exams" component={StudentExams} />
              <Route path="/student/confessions" component={StudentConfessions} />
              <Route path="/student/study-rooms" component={StudentStudyRooms} />
              <Route path="/student/ai-tools" component={StudentAITools} />
              <Route path="/student/games" component={StudentGames} />
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
              <Route path="/admin/content/pyqs" component={AdminPYQs} />
              <Route path="/admin/quizzes/:id/edit" component={AdminQuizEditor} />
              <Route path="/admin/quizzes" component={AdminQuizzes} />
              <Route path="/admin/news" component={AdminNews} />
              <Route path="/admin/announcements" component={AdminAnnouncements} />
              <Route path="/admin/analytics" component={AdminAnalytics} />
              <Route path="/admin/quiz-intelligence" component={QuizIntelligence} />
              <Route path="/admin/reports" component={AdminReports} />
              <Route path="/admin/feedback" component={AdminFeedback} />
              <Route path="/admin/settings" component={AdminSettings} />
              <Route path="/admin/super" component={SuperAdminPanel} />
              {/* Premium Admin Pages */}
              <Route path="/admin/activity-feed" component={ActivityFeed} />
              <Route path="/admin/moderation" component={ModerationCenter} />
              <Route path="/admin/warnings" component={WarningsPage} />
              <Route path="/admin/audit-log" component={AuditLog} />
              <Route path="/admin/notices" component={NoticesPage} />
              <Route path="/admin/study-tools/mnemonics" component={AdminMnemonics} />
              <Route path="/admin/study-tools/flashcards" component={AdminFlashcards} />
              <Route path="/admin/quiz-submissions" component={QuizSubmissions} />
              <Route path="/admin/proctoring/:attemptId" component={ProctoringReport} />
              <Route component={NotFound} />
            </Switch>
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme} />;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <ThemedToaster />
              <OfflineBanner />
              <InstallPrompt />
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

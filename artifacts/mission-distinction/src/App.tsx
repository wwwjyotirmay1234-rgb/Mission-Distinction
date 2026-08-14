import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { useEffect, useState, lazy, Suspense } from "react";
import { trackPage } from "@/lib/analytics";
import MaintenancePage from "@/pages/Maintenance";
import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme, ForceDark } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OfflineBanner } from "@/components/OfflineBanner";
import { Component, type ReactNode, type ErrorInfo } from "react";

/** Returns true for Vite/browser dynamic-import failures (stale chunk after deploy). */
function isChunkLoadError(error: Error): boolean {
  return (
    error.name === "ChunkLoadError" ||
    /Failed to fetch dynamically imported module/i.test(error.message) ||
    /Importing a module script failed/i.test(error.message) ||
    /Loading chunk \d+ failed/i.test(error.message) ||
    /error loading dynamically imported module/i.test(error.message)
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
    // Chunk load failures mean the old cached entry-point references a JS chunk
    // that no longer exists after a deploy. Auto-reload fetches the new bundle.
    if (isChunkLoadError(error)) {
      console.warn("[ErrorBoundary] Chunk load failure — reloading to fetch fresh bundle.");
      window.location.reload();
    }
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

// Page-level loading spinner — shown while a lazy chunk is downloading
function PageLoader() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0f1a" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #3b2170", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Lazy page imports — each becomes its own JS chunk ────────────────────────
// Auth / public
const LandingPage      = lazy(() => import("@/pages/auth/LandingPage"));
const ComingSoon       = lazy(() => import("@/pages/auth/ComingSoon"));
const ForgotPassword   = lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword    = lazy(() => import("@/pages/auth/ResetPassword"));
const VerifyEmail      = lazy(() => import("@/pages/auth/VerifyEmail"));
const PrivacyPolicy    = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService   = lazy(() => import("@/pages/TermsOfService"));
const NotFound         = lazy(() => import("@/pages/not-found"));
const SubjectLandingPage = lazy(() => import("@/pages/public/SubjectLandingPage"));

// Layouts (small — keep eager so protected routes don't flash)
import { StudentLayout } from "@/components/layout/StudentLayout";
import { AdminLayout }   from "@/components/layout/AdminLayout";

// Student pages

const StudentDashboard     = lazy(() => import("@/pages/student/Dashboard"));
const StudentQuiz          = lazy(() => import("@/pages/student/Quiz"));
const StudentNotes         = lazy(() => import("@/pages/student/Notes"));
const StudentPDFs          = lazy(() => import("@/pages/student/PDFs"));
const StudentCommunity     = lazy(() => import("@/pages/student/Community"));
const StudentMyProgress     = lazy(() => import("@/pages/student/MyProgress"));
const StudentProgress      = lazy(() => import("@/pages/student/Progress"));
const StudentCalendar      = lazy(() => import("@/pages/student/Calendar"));
const StudentSettings      = lazy(() => import("@/pages/student/Settings"));
const StudentAnnouncements = lazy(() => import("@/pages/student/Announcements"));
const StudentLeaderboard   = lazy(() => import("@/pages/student/Leaderboard"));
const StudentDoubts        = lazy(() => import("@/pages/student/Doubts"));
const StudentTools         = lazy(() => import("@/pages/student/Tools"));
const StudentMusic         = lazy(() => import("@/pages/student/Music"));
const StudentCheatCodes    = lazy(() => import("@/pages/student/CheatCodes"));
const StudentExams         = lazy(() => import("@/pages/student/Exams"));
const StudentConfessions   = lazy(() => import("@/pages/student/Confessions"));
const StudentStudyRooms    = lazy(() => import("@/pages/student/StudyRooms"));
const StudentGames         = lazy(() => import("@/pages/student/Games"));
const StudentQuizAnalysis  = lazy(() => import("@/pages/student/QuizAnalysis"));
const StudentClinicalCase  = lazy(() => import("@/pages/student/ClinicalCase"));
const StudentBookmarks     = lazy(() => import("@/pages/student/Bookmarks"));

// Admin pages
const AdminDashboard     = lazy(() => import("@/pages/admin/Dashboard"));
const AdminUsers         = lazy(() => import("@/pages/admin/Users"));
const AdminNotes         = lazy(() => import("@/pages/admin/Notes"));
const AdminPDFs          = lazy(() => import("@/pages/admin/PDFs"));
const AdminBooks         = lazy(() => import("@/pages/admin/Books"));
const AdminQuickUpload   = lazy(() => import("@/pages/admin/QuickUpload"));
const AdminPYQs          = lazy(() => import("@/pages/admin/PYQs"));
const AdminQuizzes       = lazy(() => import("@/pages/admin/Quizzes"));
const AdminAnnouncements = lazy(() => import("@/pages/admin/Announcements"));
const AdminAnalytics     = lazy(() => import("@/pages/admin/Analytics"));
const AdminQuizEditor    = lazy(() => import("@/pages/admin/QuizEditor"));
const AdminNews          = lazy(() => import("@/pages/admin/News"));
const AdminSettings      = lazy(() => import("@/pages/admin/Settings"));
const AdminReports       = lazy(() => import("@/pages/admin/Reports"));
const AdminFeedback      = lazy(() => import("@/pages/admin/Feedback"));
const SuperAdminPanel    = lazy(() => import("@/pages/admin/SuperAdmin"));
const ActivityFeed       = lazy(() => import("@/pages/admin/ActivityFeed"));
const ModerationCenter   = lazy(() => import("@/pages/admin/ModerationCenter"));
const WarningsPage       = lazy(() => import("@/pages/admin/WarningsPage"));
const AuditLog           = lazy(() => import("@/pages/admin/AuditLog"));
const QuizIntelligence   = lazy(() => import("@/pages/admin/QuizIntelligence"));
const NoticesPage        = lazy(() => import("@/pages/admin/NoticesPage"));
const AdminMnemonics     = lazy(() => import("@/pages/admin/Mnemonics"));
const AdminFlashcards    = lazy(() => import("@/pages/admin/Flashcards"));
const QuizSubmissions    = lazy(() => import("@/pages/admin/QuizSubmissions"));
const ProctoringReport   = lazy(() => import("@/pages/admin/ProctoringReport"));
const AdminScholarHub    = lazy(() => import("@/pages/admin/ScholarHub"));
const VivaQuestionBank   = lazy(() => import("@/pages/admin/VivaQuestionBank"));

const AdminClinicalCases = lazy(() => import("@/pages/admin/ClinicalCases"));
const AdminGrandTests         = lazy(() => import("@/pages/admin/GrandTests"));
const StudentGrandTests       = lazy(() => import("@/pages/student/GrandTests"));
const StudentCustomQuiz       = lazy(() => import("@/pages/student/CustomQuizBuilder"));
const StudentNotesMarketplace = lazy(() => import("@/pages/student/NotesMarketplace"));
const StudentGrandRounds      = lazy(() => import("@/pages/student/GrandRounds"));
const StudentVideos           = lazy(() => import("@/pages/student/Videos"));
const AdminVideos             = lazy(() => import("@/pages/admin/Videos"));
const AdminNotesMarketplace   = lazy(() => import("@/pages/admin/NotesMarketplace"));

const queryClient = new QueryClient();


function PageTracker() {
  const [location] = useLocation();
  useEffect(() => { trackPage(location); }, [location]);
  return null;
}

/**
 * RootRoute — instantly redirects authenticated users to their dashboard
 * WITHOUT loading the LandingPage lazy chunk first. This eliminates the
 * "spinner → flash of login page → redirect" sequence on PWA re-open.
 * Unauthenticated users get the normal LandingPage (lazy-loaded as before).
 */
function RootRoute() {
  const { isAuthenticated, isAdmin } = useAuth();
  if (isAuthenticated) {
    return <Redirect to={isAdmin ? "/admin/dashboard" : "/student/dashboard"} />;
  }
  return <ForceDark><LandingPage /></ForceDark>;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PageTracker />
      <Switch>
        <Route path="/">
          <RootRoute />
        </Route>
        <Route path="/coming-soon">
          <ForceDark><ComingSoon /></ForceDark>
        </Route>
        <Route path="/forgot-password">
          <ForceDark><ForgotPassword /></ForceDark>
        </Route>
        <Route path="/reset-password">
          <ForceDark><ResetPassword /></ForceDark>
        </Route>
        <Route path="/verify-email">
          <ForceDark><VerifyEmail /></ForceDark>
        </Route>
        <Route path="/privacy-policy">
          <ForceDark><PrivacyPolicy /></ForceDark>
        </Route>
        <Route path="/terms">
          <ForceDark><TermsOfService /></ForceDark>
        </Route>

        {/* Public subject landing pages — indexed by Google */}
        <Route path="/anatomy">
          <ForceDark><SubjectLandingPage subject="anatomy" /></ForceDark>
        </Route>
        <Route path="/physiology">
          <ForceDark><SubjectLandingPage subject="physiology" /></ForceDark>
        </Route>
        <Route path="/biochemistry">
          <ForceDark><SubjectLandingPage subject="biochemistry" /></ForceDark>
        </Route>
        <Route path="/pathology">
          <ForceDark><SubjectLandingPage subject="pathology" /></ForceDark>
        </Route>
        <Route path="/microbiology">
          <ForceDark><SubjectLandingPage subject="microbiology" /></ForceDark>
        </Route>
        <Route path="/pharmacology">
          <ForceDark><SubjectLandingPage subject="pharmacology" /></ForceDark>
        </Route>

        {/* Student Routes */}
        <Route path="/student/*">
          <ProtectedRoute>
            <StudentLayout>
              <Switch>
                <Route path="/student/dashboard"    component={StudentDashboard} />
                <Route path="/student/quiz"          component={StudentQuiz} />
                <Route path="/student/quiz-analysis" component={StudentQuizAnalysis} />
                <Route path="/student/notes"        component={StudentNotes} />
                <Route path="/student/pdfs"         component={StudentPDFs} />
                <Route path="/student/announcements" component={StudentAnnouncements} />
                <Route path="/student/progress"     component={StudentMyProgress} />
                <Route path="/student/old-progress"     component={StudentProgress} />
                <Route path="/student/leaderboard"  component={StudentLeaderboard} />
                <Route path="/student/doubts"       component={StudentDoubts} />
                <Route path="/student/calendar"     component={StudentCalendar} />
                <Route path="/student/settings"     component={StudentSettings} />
                <Route path="/student/tools"        component={StudentTools} />
                <Route path="/student/music"        component={StudentMusic} />
                <Route path="/student/cheat-codes"  component={StudentCheatCodes} />
                <Route path="/student/flashcards"   component={StudentCheatCodes} />
                <Route path="/student/mnemonics"    component={StudentCheatCodes} />
                <Route path="/student/exams"        component={StudentExams} />
                <Route path="/student/study-rooms"  component={StudentStudyRooms} />
                <Route path="/student/clinical-case"     component={StudentClinicalCase} />
                <Route path="/student/bookmarks"         component={StudentBookmarks} />
                <Route path="/student/grand-tests"       component={StudentGrandTests} />
                <Route path="/student/custom-quiz"       component={StudentCustomQuiz} />
                <Route path="/student/notes-marketplace" component={StudentNotesMarketplace} />
                <Route path="/student/videos"            component={StudentVideos} />
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
                <Route path="/admin/dashboard"              component={AdminDashboard} />
                <Route path="/admin/users"                  component={AdminUsers} />
                <Route path="/admin/content/notes"          component={AdminNotes} />
                <Route path="/admin/content/pdfs"           component={AdminPDFs} />
                <Route path="/admin/content/books"          component={AdminBooks} />
                <Route path="/admin/content/quick-upload"   component={AdminQuickUpload} />
                <Route path="/admin/content/pyqs"           component={AdminPYQs} />
                <Route path="/admin/quizzes/:id/edit"       component={AdminQuizEditor} />
                <Route path="/admin/quizzes"                component={AdminQuizzes} />
                <Route path="/admin/news"                   component={AdminNews} />
                <Route path="/admin/announcements"          component={AdminAnnouncements} />
                <Route path="/admin/analytics"              component={AdminAnalytics} />
                <Route path="/admin/quiz-intelligence"      component={QuizIntelligence} />
                <Route path="/admin/reports"                component={AdminReports} />
                <Route path="/admin/feedback"               component={AdminFeedback} />
                <Route path="/admin/settings"               component={AdminSettings} />
                <Route path="/admin/super"                  component={SuperAdminPanel} />
                <Route path="/admin/activity-feed"          component={ActivityFeed} />
                <Route path="/admin/moderation"             component={ModerationCenter} />
                <Route path="/admin/warnings"               component={WarningsPage} />
                <Route path="/admin/viva-questions"         component={VivaQuestionBank} />
                <Route path="/admin/audit-log"              component={AuditLog} />
                <Route path="/admin/notices"                component={NoticesPage} />
                <Route path="/admin/study-tools/mnemonics"  component={AdminMnemonics} />
                <Route path="/admin/study-tools/flashcards" component={AdminFlashcards} />
                <Route path="/admin/quiz-submissions"       component={QuizSubmissions} />
                <Route path="/admin/proctoring/:attemptId"  component={ProctoringReport} />
                <Route path="/admin/scholar-hub"            component={AdminScholarHub} />
                <Route path="/admin/clinical-cases"         component={AdminClinicalCases} />
                <Route path="/admin/grand-tests"            component={AdminGrandTests} />
                <Route path="/admin/notes-marketplace"      component={AdminNotesMarketplace} />
                <Route path="/admin/videos"              component={AdminVideos} />
                <Route component={NotFound} />
              </Switch>
            </AdminLayout>
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme} />;
}

function HideLoadingSpinner() {
  useEffect(() => {
    const el = document.getElementById("app-loading");
    if (el) el.style.display = "none";
  }, []);
  return null;
}

/**
 * StuckOverlayGuard — defends against a well-known Radix UI mobile bug:
 * Select/Dialog/Popover primitives set `pointer-events: none` on <body>
 * while open and restore it on close. On mobile browsers, if that
 * close/unmount animation gets interrupted (app backgrounded, gesture
 * navigation, quick tab switch, screen rotation mid-close), the cleanup
 * never runs and `pointer-events: none` gets stuck on <body> — making the
 * ENTIRE page (any input, any form, any tab) untappable/untypeable until
 * a full reload. This matches "random field, phone only, both forms
 * affected" reports because the lock is page-wide, not field-specific.
 *
 * Fix: periodically check if body has pointer-events locked while no
 * Radix overlay is actually open/animating, and clear it.
 */
function StuckOverlayGuard() {
  useEffect(() => {
    const clearIfStuck = () => {
      if (document.body.style.pointerEvents !== "none") return;
      const openOverlay = document.querySelector(
        '[data-radix-popper-content-wrapper], [role="dialog"][data-state="open"], [role="listbox"], [data-state="open"][data-radix-select-content], [data-state="open"][data-radix-popover-content]'
      );
      if (!openOverlay) {
        document.body.style.pointerEvents = "";
      }
    };

    const interval = setInterval(clearIfStuck, 2000);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "style") {
          clearIfStuck();
        }
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);
  return null;
}

function useMaintenance() {
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    async function check() {
      try {
        const { API_BASE } = await import("@/lib/apiConfig");
        const healthUrl = API_BASE ? `${API_BASE}/api/health` : "/api/health";
        const res = await fetch(healthUrl, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        setMaintenance(!!data.maintenance);
        // If still in maintenance, poll every 15s; otherwise every 60s
        timer = setTimeout(check, data.maintenance ? 15_000 : 60_000);
      } catch {
        // Network error — don't flip into maintenance, just retry in 15s
        timer = setTimeout(check, 15_000);
      }
    }

    check();
    return () => clearTimeout(timer);
  }, []);

  return maintenance;
}

function App() {
  const maintenance = useMaintenance();

  if (maintenance) return <MaintenancePage />;

  return (
    <ErrorBoundary>
      <HideLoadingSpinner />
      <StuckOverlayGuard />
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

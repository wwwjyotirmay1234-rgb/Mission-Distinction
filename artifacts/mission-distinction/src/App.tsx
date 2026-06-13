import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/auth/LandingPage";

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
// Stubs for remaining
const StubPage = ({ title }: { title: string }) => <div className="p-8 text-center"><h1 className="text-2xl font-bold">{title}</h1><p className="text-muted-foreground mt-4">Coming soon.</p></div>;

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminNotes from "@/pages/admin/Notes";
import AdminPDFs from "@/pages/admin/PDFs";
import AdminBooks from "@/pages/admin/Books";
import AdminQuizzes from "@/pages/admin/Quizzes";
import AdminAnnouncements from "@/pages/admin/Announcements";
import AdminAnalytics from "@/pages/admin/Analytics";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      
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
              <Route path="/student/announcements" component={() => <StubPage title="Announcements" />} />
              <Route path="/student/progress" component={StudentProgress} />
              <Route path="/student/bookmarks" component={StudentBookmarks} />
              <Route path="/student/calendar" component={StudentCalendar} />
              <Route path="/student/settings" component={StudentSettings} />
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
              <Route path="/admin/quizzes" component={AdminQuizzes} />
              <Route path="/admin/news" component={() => <StubPage title="News & Discoveries" />} />
              <Route path="/admin/announcements" component={AdminAnnouncements} />
              <Route path="/admin/analytics" component={AdminAnalytics} />
              <Route path="/admin/reports" component={() => <StubPage title="Reports" />} />
              <Route path="/admin/feedback" component={() => <StubPage title="Feedback" />} />
              <Route path="/admin/settings" component={() => <StubPage title="Settings" />} />
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster theme="dark" />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

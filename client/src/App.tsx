import { lazy, Suspense } from "react";
import { Redirect, Switch, Route, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { I18nProvider, useI18n } from "@/contexts/I18nContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import Sidebar from "@/components/sidebar";
import MobileNav from "@/components/mobile-nav";
import TopBar from "@/components/top-bar";
import { useAuth } from "@/lib/auth";
import { isTechnicalStaffRole, isAdminRole } from "@shared/schema";
import { StaffRegistrationPopup } from "@/components/staff-registration-popup";

const Dashboard = lazy(() => import("@/pages/dashboard"));
const Players = lazy(() => import("@/pages/players"));
const Teams = lazy(() => import("@/pages/teams"));
const Staff = lazy(() => import("@/pages/staff"));
const Training = lazy(() => import("@/pages/training"));
const TrainingAttendance = lazy(() => import("@/pages/training-attendance"));
const Matches = lazy(() => import("@/pages/matches"));
const Tactics = lazy(() => import("@/pages/tactics"));
const Analytics = lazy(() => import("@/pages/analytics"));
const Reports = lazy(() => import("@/pages/reports"));
const Settings = lazy(() => import("@/pages/settings"));
const UserControlPage = lazy(() => import("@/pages/user-control"));
const Wearables = lazy(() => import("@/pages/wearables"));
const CatapultOpenField = lazy(() => import("@/pages/catapult-openfield"));
const MonthlyBudgets = lazy(() => import("@/pages/monthly-budgets"));
const YearBudgets = lazy(() => import("@/pages/year-budgets"));
const PerformanceReactionsPage = lazy(() => import("@/pages/performance-reactions"));
const TacticalBoardPage = lazy(() => import("@/pages/tactical-board"));
const TacticalIconsDemo = lazy(() => import("@/pages/tactical-icons-demo"));
const BubbleDesignPage = lazy(() => import("@/pages/bubble-design"));
const InteractiveTacticalBoardPage = lazy(() => import("@/pages/interactive-tactical-board"));
const AchievementsPage = lazy(() => import("@/pages/achievements"));
const InjuryList = lazy(() => import("@/pages/injury-list"));
const AddInjury = lazy(() => import("@/pages/add-injury"));
const InjuryReport = lazy(() => import("@/pages/injury-report"));
const InjuryManagement = lazy(() => import("@/pages/injury-management"));
const NotFound = lazy(() => import("@/pages/not-found"));
const LoginPage = lazy(() => import("@/pages/login"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password"));
const PlayerDashboard = lazy(() => import("@/pages/player-dashboard"));
const PlayerTraining = lazy(() => import("@/pages/player-training"));
const PlayerMatches = lazy(() => import("@/pages/player-matches"));
const PlayerAnalytics = lazy(() => import("@/pages/player-analytics"));
const PlayerSignup = lazy(() => import("@/pages/player-signup"));
const EmployeeSignup = lazy(() => import("@/pages/employee-signup"));
const TechnicalStaffDashboard = lazy(() => import("@/pages/technical-staff-dashboard"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const AdminTraining = lazy(() => import("@/pages/admin-training"));

function RouteFallback() {
  return (
    <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const { isRtl } = useI18n();

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className={`flex h-screen overflow-hidden bg-background ${isRtl ? "flex-row-reverse" : ""}`}>
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto h-full pb-16 md:pb-0">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}

function StaffRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/players" component={Players} />
      <Route path="/teams" component={Teams} />
      <Route path="/staff" component={Staff} />
      <Route path="/training" component={Training} />
      <Route path="/training/attendance" component={TrainingAttendance} />
      <Route path="/matches" component={Matches} />
      <Route path="/tactics" component={Tactics} />
      <Route path="/tactical-board" component={TacticalBoardPage} />
      <Route path="/interactive-tactical-board" component={InteractiveTacticalBoardPage} />
      <Route path="/tactical-icons-demo" component={TacticalIconsDemo} />
      <Route path="/bubble-design" component={BubbleDesignPage} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/achievements" component={AchievementsPage} />
      <Route path="/performance-reactions" component={PerformanceReactionsPage} />
      <Route path="/reports" component={Reports} />
      <Route path="/wearables" component={Wearables} />
      <Route path="/catapult-openfield" component={CatapultOpenField} />
      <Route path="/injuries" component={InjuryList} />
      <Route path="/injuries/add" component={AddInjury} />
      <Route path="/injuries/report" component={InjuryReport} />
      <Route path="/injuries/manage" component={InjuryManagement} />
      <Route path="/monthly-budgets" component={MonthlyBudgets} />
      <Route path="/year-budgets" component={YearBudgets} />
      <Route path="/settings" component={Settings} />
      <Route path="/user-control" component={UserControlPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminRouter() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/admin-dashboard" />
      </Route>
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/players" component={Players} />
      <Route path="/teams" component={Teams} />
      <Route path="/staff" component={Staff} />
      <Route path="/training" component={AdminTraining} />
      <Route path="/training/attendance" component={TrainingAttendance} />
      <Route path="/matches" component={Matches} />
      <Route path="/monthly-budgets" component={MonthlyBudgets} />
      <Route path="/reports" component={Reports} />
      <Route path="/injuries" component={InjuryList} />
      <Route path="/injuries/report" component={InjuryReport} />
      <Route path="/settings" component={Settings} />
      <Route>
        <Redirect to="/admin-dashboard" />
      </Route>
    </Switch>
  );
}

function PlayerRouter() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/player-dashboard" />
      </Route>
      <Route path="/player-dashboard" component={PlayerDashboard} />
      <Route path="/training" component={PlayerTraining} />
      <Route path="/matches" component={PlayerMatches} />
      <Route path="/analytics" component={PlayerAnalytics} />
      <Route path="/achievements" component={AchievementsPage} />
      <Route>
        <Redirect to="/player-dashboard" />
      </Route>
    </Switch>
  );
}

// Add Injury and Injury Management stay medical-staff-only even if a
// non-medical technical staffer types the URL directly, since the nav only
// surfaces them to physiotherapists.
function TechnicalStaffAddInjuryRoute() {
  const { user } = useAuth();
  if (user?.role !== "physiotherapist") {
    return <Redirect to="/technical-staff" />;
  }
  return <AddInjury />;
}

function TechnicalStaffInjuryManagementRoute() {
  const { user } = useAuth();
  if (user?.role !== "physiotherapist") {
    return <Redirect to="/technical-staff" />;
  }
  return <InjuryManagement />;
}

function TechnicalStaffRouter() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/technical-staff" />
      </Route>
      <Route path="/technical-staff" component={TechnicalStaffDashboard} />
      <Route path="/players" component={Players} />
      <Route path="/teams" component={Teams} />
      <Route path="/training" component={Training} />
      <Route path="/training/attendance" component={TrainingAttendance} />
      <Route path="/matches" component={Matches} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/catapult-openfield" component={CatapultOpenField} />
      <Route path="/achievements" component={AchievementsPage} />
      <Route path="/interactive-tactical-board" component={InteractiveTacticalBoardPage} />
      <Route path="/injuries" component={InjuryList} />
      <Route path="/injuries/report" component={InjuryReport} />
      <Route path="/injuries/add" component={TechnicalStaffAddInjuryRoute} />
      <Route path="/injuries/manage" component={TechnicalStaffInjuryManagementRoute} />
      <Route>
        <Redirect to="/technical-staff" />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <I18nProvider>
          <TooltipProvider>
            <PublicOrAuthGate />
            <Toaster />
          </TooltipProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function PublicOrAuthGate() {
  const [isInviteRoute] = useRoute("/invite/:token");
  const [isEmployeeInviteRoute] = useRoute("/employee-invite/:token");
  const [isResetPasswordRoute] = useRoute("/reset-password");

  if (isInviteRoute) {
    return (
      <SettingsProvider>
        <Suspense fallback={<RouteFallback />}>
          <PlayerSignup />
        </Suspense>
      </SettingsProvider>
    );
  }

  if (isEmployeeInviteRoute) {
    return (
      <SettingsProvider>
        <Suspense fallback={<RouteFallback />}>
          <EmployeeSignup />
        </Suspense>
      </SettingsProvider>
    );
  }

  if (isResetPasswordRoute) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <ResetPasswordPage />
      </Suspense>
    );
  }

  return <AuthGate />;
}

function AuthGate() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        {t("app.loading")}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <LoginPage />
      </Suspense>
    );
  }

  return (
    <SettingsProvider>
      <Layout>
        {user && user.role !== "player" && <StaffRegistrationPopup user={user} />}
        <Suspense fallback={<RouteFallback />}>
          {user?.role === "player"
            ? <PlayerRouter />
            : isAdminRole(user?.role)
              ? <AdminRouter />
              : isTechnicalStaffRole(user?.role)
                ? <TechnicalStaffRouter />
                : <StaffRouter />}
        </Suspense>
      </Layout>
    </SettingsProvider>
  );
}

export default App;

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
import Dashboard from "@/pages/dashboard";
import Players from "@/pages/players";
import Teams from "@/pages/teams";
import Staff from "@/pages/staff";
import Training from "@/pages/training";
import TrainingAttendance from "@/pages/training-attendance";
import Matches from "@/pages/matches";
import Tactics from "@/pages/tactics";
import Analytics from "@/pages/analytics";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import UserControlPage from "@/pages/user-control";
import Wearables from "@/pages/wearables";
import CatapultOpenField from "@/pages/catapult-openfield";
import MonthlyBudgets from "@/pages/monthly-budgets";
import YearBudgets from "@/pages/year-budgets";
import PerformanceReactionsPage from "@/pages/performance-reactions";
import TacticalBoardPage from "@/pages/tactical-board";
import TacticalIconsDemo from "@/pages/tactical-icons-demo";
import BubbleDesignPage from "@/pages/bubble-design";
import InteractiveTacticalBoardPage from "@/pages/interactive-tactical-board";
import AchievementsPage from "@/pages/achievements";
import InjuryList from "@/pages/injury-list";
import AddInjury from "@/pages/add-injury";
import InjuryReport from "@/pages/injury-report";
import InjuryManagement from "@/pages/injury-management";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import ResetPasswordPage from "@/pages/reset-password";
import { useAuth } from "@/lib/auth";
import PlayerDashboard from "@/pages/player-dashboard";
import PlayerTraining from "@/pages/player-training";
import PlayerMatches from "@/pages/player-matches";
import PlayerAnalytics from "@/pages/player-analytics";
import PlayerSignup from "@/pages/player-signup";
import EmployeeSignup from "@/pages/employee-signup";
import TechnicalStaffDashboard from "@/pages/technical-staff-dashboard";
import { isTechnicalStaffRole, isAdminRole } from "@shared/schema";
import AdminDashboard from "@/pages/admin-dashboard";
import { StaffRegistrationPopup } from "@/components/staff-registration-popup";

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
      <Route path="/training" component={Training} />
      <Route path="/training/attendance" component={TrainingAttendance} />
      <Route path="/matches" component={Matches} />
      <Route path="/monthly-budgets" component={MonthlyBudgets} />
      <Route path="/reports" component={Reports} />
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
        <PlayerSignup />
      </SettingsProvider>
    );
  }

  if (isEmployeeInviteRoute) {
    return (
      <SettingsProvider>
        <EmployeeSignup />
      </SettingsProvider>
    );
  }

  if (isResetPasswordRoute) {
    return <ResetPasswordPage />;
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
    return <LoginPage />;
  }

  return (
    <SettingsProvider>
      <Layout>
        {user && user.role !== "player" && <StaffRegistrationPopup user={user} />}
        {user?.role === "player"
          ? <PlayerRouter />
          : isAdminRole(user?.role)
            ? <AdminRouter />
            : isTechnicalStaffRole(user?.role)
              ? <TechnicalStaffRouter />
              : <StaffRouter />}
      </Layout>
    </SettingsProvider>
  );
}

export default App;

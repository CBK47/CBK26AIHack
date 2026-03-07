import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import TrainingPage from "@/pages/training";
import TrickLibrary from "@/pages/trick-library";
import StatsPage from "@/pages/stats";
import SequenceBuilder from "@/pages/sequences";
import ProgressionPage from "@/pages/progression";
import HeightChallenge from "@/pages/height-challenge";
import GamesPage from "@/pages/games";
import ProfilePage, { applyTheme } from "@/pages/profile";
import { scheduleReminder, cancelReminder } from "@/lib/notifications";
import ForumPage from "@/pages/forum";
import CommunityPage from "@/pages/community";
import ShopPage from "@/pages/shop";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/training" component={TrainingPage} />
      <Route path="/tricks" component={TrickLibrary} />
      <Route path="/stats" component={StatsPage} />
      <Route path="/sequences" component={SequenceBuilder} />
      <Route path="/progression" component={ProgressionPage} />
      <Route path="/height-challenge" component={HeightChallenge} />
      <Route path="/games" component={GamesPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/shop" component={ShopPage} />
      <Route path="/forum" component={ForumPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-1 p-2 border-b h-12 md:h-12">
            <SidebarTrigger data-testid="button-sidebar-toggle" className="hidden md:flex" />
            <div className="flex items-center gap-2 md:hidden">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">JJ</span>
              </div>
              <span className="font-semibold text-sm">Just Juggle</span>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <Router />
          </main>
        </div>
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}

function ThemeApplier() {
  const { user } = useAuth();
  useEffect(() => {
    if (user?.preferredTheme) {
      applyTheme(user.preferredTheme);
    }
  }, [user?.preferredTheme]);
  useEffect(() => {
    if (user?.notificationsEnabled && user?.reminderTime) {
      scheduleReminder(user.reminderTime, user.reminderMessage || "Time to juggle!");
    } else {
      cancelReminder();
    }
    return () => cancelReminder();
  }, [user?.reminderTime, user?.reminderMessage, user?.notificationsEnabled]);
  return null;
}

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <ThemeApplier />
      <AuthenticatedLayout />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

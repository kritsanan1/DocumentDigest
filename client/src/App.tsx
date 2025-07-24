import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Home from "@/pages/home";
import Services from "@/pages/services";
import Reports from "@/pages/reports";
import Announcements from "@/pages/announcements";
import Profile from "@/pages/profile";
import Verification from "@/pages/verification";
import Login from "@/pages/login";
import AppHeader from "@/components/app-header";
import BottomNavigation from "@/components/bottom-navigation";
import FloatingActionButton from "@/components/floating-action-button";
import NotificationToast from "@/components/notification-toast";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/services" component={Services} />
      <Route path="/reports" component={Reports} />
      <Route path="/announcements" component={Announcements} />
      <Route path="/profile" component={Profile} />
      <Route path="/verification" component={Verification} />
      <Route path="/login" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <AppHeader />
            <main className="pb-20">
              <Router />
            </main>
            <BottomNavigation />
            <FloatingActionButton />
            <NotificationToast />
            <Toaster />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

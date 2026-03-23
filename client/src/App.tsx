import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Pages
import Finder from "@/pages/Finder";
import Magazine from "@/pages/Magazine";
import AiChat from "@/pages/AiChat";
import Shoutbox from "@/pages/Shoutbox";
import Ads from "@/pages/Ads";
import Events from "@/pages/Events";
import Profile from "@/pages/Profile";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import MyProfile from "@/pages/MyProfile";
import NotFound from "@/pages/not-found";

function PrivateRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  return <Component {...rest} />;
}

function AdminRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();
  const { data: adminCheck, isLoading: checkingAdmin } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    enabled: isAuthenticated,
  });

  if (isLoading || checkingAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  if (!adminCheck?.isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background flex-col gap-4">
        <p className="text-destructive text-xl font-bold">Brak dostępu</p>
        <p className="text-muted-foreground">Nie masz uprawnień administratora.</p>
      </div>
    );
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/login" component={Login} />
        
        {/* Public Routes */}
        <Route path="/" component={Finder} />
        <Route path="/magazyn" component={Magazine} />
        <Route path="/czat" component={Shoutbox} />
        <Route path="/imprezy" component={Events} />
        <Route path="/ogloszenia" component={Ads} />
        <Route path="/profile/:id" component={Profile} />
        
        {/* Private Routes */}
        <Route path="/chat">
          <PrivateRoute component={AiChat} />
        </Route>
        <Route path="/me">
          <PrivateRoute component={MyProfile} />
        </Route>
        
        {/* Admin Route */}
        <Route path="/admin">
          <AdminRoute component={Admin} />
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

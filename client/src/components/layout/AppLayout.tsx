import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import aiChatLogo from "@assets/gaypl-logo-black-2048px_1766863308056.png";

export function AppLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const isLoginPage = location === "/login";
  const isChatPage = location === "/chat";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground md:pl-64 pb-20 md:pb-0">
      <Sidebar />
      <main className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
        {children}
      </main>
      <BottomNav />
      
      {!isChatPage && (
        <Link 
          href="/chat"
          className="fixed bottom-20 right-4 z-50 md:hidden w-14 h-14 rounded-full shadow-lg shadow-primary/30 overflow-hidden transition-transform active:scale-95"
          data-testid="button-ai-chat-fab"
        >
          <img 
            src={aiChatLogo} 
            alt="AI Chat" 
            className="w-full h-full object-cover"
          />
        </Link>
      )}
    </div>
  );
}

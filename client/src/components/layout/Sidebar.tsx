import { Link, useLocation } from "wouter";
import { User, BookOpen, MessageCircle, Megaphone, Calendar, LogOut, Settings, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";

const navItems = [
  { href: "/", icon: User, label: "Szukaj" },
  { href: "/magazyn", icon: BookOpen, label: "Magazyn" },
  { href: "/czat", icon: MessageCircle, label: "Czat" },
  { href: "/ogloszenia", icon: Megaphone, label: "Ogłoszenia" },
  { href: "/imprezy", icon: Calendar, label: "Wydarzenia" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logout, isAuthenticated } = useAuth();
  const { data: adminCheck } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    enabled: isAuthenticated,
  });

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-card border-r border-border p-6 z-40">
      <div className="flex items-center gap-3 mb-10 px-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          gay<span className="text-primary">.pl</span>
        </h1>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = location === href || (href !== "/" && location.startsWith(href));
          return (
            <Link key={href} href={href} className={clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive 
                ? "bg-primary text-black font-semibold shadow-[0_0_15px_rgba(0,255,65,0.4)]" 
                : "text-muted-foreground hover:bg-white/5 hover:text-white"
            )}>
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-border mt-auto space-y-2">
        {adminCheck?.isAdmin && (
          <Link href="/admin" className={clsx(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
            location === "/admin" 
              ? "bg-primary text-black font-semibold shadow-[0_0_15px_rgba(0,255,65,0.4)]"
              : "text-primary hover:bg-primary/10"
          )}>
            <Shield className="w-5 h-5" />
            <span>Panel Admin</span>
          </Link>
        )}
        <Link href="/me" className={clsx(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-muted-foreground hover:bg-white/5 hover:text-white",
          location === "/me" && "bg-white/5 text-white"
        )}>
          <Settings className="w-5 h-5" />
          <span>Mój Profil</span>
        </Link>
        <button 
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5" />
          <span>Wyloguj</span>
        </button>
      </div>
    </aside>
  );
}

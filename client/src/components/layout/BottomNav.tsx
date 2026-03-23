import { Link, useLocation } from "wouter";
import { Search, BookOpen, Megaphone, MessageCircle, PartyPopper } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/", icon: Search, label: "Szukaj" },
  { href: "/imprezy", icon: PartyPopper, label: "Imprezy" },
  { href: "/magazyn", icon: BookOpen, label: "Magazyn" },
  { href: "/czat", icon: MessageCircle, label: "Czat" },
  { href: "/ogloszenia", icon: Megaphone, label: "Ogłoszenia" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-white/10 pb-safe md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = location === href || (href !== "/" && location.startsWith(href));
          
          return (
            <Link key={href} href={href} className="w-full h-full flex flex-col items-center justify-center gap-1 group">
              <div
                className={clsx(
                  "p-1.5 rounded-xl transition-all duration-300",
                  isActive ? "bg-primary/20 text-primary" : "text-muted-foreground group-hover:text-primary/70"
                )}
              >
                <Icon className={clsx("w-6 h-6", isActive && "animate-pulse-green")} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={clsx(
                "text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

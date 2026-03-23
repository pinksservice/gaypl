import { useProfile } from "@/hooks/use-profiles";
import { useRoute } from "wouter";
import { Badge } from "@/components/ui/Badge";
import { MapPin, MessageCircle, Heart, Share2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Profile() {
  const [, params] = useRoute("/profile/:id");
  const id = parseInt(params?.id || "0");
  const { data: profile, isLoading } = useProfile(id);
  const { isAuthenticated } = useAuth();

  if (isLoading) return <div className="animate-pulse h-screen bg-background" />;
  if (!profile) return <div className="text-center py-20">Profil nie istnieje.</div>;

  return (
    <div className="space-y-6">
      {/* Hero / Avatar */}
      <div className="relative aspect-square md:aspect-[3/1] md:rounded-3xl overflow-hidden bg-secondary border-b border-border md:border group">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-9xl font-bold text-muted-foreground/20">
            {profile.displayName[0]}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent md:from-black/80" />
        
        {/* Info Overlay (Desktop mainly) */}
        <div className="absolute bottom-0 left-0 p-6 w-full z-10 hidden md:block">
          <h1 className="text-4xl font-bold text-white mb-2">{profile.displayName}, {profile.age}</h1>
          <div className="flex items-center gap-2 text-gray-300">
             <MapPin className="w-4 h-4 text-primary" /> {profile.city}
          </div>
        </div>
      </div>

      {/* Mobile Header Info */}
      <div className="px-4 md:hidden -mt-10 relative z-10">
        <h1 className="text-3xl font-bold text-white">{profile.displayName}, {profile.age}</h1>
        <div className="flex items-center gap-2 text-muted-foreground mt-1">
          <MapPin className="w-4 h-4 text-primary" /> {profile.city}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 px-4 md:px-0">
        <button 
          onClick={() => isAuthenticated ? null : window.location.href = "/login"}
          className="flex-1 bg-primary text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(0,255,65,0.3)]"
        >
          <MessageCircle className="w-5 h-5" />
          Napisz
        </button>
        <button className="w-12 h-12 flex items-center justify-center rounded-xl bg-card border border-border text-white hover:text-red-500 hover:border-red-500/50 transition-colors">
          <Heart className="w-6 h-6" />
        </button>
        <button className="w-12 h-12 flex items-center justify-center rounded-xl bg-card border border-border text-white hover:text-primary transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Bio & Details */}
      <div className="px-4 md:px-0 space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6">
           <h3 className="text-lg font-bold mb-3 text-white">O mnie</h3>
           <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">
             {profile.bio || "Brak opisu."}
           </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
           <h3 className="text-lg font-bold mb-3 text-white">Informacje</h3>
           <div className="space-y-3">
             <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-muted-foreground">Status</span>
                <span className={profile.isOnline ? "text-primary font-medium" : "text-gray-500"}>
                  {profile.isOnline ? "Online" : "Offline"}
                </span>
             </div>
             <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-muted-foreground">Weryfikacja</span>
                <span className="text-white">
                  {profile.isVerified ? (
                    <span className="flex items-center gap-1 text-primary"><Badge variant="outline" className="border-primary text-primary">Tak</Badge></span>
                  ) : "Nie"}
                </span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useProfiles, useUpdateLocation, useMyProfile } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, MoreVertical, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import ReportBlockModal from "@/components/ReportBlockModal";

const FILTERS = [
  { id: "edit", label: "Edytuj", icon: ArrowRight, iconClass: "text-primary" },
  { id: "nearby", label: "W pobliżu", icon: Navigation, iconClass: "" },
  { id: "online", label: "Online", icon: null, iconClass: "" },
  { id: "new", label: "Nowi", icon: null, iconClass: "" },
  { id: "verified", label: "Zweryfikowani", icon: null, iconClass: "" },
];

export default function Finder() {
  const [activeFilter, setActiveFilter] = useState<string>("online");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  const [reportModalProfile, setReportModalProfile] = useState<{ id: number; username: string } | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const updateLocation = useUpdateLocation();
  const { data: myProfile } = useMyProfile();
  const [, navigate] = useLocation();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          setLocationPermission("granted");
          
          if (isAuthenticated) {
            updateLocation.mutate(loc);
          }
        },
        () => {
          setLocationPermission("denied");
        }
      );
    }
  }, [isAuthenticated]);

  const filters = {
    filter: activeFilter,
    userLat: activeFilter === "nearby" && userLocation ? userLocation.lat : undefined,
    userLng: activeFilter === "nearby" && userLocation ? userLocation.lng : undefined,
  };

  const { data: profiles, isLoading } = useProfiles(filters);

  const handleFilterClick = (filterId: string) => {
    if (filterId === "edit") {
      navigate("/my-profile?edit=true");
      return;
    }
    if (filterId === "nearby") {
      if (locationPermission === "granted") {
        setActiveFilter("nearby");
      } else if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const loc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(loc);
            setLocationPermission("granted");
            setActiveFilter("nearby");
            
            if (isAuthenticated) {
              updateLocation.mutate(loc);
            }
          },
          () => {
            setLocationPermission("denied");
            toast({ title: "Brak dostępu do lokalizacji", variant: "destructive" });
          }
        );
      }
    } else {
      setActiveFilter(filterId);
    }
  };

  const filteredProfiles = profiles?.filter((p: any) => p.id !== myProfile?.id) || [];

  return (
    <div className="space-y-6">
      <header>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {FILTERS.map((f) => (
            <Button
              key={f.id}
              onClick={() => handleFilterClick(f.id)}
              variant={activeFilter === f.id ? "default" : "outline"}
              size="sm"
              className="whitespace-nowrap text-xs px-3"
              data-testid={`button-filter-${f.id}`}
            >
              {f.icon && <f.icon className={`w-3 h-3 mr-1 ${f.iconClass}`} />}
              {f.label}
            </Button>
          ))}
        </div>
      </header>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          {activeFilter === "nearby" ? "W pobliżu" : activeFilter === "online" ? "Online" : activeFilter === "new" ? "Nowi" : "Zweryfikowani"}
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-card/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>Nie znaleziono profili dla tego filtru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProfiles.map((profile: any) => (
              <div key={profile.id} className="group relative block aspect-[3/4] rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300">
                <Link href={`/profile/${profile.id}`} className="absolute inset-0">
                  {profile.avatarUrl ? (
                    <img 
                      src={profile.avatarUrl} 
                      alt={profile.displayName} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center text-4xl font-bold text-muted-foreground/30">
                      {profile.displayName[0]}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                </Link>

                {isAuthenticated && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white h-8 w-8"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setReportModalProfile({ id: profile.id, username: profile.username });
                    }}
                    data-testid={`button-more-${profile.id}`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                )}

                {activeFilter === "nearby" && profile.distanceKm !== undefined && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-primary/20 border-primary/50 text-primary">
                      <MapPin className="w-3 h-3 mr-1" />
                      {profile.distanceKm} km
                    </Badge>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white truncate">{profile.displayName}{profile.age ? `, ${profile.age}` : ""}</h3>
                    {profile.isVerified && (
                      <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#00FF41]" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span className="truncate max-w-[80px]">{profile.city || "Polska"}</span>
                    </div>
                    {profile.isOnline && (
                      <Badge variant="outline" className="h-5 px-1.5 border-primary/30 text-primary bg-primary/10 text-[10px]">
                        Online
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reportModalProfile && (
        <ReportBlockModal
          profileId={reportModalProfile.id}
          username={reportModalProfile.username}
          isOpen={!!reportModalProfile}
          onClose={() => setReportModalProfile(null)}
        />
      )}
    </div>
  );
}

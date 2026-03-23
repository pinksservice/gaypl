import { useState, useEffect } from "react";
import { useAds, useCreateAd } from "@/hooks/use-ads";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, MapPin, Tag, User, Navigation, Globe, X } from "lucide-react";
import clsx from "clsx";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAdSchema, type InsertAd } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { value: "all", label: "Wszystkie" },
  { value: "Znajomości", label: "Znajomości" },
  { value: "Mieszkania", label: "Mieszkania" },
  { value: "Marketplace", label: "Marketplace" },
  { value: "Inne", label: "Inne" },
];

export default function Ads() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"nearby" | "all">("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt");

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationPermission("granted");
        },
        () => {
          setLocationPermission("denied");
        }
      );
    }
  }, []);

  const filters = {
    category: selectedCategory === "all" ? undefined : selectedCategory,
    userLat: viewMode === "nearby" && userLocation ? userLocation.lat : undefined,
    userLng: viewMode === "nearby" && userLocation ? userLocation.lng : undefined,
  };

  const { data: ads, isLoading } = useAds(filters);

  return (
    <div className="space-y-4 relative min-h-screen">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={viewMode === "nearby" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            if (locationPermission === "granted") {
              setViewMode("nearby");
            } else if ("geolocation" in navigator) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                  });
                  setLocationPermission("granted");
                  setViewMode("nearby");
                },
                () => {
                  setLocationPermission("denied");
                  toast({ title: "Brak dostępu do lokalizacji", variant: "destructive" });
                }
              );
            }
          }}
          className="flex items-center gap-2"
          data-testid="button-view-nearby"
        >
          <Navigation className="w-4 h-4" />
          W pobliżu
        </Button>
        <Button
          variant={viewMode === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("all")}
          className="flex items-center gap-2"
          data-testid="button-view-all"
        >
          <Globe className="w-4 h-4" />
          Wszystkie
        </Button>
        <Button 
          onClick={() => isAuthenticated ? setIsCreateOpen(true) : window.location.href = "/login"}
          size="sm"
          className="flex items-center gap-2"
          data-testid="button-add-ad"
        >
          <Plus className="w-4 h-4" />
          Dodaj
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            variant={selectedCategory === cat.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.value)}
            className="whitespace-nowrap"
            data-testid={`button-category-${cat.value}`}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : ads?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Brak ogłoszeń w tej kategorii
        </div>
      ) : (
        <div className="space-y-3">
          {ads?.map((ad: any) => (
            <div 
              key={ad.id} 
              className={clsx(
                "group bg-card p-4 rounded-xl border transition-all",
                ad.isPremium 
                  ? "border-yellow-500/50" 
                  : "border-border"
              )}
              data-testid={`card-ad-${ad.id}`}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex gap-2 items-center flex-wrap">
                    {ad.isPremium && <Badge variant="premium">Premium</Badge>}
                    <Badge variant="secondary">
                      <Tag className="w-3 h-3 mr-1" />
                      {ad.category}
                    </Badge>
                    {ad.distanceKm !== undefined && ad.distanceKm !== null && (
                      <Badge variant="outline" className="text-primary border-primary/30">
                        <MapPin className="w-3 h-3 mr-1" />
                        {ad.distanceKm} km
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-foreground truncate">
                    {ad.title}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">{ad.description}</p>
                  
                  {ad.tags && ad.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {ad.tags.slice(0, 3).map((tag: string, idx: number) => (
                        <span key={idx} className="text-xs bg-muted px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    {ad.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {ad.location}
                      </span>
                    )}
                    <span>{new Date(ad.createdAt).toLocaleDateString("pl-PL")}</span>
                  </div>
                </div>
                
                {ad.author && (
                  <Link href={`/profile/${ad.author.id}`} className="flex-shrink-0">
                    <Avatar className="w-10 h-10 border-2 border-primary/30 hover:border-primary transition-colors cursor-pointer" data-testid={`avatar-ad-author-${ad.id}`}>
                      <AvatarImage src={ad.author.avatarUrl || undefined} alt={ad.author.displayName} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                )}
              </div>
              
              {ad.images && ad.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {ad.images.slice(0, 3).map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={img}
                      alt=""
                      className="w-full h-20 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nowe ogłoszenie</DialogTitle>
          </DialogHeader>
          <CreateAdForm 
            userLocation={userLocation}
            onSuccess={() => { 
              setIsCreateOpen(false); 
              toast({ title: "Dodano ogłoszenie!" }); 
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CreateAdFormProps {
  onSuccess: () => void;
  userLocation: { lat: number; lng: number } | null;
}

function CreateAdForm({ onSuccess, userLocation }: CreateAdFormProps) {
  const { mutate, isPending } = useCreateAd();
  const { toast } = useToast();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [useLocation, setUseLocation] = useState(!!userLocation);

  const form = useForm<InsertAd>({
    resolver: zodResolver(insertAdSchema),
    defaultValues: { 
      title: "",
      description: "",
      category: "Znajomości",
      location: "",
      contactInfo: "",
      isPremium: false,
      tags: [],
      images: [],
      latitude: userLocation?.lat?.toString() || null,
      longitude: userLocation?.lng?.toString() || null,
    }
  });

  const addTag = () => {
    if (tagInput.trim() && tags.length < 5) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      form.setValue("tags", newTags);
      setTagInput("");
    }
  };

  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
    form.setValue("tags", newTags);
  };
  
  const onSubmit = (data: InsertAd) => {
    const submitData = {
      ...data,
      tags: tags.length > 0 ? tags : null,
      latitude: useLocation && userLocation ? userLocation.lat.toString() : null,
      longitude: useLocation && userLocation ? userLocation.lng.toString() : null,
    };
    
    mutate(submitData, { 
      onSuccess,
      onError: (error) => {
        toast({ 
          title: "Błąd", 
          description: error.message || "Nie udało się dodać ogłoszenia",
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Tytuł</label>
        <input 
          {...form.register("title")} 
          className="w-full bg-background border border-border rounded-lg p-2.5 focus:border-primary" 
          placeholder="np. Szukam współlokatora w Warszawie"
          data-testid="input-ad-title"
        />
        {form.formState.errors.title && <span className="text-red-500 text-xs">{form.formState.errors.title.message}</span>}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Kategoria</label>
        <select 
          {...form.register("category")} 
          className="w-full bg-background border border-border rounded-lg p-2.5 focus:border-primary"
          data-testid="select-ad-category"
        >
          <option value="Znajomości">Znajomości - randki, przyjaźnie</option>
          <option value="Mieszkania">Mieszkania - wynajem, noclegi</option>
          <option value="Marketplace">Marketplace - praca, usługi, sprzedaż</option>
          <option value="Inne">Inne</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Opis</label>
        <textarea 
          {...form.register("description")} 
          rows={4} 
          className="w-full bg-background border border-border rounded-lg p-2.5 focus:border-primary" 
          placeholder="Opisz szczegóły..."
          data-testid="textarea-ad-description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tagi (max 5)</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            className="flex-1 bg-background border border-border rounded-lg p-2.5 focus:border-primary"
            placeholder="np. gaming, aktywny..."
            disabled={tags.length >= 5}
            data-testid="input-ad-tag"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addTag}
            disabled={tags.length >= 5}
            data-testid="button-add-tag"
          >
            Dodaj
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="bg-muted px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(idx)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Miasto</label>
          <input 
            {...form.register("location")} 
            className="w-full bg-background border border-border rounded-lg p-2.5 focus:border-primary" 
            placeholder="np. Warszawa"
            data-testid="input-ad-location"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Kontakt</label>
          <input 
            {...form.register("contactInfo")} 
            className="w-full bg-background border border-border rounded-lg p-2.5 focus:border-primary" 
            placeholder="email lub telefon"
            data-testid="input-ad-contact"
          />
        </div>
      </div>

      {userLocation && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="useLocation"
            checked={useLocation}
            onChange={(e) => setUseLocation(e.target.checked)}
            className="rounded border-border"
            data-testid="checkbox-use-location"
          />
          <label htmlFor="useLocation" className="text-sm text-muted-foreground">
            Dodaj moją lokalizację (widoczne w "W pobliżu")
          </label>
        </div>
      )}
      
      <Button 
        disabled={isPending}
        type="submit" 
        className="w-full"
        data-testid="button-submit-ad"
      >
        {isPending ? "Dodawanie..." : "Opublikuj"}
      </Button>
    </form>
  );
}

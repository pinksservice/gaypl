import { useState, useEffect, useCallback } from "react";
import { useNearbyEvents, useWeeklySchedule, useVenueDetails, useVenues, type VenueEvent, type Venue } from "@/hooks/use-venues";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MapPin, Clock, Navigation, Calendar, Star, ExternalLink, Phone, Globe } from "lucide-react";
import clsx from "clsx";

const CITIES = ["Warszawa", "Kraków", "Wrocław", "Poznań", "Gdańsk", "Łódź", "Katowice", "Sopot", "Szczecin", "Barcelona"];
const VENUE_TYPES = [
  { value: "all", label: "Wszystkie" },
  { value: "Klub", label: "Klub" },
  { value: "Bar", label: "Bar" },
  { value: "Sauna", label: "Sauna" },
  { value: "Kawiarnia", label: "Kawiarnia" },
  { value: "Restauracja", label: "Restauracja" },
];

const DAYS_OF_WEEK = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
}

function EventCard({ event, onVenueClick }: { event: VenueEvent; onVenueClick: (id: number) => void }) {
  return (
    <Card 
      data-testid={`card-event-${event.event.id}`}
      className="cursor-pointer hover:border-primary/50 transition-all"
      onClick={() => onVenueClick(event.venue.id)}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-lg bg-secondary flex-shrink-0 overflow-hidden">
            {event.venue.coverImage ? (
              <img src={event.venue.coverImage} alt={event.venue.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-semibold text-foreground truncate">{event.event.name}</h3>
                <p className="text-sm text-muted-foreground">{event.venue.name}</p>
              </div>
              {event.event.is_recurring ? (
                <Badge variant="outline">{DAYS_OF_WEEK[event.event.day_of_week || 0]}</Badge>
              ) : event.event.featured && (
                <Badge variant="default" className="bg-primary text-black">
                  <Star className="w-3 h-3 mr-1" />Wyjatkowe
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {event.event.start_time}{event.event.end_time && ` - ${event.event.end_time}`}
              </span>
              {event.venue.distance_km != null && (
                <span className="flex items-center gap-1 text-primary">
                  <Navigation className="w-3 h-3" />
                  {parseFloat(String(event.venue.distance_km)).toFixed(1)} km
                </span>
              )}
            </div>
            {event.event.price && (
              <p className="text-sm text-primary mt-1 font-medium">{event.event.price}</p>
            )}
            {event.event.tags && event.event.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {event.event.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VenueDetailModal({ venueId, onClose }: { venueId: number; onClose: () => void }) {
  const { data, isLoading } = useVenueDetails(venueId);

  if (isLoading) {
    return (
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">Ladowanie lokalu</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DialogContent>
    );
  }

  if (!data) return null;

  const { venue, recurring_events, upcoming_one_time_events } = data;

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl">{venue.name}</DialogTitle>
      </DialogHeader>
      
      {venue.coverImage && (
        <div className="aspect-video rounded-lg overflow-hidden mb-4">
          <img src={venue.coverImage} alt={venue.name} className="w-full h-full object-cover" />
        </div>
      )}
      
      <div className="space-y-4">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-primary mt-0.5" />
          <div>
            <p>{venue.address}</p>
            <p className="text-muted-foreground">{venue.city}{venue.district && `, ${venue.district}`}</p>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">{venue.type}</Badge>
          {venue.featured && <Badge variant="default" className="bg-primary text-black">Wyroziniony</Badge>}
        </div>
        
        {venue.description && (
          <p className="text-sm text-muted-foreground">{venue.description}</p>
        )}
        
        <div className="flex gap-2 flex-wrap">
          {venue.website && (
            <Button size="sm" variant="outline" asChild>
              <a href={venue.website} target="_blank" rel="noopener noreferrer">
                <Globe className="w-4 h-4 mr-1" />Strona
              </a>
            </Button>
          )}
          {venue.phone && (
            <Button size="sm" variant="outline" asChild>
              <a href={`tel:${venue.phone}`}>
                <Phone className="w-4 h-4 mr-1" />{venue.phone}
              </a>
            </Button>
          )}
          {venue.lat && venue.lng && (
            <Button size="sm" variant="default" asChild>
              <a href={`https://maps.google.com/?q=${venue.lat},${venue.lng}`} target="_blank" rel="noopener noreferrer">
                <Navigation className="w-4 h-4 mr-1" />Nawiguj
              </a>
            </Button>
          )}
        </div>
        
        {recurring_events.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Stale imprezy</h4>
            <div className="space-y-2">
              {recurring_events.map(e => (
                <div key={e.id} className="p-3 bg-secondary rounded-lg">
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <span className="font-medium">{e.eventName}</span>
                    <Badge variant="outline">{e.day_name}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {e.startTime}{e.endTime && ` - ${e.endTime}`}
                    {e.price && ` | ${e.price}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {upcoming_one_time_events.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Nadchodzace wydarzenia</h4>
            <div className="space-y-2">
              {upcoming_one_time_events.map(e => (
                <div key={e.id} className="p-3 bg-secondary rounded-lg">
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <span className="font-medium">{e.eventName}</span>
                    {e.featured && <Badge className="bg-primary text-black">Wyjatkowe</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(e.eventDate).toLocaleDateString('pl-PL')} | {e.startTime}
                    {e.price && ` | ${e.price}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );
}

export default function Events() {
  const [tab, setTab] = useState<"nearby" | "week" | "places">("nearby");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState("Warszawa");
  const [selectedType, setSelectedType] = useState("all");
  const [radiusKm, setRadiusKm] = useState(10);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);

  const requestLocation = useCallback(() => {
    setLocationError(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          setLocationError("Nie udalo sie uzyskac lokalizacji. Wybierz miasto recznie.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationError("Twoja przegladarka nie wspiera geolokalizacji.");
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const { data: nearbyData, isLoading: nearbyLoading } = useNearbyEvents({
    lat: userLocation?.lat,
    lng: userLocation?.lng,
    city: !userLocation ? selectedCity : undefined,
    radiusKm,
    date: selectedDate,
    type: selectedType !== "all" ? selectedType : undefined,
    enabled: tab === "nearby",
  });

  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklySchedule(
    userLocation ? selectedCity : selectedCity,
  );

  const [venueCity, setVenueCity] = useState("Barcelona");
  const [venueType, setVenueType] = useState("all");
  const { data: venuesData, isLoading: venuesLoading } = useVenues({
    city: venueCity,
    type: venueType !== "all" ? venueType : undefined,
  });

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2" data-testid="text-events-title">Miasto i Noc</h1>
        <p className="text-muted-foreground mb-4">Odkryj lokale i wydarzenia LGBT+ blisko Ciebie</p>
        
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
          <TabsList className="w-full max-w-md grid grid-cols-3">
            <TabsTrigger value="nearby" data-testid="tab-nearby">
              <Navigation className="w-4 h-4 mr-1" />Blisko
            </TabsTrigger>
            <TabsTrigger value="week" data-testid="tab-week">
              <Calendar className="w-4 h-4 mr-1" />Tydzien
            </TabsTrigger>
            <TabsTrigger value="places" data-testid="tab-places">
              <MapPin className="w-4 h-4 mr-1" />Lokale
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="nearby" className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              {userLocation ? (
                <Badge variant="outline" className="text-primary">
                  <Navigation className="w-3 h-3 mr-1" />Twoja lokalizacja
                </Badge>
              ) : (
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-40" data-testid="select-city">
                    <SelectValue placeholder="Miasto" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Select value={String(radiusKm)} onValueChange={(v) => setRadiusKm(Number(v))}>
                <SelectTrigger className="w-28" data-testid="select-radius">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 km</SelectItem>
                  <SelectItem value="5">5 km</SelectItem>
                  <SelectItem value="10">10 km</SelectItem>
                  <SelectItem value="20">20 km</SelectItem>
                  <SelectItem value="50">Cale miasto</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-32" data-testid="select-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VENUE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-36" data-testid="select-date">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={todayStr}>Dzisiaj</SelectItem>
                  <SelectItem value={tomorrowStr}>Jutro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {locationError && (
              <div className="p-3 bg-secondary rounded-lg text-sm text-muted-foreground flex items-center justify-between gap-2 flex-wrap">
                <span>{locationError}</span>
                <Button size="sm" variant="outline" onClick={requestLocation}>
                  Sprobuj ponownie
                </Button>
              </div>
            )}
            
            {nearbyLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : nearbyData?.events && nearbyData.events.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {formatDate(nearbyData.date)} | Znaleziono {nearbyData.events.length} wydarzen
                </p>
                {nearbyData.events.map((event, idx) => (
                  <EventCard 
                    key={`${event.venue.id}-${event.event.id}-${idx}`} 
                    event={event} 
                    onVenueClick={setSelectedVenueId}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Brak wydarzen na wybrany dzien w Twojej okolicy.</p>
                <p className="text-sm">Sprobuj zwiekszyc promien lub wybrac inny dzien.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="week" className="mt-4 space-y-4">
            <div className="flex gap-2 items-center flex-wrap">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-40" data-testid="select-city-week">
                  <SelectValue placeholder="Miasto" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {weeklyLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : weeklyData?.days ? (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Tydzien: {weeklyData.week_start} - {weeklyData.week_end}
                </p>
                {weeklyData.days.map(day => {
                  const totalEvents = day.recurring_events.length + day.one_time_events.length;
                  if (totalEvents === 0) return null;
                  
                  return (
                    <div key={day.date}>
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-semibold text-lg">{day.day_name}</h3>
                        <Badge variant="secondary">{day.date}</Badge>
                        <Badge variant="outline">{totalEvents} wydarzen</Badge>
                      </div>
                      <div className="space-y-2">
                        {[...day.recurring_events, ...day.one_time_events].map((event, idx) => (
                          <EventCard 
                            key={`${event.venue.id}-${event.event.id}-${idx}`} 
                            event={event} 
                            onVenueClick={setSelectedVenueId}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>Brak wydarzen w tym tygodniu dla wybranego miasta.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="places" className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={venueCity} onValueChange={setVenueCity}>
                <SelectTrigger className="w-40" data-testid="select-venue-city">
                  <SelectValue placeholder="Miasto" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={venueType} onValueChange={setVenueType}>
                <SelectTrigger className="w-32" data-testid="select-venue-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VENUE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {venuesLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : venuesData && venuesData.length > 0 ? (
              <div className="space-y-2">
                {venuesData.map(venue => (
                  <Card 
                    key={venue.id}
                    data-testid={`card-venue-${venue.id}`}
                    className="cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => setSelectedVenueId(venue.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-lg bg-secondary flex-shrink-0 overflow-hidden">
                          {venue.coverImage ? (
                            <img src={venue.coverImage} alt={venue.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-primary" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <h3 className="font-semibold text-foreground">{venue.name}</h3>
                              <p className="text-sm text-muted-foreground">{venue.address}</p>
                            </div>
                            <Badge variant="outline">{venue.type}</Badge>
                          </div>
                          {venue.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{venue.description}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Brak lokali w wybranym miescie.</p>
                <p className="text-sm">Sprobuj wybrac inne miasto.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </header>
      
      <Dialog open={selectedVenueId !== null} onOpenChange={(open) => !open && setSelectedVenueId(null)}>
        {selectedVenueId !== null && (
          <VenueDetailModal venueId={selectedVenueId} onClose={() => setSelectedVenueId(null)} />
        )}
      </Dialog>
    </div>
  );
}

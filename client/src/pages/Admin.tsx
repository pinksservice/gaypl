import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, FileText, Megaphone, Calendar, MapPin, Trash2, Plus, 
  Shield, ShieldOff, BarChart3, Edit, MessageCircleQuestion, Check, X, Eye
} from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import type { User, Profile, Article, Ad, Event, Place, ArticleCategory, ExpertQuestion, Venue, RecurringEvent, OneTimeEvent } from "@shared/schema";
import { Building2, Clock } from "lucide-react";

interface Stats {
  users: number;
  profiles: number;
  articles: number;
  ads: number;
  events: number;
  places: number;
}

export default function Admin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("stats");

  const { data: stats } = useQuery<Stats>({ queryKey: ["/api/admin/stats"] });
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/admin/users"] });
  const { data: profiles } = useQuery<Profile[]>({ queryKey: ["/api/admin/profiles"] });
  const { data: articles } = useQuery<Article[]>({ queryKey: ["/api/admin/articles"] });
  const { data: ads } = useQuery<Ad[]>({ queryKey: ["/api/admin/ads"] });
  const { data: events } = useQuery<Event[]>({ queryKey: ["/api/admin/events"] });
  const { data: places } = useQuery<Place[]>({ queryKey: ["/api/admin/places"] });
  const { data: categories } = useQuery<ArticleCategory[]>({ queryKey: ["/api/categories"] });
  const { data: questions } = useQuery<ExpertQuestion[]>({ queryKey: ["/api/admin/questions"] });
  const { data: venuesData } = useQuery<Venue[]>({ queryKey: ["/api/admin/venues"] });
  const { data: recurringEventsData } = useQuery<RecurringEvent[]>({ queryKey: ["/api/admin/recurring-events"] });
  const { data: oneTimeEventsData } = useQuery<OneTimeEvent[]>({ queryKey: ["/api/admin/one-time-events"] });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ id, isAdmin }: { id: string; isAdmin: boolean }) => {
      return apiRequest("PATCH", `/api/admin/users/${id}/admin`, { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Zaktualizowano uprawnienia" });
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/admin/profiles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Profil usunięty" });
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/admin/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Artykuł usunięty" });
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/admin/ads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Ogłoszenie usunięte" });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/admin/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Wydarzenie usunięte" });
    },
  });

  const deletePlaceMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/admin/places/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/places"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Miejsce usunięte" });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => 
      apiRequest("PATCH", `/api/admin/questions/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      toast({ title: "Status pytania zaktualizowany" });
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Panel Administracyjny</h1>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="stats" data-testid="tab-stats">
            <BarChart3 className="w-4 h-4 mr-1" />
            <span className="hidden md:inline">Statystyki</span>
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="w-4 h-4 mr-1" />
            <span className="hidden md:inline">Uzytkownicy</span>
          </TabsTrigger>
          <TabsTrigger value="articles" data-testid="tab-articles">
            <FileText className="w-4 h-4 mr-1" />
            <span className="hidden md:inline">Artykuly</span>
          </TabsTrigger>
          <TabsTrigger value="questions" data-testid="tab-questions">
            <MessageCircleQuestion className="w-4 h-4 mr-1" />
            <span className="hidden md:inline">Pytania</span>
          </TabsTrigger>
          <TabsTrigger value="ads" data-testid="tab-ads">
            <Megaphone className="w-4 h-4 mr-1" />
            <span className="hidden md:inline">Ogloszenia</span>
          </TabsTrigger>
          <TabsTrigger value="venues" data-testid="tab-venues">
            <Building2 className="w-4 h-4 mr-1" />
            <span className="hidden md:inline">Lokale</span>
          </TabsTrigger>
          <TabsTrigger value="recurring" data-testid="tab-recurring">
            <Clock className="w-4 h-4 mr-1" />
            <span className="hidden md:inline">Cykliczne</span>
          </TabsTrigger>
          <TabsTrigger value="events" data-testid="tab-events">
            <Calendar className="w-4 h-4 mr-1" />
            <span className="hidden md:inline">Wydarzenia</span>
          </TabsTrigger>
          <TabsTrigger value="places" data-testid="tab-places">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="hidden md:inline">Miejsca</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Użytkownicy</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats?.users || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profile</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats?.profiles || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Artykuły</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats?.articles || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ogłoszenia</CardTitle>
                <Megaphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats?.ads || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wydarzenia</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats?.events || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Miejsca</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats?.places || 0}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zarządzanie Użytkownikami</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users?.map((user) => (
                  <div key={user.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-3">
                      {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Users className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.isAdmin && <Badge variant="default">Admin</Badge>}
                      <Button
                        size="sm"
                        variant={user.isAdmin ? "destructive" : "outline"}
                        onClick={() => toggleAdminMutation.mutate({ id: user.id, isAdmin: !user.isAdmin })}
                        disabled={toggleAdminMutation.isPending}
                        data-testid={`toggle-admin-${user.id}`}
                      >
                        {user.isAdmin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
                {(!users || users.length === 0) && (
                  <p className="text-muted-foreground text-center py-8">Brak użytkowników</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="articles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Artykuły</CardTitle>
              <AddArticleDialog categories={categories || []} />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {articles?.map((article) => (
                  <div key={article.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary/30">
                    <div className="flex-1">
                      <p className="font-medium">{article.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary">{article.categorySlug || 'Brak kategorii'}</Badge>
                        <Badge variant={article.status === 'published' ? 'default' : 'outline'}>
                          {article.status === 'published' ? 'Opublikowany' : article.status === 'draft' ? 'Szkic' : 'Zaplanowany'}
                        </Badge>
                        {article.featured && <Badge variant="default">Wyróżniony</Badge>}
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {article.views || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <EditArticleDialog article={article} categories={categories || []} />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteArticleMutation.mutate(article.id)}
                        disabled={deleteArticleMutation.isPending}
                        data-testid={`delete-article-${article.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!articles || articles.length === 0) && (
                  <p className="text-muted-foreground text-center py-8">Brak artykułów</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pytania do Eksperta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {questions?.filter(q => q.status === 'pending').map((question) => (
                  <div key={question.id} className="p-4 rounded-lg bg-secondary/30 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{question.questionText}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary">{question.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {question.isAnonymous ? 'Anonimowe' : 'Zarejestrowany użytkownik'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {question.createdAt ? new Date(question.createdAt).toLocaleDateString('pl-PL') : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateQuestionMutation.mutate({ id: question.id, status: 'approved' })}
                          disabled={updateQuestionMutation.isPending}
                          title="Zaakceptuj do odpowiedzi"
                          data-testid={`approve-question-${question.id}`}
                        >
                          <Check className="w-4 h-4 text-green-500" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateQuestionMutation.mutate({ id: question.id, status: 'rejected' })}
                          disabled={updateQuestionMutation.isPending}
                          title="Odrzuć pytanie"
                          data-testid={`reject-question-${question.id}`}
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {questions?.filter(q => q.status === 'pending').length === 0 && (
                  <p className="text-muted-foreground text-center py-8">Brak oczekujących pytań</p>
                )}
                
                {questions?.filter(q => q.status === 'approved').length ? (
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Zatwierdzone (oczekują na odpowiedź)</h3>
                    {questions?.filter(q => q.status === 'approved').map((question) => (
                      <div key={question.id} className="p-3 rounded-lg bg-primary/10 mb-2">
                        <p className="text-sm">{question.questionText}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{question.category}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ogłoszenia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ads?.map((ad) => (
                  <div key={ad.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary/30">
                    <div className="flex-1">
                      <p className="font-medium">{ad.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{ad.category}</Badge>
                        {ad.isPremium && <Badge variant="default">Premium</Badge>}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteAdMutation.mutate(ad.id)}
                      disabled={deleteAdMutation.isPending}
                      data-testid={`delete-ad-${ad.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {(!ads || ads.length === 0) && (
                  <p className="text-muted-foreground text-center py-8">Brak ogłoszeń</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Wydarzenia</CardTitle>
              <AddEventDialog />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events?.map((event) => (
                  <div key={event.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary/30">
                    <div className="flex-1">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.city} - {event.locationName}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteEventMutation.mutate(event.id)}
                      disabled={deleteEventMutation.isPending}
                      data-testid={`delete-event-${event.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {(!events || events.length === 0) && (
                  <p className="text-muted-foreground text-center py-8">Brak wydarzeń</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="venues" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Lokale (nowy system z geolokalizacja)</CardTitle>
              <AddVenueDialog />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {venuesData?.map((venue) => (
                  <div key={venue.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary/30">
                    <div className="flex-1">
                      <p className="font-medium">{venue.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{venue.type}</Badge>
                        <span className="text-sm text-muted-foreground">{venue.city}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{venue.address}</p>
                      {venue.lat && venue.lng && (
                        <p className="text-xs text-primary mt-1">GPS: {parseFloat(venue.lat).toFixed(4)}, {parseFloat(venue.lng).toFixed(4)}</p>
                      )}
                    </div>
                    <DeleteVenueButton venueId={venue.id} />
                  </div>
                ))}
                {(!venuesData || venuesData.length === 0) && (
                  <p className="text-muted-foreground text-center py-8">Brak lokali</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recurring" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Wydarzenia cykliczne</CardTitle>
              <AddRecurringEventDialog venues={venuesData || []} />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recurringEventsData?.map((event) => {
                  const dayNames = ["Niedziela", "Poniedzialek", "Wtorek", "Sroda", "Czwartek", "Piatek", "Sobota"];
                  const venue = venuesData?.find(v => v.id === event.venueId);
                  return (
                    <div key={event.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary/30">
                      <div className="flex-1">
                        <p className="font-medium">{event.eventName}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="outline">{dayNames[event.dayOfWeek]}</Badge>
                          <Badge variant="secondary">{event.startTime?.slice(0, 5)}</Badge>
                          <span className="text-sm text-muted-foreground">{venue?.name || "Nieznany lokal"}</span>
                        </div>
                      </div>
                      <DeleteRecurringEventButton eventId={event.id} />
                    </div>
                  );
                })}
                {(!recurringEventsData || recurringEventsData.length === 0) && (
                  <p className="text-muted-foreground text-center py-8">Brak wydarzen cyklicznych</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="places" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Miejsca (stary system)</CardTitle>
              <AddPlaceDialog />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {places?.map((place) => (
                  <div key={place.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary/30">
                    <div className="flex-1">
                      <p className="font-medium">{place.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{place.type}</Badge>
                        <span className="text-sm text-muted-foreground">{place.city}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{place.address}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <EditPlaceDialog place={place} />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deletePlaceMutation.mutate(place.id)}
                        disabled={deletePlaceMutation.isPending}
                        data-testid={`delete-place-${place.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!places || places.length === 0) && (
                  <p className="text-muted-foreground text-center py-8">Brak miejsc</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    ['clean']
  ],
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[ąàáâãäå]/g, 'a')
    .replace(/[ćç]/g, 'c')
    .replace(/[ęèéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[łľĺ]/g, 'l')
    .replace(/[ńñ]/g, 'n')
    .replace(/[óòôõöő]/g, 'o')
    .replace(/[śšş]/g, 's')
    .replace(/[ùúûüű]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[źżž]/g, 'z')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function AddArticleDialog({ categories }: { categories: ArticleCategory[] }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ 
    title: "", 
    slug: "",
    excerpt: "", 
    content: "", 
    categorySlug: "news", 
    author: "Redakcja",
    coverImage: "",
    status: "draft",
    featured: false,
    tags: "",
    metaTitle: "",
    metaDescription: ""
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const payload = {
        ...data,
        slug: data.slug || generateSlug(data.title),
        tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
        publishDate: data.status === 'published' ? new Date() : null,
      };
      return apiRequest("POST", "/api/admin/articles", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Artykuł dodany" });
      setOpen(false);
      setForm({ title: "", slug: "", excerpt: "", content: "", categorySlug: "news", author: "Redakcja", coverImage: "", status: "draft", featured: false, tags: "", metaTitle: "", metaDescription: "" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="add-article-btn">
          <Plus className="w-4 h-4 mr-2" />
          Dodaj
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nowy Artykuł</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tytuł</Label>
              <Input 
                value={form.title} 
                onChange={(e) => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })} 
                data-testid="input-article-title" 
              />
            </div>
            <div>
              <Label>Slug (URL)</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} data-testid="input-article-slug" />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Kategoria</Label>
              <Select value={form.categorySlug} onValueChange={(v) => setForm({ ...form, categorySlug: v })}>
                <SelectTrigger data-testid="select-article-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Autor</Label>
              <Select value={form.author} onValueChange={(v) => setForm({ ...form, author: v })}>
                <SelectTrigger data-testid="select-article-author">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Redakcja">Redakcja</SelectItem>
                  <SelectItem value="Kinga">Kinga</SelectItem>
                  <SelectItem value="Dr Szymon Niemiec">Dr Szymon Niemiec</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger data-testid="select-article-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Szkic</SelectItem>
                  <SelectItem value="published">Opublikowany</SelectItem>
                  <SelectItem value="scheduled">Zaplanowany</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Zajawka</Label>
            <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} data-testid="input-article-excerpt" />
          </div>
          
          <div>
            <Label>Treść artykułu</Label>
            <div className="border rounded-md">
              <ReactQuill 
                theme="snow"
                value={form.content} 
                onChange={(content) => setForm({ ...form, content })}
                modules={quillModules}
                className="bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>URL obrazka głównego</Label>
              <Input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} data-testid="input-article-cover" />
            </div>
            <div>
              <Label>Tagi (oddzielone przecinkami)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="LGBT, Polska, Aktualności" data-testid="input-article-tags" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={form.featured} onCheckedChange={(checked) => setForm({ ...form, featured: checked })} data-testid="switch-article-featured" />
            <Label>Artykuł wyróżniony</Label>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">SEO</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Meta tytuł</Label>
                <Input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} data-testid="input-article-meta-title" />
              </div>
              <div>
                <Label>Meta opis</Label>
                <Textarea value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} data-testid="input-article-meta-desc" />
              </div>
            </div>
          </div>

          <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.title || !form.content} className="w-full" data-testid="submit-article">
            {mutation.isPending ? 'Zapisywanie...' : 'Dodaj Artykuł'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditArticleDialog({ article, categories }: { article: Article; categories: ArticleCategory[] }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ 
    title: article.title, 
    slug: article.slug || "",
    excerpt: article.excerpt || "", 
    content: article.content, 
    categorySlug: article.categorySlug || "news", 
    author: article.author || "Redakcja",
    coverImage: article.coverImage || "",
    status: article.status || "draft",
    featured: article.featured || false,
    tags: (article.tags || []).join(', '),
    metaTitle: article.metaTitle || "",
    metaDescription: article.metaDescription || ""
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
        publishDate: data.status === 'published' && !article.publishDate ? new Date() : article.publishDate,
      };
      return apiRequest("PATCH", `/api/admin/articles/${article.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      toast({ title: "Artykuł zaktualizowany" });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" data-testid={`edit-article-${article.id}`}>
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edytuj Artykuł</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tytuł</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-edit-article-title" />
            </div>
            <div>
              <Label>Slug (URL)</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} data-testid="input-edit-article-slug" />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Kategoria</Label>
              <Select value={form.categorySlug} onValueChange={(v) => setForm({ ...form, categorySlug: v })}>
                <SelectTrigger data-testid="select-edit-article-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Autor</Label>
              <Select value={form.author} onValueChange={(v) => setForm({ ...form, author: v })}>
                <SelectTrigger data-testid="select-edit-article-author">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Redakcja">Redakcja</SelectItem>
                  <SelectItem value="Kinga">Kinga</SelectItem>
                  <SelectItem value="Dr Szymon Niemiec">Dr Szymon Niemiec</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger data-testid="select-edit-article-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Szkic</SelectItem>
                  <SelectItem value="published">Opublikowany</SelectItem>
                  <SelectItem value="scheduled">Zaplanowany</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Zajawka</Label>
            <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} data-testid="input-edit-article-excerpt" />
          </div>
          
          <div>
            <Label>Treść artykułu</Label>
            <div className="border rounded-md">
              <ReactQuill 
                theme="snow"
                value={form.content} 
                onChange={(content) => setForm({ ...form, content })}
                modules={quillModules}
                className="bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>URL obrazka głównego</Label>
              <Input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} data-testid="input-edit-article-cover" />
            </div>
            <div>
              <Label>Tagi (oddzielone przecinkami)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} data-testid="input-edit-article-tags" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={form.featured} onCheckedChange={(checked) => setForm({ ...form, featured: checked })} data-testid="switch-edit-article-featured" />
            <Label>Artykuł wyróżniony</Label>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">SEO</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Meta tytuł</Label>
                <Input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} data-testid="input-edit-article-meta-title" />
              </div>
              <div>
                <Label>Meta opis</Label>
                <Textarea value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} data-testid="input-edit-article-meta-desc" />
              </div>
            </div>
          </div>

          <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.title || !form.content} className="w-full" data-testid="submit-edit-article">
            {mutation.isPending ? 'Zapisywanie...' : 'Zapisz Zmiany'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddEventDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", eventDate: "", location: "", city: "", priceInfo: "", imageUrl: "" });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => apiRequest("POST", "/api/admin/events", { ...data, eventDate: new Date(data.eventDate) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Wydarzenie dodane" });
      setOpen(false);
      setForm({ title: "", description: "", eventDate: "", location: "", city: "", priceInfo: "", imageUrl: "" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="add-event-btn">
          <Plus className="w-4 h-4 mr-2" />
          Dodaj
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nowe Wydarzenie</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tytuł</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-event-title" />
          </div>
          <div>
            <Label>Data i godzina</Label>
            <Input type="datetime-local" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} data-testid="input-event-date" />
          </div>
          <div>
            <Label>Miasto</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} data-testid="input-event-city" />
          </div>
          <div>
            <Label>Lokalizacja</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} data-testid="input-event-location" />
          </div>
          <div>
            <Label>Cena</Label>
            <Input value={form.priceInfo} onChange={(e) => setForm({ ...form, priceInfo: e.target.value })} data-testid="input-event-price" />
          </div>
          <div>
            <Label>Opis</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-event-description" />
          </div>
          <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.title || !form.eventDate || !form.city || !form.location} className="w-full" data-testid="submit-event">
            Dodaj Wydarzenie
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddPlaceDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Klub nocny", address: "", city: "", hours: "", imageUrl: "" });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => apiRequest("POST", "/api/admin/places", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/places"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Miejsce dodane" });
      setOpen(false);
      setForm({ name: "", type: "Klub nocny", address: "", city: "", hours: "", imageUrl: "" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="add-place-btn">
          <Plus className="w-4 h-4 mr-2" />
          Dodaj
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nowe Miejsce</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nazwa</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-place-name" />
          </div>
          <div>
            <Label>Typ</Label>
            <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Klub nocny, Kawiarnia, Bar..." data-testid="input-place-type" />
          </div>
          <div>
            <Label>Miasto</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} data-testid="input-place-city" />
          </div>
          <div>
            <Label>Adres</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} data-testid="input-place-address" />
          </div>
          <div>
            <Label>Godziny otwarcia</Label>
            <Input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="Pn-So 18:00-02:00" data-testid="input-place-hours" />
          </div>
          <div>
            <Label>URL obrazka</Label>
            <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} data-testid="input-place-image" />
          </div>
          <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.name || !form.city || !form.address} className="w-full" data-testid="submit-place">
            Dodaj Miejsce
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditPlaceDialog({ place }: { place: Place }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: place.name,
    type: place.type,
    address: place.address,
    city: place.city,
    hours: place.hours || "",
    imageUrl: place.imageUrl || ""
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => apiRequest("PATCH", `/api/admin/places/${place.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/places"] });
      toast({ title: "Miejsce zaktualizowane" });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" data-testid={`edit-place-${place.id}`}>
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edytuj Miejsce</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nazwa</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-edit-place-name" />
          </div>
          <div>
            <Label>Typ</Label>
            <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Klub nocny, Kawiarnia, Bar..." data-testid="input-edit-place-type" />
          </div>
          <div>
            <Label>Miasto</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} data-testid="input-edit-place-city" />
          </div>
          <div>
            <Label>Adres</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} data-testid="input-edit-place-address" />
          </div>
          <div>
            <Label>Godziny otwarcia</Label>
            <Input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="Pn-So 18:00-02:00" data-testid="input-edit-place-hours" />
          </div>
          <div>
            <Label>URL obrazka</Label>
            <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} data-testid="input-edit-place-image" />
          </div>
          <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.name || !form.city || !form.address} className="w-full" data-testid="submit-edit-place">
            Zapisz Zmiany
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddVenueDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "Klub nocny",
    address: "",
    city: "",
    description: "",
    lat: "",
    lng: "",
    website: "",
    coverImage: ""
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("POST", "/api/admin/venues", {
        name: data.name,
        type: data.type,
        address: data.address,
        city: data.city,
        description: data.description || null,
        lat: data.lat ? data.lat : null,
        lng: data.lng ? data.lng : null,
        website: data.website || null,
        coverImage: data.coverImage || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/venues"] });
      toast({ title: "Lokal dodany" });
      setOpen(false);
      setForm({ name: "", type: "Klub nocny", address: "", city: "", description: "", lat: "", lng: "", website: "", coverImage: "" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="add-venue-btn">
          <Plus className="w-4 h-4 mr-2" />
          Dodaj
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nowy Lokal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nazwa</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-venue-name" />
          </div>
          <div>
            <Label>Typ</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger data-testid="select-venue-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Klub nocny">Klub nocny</SelectItem>
                <SelectItem value="Bar">Bar</SelectItem>
                <SelectItem value="Pub">Pub</SelectItem>
                <SelectItem value="Kawiarnia">Kawiarnia</SelectItem>
                <SelectItem value="Sauna">Sauna</SelectItem>
                <SelectItem value="Restauracja">Restauracja</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Miasto</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} data-testid="input-venue-city" />
          </div>
          <div>
            <Label>Adres</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} data-testid="input-venue-address" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Szerokosc geogr. (lat)</Label>
              <Input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="52.2297" data-testid="input-venue-lat" />
            </div>
            <div>
              <Label>Dlugosc geogr. (lng)</Label>
              <Input value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="21.0122" data-testid="input-venue-lng" />
            </div>
          </div>
          <div>
            <Label>Strona www</Label>
            <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." data-testid="input-venue-website" />
          </div>
          <div>
            <Label>Opis</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-venue-desc" />
          </div>
          <div>
            <Label>URL obrazka</Label>
            <Input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} data-testid="input-venue-image" />
          </div>
          <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.name || !form.city || !form.address} className="w-full" data-testid="submit-venue">
            Dodaj Lokal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteVenueButton({ venueId }: { venueId: number }) {
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: async () => apiRequest("DELETE", `/api/admin/venues/${venueId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/venues"] });
      toast({ title: "Lokal usuniety" });
    },
  });

  return (
    <Button size="icon" variant="ghost" onClick={() => mutation.mutate()} disabled={mutation.isPending} data-testid={`delete-venue-${venueId}`}>
      <Trash2 className="w-4 h-4 text-destructive" />
    </Button>
  );
}

function AddRecurringEventDialog({ venues }: { venues: Venue[] }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    eventName: "",
    venueId: "",
    dayOfWeek: "5",
    startTime: "22:00",
    endTime: "04:00",
    description: ""
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("POST", "/api/admin/recurring-events", {
        eventName: data.eventName,
        venueId: parseInt(data.venueId),
        dayOfWeek: parseInt(data.dayOfWeek),
        startTime: data.startTime,
        endTime: data.endTime || null,
        description: data.description || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/recurring-events"] });
      toast({ title: "Wydarzenie cykliczne dodane" });
      setOpen(false);
      setForm({ eventName: "", venueId: "", dayOfWeek: "5", startTime: "22:00", endTime: "04:00", description: "" });
    },
  });

  const dayNames = ["Niedziela", "Poniedzialek", "Wtorek", "Sroda", "Czwartek", "Piatek", "Sobota"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="add-recurring-btn">
          <Plus className="w-4 h-4 mr-2" />
          Dodaj
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nowe Wydarzenie Cykliczne</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nazwa</Label>
            <Input value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} data-testid="input-recurring-name" />
          </div>
          <div>
            <Label>Lokal</Label>
            <Select value={form.venueId} onValueChange={(v) => setForm({ ...form, venueId: v })}>
              <SelectTrigger data-testid="select-recurring-venue">
                <SelectValue placeholder="Wybierz lokal" />
              </SelectTrigger>
              <SelectContent>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={v.id.toString()}>{v.name} - {v.city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Dzien tygodnia</Label>
            <Select value={form.dayOfWeek} onValueChange={(v) => setForm({ ...form, dayOfWeek: v })}>
              <SelectTrigger data-testid="select-recurring-day">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dayNames.map((day, i) => (
                  <SelectItem key={i} value={i.toString()}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Godzina rozpoczecia</Label>
              <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} data-testid="input-recurring-start" />
            </div>
            <div>
              <Label>Godzina zakonczenia</Label>
              <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} data-testid="input-recurring-end" />
            </div>
          </div>
          <div>
            <Label>Opis</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-recurring-desc" />
          </div>
          <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.eventName || !form.venueId} className="w-full" data-testid="submit-recurring">
            Dodaj Wydarzenie
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteRecurringEventButton({ eventId }: { eventId: number }) {
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: async () => apiRequest("DELETE", `/api/admin/recurring-events/${eventId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/recurring-events"] });
      toast({ title: "Wydarzenie usuniete" });
    },
  });

  return (
    <Button size="icon" variant="ghost" onClick={() => mutation.mutate()} disabled={mutation.isPending} data-testid={`delete-recurring-${eventId}`}>
      <Trash2 className="w-4 h-4 text-destructive" />
    </Button>
  );
}

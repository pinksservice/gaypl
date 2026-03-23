import { useState, useRef, useEffect } from "react";
import { useMyProfile, useCreateProfile, useUpdateProfile } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, MapPin, Camera, Save, CheckCircle, Upload } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import { useSearch } from "wouter";

export default function MyProfile() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const searchString = useSearch();
  const shouldStartEditing = searchString.includes("edit=true");
  
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    age: "",
    bio: "",
    city: "",
    avatarUrl: "",
    is18Plus: false,
    agreedToTerms: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    if (shouldStartEditing && profile && !isEditing) {
      setFormData({
        username: profile.username,
        displayName: profile.displayName,
        age: profile.age?.toString() || "",
        bio: profile.bio || "",
        city: profile.city || "",
        avatarUrl: profile.avatarUrl || "",
        is18Plus: profile.is18Plus ?? false,
        agreedToTerms: profile.agreedToTerms ?? false,
      });
      setIsEditing(true);
    }
  }, [shouldStartEditing, profile]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setFormData(prev => ({ ...prev, avatarUrl: response.objectPath }));
      toast({ title: "Zdjęcie wgrane!" });
    },
    onError: () => {
      toast({ title: "Błąd wgrywania zdjęcia", variant: "destructive" });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Wybierz plik graficzny", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Maksymalny rozmiar: 5MB", variant: "destructive" });
        return;
      }
      await uploadFile(file);
    }
  };

  const isLoading = authLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <User className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-bold">Zaloguj się</h2>
        <p className="text-muted-foreground text-center">Musisz być zalogowany, aby zobaczyć swój profil.</p>
        <Button onClick={() => window.location.href = "/login"} data-testid="button-login">
          Zaloguj się
        </Button>
      </div>
    );
  }

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.displayName || !formData.age || !formData.city) {
      toast({
        title: "Błąd",
        description: "Wypełnij wszystkie wymagane pola.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.is18Plus) {
      toast({
        title: "Błąd",
        description: "Musisz potwierdzić, że masz ukończone 18 lat.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.agreedToTerms) {
      toast({
        title: "Błąd",
        description: "Musisz zaakceptować regulamin serwisu.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createProfile.mutateAsync({
        userId: user.id,
        username: formData.username,
        displayName: formData.displayName,
        age: parseInt(formData.age),
        bio: formData.bio || null,
        city: formData.city,
        avatarUrl: formData.avatarUrl || null,
        is18Plus: formData.is18Plus,
        agreedToTerms: formData.agreedToTerms,
      });
      
      toast({
        title: "Sukces",
        description: "Profil został utworzony!",
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się utworzyć profilu.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;

    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        data: {
          displayName: formData.displayName || profile.displayName,
          age: formData.age ? parseInt(formData.age) : (profile.age || 18),
          bio: formData.bio || profile.bio || undefined,
          city: formData.city || profile.city,
          avatarUrl: formData.avatarUrl || profile.avatarUrl || undefined,
        },
      });
      
      setIsEditing(false);
      toast({
        title: "Sukces",
        description: "Profil został zaktualizowany!",
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować profilu.",
        variant: "destructive",
      });
    }
  };

  const startEditing = () => {
    if (profile) {
      setFormData({
        username: profile.username,
        displayName: profile.displayName,
        age: profile.age?.toString() || "",
        bio: profile.bio || "",
        city: profile.city || "",
        avatarUrl: profile.avatarUrl || "",
        is18Plus: profile.is18Plus ?? false,
        agreedToTerms: profile.agreedToTerms ?? false,
      });
    }
    setIsEditing(true);
  };

  if (!profile) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Utwórz swój profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nazwa użytkownika *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="np. jan_kowalski"
                  data-testid="input-username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName">Imię / pseudonim *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Jak chcesz być nazywany"
                  data-testid="input-displayName"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Wiek *</Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="99"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="18"
                    data-testid="input-age"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">Miasto *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="np. Warszawa"
                    data-testid="input-city"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Zdjęcie profilowe</Label>
                <div className="flex items-center gap-3">
                  {formData.avatarUrl && (
                    <img 
                      src={formData.avatarUrl} 
                      alt="Podgląd" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                    />
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-avatar-file"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    data-testid="button-upload-avatar"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {formData.avatarUrl ? "Zmień zdjęcie" : "Wgraj zdjęcie"}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">O mnie</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Napisz coś o sobie..."
                  rows={4}
                  data-testid="input-bio"
                />
              </div>
              
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="is18Plus"
                    checked={formData.is18Plus}
                    onCheckedChange={(checked) => setFormData({ ...formData, is18Plus: !!checked })}
                    data-testid="checkbox-is18Plus"
                  />
                  <Label htmlFor="is18Plus" className="text-sm leading-relaxed cursor-pointer">
                    Potwierdzam, że mam ukończone 18 lat *
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onCheckedChange={(checked) => setFormData({ ...formData, agreedToTerms: !!checked })}
                    data-testid="checkbox-agreedToTerms"
                  />
                  <Label htmlFor="agreedToTerms" className="text-sm leading-relaxed cursor-pointer">
                    Akceptuję regulamin serwisu i politykę prywatności *
                  </Label>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={createProfile.isPending || !formData.is18Plus || !formData.agreedToTerms}
                data-testid="button-create-profile"
              >
                {createProfile.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Utwórz profil
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Edytuj profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Imię / pseudonim</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  data-testid="input-displayName"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Wiek</Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="99"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    data-testid="input-age"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">Miasto</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    data-testid="input-city"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Zdjęcie profilowe</Label>
                <div className="flex items-center gap-3">
                  {formData.avatarUrl && (
                    <img 
                      src={formData.avatarUrl} 
                      alt="Podgląd" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                    />
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-avatar-file-edit"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    data-testid="button-upload-avatar-edit"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {formData.avatarUrl ? "Zmień zdjęcie" : "Wgraj zdjęcie"}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">O mnie</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  data-testid="input-bio"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Anuluj
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={updateProfile.isPending}
                  data-testid="button-save-profile"
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Zapisz
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div className="relative">
        <div className="aspect-square md:aspect-[3/1] overflow-hidden bg-secondary rounded-2xl">
          {profile.avatarUrl ? (
            <img 
              src={profile.avatarUrl} 
              alt={profile.displayName} 
              className="w-full h-full object-cover"
              data-testid="img-avatar"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="h-24 w-24 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
        
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg" data-testid="text-displayName">
              {profile.displayName}, {profile.age}
            </h1>
            <div className="flex items-center gap-2 text-white/80 mt-1">
              <MapPin className="h-4 w-4" />
              <span data-testid="text-city">{profile.city}</span>
            </div>
          </div>
          {profile.isVerified && (
            <CheckCircle className="h-6 w-6 text-primary" />
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>O mnie</CardTitle>
          <Button variant="outline" size="sm" onClick={startEditing} data-testid="button-edit-profile">
            Edytuj
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground" data-testid="text-bio">
            {profile.bio || "Brak opisu. Kliknij 'Edytuj' aby dodać informacje o sobie."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informacje o koncie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Email</span>
            <span data-testid="text-email">{user.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Nazwa użytkownika</span>
            <span data-testid="text-username">@{profile.username}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Status</span>
            <span className={profile.isOnline ? "text-primary" : "text-muted-foreground"}>
              {profile.isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Weryfikacja</span>
            <span className={profile.isVerified ? "text-primary" : "text-muted-foreground"}>
              {profile.isVerified ? "Zweryfikowany" : "Niezweryfikowany"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

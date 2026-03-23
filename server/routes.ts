import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

// Temporary backup download route
import path from "path";
import fs from "fs";

// Admin middleware - checks if user is authenticated and has admin role
async function isAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await storage.getUser(req.user.claims.sub);
  if (!user?.isAdmin) {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Temporary backup download route
  app.get("/download-backup", (req, res) => {
    const zipPath = path.resolve("/home/runner/workspace/gaypl-backup.zip");
    if (fs.existsSync(zipPath)) {
      res.setHeader("Content-Disposition", "attachment; filename=gaypl-backup.zip");
      res.setHeader("Content-Type", "application/zip");
      res.sendFile(zipPath);
    } else {
      res.status(404).json({ message: "Backup file not found" });
    }
  });

  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Integrations
  registerChatRoutes(app);
  registerImageRoutes(app);
  registerObjectStorageRoutes(app);

  // === PROFILES ===
  app.get(api.profiles.list.path, async (req, res) => {
    const filter = req.query.filter as string | undefined;
    const userLat = req.query.userLat ? Number(req.query.userLat) : undefined;
    const userLng = req.query.userLng ? Number(req.query.userLng) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    
    const profiles = await storage.getProfiles({ filter, userLat, userLng, limit, offset });
    res.json(profiles);
  });

  // Update location for current user's profile
  app.post("/api/profiles/location", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      
      const { lat, lng } = req.body;
      if (typeof lat !== "number" || typeof lng !== "number") {
        return res.status(400).json({ message: "Invalid coordinates" });
      }
      
      const updated = await storage.updateProfileLocation(profile.id, lat, lng);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.profiles.get.path, async (req, res) => {
    const profile = await storage.getProfile(Number(req.params.id));
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  });

  app.get(api.profiles.me.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfileByUserId(userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  });

  app.post(api.profiles.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.profiles.create.input.parse(req.body);
      const userId = req.user.claims.sub;
      
      // Enforce age verification
      if (!input.is18Plus) {
        return res.status(400).json({ message: "Musisz potwierdzić, że masz ukończone 18 lat" });
      }
      if (!input.agreedToTerms) {
        return res.status(400).json({ message: "Musisz zaakceptować regulamin serwisu" });
      }
      
      // Check if profile exists
      const existing = await storage.getProfileByUserId(userId);
      if (existing) return res.status(400).json({ message: "Profile already exists" });

      const profile = await storage.createProfile({ 
        ...input, 
        userId,
        termsAgreedAt: new Date(),
        profileCompleted: true,
      });
      res.status(201).json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put(api.profiles.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.profiles.update.input.parse(req.body);
      
      const profile = await storage.getProfile(id);
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      
      if (profile.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updated = await storage.updateProfile(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === CATEGORIES ===
  app.get("/api/categories", async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  // === ARTICLES ===
  app.get(api.articles.list.path, async (req, res) => {
    const category = req.query.category as string | undefined;
    const status = req.query.status as string | undefined;
    const featured = req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    
    const articles = await storage.getArticles({ category, status, featured, limit });
    res.json(articles);
  });

  app.get(api.articles.get.path, async (req, res) => {
    const article = await storage.getArticle(Number(req.params.id));
    if (!article) return res.status(404).json({ message: "Article not found" });
    res.json(article);
  });

  app.get("/api/articles/slug/:slug", async (req, res) => {
    const article = await storage.getArticleBySlug(req.params.slug);
    if (!article) return res.status(404).json({ message: "Article not found" });
    await storage.incrementArticleViews(article.id);
    res.json({ ...article, views: (article.views || 0) + 1 });
  });

  // === EXPERT QUESTIONS ===
  app.post("/api/questions", async (req: any, res) => {
    try {
      const { questionText, category, isAnonymous } = req.body;
      
      if (!questionText || questionText.length > 500) {
        return res.status(400).json({ message: "Pytanie jest wymagane (max 500 znaków)" });
      }
      if (!category) {
        return res.status(400).json({ message: "Kategoria jest wymagana" });
      }
      
      const userId = req.isAuthenticated?.() && !isAnonymous ? req.user?.claims?.sub : null;
      
      const question = await storage.createExpertQuestion({
        questionText,
        category,
        isAnonymous: isAnonymous ?? true,
        userId,
      });
      
      res.status(201).json(question);
    } catch (err) {
      console.error("Error creating question:", err);
      res.status(500).json({ message: "Błąd serwera" });
    }
  });

  // === ADS ===
  app.get(api.ads.list.path, async (req, res) => {
    const category = req.query.category as string | undefined;
    const userLat = req.query.userLat ? parseFloat(req.query.userLat as string) : undefined;
    const userLng = req.query.userLng ? parseFloat(req.query.userLng as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    
    const ads = await storage.getAds({ category, userLat, userLng, limit, offset });
    res.json(ads);
  });

  app.post(api.ads.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.ads.create.input.parse(req.body);
      // Need profile ID for authorId
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileByUserId(userId);
      if (!profile) return res.status(400).json({ message: "Najpierw utwórz profil w sekcji 'Mój Profil'" });

      const ad = await storage.createAd({ ...input, authorId: profile.id } as any);
      res.status(201).json(ad);
    } catch (err) {
      console.error("Error creating ad:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Błąd serwera - spróbuj ponownie" });
    }
  });

  // === EVENTS & PLACES ===
  app.get(api.events.list.path, async (req, res) => {
    const city = req.query.city as string;
    const events = await storage.getEvents(city);
    res.json(events);
  });

  app.get(api.places.list.path, async (req, res) => {
    const city = req.query.city as string;
    const type = req.query.type as string;
    const places = await storage.getPlaces(city, type);
    res.json(places);
  });

  // === CHAT ===
  app.get(api.chat.listMessages.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfileByUserId(userId);
    if (!profile) return res.status(400).json({ message: "Create a profile first" });

    const otherUserId = Number(req.query.otherUserId);
    const messages = await storage.getChatMessages(profile.id, otherUserId);
    res.json(messages);
  });

  app.post(api.chat.send.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfileByUserId(userId);
    if (!profile) return res.status(400).json({ message: "Create a profile first" });

    try {
      const input = api.chat.send.input.parse(req.body);
      if (input.senderId !== profile.id) return res.status(403).json({ message: "Unauthorized" });

      const message = await storage.createChatMessage(input);
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === SHOUTBOX ===
  app.get("/api/shoutbox", async (req, res) => {
    const parsedLimit = parseInt(req.query.limit as string, 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 50;
    const messages = await storage.getShoutboxMessages(limit);
    res.json(messages);
  });

  app.post("/api/shoutbox", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileByUserId(userId);
      
      const { content } = req.body;
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Wiadomość nie może być pusta" });
      }
      if (content.length > 500) {
        return res.status(400).json({ message: "Wiadomość jest za długa (max 500 znaków)" });
      }

      const message = await storage.createShoutboxMessage({
        userId,
        username: profile?.displayName || profile?.username || "Anonim",
        avatarUrl: profile?.avatarUrl || null,
        content: content.trim(),
      });
      res.status(201).json(message);
    } catch (err) {
      res.status(500).json({ message: "Błąd serwera" });
    }
  });

  // === REPORTS & BLOCKS ===
  app.post("/api/reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileByUserId(userId);
      if (!profile) return res.status(400).json({ message: "Najpierw utwórz profil" });

      const { reportedProfileId, reason, description } = req.body;
      if (!reportedProfileId || !reason) {
        return res.status(400).json({ message: "Brak wymaganych pól" });
      }

      const report = await storage.createReport({
        reporterId: profile.id,
        reportedProfileId,
        reason,
        description
      });
      res.status(201).json(report);
    } catch (err: any) {
      if (err.code === '23505') {
        return res.status(400).json({ message: "Już zgłosiłeś ten profil" });
      }
      res.status(500).json({ message: "Błąd serwera" });
    }
  });

  app.post("/api/blocks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileByUserId(userId);
      if (!profile) return res.status(400).json({ message: "Najpierw utwórz profil" });

      const { blockedProfileId } = req.body;
      if (!blockedProfileId) {
        return res.status(400).json({ message: "Brak ID profilu do zablokowania" });
      }

      const block = await storage.createBlock(profile.id, blockedProfileId);
      res.status(201).json(block);
    } catch (err: any) {
      if (err.code === '23505') {
        return res.status(400).json({ message: "Ten użytkownik jest już zablokowany" });
      }
      res.status(500).json({ message: "Błąd serwera" });
    }
  });

  app.get("/api/blocks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileByUserId(userId);
      if (!profile) return res.status(400).json({ message: "Najpierw utwórz profil" });

      const blocks = await storage.getBlocks(profile.id);
      res.json(blocks);
    } catch (err) {
      res.status(500).json({ message: "Błąd serwera" });
    }
  });

  app.delete("/api/blocks/:blockedId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileByUserId(userId);
      if (!profile) return res.status(400).json({ message: "Najpierw utwórz profil" });

      await storage.removeBlock(profile.id, Number(req.params.blockedId));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Błąd serwera" });
    }
  });

  // === VENUES & EVENTS (NEW SYSTEM) ===
  
  // Get events nearby based on geolocation
  app.get("/api/events/nearby", async (req, res) => {
    try {
      const lat = req.query.lat ? Number(req.query.lat) : undefined;
      const lng = req.query.lng ? Number(req.query.lng) : undefined;
      const radiusKm = req.query.radius_km ? Number(req.query.radius_km) : 5;
      const dateStr = req.query.date as string || new Date().toISOString().split('T')[0];
      const city = req.query.city as string | undefined;
      const type = req.query.type as string | undefined;
      
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      
      let venuesWithDistance: any[] = [];
      
      if (lat !== undefined && lng !== undefined) {
        venuesWithDistance = await storage.getVenuesNearby(lat, lng, radiusKm);
      } else if (city) {
        const allVenues = await storage.getVenues({ city, isActive: true, type });
        venuesWithDistance = allVenues.map(v => ({ ...v, distanceKm: null }));
      } else {
        return res.status(400).json({ message: "Wymagane współrzędne (lat, lng) lub miasto (city)" });
      }
      
      if (type) {
        venuesWithDistance = venuesWithDistance.filter(v => v.type === type);
      }
      
      const events: any[] = [];
      
      for (const venue of venuesWithDistance) {
        const recurringForDay = await storage.getRecurringEvents({ 
          venueId: venue.id, 
          dayOfWeek, 
          isActive: true 
        });
        
        for (const recurring of recurringForDay) {
          events.push({
            venue: {
              id: venue.id,
              name: venue.name,
              type: venue.type,
              address: venue.address,
              city: venue.city,
              distance_km: venue.distanceKm,
              lat: venue.lat,
              lng: venue.lng,
              coverImage: venue.coverImage
            },
            event: {
              id: recurring.id,
              name: recurring.eventName,
              is_recurring: true,
              day_of_week: recurring.dayOfWeek,
              start_time: recurring.startTime,
              end_time: recurring.endTime,
              price: recurring.price,
              description: recurring.description,
              tags: recurring.tags,
              dressCode: recurring.dressCode,
              ageRestriction: recurring.ageRestriction
            }
          });
        }
        
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        const oneTimeForDate = await storage.getOneTimeEvents({
          venueId: venue.id,
          startDate: startOfDay,
          endDate: endOfDay
        });
        
        for (const oneTime of oneTimeForDate) {
          events.push({
            venue: {
              id: venue.id,
              name: venue.name,
              type: venue.type,
              address: venue.address,
              city: venue.city,
              distance_km: venue.distanceKm,
              lat: venue.lat,
              lng: venue.lng,
              coverImage: venue.coverImage
            },
            event: {
              id: oneTime.id,
              name: oneTime.eventName,
              is_recurring: false,
              event_date: oneTime.eventDate,
              start_time: oneTime.startTime,
              end_time: oneTime.endTime,
              price: oneTime.price,
              description: oneTime.description,
              tags: oneTime.tags,
              featured: oneTime.featured,
              coverImage: oneTime.coverImage,
              externalLink: oneTime.externalLink
            }
          });
        }
      }
      
      events.sort((a, b) => {
        if (a.venue.distance_km === null) return 1;
        if (b.venue.distance_km === null) return -1;
        return (a.venue.distance_km || 0) - (b.venue.distance_km || 0);
      });
      
      res.json({
        date: dateStr,
        user_location: lat && lng ? { lat, lng } : null,
        radius_km: radiusKm,
        events
      });
    } catch (err) {
      console.error('Error in /api/events/nearby:', err);
      res.status(500).json({ message: "Błąd serwera" });
    }
  });
  
  // Get weekly recurring schedule for a city
  app.get("/api/events/week/:city", async (req, res) => {
    try {
      const city = req.params.city;
      const startDateStr = req.query.start_date as string;
      const type = req.query.type as string | undefined;
      
      const startDate = startDateStr ? new Date(startDateStr) : new Date();
      const dayIndex = startDate.getDay();
      const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + mondayOffset);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      let venuesList = await storage.getVenues({ city, isActive: true, type });
      
      const daysOfWeek = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
      const days: any[] = [];
      
      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(weekStart);
        currentDay.setDate(weekStart.getDate() + i);
        const dayOfWeek = currentDay.getDay();
        
        const recurringEvents: any[] = [];
        const oneTimeEvents: any[] = [];
        
        for (const venue of venuesList) {
          const recurring = await storage.getRecurringEvents({ 
            venueId: venue.id, 
            dayOfWeek, 
            isActive: true 
          });
          
          for (const event of recurring) {
            recurringEvents.push({
              venue: { id: venue.id, name: venue.name, type: venue.type, address: venue.address },
              event: {
                id: event.id,
                name: event.eventName,
                start_time: event.startTime,
                end_time: event.endTime,
                price: event.price,
                tags: event.tags
              }
            });
          }
          
          const startOfDay = new Date(currentDay);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(currentDay);
          endOfDay.setHours(23, 59, 59, 999);
          
          const oneTime = await storage.getOneTimeEvents({
            venueId: venue.id,
            startDate: startOfDay,
            endDate: endOfDay
          });
          
          for (const event of oneTime) {
            oneTimeEvents.push({
              venue: { id: venue.id, name: venue.name, type: venue.type, address: venue.address },
              event: {
                id: event.id,
                name: event.eventName,
                event_date: event.eventDate,
                start_time: event.startTime,
                end_time: event.endTime,
                price: event.price,
                featured: event.featured,
                coverImage: event.coverImage
              }
            });
          }
        }
        
        days.push({
          date: currentDay.toISOString().split('T')[0],
          day_of_week: dayOfWeek,
          day_name: daysOfWeek[dayOfWeek],
          recurring_events: recurringEvents,
          one_time_events: oneTimeEvents
        });
      }
      
      res.json({
        city,
        week_start: weekStart.toISOString().split('T')[0],
        week_end: weekEnd.toISOString().split('T')[0],
        days
      });
    } catch (err) {
      console.error('Error in /api/events/week:', err);
      res.status(500).json({ message: "Błąd serwera" });
    }
  });
  
  // Get recurring schedule for a city (by day)
  app.get("/api/events/recurring/:city", async (req, res) => {
    try {
      const city = req.params.city;
      const dayOfWeek = req.query.day_of_week !== undefined ? Number(req.query.day_of_week) : undefined;
      
      const venuesList = await storage.getVenues({ city, isActive: true });
      
      const schedule: Record<string, any[]> = {
        "0": [], "1": [], "2": [], "3": [], "4": [], "5": [], "6": []
      };
      
      for (const venue of venuesList) {
        const events = await storage.getRecurringEvents({ 
          venueId: venue.id, 
          dayOfWeek,
          isActive: true 
        });
        
        for (const event of events) {
          schedule[String(event.dayOfWeek)].push({
            venue: { id: venue.id, name: venue.name, type: venue.type, address: venue.address },
            event: {
              id: event.id,
              event_name: event.eventName,
              start_time: event.startTime,
              end_time: event.endTime,
              price: event.price,
              recurring_type: event.recurringType,
              tags: event.tags
            }
          });
        }
      }
      
      res.json({
        city,
        recurring_schedule: schedule
      });
    } catch (err) {
      console.error('Error in /api/events/recurring:', err);
      res.status(500).json({ message: "Błąd serwera" });
    }
  });
  
  // Get all venues (public)
  app.get("/api/venues", async (req, res) => {
    try {
      const city = req.query.city as string | undefined;
      const type = req.query.type as string | undefined;
      const venues = await storage.getVenues({ city, type, isActive: true });
      res.json(venues);
    } catch (err) {
      res.status(500).json({ message: "Błąd serwera" });
    }
  });
  
  // Get venue details with events
  app.get("/api/venues/:id", async (req, res) => {
    try {
      const venueId = Number(req.params.id);
      const venue = await storage.getVenue(venueId);
      
      if (!venue) {
        return res.status(404).json({ message: "Lokal nie znaleziony" });
      }
      
      const daysOfWeek = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
      
      const recurringEventsRaw = await storage.getRecurringEvents({ venueId, isActive: true });
      const recurringEvents = recurringEventsRaw.map(e => ({
        ...e,
        day_name: daysOfWeek[e.dayOfWeek]
      }));
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcomingOneTimeEvents = await storage.getOneTimeEvents({
        venueId,
        startDate: today
      });
      
      res.json({
        venue,
        recurring_events: recurringEvents,
        upcoming_one_time_events: upcomingOneTimeEvents
      });
    } catch (err) {
      console.error('Error in /api/venues/:id:', err);
      res.status(500).json({ message: "Błąd serwera" });
    }
  });

  // === ADMIN ROUTES ===
  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.patch("/api/admin/users/:id/admin", isAuthenticated, isAdmin, async (req, res) => {
    const { isAdmin: adminStatus } = req.body;
    const user = await storage.setUserAdmin(req.params.id, adminStatus);
    res.json(user);
  });

  app.get("/api/admin/profiles", isAuthenticated, isAdmin, async (req, res) => {
    const profiles = await storage.getProfiles({ limit: 100, offset: 0 });
    res.json(profiles);
  });

  app.delete("/api/admin/profiles/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deleteProfile(Number(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/admin/articles", isAuthenticated, isAdmin, async (req, res) => {
    const articles = await storage.getArticles();
    res.json(articles);
  });

  app.post("/api/admin/articles", isAuthenticated, isAdmin, async (req, res) => {
    const article = await storage.createArticle(req.body);
    res.status(201).json(article);
  });

  app.patch("/api/admin/articles/:id", isAuthenticated, isAdmin, async (req, res) => {
    const article = await storage.updateArticle(Number(req.params.id), req.body);
    res.json(article);
  });

  app.delete("/api/admin/articles/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deleteArticle(Number(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/admin/ads", isAuthenticated, isAdmin, async (req, res) => {
    const ads = await storage.getAds({});
    res.json(ads);
  });

  app.delete("/api/admin/ads/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deleteAd(Number(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/admin/events", isAuthenticated, isAdmin, async (req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  app.post("/api/admin/events", isAuthenticated, isAdmin, async (req, res) => {
    const event = await storage.createEvent(req.body);
    res.status(201).json(event);
  });

  app.patch("/api/admin/events/:id", isAuthenticated, isAdmin, async (req, res) => {
    const event = await storage.updateEvent(Number(req.params.id), req.body);
    res.json(event);
  });

  app.delete("/api/admin/events/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deleteEvent(Number(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/admin/places", isAuthenticated, isAdmin, async (req, res) => {
    const places = await storage.getPlaces();
    res.json(places);
  });

  app.post("/api/admin/places", isAuthenticated, isAdmin, async (req, res) => {
    const place = await storage.createPlace(req.body);
    res.status(201).json(place);
  });

  app.patch("/api/admin/places/:id", isAuthenticated, isAdmin, async (req, res) => {
    const place = await storage.updatePlace(Number(req.params.id), req.body);
    res.json(place);
  });

  app.delete("/api/admin/places/:id", isAuthenticated, isAdmin, async (req, res) => {
    await storage.deletePlace(Number(req.params.id));
    res.json({ success: true });
  });

  // === ADMIN QUESTIONS ===
  app.get("/api/admin/questions", isAuthenticated, isAdmin, async (req, res) => {
    const status = req.query.status as string | undefined;
    const questions = await storage.getExpertQuestions(status);
    res.json(questions);
  });

  app.patch("/api/admin/questions/:id", isAuthenticated, isAdmin, async (req, res) => {
    const { status, answerArticleId } = req.body;
    
    const allowedStatuses = ['pending', 'approved', 'rejected', 'answered'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be one of: pending, approved, rejected, answered" });
    }
    
    const question = await storage.updateExpertQuestionStatus(
      Number(req.params.id), 
      status, 
      answerArticleId
    );
    res.json(question);
  });

  // Check if current user is admin
  app.get("/api/admin/check", isAuthenticated, async (req: any, res) => {
    const user = await storage.getUser(req.user.claims.sub);
    res.json({ isAdmin: user?.isAdmin || false });
  });

  // === ADMIN VENUES (NEW SYSTEM) ===
  app.get("/api/admin/venues", isAuthenticated, isAdmin, async (req, res) => {
    const venues = await storage.getVenues();
    res.json(venues);
  });

  app.post("/api/admin/venues", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const venue = await storage.createVenue(req.body);
      res.status(201).json(venue);
    } catch (err) {
      console.error('Error creating venue:', err);
      res.status(500).json({ message: "Błąd tworzenia lokalu" });
    }
  });

  app.patch("/api/admin/venues/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const venue = await storage.updateVenue(Number(req.params.id), req.body);
      res.json(venue);
    } catch (err) {
      console.error('Error updating venue:', err);
      res.status(500).json({ message: "Błąd aktualizacji lokalu" });
    }
  });

  app.delete("/api/admin/venues/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteVenue(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting venue:', err);
      res.status(500).json({ message: "Błąd usuwania lokalu" });
    }
  });

  // === ADMIN RECURRING EVENTS ===
  app.get("/api/admin/recurring-events", isAuthenticated, isAdmin, async (req, res) => {
    const venueId = req.query.venue_id ? Number(req.query.venue_id) : undefined;
    const events = await storage.getRecurringEvents({ venueId });
    res.json(events);
  });

  app.post("/api/admin/recurring-events", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const event = await storage.createRecurringEvent(req.body);
      res.status(201).json(event);
    } catch (err) {
      console.error('Error creating recurring event:', err);
      res.status(500).json({ message: "Błąd tworzenia wydarzenia cyklicznego" });
    }
  });

  app.patch("/api/admin/recurring-events/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const event = await storage.updateRecurringEvent(Number(req.params.id), req.body);
      res.json(event);
    } catch (err) {
      console.error('Error updating recurring event:', err);
      res.status(500).json({ message: "Błąd aktualizacji wydarzenia cyklicznego" });
    }
  });

  app.delete("/api/admin/recurring-events/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteRecurringEvent(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting recurring event:', err);
      res.status(500).json({ message: "Błąd usuwania wydarzenia cyklicznego" });
    }
  });

  // === ADMIN ONE-TIME EVENTS ===
  app.get("/api/admin/one-time-events", isAuthenticated, isAdmin, async (req, res) => {
    const venueId = req.query.venue_id ? Number(req.query.venue_id) : undefined;
    const events = await storage.getOneTimeEvents({ venueId });
    res.json(events);
  });

  app.post("/api/admin/one-time-events", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const event = await storage.createOneTimeEvent(req.body);
      res.status(201).json(event);
    } catch (err) {
      console.error('Error creating one-time event:', err);
      res.status(500).json({ message: "Błąd tworzenia wydarzenia jednorazowego" });
    }
  });

  app.patch("/api/admin/one-time-events/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const event = await storage.updateOneTimeEvent(Number(req.params.id), req.body);
      res.json(event);
    } catch (err) {
      console.error('Error updating one-time event:', err);
      res.status(500).json({ message: "Błąd aktualizacji wydarzenia jednorazowego" });
    }
  });

  app.delete("/api/admin/one-time-events/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteOneTimeEvent(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting one-time event:', err);
      res.status(500).json({ message: "Błąd usuwania wydarzenia jednorazowego" });
    }
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const articlesList = await storage.getArticles();
  if (articlesList.length === 0) {
    await storage.createArticle({
      title: 'Najlepsze miejsca LGBT+ w Warszawie 2025',
      slug: 'najlepsze-miejsca-lgbt-warszawa-2025',
      excerpt: 'Odkryj nowe kluby, bary i kawiarnie przyjazne społeczności LGBT+ w stolicy...',
      content: 'Warszawa oferuje coraz więcej miejsc przyjaznych społeczności LGBT+...',
      categorySlug: 'wydarzenia',
      author: 'Kinga',
      status: 'published',
      coverImage: 'https://images.unsplash.com/photo-1514525253440-b393452e2729?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      publishDate: new Date(),
    });
    await storage.createArticle({
      title: 'PrEP w Polsce - wszystko co musisz wiedzieć',
      slug: 'prep-polska-przewodnik',
      excerpt: 'Kompleksowy przewodnik po profilaktyce przedekspozycyjnej HIV...',
      content: 'Profilaktyka przedekspozycyjna (PrEP) to skuteczna metoda zapobiegania HIV...',
      categorySlug: 'wellness',
      author: 'Dr Szymon Niemiec',
      status: 'published',
      coverImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      publishDate: new Date(),
    });
    await storage.createArticle({
      title: 'Pride 2025 - kalendarz wydarzeń',
      slug: 'pride-2025-kalendarz',
      excerpt: 'Wszystkie marsze równości i wydarzenia Pride w Polsce...',
      content: 'Rok 2025 zapowiada się niezwykle kolorowo!...',
      categorySlug: 'wydarzenia',
      author: 'Redakcja',
      status: 'published',
      featured: true,
      coverImage: 'https://images.unsplash.com/photo-1533604727830-2380dd78b23c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      publishDate: new Date(),
    });
  }

  const placesList = await storage.getPlaces();
  if (placesList.length === 0) {
    await storage.createPlace({
      name: 'LASH Club',
      type: 'Klub nocny',
      address: 'ul. Poznańska 12, Warszawa',
      city: 'Warszawa',
      hours: 'Pt-So 23:00-06:00',
      imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    });
    await storage.createPlace({
      name: 'Café Rączka',
      type: 'Kawiarnia LGBT+',
      address: 'ul. Poznańska 14, Warszawa',
      city: 'Warszawa',
      hours: 'Pn-Nd 10:00-22:00',
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    });
  }

  const eventsList = await storage.getEvents();
  if (eventsList.length === 0) {
    await storage.createEvent({
      title: "New Year's Eve Pride Party",
      slug: 'new-years-eve-pride-party-2025',
      startDate: new Date('2025-12-31T23:00:00'),
      locationName: 'LASH Club',
      locationAddress: 'ul. Poznańska 12, Warszawa',
      city: 'Warszawa',
      eventType: 'Klub',
      status: 'upcoming',
      featured: true,
      priceInfo: '50 PLN',
      coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    });
  }

  // Create mock profiles if none exist (needs userId to work with auth, so might be tricky to seed properly without auth users. 
  // I will create profiles with dummy userIds for display purposes, but they won't be claimable by real users).
  const profilesList = await storage.getProfiles();
  if (profilesList.length === 0) {
    await storage.createProfile({
      userId: 'mock-user-1',
      username: 'kacper28',
      displayName: 'Kacper',
      age: 28,
      city: 'Warszawa',
      bio: 'Fitness, kino, podróże',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    });
    await storage.createProfile({
      userId: 'mock-user-2',
      username: 'mateusz31',
      displayName: 'Mateusz',
      age: 31,
      city: 'Warszawa',
      bio: 'Architekt, miłośnik sztuki',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    });
  }
}

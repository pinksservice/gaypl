import { db } from "./db";
import { 
  profiles, articles, ads, events, places, favorites, chatMessages, users, shoutboxMessages,
  reports, blocks, articleCategories, expertQuestions, venues, recurringEvents, oneTimeEvents, venueFavorites,
  type Profile, type InsertProfile, type UpdateProfileRequest,
  type Article, type Ad, type InsertAd, type Event, type Place, type ChatMessage, type User,
  type ShoutboxMessage, type InsertShoutboxMessage,
  type Report, type InsertReport, type Block,
  type ArticleCategory, type ExpertQuestion, type InsertExpertQuestion,
  type Venue, type InsertVenue, type RecurringEvent, type InsertRecurringEvent,
  type OneTimeEvent, type InsertOneTimeEvent
} from "@shared/schema";
import { eq, desc, and, ilike, sql, count, or, ne, notInArray, asc, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Profiles
  getProfile(id: number): Promise<Profile | undefined>;
  getProfileByUserId(userId: string): Promise<Profile | undefined>;
  getProfiles(options?: { 
    filter?: string;
    userLat?: number; 
    userLng?: number; 
    limit?: number;
    offset?: number;
  }): Promise<(Profile & { distanceKm?: number })[]>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: number, updates: UpdateProfileRequest): Promise<Profile>;
  updateProfileLocation(id: number, lat: number, lng: number): Promise<Profile>;

  // Article Categories
  getCategories(): Promise<ArticleCategory[]>;
  
  // Articles
  getArticles(options?: { category?: string; status?: string; featured?: boolean; limit?: number }): Promise<Article[]>;
  getArticle(id: number): Promise<Article | undefined>;
  getArticleBySlug(slug: string): Promise<Article | undefined>;
  createArticle(article: typeof articles.$inferInsert): Promise<Article>;
  incrementArticleViews(id: number): Promise<void>;
  
  // Expert Questions
  getExpertQuestions(status?: string): Promise<ExpertQuestion[]>;
  createExpertQuestion(question: InsertExpertQuestion): Promise<ExpertQuestion>;
  updateExpertQuestionStatus(id: number, status: string, answerArticleId?: number): Promise<ExpertQuestion>;

  // Ads
  getAds(options?: { 
    category?: string; 
    userLat?: number; 
    userLng?: number; 
    limit?: number;
    offset?: number;
  }): Promise<(Ad & { author?: { id: number; displayName: string; avatarUrl: string | null }; distanceKm?: number })[]>;
  createAd(ad: InsertAd & { expiresAt?: Date }): Promise<Ad>;
  archiveExpiredAds(): Promise<number>;

  // Events & Places
  getEvents(city?: string): Promise<Event[]>;
  getPlaces(city?: string, type?: string): Promise<Place[]>;
  createEvent(event: typeof events.$inferInsert): Promise<Event>;
  createPlace(place: typeof places.$inferInsert): Promise<Place>;

  // Chat
  getChatMessages(userId1: number, userId2: number): Promise<ChatMessage[]>;
  createChatMessage(message: typeof chatMessages.$inferInsert): Promise<ChatMessage>;

  // Shoutbox
  getShoutboxMessages(limit?: number): Promise<ShoutboxMessage[]>;
  createShoutboxMessage(message: InsertShoutboxMessage): Promise<ShoutboxMessage>;

  // Admin
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  setUserAdmin(id: string, isAdmin: boolean): Promise<User>;
  deleteProfile(id: number): Promise<void>;
  deleteArticle(id: number): Promise<void>;
  updateArticle(id: number, data: Partial<Article>): Promise<Article>;
  deleteAd(id: number): Promise<void>;
  deleteEvent(id: number): Promise<void>;
  updateEvent(id: number, data: Partial<Event>): Promise<Event>;
  deletePlace(id: number): Promise<void>;
  updatePlace(id: number, data: Partial<Place>): Promise<Place>;
  getStats(): Promise<{ users: number; profiles: number; articles: number; ads: number; events: number; places: number }>;

  // Reports & Blocks
  createReport(report: InsertReport): Promise<Report>;
  getReports(status?: string): Promise<Report[]>;
  updateReportStatus(id: number, status: string): Promise<Report>;
  createBlock(blockerId: number, blockedId: number): Promise<Block>;
  getBlocks(blockerId: number): Promise<Block[]>;
  removeBlock(blockerId: number, blockedId: number): Promise<void>;
  isBlocked(blockerId: number, blockedId: number): Promise<boolean>;
  getBlockedProfileIds(profileId: number): Promise<number[]>;

  // Venues
  getVenues(options?: { city?: string; type?: string; isActive?: boolean }): Promise<Venue[]>;
  getVenue(id: number): Promise<Venue | undefined>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: number, data: Partial<Venue>): Promise<Venue>;
  deleteVenue(id: number): Promise<void>;
  getVenuesNearby(lat: number, lng: number, radiusKm: number): Promise<(Venue & { distanceKm: number })[]>;

  // Recurring Events
  getRecurringEvents(options?: { venueId?: number; dayOfWeek?: number; isActive?: boolean }): Promise<RecurringEvent[]>;
  getRecurringEvent(id: number): Promise<RecurringEvent | undefined>;
  createRecurringEvent(event: InsertRecurringEvent): Promise<RecurringEvent>;
  updateRecurringEvent(id: number, data: Partial<RecurringEvent>): Promise<RecurringEvent>;
  deleteRecurringEvent(id: number): Promise<void>;

  // One-Time Events
  getOneTimeEvents(options?: { venueId?: number; startDate?: Date; endDate?: Date }): Promise<OneTimeEvent[]>;
  getOneTimeEvent(id: number): Promise<OneTimeEvent | undefined>;
  createOneTimeEvent(event: InsertOneTimeEvent): Promise<OneTimeEvent>;
  updateOneTimeEvent(id: number, data: Partial<OneTimeEvent>): Promise<OneTimeEvent>;
  deleteOneTimeEvent(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // === PROFILES ===
  async getProfile(id: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }

  async getProfileByUserId(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async getProfiles(options: { 
    filter?: string;
    userLat?: number; 
    userLng?: number; 
    limit?: number;
    offset?: number;
  } = {}): Promise<(Profile & { distanceKm?: number })[]> {
    const { filter, userLat, userLng, limit = 50, offset = 0 } = options;

    // If user location provided and filter is "nearby", calculate distance
    if (userLat !== undefined && userLng !== undefined && filter === "nearby") {
      const distanceExpr = sql<number>`
        CASE 
          WHEN ${profiles.latitude} IS NULL OR ${profiles.longitude} IS NULL THEN 99999
          ELSE ROUND(
            (6371 * acos(
              LEAST(1.0, GREATEST(-1.0,
                cos(radians(${userLat})) * cos(radians(CAST(${profiles.latitude} AS FLOAT))) *
                cos(radians(CAST(${profiles.longitude} AS FLOAT)) - radians(${userLng})) +
                sin(radians(${userLat})) * sin(radians(CAST(${profiles.latitude} AS FLOAT)))
              ))
            ))::numeric, 1
          )
        END
      `;

      const results = await db.select({
        profile: profiles,
        distanceKm: distanceExpr
      }).from(profiles)
        .where(sql`${profiles.latitude} IS NOT NULL AND ${profiles.longitude} IS NOT NULL`)
        .orderBy(distanceExpr, desc(profiles.lastSeen))
        .limit(limit)
        .offset(offset);

      return results.map(r => ({
        ...r.profile,
        distanceKm: r.distanceKm === 99999 ? undefined : r.distanceKm ?? undefined
      }));
    }

    // Standard filters without distance
    let results;
    
    if (filter === "online") {
      results = await db.select().from(profiles)
        .where(eq(profiles.isOnline, true))
        .orderBy(desc(profiles.lastSeen))
        .limit(limit).offset(offset);
    } else if (filter === "new") {
      results = await db.select().from(profiles)
        .orderBy(desc(profiles.id))
        .limit(limit).offset(offset);
    } else if (filter === "verified") {
      results = await db.select().from(profiles)
        .where(eq(profiles.isVerified, true))
        .orderBy(desc(profiles.lastSeen))
        .limit(limit).offset(offset);
    } else {
      results = await db.select().from(profiles)
        .orderBy(desc(profiles.lastSeen))
        .limit(limit).offset(offset);
    }

    return results.map(r => ({ ...r, distanceKm: undefined }));
  }

  async updateProfileLocation(id: number, lat: number, lng: number): Promise<Profile> {
    const [updated] = await db.update(profiles).set({ 
      latitude: String(lat), 
      longitude: String(lng),
      lastLocationUpdate: new Date()
    }).where(eq(profiles.id, id)).returning();
    return updated;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }

  async updateProfile(id: number, updates: UpdateProfileRequest): Promise<Profile> {
    const [updated] = await db.update(profiles).set(updates).where(eq(profiles.id, id)).returning();
    return updated;
  }

  // === CATEGORIES ===
  async getCategories(): Promise<ArticleCategory[]> {
    return await db.select().from(articleCategories).orderBy(asc(articleCategories.order));
  }

  // === ARTICLES ===
  async getArticles(options?: { category?: string; status?: string; featured?: boolean; limit?: number }): Promise<Article[]> {
    const conditions: any[] = [];
    
    if (options?.category) {
      conditions.push(eq(articles.categorySlug, options.category));
    }
    if (options?.status) {
      conditions.push(eq(articles.status, options.status));
    }
    if (options?.featured !== undefined) {
      conditions.push(eq(articles.featured, options.featured));
    }
    
    let query = db.select().from(articles);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(articles.publishDate)) as any;
    
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    
    return await query;
  }

  async getArticle(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.slug, slug));
    return article;
  }

  async createArticle(article: typeof articles.$inferInsert): Promise<Article> {
    const [newArticle] = await db.insert(articles).values(article).returning();
    return newArticle;
  }

  async incrementArticleViews(id: number): Promise<void> {
    await db.update(articles)
      .set({ views: sql`${articles.views} + 1` })
      .where(eq(articles.id, id));
  }

  // === EXPERT QUESTIONS ===
  async getExpertQuestions(status?: string): Promise<ExpertQuestion[]> {
    if (status) {
      return await db.select().from(expertQuestions)
        .where(eq(expertQuestions.status, status))
        .orderBy(desc(expertQuestions.createdAt));
    }
    return await db.select().from(expertQuestions).orderBy(desc(expertQuestions.createdAt));
  }

  async createExpertQuestion(question: InsertExpertQuestion): Promise<ExpertQuestion> {
    const [newQuestion] = await db.insert(expertQuestions).values(question).returning();
    return newQuestion;
  }

  async updateExpertQuestionStatus(id: number, status: string, answerArticleId?: number): Promise<ExpertQuestion> {
    const updates: any = { status };
    if (status === 'answered') {
      updates.answeredAt = new Date();
      if (answerArticleId) {
        updates.answerArticleId = answerArticleId;
      }
    }
    const [updated] = await db.update(expertQuestions)
      .set(updates)
      .where(eq(expertQuestions.id, id))
      .returning();
    return updated;
  }

  // === ADS ===
  async getAds(options?: { 
    category?: string; 
    userLat?: number; 
    userLng?: number; 
    limit?: number;
    offset?: number;
  }): Promise<(Ad & { author?: { id: number; displayName: string; avatarUrl: string | null }; distanceKm?: number })[]> {
    const { category, userLat, userLng, limit = 50, offset = 0 } = options || {};
    
    // Build conditions - only show active ads
    let conditions: any[] = [eq(ads.status, "active")];
    if (category && category !== "all") {
      conditions.push(eq(ads.category, category));
    }

    // If user location provided, calculate distance using Haversine formula
    if (userLat !== undefined && userLng !== undefined) {
      // Safe Haversine formula with NULL handling and bounds clamping
      const distanceExpr = sql<number>`
        CASE 
          WHEN ${ads.latitude} IS NULL OR ${ads.longitude} IS NULL THEN 99999
          ELSE ROUND(
            (6371 * acos(
              LEAST(1.0, GREATEST(-1.0,
                cos(radians(${userLat})) * cos(radians(CAST(${ads.latitude} AS FLOAT))) *
                cos(radians(CAST(${ads.longitude} AS FLOAT)) - radians(${userLng})) +
                sin(radians(${userLat})) * sin(radians(CAST(${ads.latitude} AS FLOAT)))
              ))
            ))::numeric, 1
          )
        END
      `;

      const results = await db.select({
        ad: ads,
        author: {
          id: profiles.id,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
        },
        distanceKm: distanceExpr
      }).from(ads)
        .leftJoin(profiles, eq(ads.authorId, profiles.id))
        .where(and(...conditions))
        .orderBy(desc(ads.isPremium), distanceExpr, desc(ads.createdAt))
        .limit(limit)
        .offset(offset);

      return results.map(r => ({
        ...r.ad,
        author: r.author?.id ? r.author : undefined,
        distanceKm: r.distanceKm === 99999 ? undefined : r.distanceKm ?? undefined
      }));
    }

    // No location - sort by premium first, then newest
    const results = await db.select({
      ad: ads,
      author: {
        id: profiles.id,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      }
    }).from(ads)
      .leftJoin(profiles, eq(ads.authorId, profiles.id))
      .where(and(...conditions))
      .orderBy(desc(ads.isPremium), desc(ads.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(r => ({
      ...r.ad,
      author: r.author?.id ? r.author : undefined
    }));
  }

  async createAd(ad: InsertAd & { expiresAt?: Date }): Promise<Ad> {
    const expiresAt = ad.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
    const [newAd] = await db.insert(ads).values({ ...ad, expiresAt }).returning();
    return newAd;
  }

  async archiveExpiredAds(): Promise<number> {
    const result = await db.update(ads)
      .set({ status: "archived" })
      .where(and(
        eq(ads.status, "active"),
        sql`${ads.expiresAt} < NOW()`
      ))
      .returning();
    return result.length;
  }

  // === EVENTS & PLACES ===
  async getEvents(city?: string): Promise<Event[]> {
    if (city) {
      return await db.select().from(events)
        .where(ilike(events.city, `%${city}%`))
        .orderBy(events.startDate);
    }
    return await db.select().from(events).orderBy(events.startDate);
  }

  async getPlaces(city?: string, type?: string): Promise<Place[]> {
    let conditions = [];
    if (city) conditions.push(ilike(places.city, `%${city}%`));
    if (type) conditions.push(eq(places.type, type));

    return await db.select().from(places).where(and(...conditions));
  }

  async createEvent(event: typeof events.$inferInsert): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async createPlace(place: typeof places.$inferInsert): Promise<Place> {
    const [newPlace] = await db.insert(places).values(place).returning();
    return newPlace;
  }

  // === CHAT ===
  async getChatMessages(userId1: number, userId2: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(sql`
        (${chatMessages.senderId} = ${userId1} AND ${chatMessages.receiverId} = ${userId2}) OR
        (${chatMessages.senderId} = ${userId2} AND ${chatMessages.receiverId} = ${userId1})
      `)
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(message: typeof chatMessages.$inferInsert): Promise<ChatMessage> {
    const [msg] = await db.insert(chatMessages).values(message).returning();
    return msg;
  }

  // === SHOUTBOX ===
  async getShoutboxMessages(limit = 50): Promise<ShoutboxMessage[]> {
    return await db.select().from(shoutboxMessages)
      .orderBy(desc(shoutboxMessages.createdAt))
      .limit(limit);
  }

  async createShoutboxMessage(message: InsertShoutboxMessage): Promise<ShoutboxMessage> {
    const [msg] = await db.insert(shoutboxMessages).values(message).returning();
    return msg;
  }

  // === ADMIN ===
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async setUserAdmin(id: string, isAdmin: boolean): Promise<User> {
    const [user] = await db.update(users).set({ isAdmin }).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteProfile(id: number): Promise<void> {
    await db.delete(profiles).where(eq(profiles.id, id));
  }

  async deleteArticle(id: number): Promise<void> {
    await db.delete(articles).where(eq(articles.id, id));
  }

  async updateArticle(id: number, data: Partial<Article>): Promise<Article> {
    const [article] = await db.update(articles).set(data).where(eq(articles.id, id)).returning();
    return article;
  }

  async deleteAd(id: number): Promise<void> {
    await db.delete(ads).where(eq(ads.id, id));
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async updateEvent(id: number, data: Partial<Event>): Promise<Event> {
    const [event] = await db.update(events).set(data).where(eq(events.id, id)).returning();
    return event;
  }

  async deletePlace(id: number): Promise<void> {
    await db.delete(places).where(eq(places.id, id));
  }

  async updatePlace(id: number, data: Partial<Place>): Promise<Place> {
    const [place] = await db.update(places).set(data).where(eq(places.id, id)).returning();
    return place;
  }

  async getStats(): Promise<{ users: number; profiles: number; articles: number; ads: number; events: number; places: number }> {
    const [usersCount] = await db.select({ count: count() }).from(users);
    const [profilesCount] = await db.select({ count: count() }).from(profiles);
    const [articlesCount] = await db.select({ count: count() }).from(articles);
    const [adsCount] = await db.select({ count: count() }).from(ads);
    const [eventsCount] = await db.select({ count: count() }).from(events);
    const [placesCount] = await db.select({ count: count() }).from(places);
    return {
      users: usersCount.count,
      profiles: profilesCount.count,
      articles: articlesCount.count,
      ads: adsCount.count,
      events: eventsCount.count,
      places: placesCount.count,
    };
  }

  // === REPORTS ===
  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async getReports(status?: string): Promise<Report[]> {
    if (status) {
      return await db.select().from(reports).where(eq(reports.status, status)).orderBy(desc(reports.createdAt));
    }
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async updateReportStatus(id: number, status: string): Promise<Report> {
    const [updated] = await db.update(reports).set({ status }).where(eq(reports.id, id)).returning();
    return updated;
  }

  // === BLOCKS ===
  async createBlock(blockerId: number, blockedId: number): Promise<Block> {
    const [block] = await db.insert(blocks).values({ blockerId, blockedId }).returning();
    return block;
  }

  async getBlocks(blockerId: number): Promise<Block[]> {
    return await db.select().from(blocks).where(eq(blocks.blockerId, blockerId));
  }

  async removeBlock(blockerId: number, blockedId: number): Promise<void> {
    await db.delete(blocks).where(
      and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId))
    );
  }

  async isBlocked(blockerId: number, blockedId: number): Promise<boolean> {
    const [block] = await db.select().from(blocks).where(
      or(
        and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId)),
        and(eq(blocks.blockerId, blockedId), eq(blocks.blockedId, blockerId))
      )
    );
    return !!block;
  }

  async getBlockedProfileIds(profileId: number): Promise<number[]> {
    const blockedByMe = await db.select({ id: blocks.blockedId }).from(blocks).where(eq(blocks.blockerId, profileId));
    const blockedMe = await db.select({ id: blocks.blockerId }).from(blocks).where(eq(blocks.blockedId, profileId));
    return [...blockedByMe.map(b => b.id!), ...blockedMe.map(b => b.id!)];
  }

  // === VENUES ===
  async getVenues(options?: { city?: string; type?: string; isActive?: boolean }): Promise<Venue[]> {
    const conditions: any[] = [];
    if (options?.city) conditions.push(ilike(venues.city, `%${options.city}%`));
    if (options?.type) conditions.push(eq(venues.type, options.type));
    if (options?.isActive !== undefined) conditions.push(eq(venues.isActive, options.isActive));

    if (conditions.length > 0) {
      return await db.select().from(venues).where(and(...conditions)).orderBy(venues.name);
    }
    return await db.select().from(venues).orderBy(venues.name);
  }

  async getVenue(id: number): Promise<Venue | undefined> {
    const [venue] = await db.select().from(venues).where(eq(venues.id, id));
    return venue;
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    const [newVenue] = await db.insert(venues).values(venue).returning();
    return newVenue;
  }

  async updateVenue(id: number, data: Partial<Venue>): Promise<Venue> {
    const [updated] = await db.update(venues).set({ ...data, updatedAt: new Date() }).where(eq(venues.id, id)).returning();
    return updated;
  }

  async deleteVenue(id: number): Promise<void> {
    await db.delete(recurringEvents).where(eq(recurringEvents.venueId, id));
    await db.delete(oneTimeEvents).where(eq(oneTimeEvents.venueId, id));
    await db.delete(venueFavorites).where(eq(venueFavorites.venueId, id));
    await db.delete(venues).where(eq(venues.id, id));
  }

  async getVenuesNearby(lat: number, lng: number, radiusKm: number): Promise<(Venue & { distanceKm: number })[]> {
    const distanceExpr = sql<number>`
      CASE 
        WHEN ${venues.lat} IS NULL OR ${venues.lng} IS NULL THEN 99999
        ELSE ROUND(
          (6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians(${lat})) * cos(radians(CAST(${venues.lat} AS FLOAT))) *
              cos(radians(CAST(${venues.lng} AS FLOAT)) - radians(${lng})) +
              sin(radians(${lat})) * sin(radians(CAST(${venues.lat} AS FLOAT)))
            ))
          ))::numeric, 1
        )
      END
    `;

    const results = await db.select({
      venue: venues,
      distanceKm: distanceExpr
    }).from(venues)
      .where(and(
        eq(venues.isActive, true),
        sql`${venues.lat} IS NOT NULL AND ${venues.lng} IS NOT NULL`
      ))
      .orderBy(distanceExpr);

    return results
      .filter(r => (r.distanceKm ?? 99999) <= radiusKm)
      .map(r => ({
        ...r.venue,
        distanceKm: r.distanceKm ?? 99999
      }));
  }

  // === RECURRING EVENTS ===
  async getRecurringEvents(options?: { venueId?: number; dayOfWeek?: number; isActive?: boolean }): Promise<RecurringEvent[]> {
    const conditions: any[] = [];
    if (options?.venueId) conditions.push(eq(recurringEvents.venueId, options.venueId));
    if (options?.dayOfWeek !== undefined) conditions.push(eq(recurringEvents.dayOfWeek, options.dayOfWeek));
    if (options?.isActive !== undefined) conditions.push(eq(recurringEvents.isActive, options.isActive));

    if (conditions.length > 0) {
      return await db.select().from(recurringEvents).where(and(...conditions)).orderBy(recurringEvents.startTime);
    }
    return await db.select().from(recurringEvents).orderBy(recurringEvents.dayOfWeek, recurringEvents.startTime);
  }

  async getRecurringEvent(id: number): Promise<RecurringEvent | undefined> {
    const [event] = await db.select().from(recurringEvents).where(eq(recurringEvents.id, id));
    return event;
  }

  async createRecurringEvent(event: InsertRecurringEvent): Promise<RecurringEvent> {
    const [newEvent] = await db.insert(recurringEvents).values(event).returning();
    return newEvent;
  }

  async updateRecurringEvent(id: number, data: Partial<RecurringEvent>): Promise<RecurringEvent> {
    const [updated] = await db.update(recurringEvents).set({ ...data, updatedAt: new Date() }).where(eq(recurringEvents.id, id)).returning();
    return updated;
  }

  async deleteRecurringEvent(id: number): Promise<void> {
    await db.delete(recurringEvents).where(eq(recurringEvents.id, id));
  }

  // === ONE-TIME EVENTS ===
  async getOneTimeEvents(options?: { venueId?: number; startDate?: Date; endDate?: Date }): Promise<OneTimeEvent[]> {
    const conditions: any[] = [];
    if (options?.venueId) conditions.push(eq(oneTimeEvents.venueId, options.venueId));
    if (options?.startDate) conditions.push(gte(oneTimeEvents.eventDate, options.startDate));
    if (options?.endDate) conditions.push(lte(oneTimeEvents.eventDate, options.endDate));

    if (conditions.length > 0) {
      return await db.select().from(oneTimeEvents).where(and(...conditions)).orderBy(oneTimeEvents.eventDate);
    }
    return await db.select().from(oneTimeEvents).orderBy(oneTimeEvents.eventDate);
  }

  async getOneTimeEvent(id: number): Promise<OneTimeEvent | undefined> {
    const [event] = await db.select().from(oneTimeEvents).where(eq(oneTimeEvents.id, id));
    return event;
  }

  async createOneTimeEvent(event: InsertOneTimeEvent): Promise<OneTimeEvent> {
    const [newEvent] = await db.insert(oneTimeEvents).values(event).returning();
    return newEvent;
  }

  async updateOneTimeEvent(id: number, data: Partial<OneTimeEvent>): Promise<OneTimeEvent> {
    const [updated] = await db.update(oneTimeEvents).set({ ...data, updatedAt: new Date() }).where(eq(oneTimeEvents.id, id)).returning();
    return updated;
  }

  async deleteOneTimeEvent(id: number): Promise<void> {
    await db.delete(oneTimeEvents).where(eq(oneTimeEvents.id, id));
  }
}

export const storage = new DatabaseStorage();

import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Import auth and chat schemas
export * from "./models/auth";
export * from "./models/chat";

// === PROFILES ===
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(), // Links to auth.users.id
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  age: integer("age"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  city: text("city"),
  latitude: decimal("latitude"),
  longitude: decimal("longitude"),
  showDistance: boolean("show_distance").default(true),
  lastLocationUpdate: timestamp("last_location_update"),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  isVerified: boolean("is_verified").default(false),
  is18Plus: boolean("is_18_plus").default(false),
  agreedToTerms: boolean("agreed_to_terms").default(false),
  termsAgreedAt: timestamp("terms_agreed_at"),
  profileCompleted: boolean("profile_completed").default(false),
  profileCompletedAt: timestamp("profile_completed_at"),
});

// === REPORTS ===
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").references(() => profiles.id),
  reportedProfileId: integer("reported_profile_id").references(() => profiles.id),
  reason: text("reason").notNull(), // spam, harassment, fake, inappropriate, other
  description: text("description"),
  status: text("status").default("pending"), // pending, reviewed, resolved, dismissed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  status: true,
});

// === BLOCKS ===
export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").references(() => profiles.id),
  blockedId: integer("blocked_id").references(() => profiles.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ 
  id: true, 
  lastSeen: true,
  isOnline: true 
});

// === ARTICLE CATEGORIES ===
export const articleCategories = pgTable("article_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  owner: text("owner"), // 'Kinga', 'Dr Szymon Niemiec', null
  color: text("color").default("#00ff00"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// === ARTICLES (Magazyn) ===
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  galleryImages: text("gallery_images").array(),
  categorySlug: text("category_slug").references(() => articleCategories.slug),
  author: text("author").notNull().default("Redakcja"), // 'Sławek', 'Dr Szymon Niemiec', 'Kinga', 'Redakcja', 'Gość'
  status: text("status").notNull().default("draft"), // 'draft', 'published', 'scheduled'
  featured: boolean("featured").default(false),
  publishDate: timestamp("publish_date"),
  tags: text("tags").array(),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  relatedArticleIds: integer("related_article_ids").array(),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  views: true,
  createdAt: true,
  updatedAt: true,
});

// === EXPERT QUESTIONS (dla Dr Szymona) ===
export const expertQuestions = pgTable("expert_questions", {
  id: serial("id").primaryKey(),
  questionText: text("question_text").notNull(),
  category: text("category").notNull(), // 'Seks', 'Związki', 'Coming out', 'Mental health', 'Inne'
  isAnonymous: boolean("is_anonymous").default(true),
  userId: text("user_id"),
  status: text("status").notNull().default("pending"), // 'pending', 'answered', 'rejected'
  answerArticleId: integer("answer_article_id").references(() => articles.id),
  createdAt: timestamp("created_at").defaultNow(),
  answeredAt: timestamp("answered_at"),
});

export const insertExpertQuestionSchema = createInsertSchema(expertQuestions).omit({
  id: true,
  status: true,
  answerArticleId: true,
  createdAt: true,
  answeredAt: true,
});

// === ADS (Ogłoszenia) ===
export const ads = pgTable("ads", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").references(() => profiles.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // Znajomości, Mieszkania, Marketplace, Inne
  isPremium: boolean("is_premium").default(false),
  location: text("location"), // Display text like "Warszawa, Mazowieckie"
  contactInfo: text("contact_info"),
  latitude: decimal("latitude"),
  longitude: decimal("longitude"),
  tags: text("tags").array(),
  images: text("images").array(),
  status: text("status").default("active"), // active, archived, deleted
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const insertAdSchema = createInsertSchema(ads).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
  authorId: true,
  status: true,
  expiresAt: true
});

// === EVENTS & PLACES (Imprezy) ===
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  locationName: text("location_name"),
  locationAddress: text("location_address"),
  locationLat: decimal("location_lat"),
  locationLng: decimal("location_lng"),
  city: text("city").notNull(), // 'Warszawa', 'Kraków', 'Wrocław', 'Poznań', 'Gdańsk', 'Łódź', 'Katowice', 'Inne'
  eventType: text("event_type").default("Inne"), // 'Klub', 'Parada', 'Spotkanie', 'Wystawa', 'Festiwal', 'Bar', 'Inne'
  coverImage: text("cover_image"),
  galleryImages: text("gallery_images").array(),
  externalLink: text("external_link"),
  status: text("status").default("upcoming"), // 'upcoming', 'ongoing', 'past'
  featured: boolean("featured").default(false),
  organizer: text("organizer"),
  priceInfo: text("price_info"),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  views: true,
  createdAt: true,
  updatedAt: true,
});

export const places = pgTable("places", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // Klub, Kawiarnia, etc.
  address: text("address").notNull(),
  city: text("city").notNull(),
  hours: text("hours"),
  imageUrl: text("image_url"),
});

// === FAVORITES ===
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => profiles.id),
  favoriteProfileId: integer("favorite_profile_id").references(() => profiles.id),
});

// === CHAT MESSAGES (Internal) ===
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => profiles.id),
  receiverId: integer("receiver_id").references(() => profiles.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
  isRead: true
});

// === SHOUTBOX (Public Chat) ===
export const shoutboxMessages = pgTable("shoutbox_messages", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  avatarUrl: text("avatar_url"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShoutboxMessageSchema = createInsertSchema(shoutboxMessages).omit({
  id: true,
  createdAt: true,
});

// === VENUES (Lokale LGBT) ===
export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'klub', 'bar', 'sauna', 'kawiarnia', 'restauracja', 'inne'
  address: text("address").notNull(),
  city: text("city").notNull(),
  district: text("district"),
  lat: decimal("lat"),
  lng: decimal("lng"),
  website: text("website"),
  phone: text("phone"),
  description: text("description"),
  coverImage: text("cover_image"),
  galleryImages: text("gallery_images").array(),
  featured: boolean("featured").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVenueSchema = createInsertSchema(venues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// === RECURRING EVENTS (Stale imprezy tygodniowe) ===
export const recurringEvents = pgTable("recurring_events", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").references(() => venues.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=niedziela, 1=poniedzialek, ..., 6=sobota
  eventName: text("event_name").notNull(),
  description: text("description"),
  startTime: text("start_time").notNull(), // "HH:MM" format
  endTime: text("end_time"),
  price: text("price"),
  recurringType: text("recurring_type").default("weekly"), // 'weekly', 'biweekly', 'first_week', 'last_week'
  dressCode: text("dress_code"),
  ageRestriction: text("age_restriction"),
  tags: text("tags").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRecurringEventSchema = createInsertSchema(recurringEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// === ONE-TIME EVENTS (Wyjatkowe wydarzenia) ===
export const oneTimeEvents = pgTable("one_time_events", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").references(() => venues.id).notNull(),
  eventDate: timestamp("event_date").notNull(),
  eventName: text("event_name").notNull(),
  description: text("description"),
  startTime: text("start_time").notNull(), // "HH:MM" format
  endTime: text("end_time"),
  price: text("price"),
  coverImage: text("cover_image"),
  dressCode: text("dress_code"),
  ageRestriction: text("age_restriction"),
  tags: text("tags").array(),
  featured: boolean("featured").default(false),
  externalLink: text("external_link"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOneTimeEventSchema = createInsertSchema(oneTimeEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// === VENUE FAVORITES ===
export const venueFavorites = pgTable("venue_favorites", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  venueId: integer("venue_id").references(() => venues.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVenueFavoriteSchema = createInsertSchema(venueFavorites).omit({
  id: true,
  createdAt: true,
});

// === TYPES ===
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type ArticleCategory = typeof articleCategories.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type ExpertQuestion = typeof expertQuestions.$inferSelect;
export type InsertExpertQuestion = z.infer<typeof insertExpertQuestionSchema>;
export type Ad = typeof ads.$inferSelect;
export type InsertAd = z.infer<typeof insertAdSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Place = typeof places.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type ShoutboxMessage = typeof shoutboxMessages.$inferSelect;
export type InsertShoutboxMessage = z.infer<typeof insertShoutboxMessageSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Block = typeof blocks.$inferSelect;

// === VENUE/EVENT TYPES ===
export type Venue = typeof venues.$inferSelect;
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type RecurringEvent = typeof recurringEvents.$inferSelect;
export type InsertRecurringEvent = z.infer<typeof insertRecurringEventSchema>;
export type OneTimeEvent = typeof oneTimeEvents.$inferSelect;
export type InsertOneTimeEvent = z.infer<typeof insertOneTimeEventSchema>;
export type VenueFavorite = typeof venueFavorites.$inferSelect;
export type InsertVenueFavorite = z.infer<typeof insertVenueFavoriteSchema>;

// === API REQUEST/RESPONSE TYPES ===
export type UpdateProfileRequest = Partial<InsertProfile>;
export type CreateAdRequest = InsertAd;

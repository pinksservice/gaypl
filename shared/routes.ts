import { z } from 'zod';
import { insertProfileSchema, insertAdSchema, insertChatMessageSchema, profiles, articles, ads, events, places, chatMessages } from './schema';
import { createInsertSchema } from 'drizzle-zod';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

export const api = {
  profiles: {
    list: {
      method: 'GET' as const,
      path: '/api/profiles',
      input: z.object({
        filter: z.enum(['nearby', 'online', 'new', 'favorites', 'verified']).optional(),
        city: z.string().optional(),
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof profiles.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/profiles/:id',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    me: { // Get current user's profile
      method: 'GET' as const,
      path: '/api/me/profile',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound, // If profile not created yet
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/profiles/:id',
      input: insertProfileSchema.partial(),
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.unauthorized,
      },
    },
    create: { // Create profile for auth user
      method: 'POST' as const,
      path: '/api/profiles',
      input: insertProfileSchema,
      responses: {
        201: z.custom<typeof profiles.$inferSelect>(),
        400: errorSchemas.validation,
      }
    }
  },
  articles: {
    list: {
      method: 'GET' as const,
      path: '/api/articles',
      input: z.object({
        category: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof articles.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/articles/:id',
      responses: {
        200: z.custom<typeof articles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  ads: {
    list: {
      method: 'GET' as const,
      path: '/api/ads',
      input: z.object({
        category: z.string().optional(),
        userLat: z.string().optional(),
        userLng: z.string().optional(),
        limit: z.string().optional(),
        offset: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof ads.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/ads',
      input: insertAdSchema,
      responses: {
        201: z.custom<typeof ads.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  events: {
    list: {
      method: 'GET' as const,
      path: '/api/events',
      input: z.object({
        city: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof events.$inferSelect>()),
      },
    },
  },
  places: {
    list: {
      method: 'GET' as const,
      path: '/api/places',
      input: z.object({
        city: z.string().optional(),
        type: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof places.$inferSelect>()),
      },
    },
  },
  chat: {
    listMessages: {
      method: 'GET' as const,
      path: '/api/chat/messages',
      input: z.object({
        otherUserId: z.coerce.number(),
      }),
      responses: {
        200: z.array(z.custom<typeof chatMessages.$inferSelect>()),
      },
    },
    send: {
      method: 'POST' as const,
      path: '/api/chat/messages',
      input: insertChatMessageSchema,
      responses: {
        201: z.custom<typeof chatMessages.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

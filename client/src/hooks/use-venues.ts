import { useQuery } from "@tanstack/react-query";

export interface VenueEvent {
  venue: {
    id: number;
    name: string;
    type: string;
    address: string;
    city: string;
    distance_km: number | null;
    lat: string | null;
    lng: string | null;
    coverImage: string | null;
  };
  event: {
    id: number;
    name: string;
    is_recurring: boolean;
    day_of_week?: number;
    event_date?: string;
    start_time: string;
    end_time: string | null;
    price: string | null;
    description: string | null;
    tags: string[] | null;
    featured?: boolean;
    coverImage?: string | null;
    externalLink?: string | null;
  };
}

export interface NearbyEventsResponse {
  date: string;
  user_location: { lat: number; lng: number } | null;
  radius_km: number;
  events: VenueEvent[];
}

export interface WeeklyScheduleDay {
  date: string;
  day_of_week: number;
  day_name: string;
  recurring_events: VenueEvent[];
  one_time_events: VenueEvent[];
}

export interface WeeklyScheduleResponse {
  city: string;
  week_start: string;
  week_end: string;
  days: WeeklyScheduleDay[];
}

export interface RecurringScheduleResponse {
  city: string;
  recurring_schedule: Record<string, VenueEvent[]>;
}

export interface VenueDetails {
  venue: {
    id: number;
    name: string;
    type: string;
    address: string;
    city: string;
    district: string | null;
    lat: string | null;
    lng: string | null;
    website: string | null;
    phone: string | null;
    description: string | null;
    coverImage: string | null;
    galleryImages: string[] | null;
    featured: boolean;
    isActive: boolean;
  };
  recurring_events: Array<{
    id: number;
    venueId: number;
    dayOfWeek: number;
    day_name: string;
    eventName: string;
    description: string | null;
    startTime: string;
    endTime: string | null;
    price: string | null;
    tags: string[] | null;
  }>;
  upcoming_one_time_events: Array<{
    id: number;
    venueId: number;
    eventDate: string;
    eventName: string;
    description: string | null;
    startTime: string;
    endTime: string | null;
    price: string | null;
    coverImage: string | null;
    featured: boolean;
  }>;
}

export interface Venue {
  id: number;
  name: string;
  type: string;
  address: string;
  city: string;
  district: string | null;
  lat: string | null;
  lng: string | null;
  website: string | null;
  phone: string | null;
  description: string | null;
  coverImage: string | null;
  featured: boolean;
  isActive: boolean;
}

export function useNearbyEvents(options: {
  lat?: number;
  lng?: number;
  city?: string;
  radiusKm?: number;
  date?: string;
  type?: string;
  enabled?: boolean;
}) {
  const { lat, lng, city, radiusKm = 10, date, type, enabled = true } = options;

  return useQuery<NearbyEventsResponse>({
    queryKey: ['/api/events/nearby', lat, lng, city, radiusKm, date, type],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (lat !== undefined) params.append('lat', String(lat));
      if (lng !== undefined) params.append('lng', String(lng));
      if (city) params.append('city', city);
      if (radiusKm) params.append('radius_km', String(radiusKm));
      if (date) params.append('date', date);
      if (type) params.append('type', type);

      const res = await fetch(`/api/events/nearby?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch nearby events');
      return res.json();
    },
    enabled: enabled && (lat !== undefined && lng !== undefined) || !!city,
  });
}

export function useWeeklySchedule(city: string, startDate?: string) {
  return useQuery<WeeklyScheduleResponse>({
    queryKey: ['/api/events/week', city, startDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);

      const res = await fetch(`/api/events/week/${encodeURIComponent(city)}?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch weekly schedule');
      return res.json();
    },
    enabled: !!city,
  });
}

export function useRecurringSchedule(city: string, dayOfWeek?: number) {
  return useQuery<RecurringScheduleResponse>({
    queryKey: ['/api/events/recurring', city, dayOfWeek],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dayOfWeek !== undefined) params.append('day_of_week', String(dayOfWeek));

      const res = await fetch(`/api/events/recurring/${encodeURIComponent(city)}?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch recurring schedule');
      return res.json();
    },
    enabled: !!city,
  });
}

export function useVenues(options?: { city?: string; type?: string }) {
  return useQuery<Venue[]>({
    queryKey: ['/api/venues', options?.city, options?.type],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.city) params.append('city', options.city);
      if (options?.type) params.append('type', options.type);

      const res = await fetch(`/api/venues?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch venues');
      return res.json();
    },
  });
}

export function useVenueDetails(venueId: number | null) {
  return useQuery<VenueDetails>({
    queryKey: ['/api/venues', venueId],
    queryFn: async () => {
      const res = await fetch(`/api/venues/${venueId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch venue details');
      return res.json();
    },
    enabled: venueId !== null,
  });
}

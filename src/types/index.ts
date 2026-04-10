export type PropertyType =
  | "appartement"
  | "maison"
  | "terrain"
  | "bureau"
  | "local_commercial"
  | "villa"
  | "duplex";

export type ListingType = "vente" | "location";
export type RentalCategory =
  | "chambre_meublee"
  | "studio"
  | "appartement"
  | "mini_studio"
  | "colocation";
export type RentPaymentPeriod = "jour" | "mois";

export type PropertyStatus =
  | "brouillon"
  | "publie"
  | "vendu"
  | "loue"
  | "archive";

export type VisitStatus = "en_attente" | "confirme" | "annule" | "realise";

export type ContactStatus = "nouveau" | "lu" | "traite" | "archive";

export type BlogStatus = "brouillon" | "publie" | "archive";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: "admin" | "user";
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  property_type: PropertyType;
  listing_type: ListingType;
  status: PropertyStatus;
  price: number;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  address: string | null;
  neighborhood: string | null;
  city: string;
  postal_code: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  is_featured: boolean;
  is_furnished: boolean;
  rental_category: RentalCategory | null;
  rent_payment_period: RentPaymentPeriod | null;
  main_image_url: string | null;
  video_url: string | null;
  views_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  property_images?: PropertyImage[];
  property_features?: PropertyFeature[];
}

export interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  alt: string | null;
  is_main: boolean;
  order_index: number;
  created_at: string;
}

export interface PropertyFeature {
  id: string;
  property_id: string;
  name: string;
  value: string | null;
  icon: string | null;
}

export interface Favorite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
  property?: Property;
}

export interface VisitRequest {
  id: string;
  property_id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  preferred_date: string | null;
  status: VisitStatus;
  created_at: string;
  updated_at: string;
  property?: Property;
}

export interface Contact {
  id: string;
  property_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: ContactStatus;
  created_at: string;
  updated_at: string;
  property?: Property;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  video_url: string | null;
  category: string | null;
  tags: string[] | null;
  status: BlogStatus;
  author_id: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface DashboardStats {
  total_properties: number;
  published_properties: number;
  total_visits: number;
  pending_visits: number;
  total_messages: number;
  new_messages: number;
  total_favorites: number;
}

export interface SearchFilters {
  query?: string;
  listing_type?: ListingType | "";
  rental_category?: RentalCategory | "";
  rent_payment_period?: RentPaymentPeriod | "";
  property_type?: PropertyType | "";
  city?: string;
  neighborhood?: string;
  min_price?: number | "";
  max_price?: number | "";
  min_area?: number | "";
  max_area?: number | "";
  bedrooms?: number | "";
  bathrooms?: number | "";
}

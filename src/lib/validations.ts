import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email requis").email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis").min(6, "Mot de passe trop court (6 caractères min.)"),
});

export const registerSchema = z.object({
  full_name: z.string()
    .trim()
    .min(1, "Nom requis")
    .min(2, "Nom trop court (2 caractères min.)")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Le nom ne doit contenir que des lettres")
    .refine((v) => v.trim().length >= 2, "Le nom ne peut pas être que des espaces"),
  email: z.string().trim().min(1, "Email requis").email("Email invalide"),
  password: z.string()
    .min(1, "Mot de passe requis")
    .min(6, "Mot de passe trop court (6 caractères min.)")
    .regex(/[a-zA-Z]/, "Le mot de passe doit contenir au moins une lettre")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
    .refine((v) => !/^\s+$/.test(v), "Le mot de passe ne peut pas être que des espaces"),
  confirm_password: z.string().min(1, "Confirmation requise"),
}).refine((data) => data.password === data.confirm_password, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm_password"],
});

export const visitRequestSchema = z.object({
  full_name: z.string().trim().min(2, "Nom requis").regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Le nom ne doit contenir que des lettres"),
  email: z.string().trim().email("Email invalide"),
  phone: z.string().optional(),
  message: z.string().optional(),
  preferred_date: z.string().optional(),
});

export const contactSchema = z.object({
  full_name: z.string().trim().min(2, "Nom requis").regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Le nom ne doit contenir que des lettres"),
  email: z.string().trim().email("Email invalide"),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().trim().min(10, "Message trop court (10 caractères min.)"),
});

export const propertySchema = z.object({
  title: z.string().min(5, "Titre trop court"),
  description: z.string().optional(),
  property_type: z.enum([
    "appartement",
    "maison",
    "terrain",
    "bureau",
    "local_commercial",
    "villa",
    "duplex",
  ]),
  listing_type: z.enum(["vente", "location"]),
  status: z.enum(["brouillon", "publie", "vendu", "loue", "archive"]),
  price: z.number().positive("Prix invalide"),
  area: z.number().positive().optional().nullable(),
  bedrooms: z.number().int().min(0).optional().nullable(),
  bathrooms: z.number().int().min(0).optional().nullable(),
  address: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().min(2, "Ville requise"),
  postal_code: z.string().optional().nullable(),
  country: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  is_featured: z.boolean().optional(),
  is_furnished: z.boolean().optional(),
  video_url: z.string().optional().nullable(),
});

export const blogPostSchema = z.object({
  title: z.string().min(5, "Titre trop court"),
  excerpt: z.string().optional().nullable(),
  content: z.string().min(10, "Contenu trop court"),
  category: z.string().optional().nullable(),
  status: z.enum(["brouillon", "publie", "archive"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VisitRequestInput = z.infer<typeof visitRequestSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type PropertyInput = z.infer<typeof propertySchema>;
export type BlogPostInput = z.infer<typeof blogPostSchema>;

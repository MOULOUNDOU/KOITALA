import { z } from "zod";

const gmailOnlyEmailSchema = z
  .string()
  .trim()
  .min(1, "Email requis")
  .email("Email invalide")
  .refine((value) => value.toLowerCase().endsWith("@gmail.com"), "Seules les adresses Gmail sont autorisées");

const noHtmlOrAngleBrackets = (value: string): boolean =>
  !/<[^>]*>|[<>]/.test(value);

const trimToUndefined = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email requis")
    .email("Email invalide")
    .refine(noHtmlOrAngleBrackets, "Le HTML et les caractères spéciaux ne sont pas autorisés"),
  password: z
    .string()
    .min(1, "Mot de passe requis")
    .min(6, "Mot de passe trop court (6 caractères min.)")
    .regex(/^[a-zA-Z0-9]+$/, "Le mot de passe ne doit contenir que des lettres et des chiffres")
    .refine(noHtmlOrAngleBrackets, "Le HTML n'est pas autorisé"),
});

export const registerSchema = z.object({
  full_name: z.string()
    .trim()
    .min(1, "Nom requis")
    .min(2, "Nom trop court (2 caractères min.)")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Le nom ne doit contenir que des lettres")
    .refine((v) => v.trim().length >= 2, "Le nom ne peut pas être que des espaces"),
  email: gmailOnlyEmailSchema,
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
  full_name: z
    .string()
    .trim()
    .min(2, "Nom requis")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Le nom ne doit contenir que des lettres")
    .refine(noHtmlOrAngleBrackets, "Le HTML n'est pas autorisé"),
  email: z
    .string()
    .trim()
    .email("Email invalide")
    .refine(noHtmlOrAngleBrackets, "Le HTML n'est pas autorisé"),
  phone: z.preprocess(
    trimToUndefined,
    z
      .string()
      .min(6, "Téléphone invalide")
      .max(25, "Téléphone trop long")
      .regex(/^[0-9+()\-\s.]+$/, "Le téléphone contient des caractères non autorisés")
      .refine(noHtmlOrAngleBrackets, "Le HTML n'est pas autorisé")
      .optional()
  ),
  message: z.preprocess(
    trimToUndefined,
    z
      .string()
      .max(1000, "Message trop long")
      .refine(noHtmlOrAngleBrackets, "Le HTML n'est pas autorisé")
      .optional()
  ),
  preferred_date: z.preprocess(
    trimToUndefined,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide")
      .optional()
  ),
});

export const contactSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Nom requis")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Le nom ne doit contenir que des lettres")
    .refine(noHtmlOrAngleBrackets, "Le HTML n'est pas autorisé"),
  email: z
    .string()
    .trim()
    .email("Email invalide")
    .refine(noHtmlOrAngleBrackets, "Le HTML n'est pas autorisé"),
  phone: z.preprocess(
    trimToUndefined,
    z
      .string()
      .min(6, "Téléphone invalide")
      .max(25, "Téléphone trop long")
      .regex(/^[0-9+()\-\s.]+$/, "Le téléphone contient des caractères non autorisés")
      .refine(noHtmlOrAngleBrackets, "Le HTML n'est pas autorisé")
      .optional()
  ),
  subject: z.preprocess(
    trimToUndefined,
    z
      .string()
      .max(120, "Sujet trop long")
      .refine(noHtmlOrAngleBrackets, "Le HTML n'est pas autorisé")
      .optional()
  ),
  message: z
    .string()
    .trim()
    .min(10, "Message trop court (10 caractères min.)")
    .max(1500, "Message trop long")
    .refine(noHtmlOrAngleBrackets, "Le HTML n'est pas autorisé"),
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
  rental_category: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum([
      "chambre_meublee",
      "studio",
      "appartement",
      "mini_studio",
      "colocation",
    ]).optional().nullable()
  ),
  rent_payment_period: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["jour", "mois"]).optional().nullable()
  ),
  main_image_url: z.string().optional().nullable(),
  video_url: z.string().optional().nullable(),
});

export const blogPostSchema = z.object({
  title: z.string().min(5, "Titre trop court"),
  excerpt: z.string().optional().nullable(),
  content: z.string().min(10, "Contenu trop court"),
  cover_image_url: z.string().optional().nullable(),
  video_url: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  status: z.enum(["brouillon", "publie", "archive"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VisitRequestInput = z.infer<typeof visitRequestSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type PropertyInput = z.infer<typeof propertySchema>;
export type BlogPostInput = z.infer<typeof blogPostSchema>;

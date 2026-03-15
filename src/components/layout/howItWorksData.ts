import { CheckCircle, Home, MapPin, Users } from "lucide-react";

export const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    icon: Home,
    title: "Définissez votre projet",
    desc: "Partagez vos critères : budget, type de bien, localisation, et vos besoins spécifiques.",
  },
  {
    step: "02",
    icon: Users,
    title: "Rencontrez notre équipe",
    desc: "Un conseiller dédié vous accompagne et sélectionne les meilleures opportunités pour vous.",
  },
  {
    step: "03",
    icon: MapPin,
    title: "Visitez les biens",
    desc: "Planifiez des visites et découvrez les propriétés qui correspondent à vos attentes.",
  },
  {
    step: "04",
    icon: CheckCircle,
    title: "Finalisez la transaction",
    desc: "Notre équipe juridique sécurise votre transaction de A à Z, en toute transparence.",
  },
] as const;

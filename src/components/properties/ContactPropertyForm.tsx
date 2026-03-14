"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquare, CheckCircle } from "lucide-react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { contactSchema, type ContactInput } from "@/lib/validations";

interface ContactPropertyFormProps {
  propertyId?: string;
}

export default function ContactPropertyForm({ propertyId }: ContactPropertyFormProps) {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactInput) => {
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, property_id: propertyId ?? null }),
    });
    if (res.ok) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
        <h3 className="text-lg font-semibold text-[#0f1724] mb-1">Message envoyé !</h3>
        <p className="text-sm text-gray-500">
          Nous vous répondrons dans les plus brefs délais.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-[#e8b86d]/20 rounded-xl flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-[#9a6d28]" />
        </div>
        <h3 className="font-semibold text-[#0f1724]">Nous contacter</h3>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nom complet"
          placeholder="Votre nom"
          error={errors.full_name?.message}
          {...register("full_name")}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="votre@email.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Téléphone"
            type="tel"
            placeholder="+221 00 000 00 00"
            error={errors.phone?.message}
            {...register("phone")}
          />
        </div>
        <Input
          label="Sujet"
          placeholder="Objet de votre message"
          {...register("subject")}
        />
        <Textarea
          label="Message"
          placeholder="Votre message..."
          rows={4}
          error={errors.message?.message}
          {...register("message")}
        />
        <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
          Envoyer le message
        </Button>
      </form>
    </div>
  );
}

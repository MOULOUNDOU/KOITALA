import type { SupabaseClient } from "@supabase/supabase-js";

export const GENERATED_CONTRACTS_BUCKET = "contract-pdfs";

export interface GeneratedContractRecord {
  id: string;
  contract_reference: string;
  tenant_name: string;
  tenant_email: string | null;
  tenant_phone: string | null;
  property_title: string;
  property_city: string | null;
  property_address: string;
  contract_date: string;
  start_date: string;
  duration_months: number;
  monthly_rent: number;
  security_deposit: number;
  payment_frequency: "jour" | "mois";
  representative_name: string;
  special_clauses: string | null;
  pdf_url: string;
  storage_path: string;
  created_by: string | null;
  created_at: string;
}

export interface PersistGeneratedContractInput {
  contractReference: string;
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  propertyTitle: string;
  propertyCity?: string;
  propertyAddress: string;
  contractDate: string;
  startDate: string;
  durationMonths: number;
  monthlyRent: number;
  securityDeposit: number;
  paymentFrequency: "jour" | "mois";
  representativeName: string;
  specialClauses?: string;
  pdfBlob: Blob;
}

function normalizeOptionalText(value?: string): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function sanitizeStoragePart(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "contrat"
  );
}

function getStoragePath(contractReference: string, tenantName: string) {
  const safeReference = sanitizeStoragePart(contractReference || "sans-reference");
  const safeTenant = sanitizeStoragePart(tenantName || "client");
  const stamp = Date.now();
  const year = new Date().getUTCFullYear();
  return `generated/${year}/${safeReference}-${safeTenant}-${stamp}.pdf`;
}

const GENERATED_CONTRACT_SELECT =
  "id, contract_reference, tenant_name, tenant_email, tenant_phone, property_title, property_city, property_address, contract_date, start_date, duration_months, monthly_rent, security_deposit, payment_frequency, representative_name, special_clauses, pdf_url, storage_path, created_by, created_at";

export async function persistGeneratedContract(
  supabase: SupabaseClient,
  payload: PersistGeneratedContractInput
): Promise<{ data: GeneratedContractRecord | null; error: string | null }> {
  const storagePath = getStoragePath(payload.contractReference, payload.tenantName);
  const authResult = await supabase.auth.getUser();
  const createdBy = authResult.data.user?.id ?? null;

  const { error: uploadError } = await supabase.storage
    .from(GENERATED_CONTRACTS_BUCKET)
    .upload(storagePath, payload.pdfBlob, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    return { data: null, error: "Le PDF a ete genere, mais son envoi vers le stockage a echoue." };
  }

  const { data: publicUrlData } = supabase.storage
    .from(GENERATED_CONTRACTS_BUCKET)
    .getPublicUrl(storagePath);

  const { data, error } = await supabase
    .from("generated_contracts")
    .insert({
      contract_reference: payload.contractReference.trim(),
      tenant_name: payload.tenantName.trim(),
      tenant_email: normalizeOptionalText(payload.tenantEmail),
      tenant_phone: normalizeOptionalText(payload.tenantPhone),
      property_title: payload.propertyTitle.trim(),
      property_city: normalizeOptionalText(payload.propertyCity),
      property_address: payload.propertyAddress.trim(),
      contract_date: payload.contractDate,
      start_date: payload.startDate,
      duration_months: payload.durationMonths,
      monthly_rent: payload.monthlyRent,
      security_deposit: payload.securityDeposit,
      payment_frequency: payload.paymentFrequency,
      representative_name: payload.representativeName.trim(),
      special_clauses: normalizeOptionalText(payload.specialClauses),
      pdf_url: publicUrlData.publicUrl,
      storage_path: storagePath,
      created_by: createdBy,
    })
    .select(GENERATED_CONTRACT_SELECT)
    .single();

  if (error) {
    await supabase.storage.from(GENERATED_CONTRACTS_BUCKET).remove([storagePath]);
    return { data: null, error: "Le PDF a ete genere, mais l'enregistrement du contrat a echoue." };
  }

  return { data: data as GeneratedContractRecord, error: null };
}

export const GENERATED_CONTRACTS_SELECT = GENERATED_CONTRACT_SELECT;

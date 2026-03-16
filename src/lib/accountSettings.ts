export interface ClientNotificationPreferences {
  visit_updates: boolean;
  message_updates: boolean;
  property_recommendations: boolean;
  weekly_digest: boolean;
}

export interface AdminNotificationPreferences {
  visit_requests: boolean;
  contact_messages: boolean;
  listing_digest: boolean;
  weekly_digest: boolean;
}

export interface ContactCardPayload {
  fullName: string;
  email: string;
  phone?: string | null;
}

export const DEFAULT_CLIENT_NOTIFICATION_PREFERENCES: ClientNotificationPreferences = {
  visit_updates: true,
  message_updates: true,
  property_recommendations: false,
  weekly_digest: true,
};

export const DEFAULT_ADMIN_NOTIFICATION_PREFERENCES: AdminNotificationPreferences = {
  visit_requests: true,
  contact_messages: true,
  listing_digest: true,
  weekly_digest: true,
};

type UserMetadataRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UserMetadataRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readBoolean(record: UserMetadataRecord, key: string, fallback: boolean): boolean {
  const value = record[key];
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeUserMetadata(raw: unknown): UserMetadataRecord {
  return isRecord(raw) ? { ...raw } : {};
}

export function readClientNotificationPreferences(raw: unknown): ClientNotificationPreferences {
  const metadata = normalizeUserMetadata(raw);
  const source = normalizeUserMetadata(metadata.client_notification_preferences);

  return {
    visit_updates: readBoolean(
      source,
      "visit_updates",
      DEFAULT_CLIENT_NOTIFICATION_PREFERENCES.visit_updates
    ),
    message_updates: readBoolean(
      source,
      "message_updates",
      DEFAULT_CLIENT_NOTIFICATION_PREFERENCES.message_updates
    ),
    property_recommendations: readBoolean(
      source,
      "property_recommendations",
      DEFAULT_CLIENT_NOTIFICATION_PREFERENCES.property_recommendations
    ),
    weekly_digest: readBoolean(
      source,
      "weekly_digest",
      DEFAULT_CLIENT_NOTIFICATION_PREFERENCES.weekly_digest
    ),
  };
}

export function readAdminNotificationPreferences(raw: unknown): AdminNotificationPreferences {
  const metadata = normalizeUserMetadata(raw);
  const source = normalizeUserMetadata(metadata.admin_notification_preferences);

  return {
    visit_requests: readBoolean(
      source,
      "visit_requests",
      DEFAULT_ADMIN_NOTIFICATION_PREFERENCES.visit_requests
    ),
    contact_messages: readBoolean(
      source,
      "contact_messages",
      DEFAULT_ADMIN_NOTIFICATION_PREFERENCES.contact_messages
    ),
    listing_digest: readBoolean(
      source,
      "listing_digest",
      DEFAULT_ADMIN_NOTIFICATION_PREFERENCES.listing_digest
    ),
    weekly_digest: readBoolean(
      source,
      "weekly_digest",
      DEFAULT_ADMIN_NOTIFICATION_PREFERENCES.weekly_digest
    ),
  };
}

export function buildUserMetadata(
  raw: unknown,
  updates: {
    fullName?: string;
    avatarUrl?: string | null;
    clientNotificationPreferences?: ClientNotificationPreferences;
    adminNotificationPreferences?: AdminNotificationPreferences;
  }
): UserMetadataRecord {
  const metadata = normalizeUserMetadata(raw);

  if (updates.fullName !== undefined) {
    metadata.full_name = updates.fullName;
  }

  if (updates.avatarUrl !== undefined) {
    metadata.avatar_url = updates.avatarUrl || null;
  }

  if (updates.clientNotificationPreferences) {
    metadata.client_notification_preferences = updates.clientNotificationPreferences;
  }

  if (updates.adminNotificationPreferences) {
    metadata.admin_notification_preferences = updates.adminNotificationPreferences;
  }

  return metadata;
}

export function isValidHttpUrl(value: string): boolean {
  if (!value.trim()) return true;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function downloadFile(filename: string, contents: string, contentType: string): void {
  if (typeof window === "undefined") return;

  const blob = new Blob([contents], { type: contentType });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

export function downloadJsonFile(filename: string, payload: unknown): void {
  downloadFile(filename, JSON.stringify(payload, null, 2), "application/json");
}

export function buildContactCard({ fullName, email, phone }: ContactCardPayload): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${fullName}`,
    `EMAIL;TYPE=INTERNET:${email}`,
    phone ? `TEL;TYPE=CELL:${phone}` : "",
    "END:VCARD",
  ].filter(Boolean);

  return `${lines.join("\n")}\n`;
}

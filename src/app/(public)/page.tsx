// The homepage (/) is served from app/page.tsx.
// This route-group page intentionally defers to avoid duplicate route conflict.
import { notFound } from 'next/navigation';
export default function GroupRootPage() {
  notFound();
}


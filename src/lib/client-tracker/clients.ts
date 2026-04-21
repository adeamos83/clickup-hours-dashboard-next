/**
 * Slug → ClickUp folder mapping for the Client Tracker.
 * Add new clients here as they're onboarded to the tracker.
 */

export interface TrackerClient {
  slug: string;
  name: string;
  folderId: string;
  description: string | null;
}

export const TRACKER_CLIENTS: TrackerClient[] = [
  {
    slug: 'geek-power-studios',
    name: 'Geek Power Studios',
    folderId: '90117851334', // GPS | Dogfood folder in the Clients space
    description: 'Onboarding, build, and maintenance workstreams for Geek Power Studios.',
  },
];

export function getTrackerClient(slug: string): TrackerClient | null {
  return TRACKER_CLIENTS.find((c) => c.slug === slug) || null;
}

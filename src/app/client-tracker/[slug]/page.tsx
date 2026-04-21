import { notFound } from 'next/navigation';
import { getTrackerClient } from '@/lib/client-tracker/clients';
import { TrackerContent } from '@/components/client-tracker/tracker-content';

export default async function ClientTrackerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const client = getTrackerClient(slug);
  if (!client) notFound();

  return <TrackerContent slug={slug} initialName={client.name} />;
}

import { ClientContent } from '@/components/client/client-content';

export default async function ClientPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  return <ClientContent name={params.name} start={params.start} end={params.end} />;
}

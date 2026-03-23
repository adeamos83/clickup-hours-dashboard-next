import { EmployeeContent } from '@/components/employee/employee-content';

export default async function EmployeePage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  return <EmployeeContent name={params.name} start={params.start} end={params.end} />;
}

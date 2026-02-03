import { redirect } from 'next/navigation';

export default async function ClubRedirect({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  redirect(`/crews/${name}`);
}

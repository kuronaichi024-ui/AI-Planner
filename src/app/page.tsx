import { redirect } from 'next/navigation';
import { LOGIN_PATH, PROJECTS_PATH } from '@/lib/auth-routes';
import { getSessionUser } from '@/server/db';

export default async function Home() {
  const user = await getSessionUser();
  if (user) redirect(PROJECTS_PATH);
  redirect(LOGIN_PATH);
}

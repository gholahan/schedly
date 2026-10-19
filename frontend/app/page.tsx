import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to login - the auth system will handle routing based on auth state
  redirect('/login');
}

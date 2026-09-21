import { redirect } from 'next/navigation';
// Root redirects to login — AppShell handles post-auth routing
export default function RootPage() {
  redirect('/login');
}

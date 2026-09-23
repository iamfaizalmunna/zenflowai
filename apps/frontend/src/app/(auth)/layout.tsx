import { AuthSplash } from '@/components/brand/AuthSplash';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthSplash>{children}</AuthSplash>;
}

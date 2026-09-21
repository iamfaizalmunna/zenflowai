'use client';

import { useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { LOGIN_MUTATION, REGISTER_MUTATION, LOGOUT_MUTATION } from '../queries/auth.queries';
import { ROLE_HOME } from '@/lib/constants';
import { useUiSound } from '@/hooks/useUiSound';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const { play } = useUiSound();

  const [loginMutation, state] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      const { accessToken, user } = data.login;
      void play('login');
      setAuth(accessToken, user);
      router.push(ROLE_HOME[user.role] ?? '/');
    },
    onError: () => {
      void play('error');
    },
  });

  const login = (email: string, password: string) =>
    loginMutation({ variables: { email, password } });

  return { login, ...state };
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const { play } = useUiSound();

  const [registerMutation, state] = useMutation(REGISTER_MUTATION, {
    onCompleted: (data) => {
      const { accessToken, user } = data.register;
      void play('login');
      setAuth(accessToken, user);
      router.push(ROLE_HOME[user.role] ?? '/');
    },
    onError: () => {
      void play('error');
    },
  });

  const register = (email: string, name: string, password: string) =>
    registerMutation({ variables: { email, name, password } });

  return { register, ...state };
}

export function useLogout() {
  const { logout } = useAuthStore();
  const router = useRouter();
  const { play } = useUiSound();

  const [logoutMutation] = useMutation(LOGOUT_MUTATION);

  const handleLogout = async () => {
    void play('logout');
    await logoutMutation().catch(() => {});
    logout();
    router.push('/login');
  };

  return { logout: handleLogout };
}

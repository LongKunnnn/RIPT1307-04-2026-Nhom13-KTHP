import { useEffect } from 'react';
import { history } from 'umi';
import type { UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';
import { Spin } from 'antd';

interface Props {
  roles: UserRole[];
  children: React.ReactNode;
}

export function RequireRole({ roles, children }: Props) {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      history.replace(ROUTES.login, { from: history.location.pathname });
      return;
    }
    if (user && !roles.includes(user.role)) {
      history.replace(ROUTES.home);
    }
  }, [isAuthenticated, user, roles]);

  if (!isAuthenticated || !user || !roles.includes(user.role)) {
    return <Spin style={{ display: 'block', margin: '80px auto' }} />;
  }

  return <>{children}</>;
}

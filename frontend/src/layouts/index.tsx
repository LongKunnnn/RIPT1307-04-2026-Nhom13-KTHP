import { Outlet, useLocation } from 'umi';
import { ConfigProvider, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import ForumShell from './ForumShell';
import AdminShell from './AdminShell';

export default function RootLayout() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#2563eb',
          colorLink: '#2563eb',
          borderRadius: 8,
          fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        },
      }}
    >
      {isAdmin ? (
        <AdminShell />
      ) : (
        <ForumShell />
      )}
    </ConfigProvider>
  );
}

import { useEffect, useState, type ReactNode } from 'react';
import { Link, history } from 'umi';
import { Layout, Menu, Button, Typography } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
  HomeOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  SecurityScanOutlined, // 
} from '@ant-design/icons';
import { Badge } from 'antd';
import { moderationService } from '@/services/moderation/moderationService';
import { useAuth } from '@/contexts/AuthContext';
import { RequireRole } from '@/components/auth/RequireRole';
import { ROUTES } from '@/constants/routes';
import styles from './admin.less';

const { Sider, Header, Content } = Layout;

interface AdminShellProps {
  children: ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const { logout, user } = useAuth();
  const path = history.location.pathname;
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    moderationService.countQueue().then(setQueueCount).catch(() => setQueueCount(0));
  }, [path]);

  const selected = path.includes('/moderation')
    ? 'moderation'
    : path.includes('/users')
      ? 'users'
      : path.includes('/posts')
        ? 'posts'
        : path.includes('/suspicious-users') 
          ? 'suspicious-users'
          : 'dashboard';

  return (
    <RequireRole roles={['admin']}>
      <Layout className={styles.adminRoot}>
        <Sider width={240} className={styles.sider} breakpoint="lg" collapsedWidth={0}>
          <div className={styles.logo}>SV Forum Admin</div>
          <Menu
            className={styles.menu}
            theme="dark"
            mode="inline"
            selectedKeys={[selected]}
            items={[
              { key: 'dashboard', icon: <DashboardOutlined />, label: <Link to={ROUTES.admin.root}>Tổng quan</Link> },
              { key: 'posts', icon: <FileTextOutlined />, label: <Link to={ROUTES.admin.posts}>Bài viết</Link> },
              {
                key: 'moderation',
                icon: <SafetyCertificateOutlined />,
                label: (
                  <Link to={ROUTES.admin.moderation}>
                    Kiểm duyệt <Badge count={queueCount} size="small" style={{ marginLeft: 6 }} />
                  </Link>
                ),
              },
              { key: 'users', icon: <TeamOutlined />, label: <Link to={ROUTES.admin.users}>Người dùng</Link> },
              { key: 'suspicious-users', icon: <SecurityScanOutlined />, label: <Link to={ROUTES.admin.checkVar}>Nghi Vấn Gian Lận</Link> },
            ]}
          />
          <Link to={ROUTES.home} className={styles.backForum}>
            <HomeOutlined /> Về diễn đàn
          </Link>
        </Sider>
        <Layout>
          <Header className={styles.header}>
            <Typography.Text strong>Quản trị hệ thống</Typography.Text>
            <Button icon={<LogoutOutlined />} onClick={logout}>
              {user?.displayName} — Đăng xuất
            </Button>
          </Header>
          <Content className={styles.content}>
            {children}
          </Content>
        </Layout>
      </Layout>
    </RequireRole>
  );
}
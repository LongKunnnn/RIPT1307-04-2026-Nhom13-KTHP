import { Link, Outlet, history } from 'umi';
import { Layout, Menu, Button, Typography } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
  HomeOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Badge } from 'antd';
import { moderationService } from '@/services/moderation/moderationService';
import { useAuth } from '@/contexts/AuthContext';
import { RequireRole } from '@/components/auth/RequireRole';
import { ROUTES } from '@/constants/routes';
import styles from './admin.less';

const { Sider, Header, Content } = Layout;

export default function AdminShell() {
  const { logout, user } = useAuth();
  const path = history.location.pathname;

  const queueCount = moderationService.countQueue();

  const selected = path.includes('/moderation')
    ? 'moderation'
    : path.includes('/users')
      ? 'users'
      : path.includes('/posts')
        ? 'posts'
        : 'dashboard';

  return (
    <RequireRole roles={['ADMIN']}>
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
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </RequireRole>
  );
}

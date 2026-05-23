import { Link, Outlet, history, useLocation } from 'umi';
import { Layout, Input, Button, Space, Dropdown } from 'antd';
import {
  CommentOutlined,
  SearchOutlined,
  TeamOutlined,
  TagsOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';
import { roleLabel } from '@/utils/format';
import styles from './index.less';

const { Header, Footer, Content } = Layout;

export default function ForumShell() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();

  const onSearch = (value: string) => {
    const q = value.trim();
    const params = new URLSearchParams(location.search);
    if (q) params.set('q', q);
    else params.delete('q');
    params.set('tab', 'home');
    history.push({ pathname: ROUTES.home, search: params.toString(), hash: 'feed' });
  };

  const userMenu = {
    items: [
      ...(isAdmin
        ? [{ key: 'admin', icon: <DashboardOutlined />, label: <Link to={ROUTES.admin.root}>Admin</Link> }]
        : []),
      { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true, onClick: logout },
    ],
  };

  return (
    <Layout className={styles.siteRoot}>
      <Header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to={ROUTES.home} className={styles.brand}>
            <span className={styles.brandIcon}>
              <CommentOutlined />
            </span>
            <span className={styles.brandText}>
              <strong>SV Forum</strong>
              <small>Diễn đàn Hỏi Đáp Sinh viên</small>
            </span>
          </Link>

          <nav className={styles.nav}>
            <Link to={ROUTES.myQuestions()} className={styles.navLink}>
              Câu hỏi của tôi
            </Link>
            <Link to={ROUTES.homeFeed} className={styles.navLink}>
              <TagsOutlined /> Bảng tin
            </Link>
          </nav>

          <Input.Search
            className={styles.search}
            placeholder="Tìm theo từ khóa, tiêu đề, nội dung..."
            allowClear
            defaultValue={new URLSearchParams(location.search).get('q') ?? ''}
            onSearch={onSearch}
          />

          <Space size="middle" className={styles.auth}>
            {isAuthenticated && user ? (
              <Dropdown menu={userMenu}>
                <Button type="text" icon={<UserOutlined />}>
                  {user.displayName} ({roleLabel(user.role)})
                </Button>
              </Dropdown>
            ) : (
              <>
                <Button type="text" className={styles.loginBtn} onClick={() => history.push(ROUTES.login)}>
                  Đăng nhập
                </Button>
                <Button type="primary" onClick={() => history.push(ROUTES.register)}>
                  Đăng ký
                </Button>
              </>
            )}
          </Space>
        </div>
      </Header>

      <Content className={styles.content}>
        <Outlet />
      </Content>

      <Footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>
            <strong>SV Forum</strong> — Nền tảng hỏi đáp học thuật cho sinh viên và giảng viên.
          </div>
          <div className={styles.footerCopy}>© {new Date().getFullYear()} Nhóm dự án RIPT — PTIT</div>
        </div>
      </Footer>
    </Layout>
  );
}

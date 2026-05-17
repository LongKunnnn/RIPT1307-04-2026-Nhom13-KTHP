import { Link, Outlet } from 'umi';
import {
  Layout,
  Input,
  Button,
  Space,
  ConfigProvider,
  theme,
} from 'antd';
import {
  CommentOutlined,
  SearchOutlined,
  TeamOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import viVN from 'antd/locale/vi_VN';
import styles from './index.less';

const { Header, Footer, Content } = Layout;

export default function RootLayout() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#2563eb',
          borderRadius: 8,
          fontFamily:
            '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
      }}
    >
      <Layout className={styles.siteRoot}>
        <Header className={styles.header}>
          <div className={styles.headerInner}>
            <Link to="/" className={styles.brand}>
              <span className={styles.brandIcon}>
                <CommentOutlined />
              </span>
              <span className={styles.brandText}>
                <strong>SV Forum</strong>
                <small>Diễn đàn Hỏi Đáp Sinh viên</small>
              </span>
            </Link>

            <nav className={styles.nav}>
              <Link to="/#feed" className={styles.navLink}>
                Câu hỏi
              </Link>
              <a href="#" className={styles.navLink} onClick={(e) => e.preventDefault()}>
                <TagsOutlined /> Thẻ
              </a>
              <a href="#" className={styles.navLink} onClick={(e) => e.preventDefault()}>
                <TeamOutlined /> Thành viên
              </a>
            </nav>

            <Input
              className={styles.search}
              placeholder="Tìm theo từ khóa, tiêu đề, nội dung..."
              prefix={<SearchOutlined className={styles.searchIcon} />}
              allowClear
            />

            <Space size="middle" className={styles.auth}>
              <Button type="text" className={styles.loginBtn}>
                Đăng nhập
              </Button>
              <Button type="primary">Đăng ký</Button>
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
            <div className={styles.footerLinks}>
              <a href="#">Giới thiệu</a>
              <a href="#">Điều khoản</a>
              <a href="#">Liên hệ</a>
              <a href="https://github.com/umijs/umi" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </div>
            <div className={styles.footerCopy}>© {new Date().getFullYear()} Nhóm dự án RIPT — PTIT</div>
          </div>
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}

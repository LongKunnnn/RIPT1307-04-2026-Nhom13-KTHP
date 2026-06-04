import React from "react";
import { Link, history, useLocation } from "umi";
import { Layout, Input, Button, Space, Dropdown } from "antd";
import {
  CommentOutlined,
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useChat, useChatState } from "@/contexts/ChatContext";
import { ROUTES } from "@/constants/routes";
import { roleLabel } from "@/utils/format";
import { ChatModal } from "@/components/forum/ChatModal";
import styles from "./index.less";

const { Header, Footer, Content } = Layout;

interface ForumShellProps {
  children: React.ReactNode;
}

export default function ForumShell({ children }: ForumShellProps) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { openChatInbox, closeChat } = useChat();
  const { chatOpen, chatTargetUser } = useChatState();
  const location = useLocation();

  const onSearch = (value: string) => {
    const q = value.trim();
    const params = new URLSearchParams(location.search);
    if (q) params.set("q", q);
    else params.delete("q");
    params.set("tab", "home");
    history.push({
      pathname: ROUTES.home,
      search: params.toString(),
      hash: "feed",
    });
  };

  const userMenu = {
    items: [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: <Link to={ROUTES.profile}>Hồ sơ của tôi</Link>,
      },
      ...(isAdmin
        ? [
            {
              key: "admin",
              icon: <DashboardOutlined />,
              label: <Link to={ROUTES.admin.root}>Admin</Link>,
            },
          ]
        : []),
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Đăng xuất",
        danger: true,
        onClick: logout,
      },
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
              Bảng tin
            </Link>
          </nav>

          <Input.Search
            className={styles.search}
            placeholder="Tìm theo từ khóa, tiêu đề, nội dung..."
            allowClear
            defaultValue={new URLSearchParams(location.search).get("q") ?? ""}
            onSearch={onSearch}
          />

          <Space size="middle" className={styles.auth}>
            {isAuthenticated && user ? (
              <>
                <Button
                  type="text"
                  icon={<MessageOutlined />}
                  onClick={openChatInbox}
                >
                  Tin nhắn
                </Button>
                <Dropdown menu={userMenu}>
                  <Button type="text" icon={<UserOutlined />}>
                    {user.full_name} ({roleLabel(user.role)})
                  </Button>
                </Dropdown>
              </>
            ) : (
              <>
                <Button
                  type="text"
                  className={styles.loginBtn}
                  onClick={() => history.push(ROUTES.login)}
                >
                  Đăng nhập
                </Button>
                <Button
                  type="primary"
                  onClick={() => history.push(ROUTES.register)}
                >
                  Đăng ký
                </Button>
              </>
            )}
          </Space>
        </div>
      </Header>

      <Content className={styles.content}>{children}</Content>

      <Footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>
            <strong>SV Forum</strong> — Nền tảng hỏi đáp học thuật cho sinh viên
            và giảng viên.
          </div>
          <div className={styles.footerCopy}>
            © {new Date().getFullYear()} Nhóm dự án RIPT — PTIT
          </div>
        </div>
      </Footer>

      <ChatModal
        open={chatOpen}
        onClose={closeChat}
        targetUser={chatTargetUser}
      />
    </Layout>
  );
}

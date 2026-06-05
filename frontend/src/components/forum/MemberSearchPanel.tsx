import { useRef, useState } from "react";
import {
  Avatar,
  Button,
  Empty,
  Input,
  List,
  Spin,
  Tag,
  Typography,
} from "antd";
import { SearchOutlined, UserOutlined } from "@ant-design/icons";
import { Link, history } from "umi";
import { authService } from "@/services/auth/authService";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/constants/routes";
import { roleColor, roleLabel } from "@/utils/format";
import type { PublicUserSearchHit } from "@/types";

const { Text, Paragraph } = Typography;

export function MemberSearchPanel() {
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PublicUserSearchHit[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const onSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = value.trim();
    if (!q) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const rows = await authService.searchUsersGlobal(q);
        setResults(rows);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  if (!isAuthenticated) {
    return (
      <Empty description="Đăng nhập để tìm thành viên trên diễn đàn">
        <Button type="primary" onClick={() => history.push(ROUTES.login)}>
          Đăng nhập
        </Button>
      </Empty>
    );
  }

  return (
    <div>
      <Input
        size="large"
        prefix={<SearchOutlined />}
        placeholder="Tìm thành viên theo tên hoặc @username..."
        allowClear
        value={query}
        onChange={(e) => onSearch(e.target.value)}
      />
      <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 16 }}>
        Tìm kiếm toàn diễn đàn. Bấm vào hồ sơ để xem thông tin và các bài đã đăng.
      </Paragraph>

      {loading ? (
        <div style={{ textAlign: "center", padding: 48 }}>
          <Spin />
        </div>
      ) : !query.trim() ? (
        <Empty description="Nhập tên hoặc username để tìm thành viên" />
      ) : results.length === 0 ? (
        <Empty description="Không tìm thấy thành viên phù hợp" />
      ) : (
        <List
          dataSource={results}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Link to={ROUTES.publicProfile(item.username)}>
                    <Avatar
                      icon={<UserOutlined />}
                      src={item.avatarUrl}
                    >
                      {item.fullName.charAt(0).toUpperCase()}
                    </Avatar>
                  </Link>
                }
                title={
                  <Link to={ROUTES.publicProfile(item.username)}>
                    {item.fullName}
                  </Link>
                }
                description={
                  <div>
                    <Text type="secondary">@{item.username}</Text>
                    <Tag
                      color={roleColor(item.role as "student")}
                      style={{ marginLeft: 8 }}
                    >
                      {roleLabel(item.role as "student")}
                    </Tag>
                    {item.faculty && (
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary">{item.faculty}</Text>
                      </div>
                    )}
                    {item.bio && (
                      <Paragraph
                        ellipsis={{ rows: 2 }}
                        type="secondary"
                        style={{ marginBottom: 0, marginTop: 4 }}
                      >
                        {item.bio}
                      </Paragraph>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}

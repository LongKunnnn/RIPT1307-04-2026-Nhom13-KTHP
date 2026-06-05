import { useEffect, useState } from "react";
import { Link } from "umi";
import { Empty, List, Pagination, Spin, Tag, Typography } from "antd";
import { authService } from "@/services/auth/authService";
import { ROUTES } from "@/constants/routes";
import { formatViDate, formatViews } from "@/utils/format";
import type { ProfilePostSummary } from "@/types";

const { Text, Paragraph } = Typography;

interface Props {
  username: string;
}

export function ProfilePostsPanel({ username }: Props) {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<ProfilePostSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    authService
      .getUserPosts(username, page, 8)
      .then((res) => {
        setPosts(res.items);
        setTotal(res.total);
      })
      .catch(() => {
        setPosts([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [username, page]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin />
      </div>
    );
  }

  if (posts.length === 0) {
    return <Empty description="Thành viên chưa đăng bài công khai nào" />;
  }

  return (
    <>
      <List
        dataSource={posts}
        renderItem={(item) => (
          <List.Item>
            <div style={{ width: "100%" }}>
              <Link to={ROUTES.questionDetail(item.id)}>
                <Text strong style={{ fontSize: 16 }}>
                  {item.title}
                </Text>
              </Link>
              <Paragraph
                type="secondary"
                ellipsis={{ rows: 2 }}
                style={{ margin: "8px 0" }}
              >
                {item.excerpt}
              </Paragraph>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {item.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatViDate(item.createdAt)} · {item.answerCount} trả lời ·{" "}
                {formatViews(item.viewCount)} lượt xem · {item.voteScore} phiếu
              </Text>
            </div>
          </List.Item>
        )}
      />
      {total > 8 && (
        <Pagination
          current={page}
          pageSize={8}
          total={total}
          onChange={setPage}
          style={{ marginTop: 16, textAlign: "center" }}
        />
      )}
    </>
  );
}

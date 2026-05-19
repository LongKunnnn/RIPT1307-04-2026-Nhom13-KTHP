import { useCallback, useState } from 'react';
import { Link, useParams } from 'umi';
import { Alert, Breadcrumb, Card, Tag, Typography, Empty, Avatar, Space, Divider } from 'antd';
import { ArrowLeftOutlined, ClockCircleOutlined, EyeOutlined, MessageOutlined } from '@ant-design/icons';
import { ROUTES } from '@/constants/routes';
import { postService } from '@/services/posts/postService';
import { commentService } from '@/services/comments/commentService';
import { VoteButtons } from '@/components/forum/VoteButtons';
import { CommentThread } from '@/components/forum/CommentThread';
import { formatViDate, formatViews, roleColor, roleLabel } from '@/utils/format';
import { useAuth } from '@/contexts/AuthContext';
import { ReportContentButton } from '@/components/forum/ReportContentButton';
import { FollowPostButton } from '@/components/forum/FollowPostButton';
import styles from './detail.less';

const { Title, Text, Paragraph } = Typography;

export default function QuestionDetailPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const postId = id ? decodeURIComponent(id) : '';
  const [, setTick] = useState(0);
  const post = postId ? postService.getById(postId, { viewerId: user?.id }) : null;
  const comments = postId ? commentService.listByPost(postId) : [];
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  if (!post) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <Link to={ROUTES.homeFeed} className={styles.back}>
            <ArrowLeftOutlined /> Về bảng tin
          </Link>
          <Card className={styles.card} bordered={false}>
            <Empty description="Không tìm thấy bài viết" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Breadcrumb
          items={[
            { title: <Link to={ROUTES.home}>Trang chủ</Link> },
            { title: <Link to={ROUTES.myQuestions()}>Câu hỏi của tôi</Link> },
            { title: 'Chi tiết' },
          ]}
          style={{ marginBottom: 12 }}
        />
        <Link to={ROUTES.homeFeed} className={styles.back}>
          <ArrowLeftOutlined /> Về bảng tin
        </Link>

        <Card className={styles.card} bordered={false}>
          {post.moderationStatus !== 'published' && (
            <Alert
              type={post.moderationStatus === 'pending' ? 'warning' : 'error'}
              showIcon
              style={{ marginBottom: 16 }}
              message={
                post.moderationStatus === 'pending'
                  ? 'Bài đang chờ kiểm duyệt — chỉ bạn và admin thấy.'
                  : 'Bài đã bị ẩn do từ khóa cấm.'
              }
              description={post.moderationFlags?.join(', ')}
            />
          )}
          {post.moderationNote && post.moderationStatus === 'published' && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="Nhắc nhở từ quản trị"
              description={post.moderationNote}
            />
          )}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <VoteButtons targetType="post" targetId={post.id} score={post.voteScore} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <Title level={2} className={styles.title} style={{ margin: 0 }}>
                  {post.title}
                </Title>
                <Space wrap>
                  <FollowPostButton postId={post.id} authorId={post.authorId} onChange={refresh} />
                  <ReportContentButton targetType="post" targetId={post.id} />
                </Space>
              </div>
              <div className={styles.meta}>
                <Space align="center" size={10}>
                  <Avatar style={{ backgroundColor: '#2563eb' }}>{post.authorName.charAt(0)}</Avatar>
                  <div>
                    <Text strong>{post.authorName}</Text>{' '}
                    <Tag color={roleColor(post.authorRole)}>{roleLabel(post.authorRole)}</Tag>
                    <div>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        <ClockCircleOutlined /> {formatViDate(post.createdAt)}
                      </Text>
                    </div>
                  </div>
                </Space>
                <div className={styles.stats}>
                  <span>
                    <MessageOutlined /> {post.answerCount} trả lời
                  </span>
                  <span>
                    <EyeOutlined /> {formatViews(post.viewCount)} lượt xem
                  </span>
                </div>
              </div>
              <Paragraph className={styles.body}>{post.body}</Paragraph>
              <div className={styles.tags}>
                {post.tags.map((t) => (
                  <Tag key={t} className={styles.tag}>
                    {t}
                  </Tag>
                ))}
              </div>
            </div>
          </div>
          <Divider />
          <Title level={4}>Bình luận</Title>
          <CommentThread postId={post.id} nodes={comments} onUpdated={refresh} />
        </Card>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'umi';
import { Alert, Breadcrumb, Card, Tag, Typography, Empty, Avatar, Space, Divider, Spin } from 'antd';
import { ArrowLeftOutlined, ClockCircleOutlined, EyeOutlined, MessageOutlined } from '@ant-design/icons';
import { ROUTES } from '@/constants/routes';
import { postService } from '@/services/posts/postService';
import { commentService, type CommentNode } from '@/services/comments/commentService';
import { VoteButtons } from '@/components/forum/VoteButtons';
import { CommentThread } from '@/components/forum/CommentThread';
import { formatViDate, formatViews, roleColor, roleLabel, difficultyLabel, difficultyColor } from '@/utils/format';
import { PostRatingWidget } from '@/components/forum/PostRatingWidget';
import { useAuth } from '@/contexts/AuthContext';
import { ReportContentButton } from '@/components/forum/ReportContentButton';
import { FollowPostButton } from '@/components/forum/FollowPostButton';
import type { Post } from '@/types';
import styles from './detail.less';

const { Title, Text, Paragraph } = Typography;

export default function QuestionDetailPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const postId = id ? decodeURIComponent(id) : '';
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!postId) {
      setPost(null);
      setComments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        postService.getById(postId, { viewerId: user?.id }),
        commentService.listByPost(postId),
      ]);
      setPost(p);
      setComments(c);
    } finally {
      setLoading(false);
    }
  }, [postId, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.inner} style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

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
              <Title level={2}>{post.title}</Title>
              {post.difficulty && (
                <Tag color={difficultyColor(post.difficulty)} style={{ marginBottom: 8 }}>
                  Độ khó: {difficultyLabel(post.difficulty)}
                </Tag>
              )}
              {(post.bounty ?? 0) > 0 && (
                <Tag color="gold" style={{ marginBottom: 8 }}>
                  Thưởng: {post.bounty} điểm
                </Tag>
              )}
              <PostRatingWidget
                postId={post.id}
                authorId={post.authorId}
                avgRating={post.avgRating}
                ratingCount={post.ratingCount}
                onRated={(avg, count) =>
                  setPost((p) => (p ? { ...p, avgRating: avg, ratingCount: count } : p))
                }
              />
              <Space wrap size="middle" style={{ marginBottom: 16 }}>
                <Space>
                  <Link to={ROUTES.publicProfile(post.authorUsername)}>
                    <Avatar style={{ backgroundColor: '#2563eb' }}>{post.authorName.charAt(0)}</Avatar>
                  </Link>
                  <span>
                    <Link to={ROUTES.publicProfile(post.authorUsername)}>
                      <Text strong>{post.authorName}</Text>
                    </Link>{' '}
                    <Tag color={roleColor(post.authorRole)}>{roleLabel(post.authorRole)}</Tag>
                  </span>
                </Space>
                <Text type="secondary">
                  <ClockCircleOutlined /> {formatViDate(post.createdAt)}
                </Text>
                <Text type="secondary">
                  <EyeOutlined /> {formatViews(post.viewCount)} lượt xem
                </Text>
                <Text type="secondary">
                  <MessageOutlined /> {post.answerCount} trả lời
                </Text>
              </Space>
              <div style={{ marginBottom: 16 }}>
                {post.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
              <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 15 }}>{post.body}</Paragraph>
              <Space>
                <FollowPostButton postId={post.id} authorId={post.authorId} />
                <ReportContentButton targetType="post" targetId={post.id} />
              </Space>
            </div>
          </div>
          <Divider />
          <Title level={4}>Bình luận ({post.answerCount})</Title>
          <CommentThread
            postId={post.id}
            postAuthorId={post.authorId}
            postBounty={post.bounty}
            acceptedCommentId={post.acceptedCommentId}
            nodes={comments}
            onUpdated={load}
          />
        </Card>
      </div>
    </div>
  );
}

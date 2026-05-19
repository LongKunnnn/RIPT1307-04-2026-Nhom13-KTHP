import { Link, useParams } from 'umi';
import { Card, Tag, Typography, Empty, Divider } from 'antd';
import { postService } from '@/services/posts/postService';
import { commentService } from '@/services/comments/commentService';
import { AdminCommentList } from '@/components/admin/AdminCommentList';
import { ROUTES } from '@/constants/routes';
import { formatViDate, roleColor, roleLabel } from '@/utils/format';

const { Title, Paragraph } = Typography;

export default function AdminPostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const post = id ? postService.getByIdAdmin(id) : null;
  const comments = id ? commentService.listByPost(id, { includeNonPublic: true }) : [];

  if (!post) {
    return <Empty description="Không tìm thấy bài viết" />;
  }

  return (
    <div>
      <Link to={ROUTES.admin.posts}>← Danh sách bài viết</Link>
      <Card style={{ marginTop: 16 }}>
        <Title level={3}>{post.title}</Title>
        <Paragraph type="secondary">
          {post.authorName} · <Tag color={roleColor(post.authorRole)}>{roleLabel(post.authorRole)}</Tag> ·{' '}
          {formatViDate(post.createdAt)} · {post.voteScore} phiếu · {post.viewCount} lượt xem
        </Paragraph>
        <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{post.body}</Paragraph>
        <div style={{ marginBottom: 16 }}>
          {post.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
        <Divider />
        <Title level={5}>Bình luận</Title>
        <AdminCommentList nodes={comments} />
      </Card>
    </div>
  );
}

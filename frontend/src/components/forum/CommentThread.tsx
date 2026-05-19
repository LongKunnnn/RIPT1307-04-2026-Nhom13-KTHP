import { useState } from 'react';
import { Avatar, Button, Input, Space, Tag, Typography } from 'antd';
import type { CommentNode } from '@/services/comments/commentService';
import { commentService } from '@/services/comments/commentService';
import { useAuth } from '@/contexts/AuthContext';
import { useNotify } from '@/contexts/NotificationContext';
import { VoteButtons } from './VoteButtons';
import { ReportContentButton } from './ReportContentButton';
import { formatViDate, roleColor, roleLabel } from '@/utils/format';
import { moderationUserMessage } from '@/utils/moderationMessages';
import { message } from 'antd';
import styles from './CommentThread.less';

const { Text } = Typography;

interface Props {
  postId: string;
  nodes: CommentNode[];
  onUpdated: () => void;
}

function CommentItem({
  node,
  postId,
  depth,
  onUpdated,
}: {
  node: CommentNode;
  postId: string;
  depth: number;
  onUpdated: () => void;
}) {
  const { user, isAuthenticated } = useAuth();
  const notify = useNotify();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [score, setScore] = useState(node.voteScore);

  const submitReply = () => {
    if (!user || !replyText.trim()) return;
    const c = commentService.add(postId, replyText, node.id, {
      id: user.id,
      displayName: user.displayName,
      role: user.role,
    });
    if (c.moderationStatus === 'published') {
      notify.notifyEmail('Phản hồi mới', `${user.displayName} đã trả lời bình luận của bạn trên diễn đàn.`);
    }
    message.info(moderationUserMessage(c.moderationStatus, c.moderationFlags));
    setReplyText('');
    setReplyOpen(false);
    onUpdated();
  };

  return (
    <div className={styles.item} style={{ marginLeft: depth * 24 }}>
      <div className={styles.row}>
        <VoteButtons targetType="comment" targetId={node.id} score={score} onChange={setScore} />
        <div className={styles.content}>
          <Space align="start">
            <Avatar style={{ backgroundColor: '#2563eb' }}>{node.authorName.charAt(0)}</Avatar>
            <div>
              <Text strong>{node.authorName}</Text>{' '}
              <Tag color={roleColor(node.authorRole)}>{roleLabel(node.authorRole)}</Tag>
              <div className={styles.body}>{node.body}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatViDate(node.createdAt)}
              </Text>
            </div>
          </Space>
          <Space size="small">
            {isAuthenticated && (
              <Button type="link" size="small" onClick={() => setReplyOpen((v) => !v)}>
                Trả lời
              </Button>
            )}
            <ReportContentButton targetType="comment" targetId={node.id} />
          </Space>
        </div>
      </div>
      {replyOpen && (
        <div className={styles.replyBox}>
          <Input.TextArea rows={2} value={replyText} onChange={(e) => setReplyText(e.target.value)} />
          <Button type="primary" size="small" style={{ marginTop: 8 }} onClick={submitReply}>
            Gửi trả lời
          </Button>
        </div>
      )}
      {node.children.map((child) => (
        <CommentItem key={child.id} node={child} postId={postId} depth={depth + 1} onUpdated={onUpdated} />
      ))}
    </div>
  );
}

export function CommentThread({ postId, nodes, onUpdated }: Props) {
  const { user, isAuthenticated } = useAuth();
  const notify = useNotify();
  const [text, setText] = useState('');

  const submit = () => {
    if (!user || !text.trim()) return;
    const c = commentService.add(postId, text, null, {
      id: user.id,
      displayName: user.displayName,
      role: user.role,
    });
    if (c.moderationStatus === 'published') {
      notify.notifyEmail('Phản hồi mới', 'Có bình luận mới trên bài viết bạn theo dõi.');
    }
    message.info(moderationUserMessage(c.moderationStatus, c.moderationFlags));
    setText('');
    onUpdated();
  };

  return (
    <div className={styles.thread}>
      {isAuthenticated ? (
        <div className={styles.compose}>
          <Input.TextArea
            rows={3}
            placeholder="Viết bình luận..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button type="primary" style={{ marginTop: 8 }} onClick={submit}>
            Đăng bình luận
          </Button>
        </div>
      ) : (
        <Text type="secondary">Đăng nhập để bình luận.</Text>
      )}
      {nodes.map((n) => (
        <CommentItem key={n.id} node={n} postId={postId} depth={0} onUpdated={onUpdated} />
      ))}
    </div>
  );
}

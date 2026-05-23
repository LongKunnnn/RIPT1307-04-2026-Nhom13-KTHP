import { Typography } from 'antd';
import type { CommentNode } from '@/services/comments/commentService';
import { formatViDate, roleLabel } from '@/utils/format';

const { Text } = Typography;

function Node({ node, depth }: { node: CommentNode; depth: number }) {
  return (
    <div style={{ marginLeft: depth * 20, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
      <Text strong>{node.authorName}</Text> <Text type="secondary">({roleLabel(node.authorRole)})</Text>
      <div style={{ whiteSpace: 'pre-wrap', margin: '6px 0' }}>{node.body}</div>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {formatViDate(node.createdAt)} · {node.voteScore} phiếu
      </Text>
      {node.children.map((c) => (
        <Node key={c.id} node={c} depth={depth + 1} />
      ))}
    </div>
  );
}

export function AdminCommentList({ nodes }: { nodes: CommentNode[] }) {
  if (nodes.length === 0) return <Text type="secondary">Chưa có bình luận.</Text>;
  return (
    <div>
      {nodes.map((n) => (
        <Node key={n.id} node={n} depth={0} />
      ))}
    </div>
  );
}

import { useState } from "react";
import { Link } from "umi";
import { Avatar, Button, Input, Space, Tag, Typography } from "antd";
import type { CommentNode } from "@/services/comments/commentService";
import { commentService } from "@/services/comments/commentService";
import { useAuth } from "@/contexts/AuthContext";
import { useNotify } from "@/contexts/NotificationContext";
import { ROUTES } from "@/constants/routes";
import { VoteButtons } from "./VoteButtons";
import { ReportContentButton } from "./ReportContentButton";
import { AcceptAnswerButton } from "./AcceptAnswerButton";
import { formatViDate, roleColor, roleLabel } from "@/utils/format";
import { moderationUserMessage } from "@/utils/moderationMessages";
import { message } from "antd";
import styles from "./CommentThread.less";

const { Text } = Typography;

interface Props {
  postId: string;
  postAuthorId: string;
  postBounty?: number;
  acceptedCommentId?: string;
  nodes: CommentNode[];
  onUpdated: () => void;
}

function CommentItem({
  node,
  postId,
  postAuthorId,
  postBounty,
  acceptedCommentId,
  depth,
  onUpdated,
}: {
  node: CommentNode;
  postId: string;
  postAuthorId: string;
  postBounty?: number;
  acceptedCommentId?: string;
  depth: number;
  onUpdated: () => void;
}) {
  const { user, isAuthenticated } = useAuth();
  const isPostAuthor = user?.id === postAuthorId;
  const canAccept =
    isPostAuthor &&
    depth === 0 &&
    !acceptedCommentId &&
    node.authorId !== postAuthorId &&
    !node.isAccepted;
  const notify = useNotify();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [score, setScore] = useState(node.voteScore);

  const submitReply = async () => {
    if (!user || !replyText.trim()) return;
    try {
      const c = await commentService.add(postId, replyText, node.id, {
        id: user.id,
        displayName: user.displayName,
        role: user.role,
      });
      if (c.moderationStatus === "published") {
        notify.notifyEmail(
          "Phản hồi mới",
          `${user.displayName} đã trả lời bình luận của bạn trên diễn đàn.`,
        );
      }
      message.info(moderationUserMessage(c.moderationStatus, c.moderationFlags));
      setReplyText("");
      setReplyOpen(false);
      onUpdated();
    } catch (error: any) {
      if (error?.status === 429) {
        message.warning(error?.message || "Bạn thao tác quá nhanh. Vui lòng đợi 15 giây.");
      } else if (error?.status === 400) {
        message.warning(error?.message || "Nội dung bình luận bị trùng lặp.");
      } else {
        message.error(error?.message || "Có lỗi xảy ra khi gửi bình luận.");
      }
    }
  };

  return (
    <div className={styles.item} style={{ marginLeft: depth * 24 }}>
      <div className={styles.row}>
        <VoteButtons
          targetType="comment"
          targetId={node.id}
          score={score}
          onChange={setScore}
        />
        <div className={styles.content}>
          <Space align="start">
            <Link to={ROUTES.publicProfile(node.authorUsername)}>
              <Avatar style={{ backgroundColor: "#2563eb" }}>
                {node.authorName.charAt(0)}
              </Avatar>
            </Link>
            <div>
              <Link to={ROUTES.publicProfile(node.authorUsername)}>
                <Text strong>{node.authorName}</Text>
              </Link>{" "}
              <Tag color={roleColor(node.authorRole)}>
                {roleLabel(node.authorRole)}
              </Tag>
              {node.isAccepted && (
                <Tag color="success" style={{ marginLeft: 4 }}>
                  Đã chấp nhận
                </Tag>
              )}
              <div className={styles.body}>{node.body}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatViDate(node.createdAt)}
              </Text>
            </div>
          </Space>
          <Space size="small">
            {isAuthenticated && (
              <Button
                type="link"
                size="small"
                onClick={() => setReplyOpen((v) => !v)}
              >
                Trả lời
              </Button>
            )}
            <ReportContentButton targetType="comment" targetId={node.id} />
            {canAccept && (
              <AcceptAnswerButton
                postId={postId}
                commentId={node.id}
                bounty={postBounty}
                onAccepted={() => onUpdated()}
              />
            )}
          </Space>
        </div>
      </div>
      {replyOpen && (
        <div className={styles.replyBox}>
          <Input.TextArea
            rows={2}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <Button
            type="primary"
            size="small"
            style={{ marginTop: 8 }}
            onClick={submitReply}
          >
            Gửi trả lời
          </Button>
        </div>
      )}
      {node.children.map((child) => (
        <CommentItem
          key={child.id}
          node={child}
          postId={postId}
          postAuthorId={postAuthorId}
          postBounty={postBounty}
          acceptedCommentId={acceptedCommentId}
          depth={depth + 1}
          onUpdated={onUpdated}
        />
      ))}
    </div>
  );
}

export function CommentThread({
  postId,
  postAuthorId,
  postBounty,
  acceptedCommentId,
  nodes,
  onUpdated,
}: Props) {
  const { user, isAuthenticated } = useAuth();
  const notify = useNotify();
  const [text, setText] = useState("");

  const submit = async () => {
    if (!user || !text.trim()) return;
    try {
      const c = await commentService.add(postId, text, null, {
        id: user.id,
        displayName: user.displayName,
        role: user.role,
      });
      if (c.moderationStatus === "published") {
        notify.notifyEmail(
          "Phản hồi mới",
          "Có bình luận mới trên bài viết bạn theo dõi.",
        );
      }
      message.info(moderationUserMessage(c.moderationStatus, c.moderationFlags));
      setText("");
      onUpdated();
    } catch (error: any) {
      if (error?.status === 429) {
        message.warning(error?.message || "Bạn thao tác quá nhanh. Vui lòng đợi 15 giây.");
      } else if (error?.status === 400) {
        message.warning(error?.message || "Nội dung bình luận bị trùng lặp.");
      } else {
        message.error(error?.message || "Có lỗi xảy ra khi đăng bình luận.");
      }
    }
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
        <CommentItem
          key={n.id}
          node={n}
          postId={postId}
          postAuthorId={postAuthorId}
          postBounty={postBounty}
          acceptedCommentId={acceptedCommentId}
          depth={0}
          onUpdated={onUpdated}
        />
      ))}
    </div>
  );
}

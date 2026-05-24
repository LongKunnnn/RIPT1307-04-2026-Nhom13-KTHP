import { Button, Popconfirm, Tag, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { postService } from '@/services/posts/postService';

interface Props {
  postId: string;
  commentId: string;
  bounty?: number;
  disabled?: boolean;
  onAccepted?: (bountyAwarded: number) => void;
}

export function AcceptAnswerButton({ postId, commentId, bounty, disabled, onAccepted }: Props) {
  const handle = async () => {
    try {
      const res = await postService.acceptAnswer(postId, commentId);
      if (res.bountyAwarded > 0) {
        message.success(`Đã chấp nhận — trao ${res.bountyAwarded} điểm thưởng cho người trả lời`);
      } else {
        message.success('Đã chấp nhận câu trả lời');
      }
      onAccepted?.(res.bountyAwarded);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không chấp nhận được');
    }
  };

  if (disabled) {
    return (
      <Tag icon={<CheckCircleOutlined />} color="success">
        Đã chấp nhận
      </Tag>
    );
  }

  return (
    <Popconfirm
      title={
        bounty && bounty > 0
          ? `Chấp nhận và trao ${bounty} điểm thưởng?`
          : 'Chấp nhận câu trả lời này?'
      }
      onConfirm={handle}
    >
      <Button type="link" size="small" icon={<CheckCircleOutlined />}>
        Chấp nhận{bounty && bounty > 0 ? ` (+${bounty} điểm)` : ''}
      </Button>
    </Popconfirm>
  );
}

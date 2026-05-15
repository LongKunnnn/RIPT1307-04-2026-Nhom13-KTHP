import { useState } from 'react';
import { Button } from 'antd';
import { BellOutlined, BellFilled } from '@ant-design/icons';
import { followService } from '@/services/posts/followService';
import { useAuth } from '@/contexts/AuthContext';
import { useNotify } from '@/contexts/NotificationContext';
import { history } from 'umi';
import { ROUTES } from '@/constants/routes';

interface Props {
  postId: string;
  authorId: string;
  onChange?: () => void;
}

export function FollowPostButton({ postId, authorId, onChange }: Props) {
  const { user, isAuthenticated } = useAuth();
  const { success } = useNotify();
  const [following, setFollowing] = useState(
    () => !!(user && followService.isFollowing(user.id, postId)),
  );

  if (!isAuthenticated || !user) return null;
  if (user.id === authorId) return null;

  const toggle = () => {
    const now = followService.toggle(user.id, postId);
    setFollowing(now);
    success(now ? 'Đã theo dõi câu hỏi này' : 'Đã bỏ theo dõi');
    onChange?.();
  };

  return (
    <Button
      icon={following ? <BellFilled /> : <BellOutlined />}
      type={following ? 'primary' : 'default'}
      onClick={toggle}
    >
      {following ? 'Đang theo dõi' : 'Theo dõi'}
    </Button>
  );
}

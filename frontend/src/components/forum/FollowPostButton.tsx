import { useEffect, useState } from 'react';
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
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setFollowing(false);
      return;
    }
    followService.isFollowing(user.id, postId).then(setFollowing);
  }, [user, postId]);

  if (!isAuthenticated || !user) return null;
  if (user.id === authorId) return null;

  const toggle = async () => {
    setLoading(true);
    try {
      const now = await followService.toggle(user.id, postId);
      setFollowing(now);
      success(now ? 'Đã theo dõi câu hỏi này' : 'Đã bỏ theo dõi');
      onChange?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      icon={following ? <BellFilled /> : <BellOutlined />}
      type={following ? 'primary' : 'default'}
      loading={loading}
      onClick={() => {
        if (!user) history.push(ROUTES.login);
        else toggle();
      }}
    >
      {following ? 'Đang theo dõi' : 'Theo dõi'}
    </Button>
  );
}

import { useEffect, useState } from 'react';
import { Rate, Typography, message } from 'antd';
import { postService } from '@/services/posts/postService';
import { useAuth } from '@/contexts/AuthContext';

const { Text } = Typography;

interface Props {
  postId: string;
  authorId: string;
  avgRating?: number;
  ratingCount?: number;
  onRated?: (avg: number, count: number) => void;
}

export function PostRatingWidget({ postId, authorId, avgRating = 0, ratingCount = 0, onRated }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [myStars, setMyStars] = useState<number | null>(null);
  const [avg, setAvg] = useState(avgRating);
  const [count, setCount] = useState(ratingCount);

  useEffect(() => {
    setAvg(avgRating);
    setCount(ratingCount);
  }, [avgRating, ratingCount]);

  useEffect(() => {
    if (!isAuthenticated || user?.id === authorId) return;
    postService.getMyRating(postId).then((r) => setMyStars(r.stars)).catch(() => setMyStars(null));
  }, [postId, authorId, isAuthenticated, user?.id]);

  const rate = async (stars: number) => {
    if (!isAuthenticated) {
      message.info('Đăng nhập để đánh giá');
      return;
    }
    if (user?.id === authorId) {
      message.warning('Không thể tự đánh giá bài của mình');
      return;
    }
    try {
      const res = await postService.rate(postId, stars);
      setMyStars(stars);
      setAvg(res.avgRating);
      setCount(res.ratingCount);
      onRated?.(res.avgRating, res.ratingCount);
      message.success('Đã gửi đánh giá');
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không đánh giá được');
    }
  };

  const isOwn = user?.id === authorId;

  return (
    <div style={{ marginTop: 8 }}>
      <Text type="secondary" style={{ fontSize: 13, marginRight: 8 }}>
        Đánh giá độ hữu ích:
      </Text>
      <Rate
        allowHalf={false}
        disabled={!isAuthenticated || isOwn}
        value={myStars ?? Math.round(avg)}
        onChange={rate}
      />
      <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
        {count > 0 ? `${avg.toFixed(1)} / 5 (${count} lượt)` : 'Chưa có đánh giá'}
      </Text>
    </div>
  );
}

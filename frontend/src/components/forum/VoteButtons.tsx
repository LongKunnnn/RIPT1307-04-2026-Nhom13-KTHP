import { Button, Space } from 'antd';
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { voteService } from '@/services/votes/voteService';
import type { VoteTargetType } from '@/types';
import { useState } from 'react';

interface Props {
  targetType: VoteTargetType;
  targetId: string;
  score: number;
  onChange?: (score: number) => void;
}

export function VoteButtons({ targetType, targetId, score, onChange }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [current, setCurrent] = useState(score);
  const [mine, setMine] = useState<1 | -1 | 0>(() =>
    user ? voteService.getUserVote(targetType, targetId, user.id) : 0,
  );

  const vote = (value: 1 | -1) => {
    if (!isAuthenticated || !user) return;
    const next = voteService.vote(targetType, targetId, user.id, value);
    setCurrent(next);
    setMine(voteService.getUserVote(targetType, targetId, user.id));
    onChange?.(next);
  };

  return (
    <Space direction="vertical" size={0} align="center">
      <Button
        type="text"
        size="small"
        icon={<CaretUpOutlined />}
        disabled={!isAuthenticated}
        style={{ color: mine === 1 ? '#2563eb' : undefined }}
        onClick={() => vote(1)}
      />
      <strong style={{ fontSize: 14 }}>{current}</strong>
      <Button
        type="text"
        size="small"
        icon={<CaretDownOutlined />}
        disabled={!isAuthenticated}
        style={{ color: mine === -1 ? '#dc2626' : undefined }}
        onClick={() => vote(-1)}
      />
    </Space>
  );
}

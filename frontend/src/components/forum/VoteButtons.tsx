import { Button, Space } from 'antd';
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { voteService } from '@/services/votes/voteService';
import type { VoteTargetType } from '@/types';
import { useEffect, useState } from 'react';

interface Props {
  targetType: VoteTargetType;
  targetId: string;
  score: number;
  onChange?: (score: number) => void;
}

export function VoteButtons({ targetType, targetId, score, onChange }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [current, setCurrent] = useState(score);
  const [mine, setMine] = useState<1 | -1 | 0>(0);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    setCurrent(score);
  }, [score]);

  useEffect(() => {
    if (!user) {
      setMine(0);
      return;
    }
    voteService.getUserVote(targetType, targetId, user.id).then(setMine);
  }, [targetType, targetId, user]);

  const vote = async (value: 1 | -1) => {
    if (!isAuthenticated || !user || voting) return;
    setVoting(true);
    try {
      const next = await voteService.vote(targetType, targetId, user.id, value);
      setCurrent(next);
      const m = await voteService.getUserVote(targetType, targetId, user.id);
      setMine(m);
      onChange?.(next);
    } finally {
      setVoting(false);
    }
  };

  return (
    <Space direction="vertical" size={0} align="center">
      <Button
        type="text"
        size="small"
        icon={<CaretUpOutlined />}
        disabled={!isAuthenticated || voting}
        style={{ color: mine === 1 ? '#2563eb' : undefined }}
        onClick={() => vote(1)}
      />
      <strong style={{ fontSize: 14 }}>{current}</strong>
      <Button
        type="text"
        size="small"
        icon={<CaretDownOutlined />}
        disabled={!isAuthenticated || voting}
        style={{ color: mine === -1 ? '#dc2626' : undefined }}
        onClick={() => vote(-1)}
      />
    </Space>
  );
}

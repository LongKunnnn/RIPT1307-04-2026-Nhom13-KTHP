import type { VoteTargetType } from '@/types';
import { apiFetch, buildQuery } from '@/services/api/client';

export const voteService = {
  async vote(
    targetType: VoteTargetType,
    targetId: string,
    userId: string,
    value: 1 | -1,
  ): Promise<number> {
    void userId;
    const res = await apiFetch<{ score: number }>('/api/votes', {
      method: 'POST',
      body: JSON.stringify({
        targetType,
        targetId: Number(targetId),
        value,
      }),
    });
    return res.score;
  },

  async getUserVote(targetType: VoteTargetType, targetId: string, userId: string): Promise<1 | -1 | 0> {
    void userId;
    try {
      return await apiFetch<1 | -1 | 0>(
        `/api/votes/mine${buildQuery({ targetType, targetId })}`,
      );
    } catch {
      return 0;
    }
  },
};

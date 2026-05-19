import type { VoteTargetType } from '@/types';
import { getComments, getPosts, getVotes, setComments, setPosts, setVotes } from '@/services/mock/db';

function applyScore<T extends { id: string; voteScore: number }>(
  items: T[],
  id: string,
  delta: number,
): T[] {
  return items.map((item) =>
    item.id === id ? { ...item, voteScore: item.voteScore + delta } : item,
  );
}

export const voteService = {
  vote(
    targetType: VoteTargetType,
    targetId: string,
    userId: string,
    value: 1 | -1,
  ): number {
    const votes = getVotes();
    const existing = votes.find(
      (v) => v.targetType === targetType && v.targetId === targetId && v.userId === userId,
    );

    let delta = value;
    if (existing) {
      if (existing.value === value) {
        votes.splice(votes.indexOf(existing), 1);
        delta = -value;
      } else {
        existing.value = value;
        delta = value * 2;
      }
    } else {
      votes.push({ targetType, targetId, userId, value });
    }
    setVotes(votes);

    if (targetType === 'post') {
      setPosts(applyScore(getPosts(), targetId, delta));
      return getPosts().find((p) => p.id === targetId)?.voteScore ?? 0;
    }
    setComments(applyScore(getComments(), targetId, delta));
    return getComments().find((c) => c.id === targetId)?.voteScore ?? 0;
  },

  getUserVote(targetType: VoteTargetType, targetId: string, userId: string): 1 | -1 | 0 {
    const v = getVotes().find(
      (x) => x.targetType === targetType && x.targetId === targetId && x.userId === userId,
    );
    return v ? v.value : 0;
  },
};

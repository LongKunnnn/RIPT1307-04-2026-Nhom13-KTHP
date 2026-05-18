import type { LeaderboardEntry } from '@/types';
import { apiFetch, buildQuery } from '@/services/api/client';

export type LeaderboardScope = 'global' | 'tag';

export const leaderboardService = {
  async list(scope: LeaderboardScope, tag?: string, limit = 8): Promise<LeaderboardEntry[]> {
    return apiFetch<LeaderboardEntry[]>(
      `/api/leaderboard${buildQuery({ scope, tag, limit })}`,
    );
  },
};

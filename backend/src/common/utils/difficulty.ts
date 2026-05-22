import { PostDifficulty } from '@prisma/client';

export const DIFFICULTY_WEIGHT: Record<PostDifficulty, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2,
};

export function difficultyWeight(d: PostDifficulty): number {
  return DIFFICULTY_WEIGHT[d] ?? 1;
}

import { ModerationStatus } from '@prisma/client';
import { PrismaService } from '../../modules/prisma/prisma.service';

export interface ScanResult {
  status: ModerationStatus;
  matchedWords: string[];
}

export async function scanContent(
  prisma: PrismaService,
  ...parts: string[]
): Promise<ScanResult> {
  const text = parts.join(' ').toLowerCase();
  const banned = await prisma.bannedWord.findMany();
  const matched = banned
    .filter((b) => text.includes(b.word.toLowerCase()))
    .map((b) => b.word);

  if (matched.length === 0) {
    return { status: ModerationStatus.published, matchedWords: [] };
  }

  const hasHidden = banned.some(
    (b) => matched.includes(b.word) && b.action === 'hidden',
  );

  return {
    status: hasHidden ? ModerationStatus.hidden : ModerationStatus.pending,
    matchedWords: matched,
  };
}

export async function sumVoteScore(
  prisma: PrismaService,
  targetId: number,
  targetType: 'post' | 'comment',
): Promise<number> {
  const agg = await prisma.vote.aggregate({
    where: { target_id: targetId, target_type: targetType },
    _sum: { vote_value: true },
  });
  return agg._sum.vote_value ?? 0;
}

import type { ReportTargetType } from '@/types';
import { apiFetch } from '@/services/api/client';

export const reportService = {
  async create(
    targetType: ReportTargetType,
    targetId: string,
    reporter: { id: string; displayName: string },
    reason: string,
  ) {
    void reporter;
    await apiFetch('/api/reports', {
      method: 'POST',
      body: JSON.stringify({
        targetType,
        targetId: Number(targetId),
        reason,
      }),
    });
  },

  async countOpen(): Promise<number> {
    const stats = await apiFetch<{ openReportCount: number }>('/api/admin/stats');
    return stats.openReportCount;
  },
};

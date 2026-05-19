import type { ContentReport, ModerationResolveAction, ReportTargetType } from '@/types';
import { getReports, newId, setReports } from '@/services/mock/db';

export const reportService = {
  listOpen(): ContentReport[] {
    return getReports()
      .filter((r) => r.status === 'open')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  create(
    targetType: ReportTargetType,
    targetId: string,
    reporter: { id: string; displayName: string },
    reason: string,
  ): ContentReport {
    const trimmed = reason.trim();
    if (trimmed.length < 5) throw new Error('Lý do báo cáo cần ít nhất 5 ký tự');
    const dup = getReports().find(
      (r) =>
        r.status === 'open' &&
        r.targetType === targetType &&
        r.targetId === targetId &&
        r.reporterId === reporter.id,
    );
    if (dup) throw new Error('Bạn đã báo cáo nội dung này');

    const report: ContentReport = {
      id: newId('rep'),
      targetType,
      targetId,
      reporterId: reporter.id,
      reporterName: reporter.displayName,
      reason: trimmed,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    setReports([...getReports(), report]);
    return report;
  },

  resolve(id: string, action: ModerationResolveAction) {
    const list = getReports();
    const idx = list.findIndex((r) => r.id === id);
    if (idx < 0) throw new Error('Không tìm thấy báo cáo');
    list[idx] = {
      ...list[idx],
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
      resolvedAction: action,
    };
    setReports(list);
    return list[idx];
  },

  countOpen(): number {
    return getReports().filter((r) => r.status === 'open').length;
  },
};

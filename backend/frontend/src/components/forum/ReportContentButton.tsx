import { useState } from 'react';
import { Button, Input, Modal, message } from 'antd';
import { FlagOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { reportService } from '@/services/moderation/reportService';
import { useNotify } from '@/contexts/NotificationContext';
import type { ReportTargetType } from '@/types';
import { ROUTES } from '@/constants/routes';
import { history } from 'umi';

interface Props {
  targetType: ReportTargetType;
  targetId: string;
  size?: 'small' | 'middle';
}

export function ReportContentButton({ targetType, targetId, size = 'small' }: Props) {
  const { user, isAuthenticated } = useAuth();
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) return null;

  const submit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      reportService.create(targetType, targetId, { id: user.id, displayName: user.displayName }, reason);
      notify.notifyEmail('Báo cáo mới', `Admin: có báo cáo vi phạm mới từ ${user.displayName} — vào hàng đợi kiểm duyệt.`);
      message.success('Đã gửi báo cáo. Admin sẽ xem xét trong hàng đợi kiểm duyệt.');
      setOpen(false);
      setReason('');
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Không gửi được báo cáo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size={size}
        type="text"
        danger
        icon={<FlagOutlined />}
        onClick={() => {
          if (!user) history.push(ROUTES.login);
          else setOpen(true);
        }}
      >
        Báo cáo
      </Button>
      <Modal
        title="Báo cáo vi phạm"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submit}
        confirmLoading={loading}
        okText="Gửi báo cáo"
      >
        <Input.TextArea
          rows={4}
          placeholder="Mô tả lý do (spam, ngôn từ không phù hợp, quấy rối...)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Modal>
    </>
  );
}

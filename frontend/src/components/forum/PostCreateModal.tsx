import { Form, Input, Modal } from 'antd';
import type { CreatePostInput } from '@/types';
import { postService } from '@/services/posts/postService';
import { useAuth } from '@/contexts/AuthContext';
import { useNotify } from '@/contexts/NotificationContext';
import { TagSelectField } from './TagSelectField';
import { moderationUserMessage } from '@/utils/moderationMessages';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (postId: string) => void;
}

export function PostCreateModal({ open, onClose, onCreated }: Props) {
  const [form] = Form.useForm<CreatePostInput>();
  const { user } = useAuth();
  const notify = useNotify();

  const handleOk = async () => {
    const values = await form.validateFields();
    if (!user) return;
    const post = postService.create(
      {
        title: values.title.trim(),
        body: values.body.trim(),
        tags: (values.tags ?? []).map((t) => String(t).trim()).filter(Boolean),
      },
      { id: user.id, displayName: user.displayName, role: user.role },
    );
    if (post.moderationStatus === 'published') {
      notify.notifyEmail('Bài đăng mới', `Có bài mới: "${post.title}" — thông báo đã gửi (giả lập).`);
    }
    notify.success(moderationUserMessage(post.moderationStatus, post.moderationFlags));
    form.resetFields();
    onClose();
    if (post.moderationStatus === 'published') onCreated(post.id);
  };

  return (
    <Modal title="Đăng bài mới" open={open} onCancel={onClose} onOk={handleOk} okText="Đăng" width={640}>
      <Form form={form} layout="vertical" initialValues={{ tags: [] }}>
        <Form.Item label="Tiêu đề" name="title" rules={[{ required: true, min: 12 }]}>
          <Input maxLength={200} showCount />
        </Form.Item>
        <Form.Item label="Nội dung" name="body" rules={[{ required: true, min: 30 }]}>
          <Input.TextArea rows={8} maxLength={20000} showCount />
        </Form.Item>
        <Form.Item label="Thẻ (môn / lớp / khoa / lĩnh vực)" name="tags">
          <TagSelectField />
        </Form.Item>
      </Form>
    </Modal>
  );
}

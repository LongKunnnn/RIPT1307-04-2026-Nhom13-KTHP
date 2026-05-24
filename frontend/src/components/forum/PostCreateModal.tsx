import { Form, Input, InputNumber, Modal, Select, message } from 'antd';
import type { CreatePostInput, Post } from '@/types';
import { postService } from '@/services/posts/postService';
import { useAuth } from '@/contexts/AuthContext';
import { useNotify } from '@/contexts/NotificationContext';
import { TagSelectField } from './TagSelectField';
import { moderationUserMessage } from '@/utils/moderationMessages';
import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (postId: string) => void;
  editPost?: Post | null;
}

export function PostCreateModal({ open, onClose, onCreated, editPost }: Props) {
  const [form] = Form.useForm<CreatePostInput>();
  const { user } = useAuth();
  const notify = useNotify();

  useEffect(() => {
    if (open && editPost) {
      form.setFieldsValue({
        title: editPost.title,
        body: editPost.body,
        tags: editPost.tags,
        difficulty: editPost.difficulty,
        bounty: editPost.bounty ?? 0,
      });
    } else if (open && !editPost) {
      form.resetFields();
    }
  }, [open, editPost, form]);

  const handleOk = async () => {
    let values;
    try {
      // 1. Check lỗi hiển thị trên Form (Frontend)
      values = await form.validateFields();
    } catch (e) {
      // Nếu user nhập sai rules của antd (ví dụ chưa đủ min: 12), form tự đỏ, không cần làm gì thêm
      return; 
    }

    if (!user) return;

    const payload = {
      title: values.title.trim(),
      body: values.body.trim(),
      tags: (values.tags ?? []).map((t) => String(t).trim()).filter(Boolean),
      difficulty: values.difficulty,
      bounty: values.bounty ?? 0,
    };

    try {
      if (editPost) {
        const updated = await postService.update(editPost.id, payload);
        notify.success('Đã cập nhật bài viết');
        onClose();
        onCreated(updated.id);
      } else {
        const post = await postService.create(payload, {
          id: user.id,
          displayName: user.displayName,
          role: user.role,
        });
        if (post.moderationStatus === 'published') {
          notify.notifyEmail('Bài đăng mới', `Có bài mới: "${post.title}" — thông báo đã gửi (giả lập).`);
        }
        notify.success(moderationUserMessage(post.moderationStatus, post.moderationFlags));
        onClose();
        if (post.moderationStatus === 'published') onCreated(post.id);
      }
    } catch (error: any) {
      console.error('Lỗi từ Backend:', error);
      message.error('Dữ liệu gửi đi bị thiếu hoặc sai định dạng. Kiểm tra lại nhé!');
    }
  };

  return (
    <Modal
      title={editPost ? 'Chỉnh sửa bài viết' : 'Đăng bài mới'}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText={editPost ? 'Cập nhật' : 'Đăng'}
      width={640}
    >
      <Form form={form} layout="vertical" initialValues={{ tags: [], difficulty: 'medium', bounty: 0 }}>
        <Form.Item label="Tiêu đề" name="title" rules={[{ required: true, min: 12 }]}>
          <Input maxLength={200} showCount />
        </Form.Item>
        <Form.Item label="Nội dung" name="body" rules={[{ required: true, min: 30 }]}>
          <Input.TextArea rows={8} maxLength={20000} showCount />
        </Form.Item>
        <Form.Item label="Thẻ (môn / lớp / khoa / lĩnh vực)" name="tags">
          <TagSelectField />
        </Form.Item>
        <Form.Item label="Độ khó" name="difficulty" rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'easy', label: 'Dễ' },
              { value: 'medium', label: 'Trung bình' },
              { value: 'hard', label: 'Khó' },
            ]}
          />
        </Form.Item>
        <Form.Item
          label="Điểm thưởng (trừ từ số dư của bạn)"
          name="bounty"
          extra={`Số dư hiện tại: ${(user?.rewardPoints ?? 0).toLocaleString('vi-VN')} điểm`}
        >
          <InputNumber min={0} max={user?.rewardPoints ?? 0} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

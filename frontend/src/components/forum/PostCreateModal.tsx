import { Form, Input, InputNumber, Modal, Select, message } from 'antd';
import type { CreatePostInput, Post } from '@/types';
import { postService } from '@/services/posts/postService';
import { useAuth } from '@/contexts/AuthContext';
import { useNotify } from '@/contexts/NotificationContext';
import { TagSelectField } from './TagSelectField';
import { moderationUserMessage } from '@/utils/moderationMessages';
import { useEffect, useState } from 'react'; // Bổ sung useState

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
  
  // 1. Khai báo state theo dõi trạng thái gửi dữ liệu
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      values = await form.validateFields();
    } catch (e) {
      return; 
    }

    if (!user) return;

    // 2. Bắt đầu quá trình submit -> Khóa nút lại và hiện vòng quay loading
    setIsSubmitting(true);

    const payload = {
      title: values.title.trim(),
      body: values.body.trim(),
      tags: (values.tags ?? []).map((t) => String(t).trim()).filter(Boolean),
      difficulty: values.difficulty,
      bounty: values.bounty ?? 0,
    };

    try {
      console.log('📦 Payload gửi đi:', payload);
      if (editPost) {
        const updated = await postService.update(editPost.id, payload);
        notify.success('Đã cập nhật bài viết');
        onClose();
        onCreated(updated.id);
      } else {
        const post = await postService.create(payload, {
          id: user.id,
          displayName: user.displayName || "",
          role: user.role,
        });
        console.log('✅ Phản hồi thành công:', post);
        if (post.moderationStatus === 'published') {
          notify.notifyEmail('Bài đăng mới', `Có bài mới: "${post.title}" — thông báo đã gửi (giả lập).`);
        }
        notify.success(moderationUserMessage(post.moderationStatus, post.moderationFlags));
        onClose();
        if (post.moderationStatus === 'published') onCreated(post.id);
      }
    } catch (error: any) {
      console.error('❌ Lỗi từ Backend:', error);
      const errorMsg = error?.message || 'Dữ liệu gửi đi bị thiếu hoặc sai định dạng. Kiểm tra lại nhé!';
      message.error(errorMsg);
    } finally {
      // 3. Xong xuôi (dù lỗi hay thành công) thì mở khóa nút
      setIsSubmitting(false);
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
      // 4. Báo cho Modal của antd biết đang loading để nó khóa nút OK lại
      confirmLoading={isSubmitting} 
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
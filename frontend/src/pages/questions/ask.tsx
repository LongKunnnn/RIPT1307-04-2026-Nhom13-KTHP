import { useState } from "react";
import { Link, history } from "umi";
import {
  Breadcrumb,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  message,
} from "antd";
import { ArrowLeftOutlined, SendOutlined } from "@ant-design/icons";
import { ROUTES } from "@/constants/routes";
import { postService } from "@/services/posts/postService";
import { useAuth } from "@/contexts/AuthContext";
import { useNotify } from "@/contexts/NotificationContext";
import type { CreatePostInput } from "@/types";
import { TagSelectField } from "@/components/forum/TagSelectField";
import { moderationUserMessage } from "@/utils/moderationMessages";
import { getAccessToken } from "@/services/api/client";
import styles from "./ask.less";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function AskQuestionPage() {
  const [form] = Form.useForm<CreatePostInput>();
  const [submitting, setSubmitting] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const notify = useNotify();

  const onFinish = async (values: CreatePostInput) => {
    if (!user) {
      history.push(ROUTES.login);
      return;
    }
    setSubmitting(true);
    const payload = {
      title: values.title.trim(),
      body: values.body.trim(),
      tags: (values.tags ?? []).map((t) => String(t).trim()).filter(Boolean),
      difficulty: values.difficulty,
      bounty: values.bounty ?? 0,
    };
    console.log("📤 Sending payload:", payload);
    console.log("🔑 Have token:", !!getAccessToken());
    try {
      const post = await postService.create(payload, {
        id: user.id,
        displayName: user.displayName,
        role: user.role,
      });
      console.log("📥 Response:", post);
      if (post.moderationStatus === "published") {
        notify.notifyEmail(
          "Bài đăng mới",
          `Bài "${post.title}" đã được đăng (email giả lập).`,
        );
      }
      message.success(
        moderationUserMessage(post.moderationStatus, post.moderationFlags),
      );
      form.resetFields();
      history.push(ROUTES.questionDetail(post.id));
    } catch (e) {
      console.error("❌ Error creating post:", e);
      message.error(e instanceof Error ? e.message : "Không gửi được câu hỏi");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <Card>
            <Text>Vui lòng đăng nhập để đặt câu hỏi.</Text>
            <Button
              type="primary"
              style={{ marginTop: 12 }}
              onClick={() => history.push(ROUTES.login)}
            >
              Đăng nhập
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <Breadcrumb
            items={[
              { title: <Link to={ROUTES.home}>Trang chủ</Link> },
              { title: "Đặt câu hỏi" },
            ]}
            style={{ marginBottom: 12 }}
          />
          <Link to={ROUTES.myQuestions("authored")} className={styles.back}>
            <ArrowLeftOutlined /> Quay lại danh sách câu hỏi
          </Link>
          <Title level={2} className={styles.title}>
            Đặt câu hỏi
          </Title>
          <Text className={styles.sub}>
            Mô tả rõ vấn đề, đã thử gì và kỳ vọng điều gì — giúp mọi người trả
            lời nhanh và đúng trọng tâm.
          </Text>
        </div>

        <Card className={styles.card} bordered={false}>
          <Form<CreatePostInput>
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark="optional"
            initialValues={{ tags: [], difficulty: "medium", bounty: 0 }}
          >
            <Form.Item
              label="Tiêu đề"
              name="title"
              rules={[
                { required: true, message: "Nhập tiêu đề câu hỏi" },
                { min: 12, message: "Tiêu đề nên ít nhất 12 ký tự" },
                { max: 200, message: "Tối đa 200 ký tự" },
              ]}
            >
              <Input
                showCount
                maxLength={200}
                placeholder="Tóm tắt vấn đề một cách cụ thể"
              />
            </Form.Item>

            <Form.Item
              label="Nội dung chi tiết"
              name="body"
              rules={[
                { required: true, message: "Nhập nội dung" },
                { min: 30, message: "Nội dung nên ít nhất 30 ký tự" },
                { max: 20000, message: "Tối đa 20.000 ký tự" },
              ]}
            >
              <TextArea
                rows={12}
                showCount
                maxLength={20000}
                placeholder="Ngữ cảnh, code, lỗi, môi trường, câu hỏi cụ thể..."
              />
            </Form.Item>

            <Form.Item label="Thẻ (môn / lớp / khoa / lĩnh vực)" name="tags">
              <TagSelectField />
            </Form.Item>

            <Form.Item
              label="Độ khó"
              name="difficulty"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: "easy", label: "Dễ" },
                  { value: "medium", label: "Trung bình" },
                  { value: "hard", label: "Khó" },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Điểm thưởng cho câu trả lời hay nhất"
              name="bounty"
              extra={`Số dư: ${(user?.rewardPoints ?? 0).toLocaleString("vi-VN")} điểm — sẽ trừ khi đăng bài`}
            >
              <InputNumber
                min={0}
                max={user?.rewardPoints ?? 0}
                style={{ width: "100%" }}
              />
            </Form.Item>

            <div className={styles.actions}>
              <Button onClick={() => form.resetFields()} disabled={submitting}>
                Xoá form
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<SendOutlined />}
              >
                Đăng câu hỏi
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}

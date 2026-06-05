import { useEffect, useState } from "react";
import { history } from "umi";
import {
  Card,
  Typography,
  Button,
  Avatar,
  Space,
  Divider,
  Form,
  Input,
  DatePicker,
  message,
  Skeleton,
  Upload,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  MailOutlined,
  CalendarOutlined,
  GlobalOutlined,
  TrophyOutlined,
  BankOutlined,
  SaveOutlined,
  CloseOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import { fileToAvatarDataUrl } from "@/utils/avatar";
import dayjs from "dayjs";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth/authService";
import { formatViDate } from "@/utils/format";
import type { User } from "@/types";
import styles from "./profile.less";

const { Title, Text, Paragraph } = Typography;

export default function MyProfilePage() {
  const {
    user: authUser,
    isAuthenticated,
    refreshProfile,
    updateProfile,
  } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>();

  useEffect(() => {
    if (!isAuthenticated) {
      history.push("/login");
      return;
    }
    if (authUser) {
      setUser(authUser);
      const avatar = authUser.avatar_url ?? authUser.avatarUrl;
      setAvatarPreview(avatar);
      form.setFieldsValue({
        ...authUser,
        displayName: authUser.full_name,
        avatarUrl: avatar,
        birthday: authUser.birthday ? dayjs(authUser.birthday) : undefined,
      });
    }
  }, [authUser, isAuthenticated, form]);

  const onAvatarPick = async (file: File) => {
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setAvatarPreview(dataUrl);
      form.setFieldValue("avatarUrl", dataUrl);
      message.success("Đã chọn ảnh — nhấn Lưu để cập nhật avatar");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Không thể xử lý ảnh");
    }
    return false;
  };

  const onSave = async (values: any) => {
    setLoading(true);
    try {
      const updated = await updateProfile({
        ...values,
        displayName: values.displayName,
        avatarUrl: values.avatarUrl ?? avatarPreview,
        birthday: values.birthday?.format("YYYY-MM-DD"),
      });
      setAvatarPreview(updated.avatar_url ?? updated.avatarUrl);
      setUser(updated);
      setEditing(false);
      message.success("Đã cập nhật hồ sơ");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!user)
    return (
      <div className={styles.container}>
        <Skeleton active />
      </div>
    );

  return (
    <div className={styles.container}>
      <Card
        className={styles.profileCard}
        title="Hồ sơ cá nhân"
        extra={
          !editing && (
            <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>
              Chỉnh sửa
            </Button>
          )
        }
      >
        <div className={styles.avatarSection}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <Avatar
              size={100}
              icon={<UserOutlined />}
              src={avatarPreview ?? user.avatar_url ?? user.avatarUrl}
            />
            {editing && (
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={onAvatarPick}
              >
                <Button
                  type="primary"
                  shape="circle"
                  icon={<CameraOutlined />}
                  size="small"
                  style={{
                    position: "absolute",
                    right: 0,
                    bottom: 0,
                  }}
                  title="Đổi ảnh đại diện"
                />
              </Upload>
            )}
          </div>
          {editing && (
            <Text type="secondary" style={{ display: "block", marginTop: 8, fontSize: 12 }}>
              Nhấn biểu tượng máy ảnh để chọn ảnh từ thiết bị (JPG, PNG, tối đa 5MB)
            </Text>
          )}
          <Title level={2} className={styles.displayName}>
            {user.full_name}
          </Title>
          <Text className={styles.username}>@{user.username}</Text>
          <div className={styles.statsRow}>
            <Space direction="vertical" align="center">
              <TrophyOutlined style={{ fontSize: 24, color: "#f59e0b" }} />
              <Text strong>
                {(user.reward_points ?? user.rewardPoints ?? 0).toLocaleString(
                  "vi-VN",
                )}{" "}
                điểm
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Điểm thưởng
              </Text>
            </Space>
          </div>
        </div>

        {editing ? (
          <div className={styles.infoSection}>
            <Form form={form} layout="vertical" onFinish={onSave}>
              <Form.Item name="avatarUrl" hidden>
                <Input />
              </Form.Item>
              <div className={styles.infoGrid}>
                <Form.Item
                  name="displayName"
                  label="Họ tên"
                  rules={[{ required: true }]}
                >
                  <Input prefix={<UserOutlined />} />
                </Form.Item>
                <Form.Item
                  name="username"
                  label="Username"
                  rules={[{ required: true, min: 3 }]}
                >
                  <Input prefix={<Text style={{ color: "#94a3b8" }}>@</Text>} />
                </Form.Item>
                <Form.Item name="birthday" label="Ngày sinh">
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
                <Form.Item name="faculty" label="Khoa / Đơn vị">
                  <Input prefix={<BankOutlined />} />
                </Form.Item>
                <Form.Item
                  name="bio"
                  label="Giới thiệu bản thân"
                  style={{ gridColumn: "1 / -1" }}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Viết vài điều về bản thân..."
                  />
                </Form.Item>
              </div>

              <Divider orientation={"left" as any} orientationMargin="0">
                Mạng xã hội
              </Divider>
              <Form.Item name={["socialLinks", "facebook"]} label="Facebook">
                <Input
                  prefix={<GlobalOutlined />}
                  placeholder="Link Facebook"
                />
              </Form.Item>
              <Form.Item name={["socialLinks", "linkedin"]} label="LinkedIn">
                <Input
                  prefix={<GlobalOutlined />}
                  placeholder="Link LinkedIn"
                />
              </Form.Item>

              <Space style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                >
                  Lưu thay đổi
                </Button>
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setEditing(false);
                    const avatar = user.avatar_url ?? user.avatarUrl;
                    setAvatarPreview(avatar);
                    form.setFieldValue("avatarUrl", avatar);
                  }}
                >
                  Hủy
                </Button>
              </Space>
            </Form>
          </div>
        ) : (
          <div className={styles.infoSection}>
            <div className={styles.sectionTitle}>
              <UserOutlined /> Thông tin cơ bản
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Email</label>
                <span>
                  <MailOutlined /> {user.email}
                </span>
              </div>
              <div className={styles.infoItem}>
                <label>Ngày sinh</label>
                <span>
                  <CalendarOutlined />{" "}
                  {user.birthday
                    ? dayjs(user.birthday).format("DD/MM/YYYY")
                    : "Chưa cập nhật"}
                </span>
              </div>
              <div className={styles.infoItem}>
                <label>Khoa / Đơn vị</label>
                <span>
                  <BankOutlined /> {user.faculty || "Chưa cập nhật"}
                </span>
              </div>
              <div className={styles.infoItem}>
                <label>Ngày tham gia</label>
                <span>
                  <CalendarOutlined />{" "}
                  {formatViDate(user.created_at ?? user.createdAt)}
                </span>
              </div>
              {user.bio && (
                <div className={styles.bio}>
                  <Paragraph>{user.bio}</Paragraph>
                </div>
              )}
            </div>

            <Divider />

            <div className={styles.sectionTitle}>
              <GlobalOutlined /> Liên kết mạng xã hội
            </div>
            <div className={styles.socialLinks}>
              {(user.social_links || user.socialLinks) &&
                Object.entries(user.social_links || user.socialLinks || {}).map(
                  ([key, url]) =>
                    url && (
                      <Button
                        key={key}
                        type="default"
                        className={styles.socialBtn}
                        onClick={() =>
                          window.open(
                            (url as string).startsWith("http")
                              ? (url as string)
                              : `https://${url}`,
                            "_blank",
                          )
                        }
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Button>
                    ),
                )}
              {((!user.social_links && !user.socialLinks) ||
                Object.values(
                  user.social_links || user.socialLinks || {},
                ).every((v) => !v)) && (
                <Text type="secondary">Chưa có liên kết mạng xã hội</Text>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
